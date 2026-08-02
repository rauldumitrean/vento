let app;
try {
  const express = require('express');
  const cors = require('cors');
  const dotenv = require('dotenv');

  dotenv.config();

  const authRoutes = require('./routes/auth');
  const apiRoutes = require('./routes/api');
  const paymentsRoutes = require('./routes/payments');
  const friendsRoutes = require('./routes/friends');

  app = express();

  app.use(cors({ origin: '*' }));
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/friends', friendsRoutes);
  app.use('/api', apiRoutes);

  const PORT = process.env.PORT || 3000;
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
  }
} catch (error) {
  const express = require('express');
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({
      error: 'CRITICAL STARTUP ERROR',
      message: error.message,
      stack: error.stack
    });
  });
}

module.exports = app;
