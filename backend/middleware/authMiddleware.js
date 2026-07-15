const jwt = require('jsonwebtoken');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, no hay token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    
    // Update lastActive timestamp in the background
    if (req.user && req.user.id) {
      prisma.user.update({
        where: { id: req.user.id },
        data: { lastActive: new Date() }
      }).catch(err => console.error("Error updating lastActive:", err));
    }
    
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido.' });
  }
};

module.exports = authMiddleware;
