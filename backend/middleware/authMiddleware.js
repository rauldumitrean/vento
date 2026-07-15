const jwt = require('jsonwebtoken');
// FIX: Removed redundant PrismaClient instantiation (lastActive update removed from middleware)
// lastActive is already handled by /api/ping heartbeat endpoint

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, no hay token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    // FIX: Removed lastActive write on every request (was causing unnecessary DB writes)
    // /api/ping already handles this on a 15-second heartbeat
    next();
  } catch (err) {
    // FIX: Changed 400 to 401 - invalid/expired token is an authentication error
    res.status(401).json({ error: 'Token inválido.' });
  }
};

module.exports = authMiddleware;
