const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, gender, age } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos.' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'El email ya está registrado.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, gender, age: age ? parseInt(age) : null },
    });

    // Send async welcome email (must await in Vercel serverless)
    await emailService.sendWelcomeEmail(user).catch(console.error);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas.' });

    if (!user.password) {
      return res.status(400).json({ error: 'Esta cuenta se registró con Google. Inicia sesión con Google.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Credenciales inválidas.' });

    if (user.isBanned) {
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isBanned: false, bannedUntil: null, banReason: null }
        });
      } else {
        return res.status(403).json({ 
          error: 'BANNED', 
          message: 'Tu cuenta está bloqueada.', 
          bannedUntil: user.bannedUntil 
        });
      }
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Send async login alert (must await in Vercel serverless)
    const reqIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';
    await emailService.sendLoginAlertEmail(user, reqIp, userAgent).catch(console.error);

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
});

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const appleSignin = require('apple-signin-auth');

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, sub: providerId, name, picture } = payload;
    
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name, authProvider: 'google', providerId, profilePicture: picture || null }
      });
      await emailService.sendWelcomeEmail(user).catch(console.error);
    } else if (user.authProvider === 'local' && !user.providerId) {
      user = await prisma.user.update({
        where: { email },
        data: { authProvider: 'google', providerId, profilePicture: user.profilePicture || picture || null }
      });
    }

    if (user.isBanned) {
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        await prisma.user.update({ where: { id: user.id }, data: { isBanned: false, bannedUntil: null, banReason: null } });
      } else {
        return res.status(403).json({ error: 'BANNED', message: 'Tu cuenta está bloqueada.', bannedUntil: user.bannedUntil });
      }
    }

    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const reqIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';
    await emailService.sendLoginAlertEmail(user, reqIp, userAgent).catch(console.error);

    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ error: 'Token de Google inválido o caducado.' });
  }
});

router.post('/apple', async (req, res) => {
  try {
    const { token, name: appleName } = req.body;
    const { sub: providerId, email } = await appleSignin.verifyIdToken(token, {
      audience: process.env.APPLE_CLIENT_ID,
      ignoreExpiration: true,
    });

    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: { email, name: appleName || null, authProvider: 'apple', providerId }
        });
        await emailService.sendWelcomeEmail(user).catch(console.error);
      } else if (!user.providerId) {
        user = await prisma.user.update({ where: { email }, data: { authProvider: 'apple', providerId } });
      }
    } else {
      user = await prisma.user.findFirst({ where: { providerId, authProvider: 'apple' } });
      if (!user) return res.status(400).json({ error: 'No se pudo obtener el usuario de Apple.' });
    }

    if (user.isBanned) {
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        await prisma.user.update({ where: { id: user.id }, data: { isBanned: false, bannedUntil: null, banReason: null } });
      } else {
        return res.status(403).json({ error: 'BANNED', message: 'Tu cuenta está bloqueada.', bannedUntil: user.bannedUntil });
      }
    }

    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error('Apple Auth Error:', error);
    res.status(401).json({ error: 'Token de Apple inválido.' });
  }
});

const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        _count: {
          select: { 
            consultas: { where: { isFavorite: false } }
          }
        }
      }
    });

    const consultasHoyCount = await prisma.consulta.count({
      where: {
        userId: req.user.id,
        createdAt: { gte: todayStart, lte: todayEnd }
      }
    });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture, historyCount: user._count.consultas, dailyCount: consultasHoyCount } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, gender, age, estiloPersonal, estiloDetalles } = req.body;
    const updateData = { name, gender, estiloPersonal, estiloDetalles };
    if (age !== undefined) updateData.age = age === '' || age === null ? null : parseInt(age);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: {
        _count: {
          select: { consultas: { where: { isFavorite: false } } }
        }
      }
    });

    const consultasHoyCount = await prisma.consulta.count({
      where: {
        userId: req.user.id,
        createdAt: { gte: todayStart, lte: todayEnd }
      }
    });

    res.json({ user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture, historyCount: user._count.consultas, dailyCount: consultasHoyCount } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar perfil.' });
  }
});

module.exports = router;
