const prisma = require('../prismaClient');

const getFavorites = async (req, res, next) => {
  try {
    const favorites = await prisma.favoriteCity.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, cityName: true, lat: true, lon: true, createdAt: true }
    });
    res.json({ favorites });
  } catch (err) {
    err.errorCode = '0x1003';
    err.statusCode = 500;
    next(err);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const { cityName, lat, lon } = req.body;
    if (!cityName) {
      return res.status(400).json({ errorCode: '0x1004', error: 'cityName es requerido' });
    }

    const latFloat = lat ? parseFloat(lat) : null;
    const lonFloat = lon ? parseFloat(lon) : null;

    const favorite = await prisma.favoriteCity.upsert({
      where: { userId_cityName: { userId: req.user.id, cityName } },
      update: { lat: latFloat, lon: lonFloat },
      create: { userId: req.user.id, cityName, lat: latFloat, lon: lonFloat }
    });
    res.json({ favorite });
  } catch (err) {
    err.errorCode = '0x1005';
    err.statusCode = 500;
    next(err);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ errorCode: '0x1006_B', error: 'ID inválido' });
    const fav = await prisma.favoriteCity.findUnique({ where: { id } });
    
    if (!fav || fav.userId !== req.user.id) {
      return res.status(404).json({ errorCode: '0x1006', error: 'Favorito no encontrado' });
    }
    
    await prisma.favoriteCity.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    err.errorCode = '0x1007';
    err.statusCode = 500;
    next(err);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite
};
