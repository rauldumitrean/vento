let app;
try {
  const express = require('express');
  const cors = require('cors');
  const dotenv = require('dotenv');
  const helmet = require('helmet');
  const compression = require('compression');
  const rateLimit = require('express-rate-limit');
  const slowDown = require('express-slow-down');
  const { errorHandler } = require('./middleware/errorHandler');

  dotenv.config();

  const authRoutes = require('./routes/auth');
  const apiRoutes = require('./routes/api');
  const paymentsRoutes = require('./routes/payments');
  const friendsRoutes = require('./routes/friends');
  const favoritesRoutes = require('./routes/favorites');

  // ─── CAPA 1: Rate Limiter Global (Anti-HTTP-Flood / DDoS) ────────────────────
  // 300 req / 15 min por IP. Conservador pero suficiente para usuarios normales.
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { errorCode: '0x429', error: 'Demasiadas peticiones. Por favor, espera unos minutos.' },
    skip: (req) => req.path === '/api/health',
  });

  // ─── CAPA 2: Slow Down (Anti-F5-Spam / Anti-Bot Gradual) ─────────────────────
  // Primeras 50 req/15min: velocidad normal.
  // A partir de la 51ª: cada petición extra acumula +100ms de delay (máx 5 seg).
  // Hace que los bots sean ineficientes sin penalizar a usuarios reales.
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: (used) => (used - 50) * 100,
    maxDelayMs: 5000,
  });

  // ─── CAPA 3: Rate Limiters Específicos por Endpoint ───────────────────────────

  // Auth: 10 intentos / 15 min (anti fuerza bruta)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { errorCode: '0x429', error: 'Demasiados intentos de autenticación. Intenta más tarde.' }
  });

  // IA Outfits / Chat / Imágenes: muy caro en CPU y APIs externas
  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { errorCode: '0x429', error: 'Has alcanzado el límite de consultas a la IA. Espera unos minutos.' }
  });

  // Subidas de imágenes: caro en ancho de banda y almacenamiento
  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { errorCode: '0x429', error: 'Has alcanzado el límite de subidas de imágenes.' }
  });

  // ─── CAPA 4: Bot Detection por User-Agent ─────────────────────────────────────
  // Bloquea herramientas de hacking, scrapers y clientes HTTP automatizados.
  const BOT_BLOCKLIST = [
    /python-requests/i,
    /go-http-client/i,
    /curl\//i,
    /wget\//i,
    /scrapy/i,
    /httpclient/i,
    /java\//i,
    /libwww-perl/i,
    /masscan/i,
    /nikto/i,
    /nmap/i,
    /sqlmap/i,
    /dirbuster/i,
    /hydra/i,
  ];

  const botDetector = (req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    const isVercelCron = req.headers['x-vercel-cron'] === '1';
    if (!isVercelCron && (!ua || BOT_BLOCKLIST.some(pattern => pattern.test(ua)))) {
      return res.status(403).json({ errorCode: '0x403B', error: 'Acceso denegado.' });
    }
    next();
  };

  // ─── APP SETUP ────────────────────────────────────────────────────────────────

  app = express();

  // Vercel Proxy Trust: necesario para que express-rate-limit use la IP real del cliente
  app.set('trust proxy', 1);

  // Seguridad HTTP y compresión de respuestas
  app.use(helmet());
  app.use(compression());

  // CORS estricto: solo permite el origen del frontend de producción
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'];

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));

  // Health check: sin rate limit, útil para monitores de uptime
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // IMPORTANTE: Los parsers síncronos van ANTES de los middlewares asíncronos (rate limiters).
  // En Vercel, si el rate limiter (asíncrono) va primero, cede el Event Loop y el stream
  // de la petición HTTP se cierra antes de que express.json() pueda leerlo => req.body = {}
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // ─── MIDDLEWARE STACK (Orden: Bots → Rate Limit Global → Slow Down → Específicos) ──
  app.use('/api/', botDetector);
  app.use('/api/', globalLimiter);
  app.use('/api/', speedLimiter);

  // Limiters específicos para endpoints costosos
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/recomendacion', aiLimiter);
  app.use('/api/chat', aiLimiter);
  app.use('/api/images/generate', aiLimiter);
  app.use('/api/travel-packing', aiLimiter);
  app.use('/api/upload-avatar', uploadLimiter);
  app.use('/api/armario/upload-prenda-photo', uploadLimiter);

  // ─── RUTAS ────────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/friends', friendsRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api', apiRoutes);

  // Middleware global de errores (siempre al final)
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

// Las migraciones de base de datos se gestionan con Prisma Migrate CLI.
// Se eliminaron los prisma.$executeRawUnsafe del arranque por seguridad.

module.exports = app;
