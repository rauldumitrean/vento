const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const authMiddleware = require('../middleware/authMiddleware');

// JWT_SECRET is required but will be checked at runtime to prevent serverless function crash

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, gender, age, usaGorras } = req.body;
    if (!email || !password) return res.status(400).json({ errorCode: '0x1053', error: 'Faltan datos.' });
    // FIX A-8: Basic input validation
    if (typeof email !== 'string' || !email.includes('@')) return res.status(400).json({ errorCode: '0x1054', error: 'Email inválido.' });
    if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ errorCode: '0x1055', error: 'La contraseña debe tener al menos 6 caracteres.' });
    if (age !== undefined && age !== null && age !== '') {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) return res.status(400).json({ errorCode: '0x1056', error: 'La edad debe estar entre 1 y 120.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ errorCode: '0x1057', error: 'El email ya está registrado.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, gender, age: age ? parseInt(age) : null, usaGorras: usaGorras === true },
    });

    // Send async welcome email (must await in Vercel serverless)
    await emailService.sendWelcomeEmail(user).catch(console.error);

    const token = jwt.sign({ id: user.id, sessionVersion: user.sessionVersion || 0 }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture, usaGorras: user.usaGorras } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorCode: '0x1058', error: 'Error al registrar usuario.' });
  }
});

router.post('/update-preferences', authMiddleware, async (req, res) => {
  try {
    const { usaGorras } = req.body;
    if (usaGorras === undefined) return res.status(400).json({ errorCode: '0x105Z', error: 'Faltan datos.' });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { usaGorras: usaGorras === true },
      select: { id: true, email: true, role: true, isPremium: true, premiumPlan: true, name: true, gender: true, age: true, estiloPersonal: true, estiloDetalles: true, profilePicture: true, usaGorras: true }
    });

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorCode: '0x105Y', error: 'Error al actualizar preferencias.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ errorCode: '0x1059', error: 'Faltan datos.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ errorCode: '0x105A', error: 'Credenciales inválidas.' });

    if (!user.password) {
      return res.status(400).json({ errorCode: '0x105B', error: 'Esta cuenta se registró con Google. Inicia sesión con Google.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ errorCode: '0x105C', error: 'Credenciales inválidas.' });

    if (user.isBanned) {
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isBanned: false, bannedUntil: null, banReason: null }
        });
      } else {
        return res.status(403).json({ 
          errorCode: '0x105D', error: 'BANNED', 
          message: 'Tu cuenta está bloqueada.', 
          bannedUntil: user.bannedUntil 
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } }
    });
    const token = jwt.sign({ id: user.id, sessionVersion: updatedUser.sessionVersion }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Send async login alert (must await in Vercel serverless)
    const reqIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';
    await emailService.sendLoginAlertEmail(user, reqIp, userAgent).catch(console.error);

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture, usaGorras: user.usaGorras } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorCode: '0x105E', error: 'Error al iniciar sesión.' });
  }
});

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const appleSignin = require('apple-signin-auth');

router.post('/google', async (req, res) => {
  try {
    const { token, accessToken, gender, age } = req.body;
    
    // FIX A-9: Validate token presence before calling Google
    if (!token && !accessToken) return res.status(400).json({ errorCode: '0x105F', error: 'Token de Google requerido.' });
    
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
        return res.status(403).json({ errorCode: '0x1060', error: 'BANNED', message: 'Tu cuenta está bloqueada.', bannedUntil: user.bannedUntil });
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
    res.json({ token: jwtToken, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture, usaGorras: user.usaGorras } });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ errorCode: '0x1061', error: 'Token de Google inválido o caducado.' });
  }
});

router.post('/apple', async (req, res) => {
  try {
    const { token, name: appleName } = req.body;
    // FIX A-9: Validate token presence
    if (!token) return res.status(400).json({ errorCode: '0x1062', error: 'Token de Apple requerido.' });
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
      if (!user) return res.status(400).json({ errorCode: '0x1063', error: 'No se pudo obtener el usuario de Apple.' });
    }

    if (user.isBanned) {
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        await prisma.user.update({ where: { id: user.id }, data: { isBanned: false, bannedUntil: null, banReason: null } });
      } else {
        return res.status(403).json({ errorCode: '0x1064', error: 'BANNED', message: 'Tu cuenta está bloqueada.', bannedUntil: user.bannedUntil });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } }
    });
    const jwtToken = jwt.sign({ id: user.id, sessionVersion: updatedUser.sessionVersion }, process.env.JWT_SECRET, { expiresIn: '1d' });
    // FIX A-10: Never return raw Prisma object — whitelist safe fields only
    res.json({ token: jwtToken, user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture, usaGorras: user.usaGorras } });
  } catch (error) {
    console.error('Apple Auth Error:', error);
    res.status(401).json({ errorCode: '0x1065', error: 'Token de Apple inválido.' });
  }
});

// Removed duplicate authMiddleware import

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
    if (!user) return res.status(404).json({ errorCode: '0x1066', error: 'Usuario no encontrado' });

    const consultasHoyCount = await prisma.consulta.count({
      where: {
        userId: req.user.id,
        createdAt: { gte: todayStart, lte: todayEnd }
      }
    });

    res.json({ user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture, historyCount: user._count.consultas, dailyCount: consultasHoyCount, usaGorras: user.usaGorras } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorCode: '0x1067', error: 'Error al obtener perfil' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, gender, age, estiloPersonal, estiloDetalles, usaGorras, morningAlerts, alertHour } = req.body;
    const updateData = { name, gender, estiloPersonal, estiloDetalles };
    
    if (usaGorras !== undefined) {
      updateData.usaGorras = usaGorras;
    }
    if (morningAlerts !== undefined) {
      updateData.morningAlerts = morningAlerts;
    }
    if (alertHour !== undefined) {
      const h = parseInt(alertHour);
      if (!isNaN(h) && h >= 0 && h <= 23) updateData.alertHour = h;
    }
    if (age !== undefined && age !== null && age !== '') {
      const parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
        return res.status(400).json({ errorCode: '0x1068', error: 'La edad debe estar entre 13 y 120' });
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

    res.json({ user: { id: user.id, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, name: user.name, gender: user.gender, age: user.age, estiloPersonal: user.estiloPersonal, estiloDetalles: user.estiloDetalles, profilePicture: user.profilePicture, historyCount: user._count.consultas, dailyCount: consultasHoyCount, usaGorras: user.usaGorras, morningAlerts: user.morningAlerts, alertHour: user.alertHour } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorCode: '0x1069', error: 'Error al actualizar perfil.' });
  }
});

module.exports = router;
