const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// lastActive is already handled by /api/ping heartbeat endpoint

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, no hay token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: verified.id }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'El usuario ya no existe.' });
    }

    req.user = verified;
    next();
  } catch (err) {
    // FIX: Changed 400 to 401 - invalid/expired token is an authentication error
    res.status(401).json({ error: 'Token inválido.' });
  }
};

module.exports = authMiddleware;
