const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, gender } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos.' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'El email ya está registrado.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, gender },
    });

    // Send async welcome email (must await in Vercel serverless)
    await emailService.sendWelcomeEmail(user).catch(console.error);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles } });
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

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
});

const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      include: {
        _count: {
          select: { consultas: { where: { isFavorite: false } } }
        }
      }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, historyCount: user._count.consultas } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, gender, estiloPersonal, estiloDetalles } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, gender, estiloPersonal, estiloDetalles },
      include: {
        _count: {
          select: { consultas: { where: { isFavorite: false } } }
        }
      }
    });
    res.json({ user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, historyCount: user._count.consultas } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar perfil.' });
  }
});

module.exports = router;
