const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
// lastActive is already handled by /api/ping heartbeat endpoint

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, no hay token.', errorCode: '0x108E' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: verified.id }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'El usuario ya no existe.', errorCode: '0x108F' });
    }

    // Single-session check (invalidate older tokens)
    if (verified.sessionVersion !== undefined && user.sessionVersion !== verified.sessionVersion) {
      return res.status(401).json({ error: 'Sesión expirada. Has iniciado sesión en otro dispositivo.', errorCode: '0x1090' });
    }

    if (user.isBanned) {
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        // Unban if time expired
        await prisma.user.update({
          where: { id: user.id },
          data: { isBanned: false, bannedUntil: null, banReason: null }
        });
      } else {
        return res.status(403).json({ error: 'BANNED', 
          message: 'Tu cuenta está bloqueada.', 
          bannedUntil: user.bannedUntil, 
          banReason: user.banReason 
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    // FIX: Changed 400 to 401 - invalid/expired token is an authentication error
    res.status(401).json({ error: ', errorCode: '0x1091'Token inválido.' });
  }
};

module.exports = authMiddleware;
