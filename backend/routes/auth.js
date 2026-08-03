const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

// JWT_SECRET is required but will be checked at runtime to prevent serverless function crash

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, gender, age } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos.', errorCode: '0x1051' });
    // FIX A-8: Basic input validation
    if (typeof email !== 'string' || !email.includes('@')) return res.status(400).json({ error: 'Email inválido.', errorCode: '0x1052' });
    if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.', errorCode: '0x1053' });
    if (age !== undefined && age !== null && age !== '') {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) return res.status(400).json({ error: 'La edad debe estar entre 1 y 120.', errorCode: '0x1054' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'El email ya está registrado.', errorCode: '0x1055' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, gender, age: age ? parseInt(age) : null },
    });

    // Send async welcome email (must await in Vercel serverless)
    await emailService.sendWelcomeEmail(user).catch(console.error);

    const token = jwt.sign({ id: user.id, sessionVersion: user.sessionVersion || 0 }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario.', errorCode: '0x1056' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos.', errorCode: '0x1057' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas.', errorCode: '0x1058' });

    if (!user.password) {
      return res.status(400).json({ error: 'Esta cuenta se registró con Google. Inicia sesión con Google.', errorCode: '0x1059' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Credenciales inválidas.', errorCode: '0x105A' });

    if (user.isBanned) {
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isBanned: false, bannedUntil: null, banReason: null }
        });
      } else {
        return res.status(403).json({ error: 'BANNED', 
          message: 'Tu cuenta está bloqueada.', 
          bannedUntil: user.bannedUntil 
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } }
    });
    const token = jwt.sign({ id: user.id, sessionVersion: updatedUser.sessionVersion }, process.env.JWT_SECRET, { expiresIn: ', errorCode: '0x105B'1d' });
    
    // Send async login alert (must await in Vercel serverless)
    const reqIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';
    await emailService.sendLoginAlertEmail(user, reqIp, userAgent).catch(console.error);

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión.', errorCode: '0x105C' });
  }
});

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const appleSignin = require('apple-signin-auth');

router.post('/google', async (req, res) => {
  try {
    const { token, accessToken, gender, age } = req.body;
    
    // FIX A-9: Validate token presence before calling Google
    if (!token && !accessToken) return res.status(400).json({ error: 'Token de Google requerido.', errorCode: '0x105D' });
    
    let email, providerId, name, picture;
    
    if (accessToken) {
      // Usar la API de UserInfo de Google para obtener los datos con el accessToken
      const axios = require('axios');
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      ({ email, sub: providerId, name, picture } = response.data);
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      ({ email, sub: providerId, name, picture } = payload);
    }
    
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Si el usuario no existe y no nos han pasado género, devolvemos estado 202
      // para que el frontend muestre el modal pidiendo el género y la edad.
      if (!gender) {
        return res.status(202).json({
          needsOnboarding: true,
          email, name, providerId, picture, accessToken: accessToken || token
        });
      }
      
      user = await prisma.user.create({
        data: { 
          email, 
          name, 
          authProvider: 'google', 
          providerId, 
          profilePicture: picture || null,
          gender: gender || 'Mujer',
          age: age ? parseInt(age) : null
        }
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
        return res.status(403).json({ error: 'BANNED', errorCode: '0x105E', message: 'Tu cuenta está bloqueada.', bannedUntil: user.bannedUntil });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } }
    });
    const jwtToken = jwt.sign({ id: user.id, sessionVersion: updatedUser.sessionVersion }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const reqIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';
    await emailService.sendLoginAlertEmail(user, reqIp, userAgent).catch(console.error);

    // FIX A-10: Never return raw Prisma object — whitelist safe fields only
    res.json({ token: jwtToken, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture } });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ error: 'Token de Google inválido o caducado.', errorCode: '0x105F' });
  }
});

router.post('/apple', async (req, res) => {
  try {
    const { token, name: appleName } = req.body;
    // FIX A-9: Validate token presence
    if (!token) return res.status(400).json({ error: 'Token de Apple requerido.', errorCode: '0x1060' });
    const { sub: providerId, email } = await appleSignin.verifyIdToken(token, {
      audience: process.env.APPLE_CLIENT_ID,
      // FIX C-9: REMOVED ignoreExpiration:true — accepting expired Apple tokens is a security vulnerability
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
      if (!user) return res.status(400).json({ error: 'No se pudo obtener el usuario de Apple.', errorCode: '0x1061' });
    }

    if (user.isBanned) {
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        await prisma.user.update({ where: { id: user.id }, data: { isBanned: false, bannedUntil: null, banReason: null } });
      } else {
        return res.status(403).json({ error: 'BANNED', errorCode: '0x1062', message: 'Tu cuenta está bloqueada.', bannedUntil: user.bannedUntil });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } }
    });
    const jwtToken = jwt.sign({ id: user.id, sessionVersion: updatedUser.sessionVersion }, process.env.JWT_SECRET, { expiresIn: '1d' });
    // FIX A-10: Never return raw Prisma object — whitelist safe fields only
    res.json({ token: jwtToken, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture } });
  } catch (error) {
    console.error('Apple Auth Error:', error);
    res.status(401).json({ error: 'Token de Apple inválido.', errorCode: '0x1063' });
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

    // FIX B-M15: Null check BEFORE the dependent query, not after
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado', errorCode: '0x1064' });

    const consultasHoyCount = await prisma.consulta.count({
      where: {
        userId: req.user.id,
        createdAt: { gte: todayStart, lte: todayEnd }
      }
    });

    res.json({ user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture, historyCount: user._count.consultas, dailyCount: consultasHoyCount } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener perfil', errorCode: '0x1065' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, gender, age, estiloPersonal, estiloDetalles } = req.body;
    const updateData = { name, gender, estiloPersonal, estiloDetalles };
    if (age !== undefined && age !== null && age !== '') {
      const parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
        return res.status(400).json({ error: 'La edad debe estar entre 13 y 120', errorCode: '0x1066' });
      }
      updateData.age = parsedAge;
    } else if (age === '' || age === null) {
      updateData.age = null;
    }

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
    res.status(500).json({ error: 'Error al actualizar perfil.', errorCode: '0x1067' });
  }
});

module.exports = router;
