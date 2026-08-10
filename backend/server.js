let app;
try {
  const express = require('express');
  const cors = require('cors');
  const dotenv = require('dotenv');
  const helmet = require('helmet');
  const compression = require('compression');
  const rateLimit = require('express-rate-limit');
  const { errorHandler } = require('./middleware/errorHandler');

  dotenv.config();

  const authRoutes = require('./routes/auth');
  const apiRoutes = require('./routes/api');
  const paymentsRoutes = require('./routes/payments');
  const friendsRoutes = require('./routes/friends');
  const favoritesRoutes = require('./routes/favorites');

  // Configuración de Rate Limiting (Prevención DDoS básica)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Límite de 1000 peticiones por ventana por IP (algo permisivo para no romper la app)
    message: { errorCode: '0x429', error: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app = express();

  // Vercel Proxy Trust para que express-rate-limit funcione correctamente
  app.set('trust proxy', 1);

  // Seguridad HTTP y Compresión
  app.use(helmet());
  app.use(compression());
  
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173'];
  
  app.use(cors({ 
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));
  
  // IMPORTANTE: Los parsers sincrónicos deben ir ANTES de cualquier middleware asíncrono (como el limiter).
  // Si el limiter (asíncrono) va primero en Vercel, cede el Event Loop y el stream de la petición
  // HTTP se agota/cierra antes de que express.json() pueda leerlo, resultando en un req.body vacío ({}).
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Rate Limiting Global (Asíncrono)
  app.use('/api/', limiter);

  // Rate Limiting Estricto para Auth
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 intentos por ventana
    message: { errorCode: '0x429', error: 'Demasiados intentos de autenticación. Intenta más tarde.' }
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/friends', friendsRoutes);
  app.use('/api/favorites', favoritesRoutes);

  app.use('/api', apiRoutes);

  // Middleware Global de Errores (Siempre debe ir al final de las rutas)
  app.use(errorHandler);

  const PORT = process.env.PORT || 3000;
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
  }
} catch (error) {
  console.error("CRITICAL STARTUP ERROR:", error);
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

// Las migraciones de base de datos se han movido a herramientas CLI estándar (Prisma Migrate) 
// para prevenir el uso de comandos RawUnsafe en producción.

module.exports = app;
