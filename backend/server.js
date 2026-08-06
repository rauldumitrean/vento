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
  console.error("CRITICAL STARTUP ERROR:", error);
  const express = require('express');
  app = express();
  app.all('(.*)', (req, res) => {
    res.status(500).json({
      error: 'CRITICAL STARTUP ERROR',
      message: error.message,
      stack: error.stack
    });
  });
}

// Auto-migration for Vercel database (adds column if missing)
try {
  const prisma = require('./prismaClient');
  prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;')
    .catch(() => {}); // Ignore error if column already exists

  // Auto-migrate usaGorras
  prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "usaGorras" BOOLEAN;')
    .catch(() => {});

  // Auto-migrate alertCityName
  prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "alertCityName" TEXT;')
    .catch(() => {});

  // Create FavoriteCity table if it doesn't exist
  prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "FavoriteCity" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "cityName" TEXT NOT NULL,
      "lat" DOUBLE PRECISION,
      "lon" DOUBLE PRECISION,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FavoriteCity_userId_cityName_key" UNIQUE ("userId", "cityName")
    );
  `).catch(() => {});
  
  prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "FavoriteCity_userId_idx" ON "FavoriteCity"("userId");`)
    .catch(() => {});
} catch (e) {}

module.exports = app;
