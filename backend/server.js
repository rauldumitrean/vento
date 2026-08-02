const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const paymentsRoutes = require('./routes/payments');
const friendsRoutes = require('./routes/friends');

const app = express();

// CORS: Allow configured frontend URL, Vercel preview URLs, and localhost
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://ventoo.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain (for preview deployments)
    if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// El webhook de Stripe necesita el body en crudo (raw)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// FIX: Aumentado el límite de JSON a 50mb para permitir el envío de imágenes en base64 en el chat
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}

module.exports = app;
