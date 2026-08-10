const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const prisma = require('../prismaClient');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// FIX: Moved bcrypt require to top level instead of inside route handlers
const bcrypt = require('bcryptjs');
const { sendBanNotificationEmail, sendNewTicketEmail } = require('../services/emailService');

// Initialize Gemini (graceful degradation if missing)
const geminiKey = process.env.GEMINI_API_KEY || 'MISSING_KEY';
const genAI = new GoogleGenerativeAI(geminiKey);

// In-memory fallbacks for when DB tables are not yet provisioned (e.g., fresh deploys)
const activeRequests = new Map();
const weatherCache = new Map();
const weatherCacheKeys = [];

// Admin Middleware
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ errorCode: '0x1000', error: 'Acceso denegado. Se requiere rol de Administrador.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ errorCode: '0x1001', error: 'Error verificando rol de administrador' });
  }
};

// Heartbeat: update lastActive so we know who has the tab open right now
router.post('/ping', authMiddleware, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { lastActive: new Date() }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ errorCode: '0x1002', error: 'Ping error' });
  }
});

// Upload avatar to ImgBB
router.post('/upload-avatar', authMiddleware, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ errorCode: '0x1008', error: 'No se envió ninguna imagen.' });

    // Ensure API key is configured
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      console.warn("Falta IMGBB_API_KEY. Simulando subida de avatar.");
      // Dummy success for development
      await prisma.user.update({
        where: { id: req.user.id },
        data: { profilePicture: 'https://i.ibb.co/dummy/avatar.jpg' }
      });
      return res.json({ profilePicture: 'https://i.ibb.co/dummy/avatar.jpg' });
    }

    // Prepare ImgBB payload
    // ImgBB API requires just the base64 string without the "data:image/jpeg;base64," prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const formData = new URLSearchParams();
    formData.append('image', base64Data);

    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data && response.data.data && response.data.data.url) {
      const profilePicture = response.data.data.url;
      
      // Update DB
      await prisma.user.update({
        where: { id: req.user.id },
        data: { profilePicture }
      });
      
      res.json({ profilePicture });
    } else {
      res.status(500).json({ errorCode: '0x1009', error: 'Error inesperado al subir la imagen a ImgBB.' });
    }
  } catch (error) {
    console.error('Error uploading avatar:', error?.response?.data || error.message);
    res.status(500).json({ errorCode: '0x100A', error: 'Error al subir la imagen.' });
  }
});

// Weather Cache: Try DB first, fall back to in-memory

router.get('/autocomplete', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ results: [] });
    const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=es&format=json`);
    res.json({ results: geoRes.data.results || [] });
  } catch (error) {
    console.error('Error in /autocomplete:', error.message);
    res.json({ results: [] });
  }
});

router.get('/weather', authMiddleware, async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    let latitude = lat;
    let longitude = lon;
    
    // FIX B-M3: use normalized coordinates for cache key if city is used
    // Wait, first we need to get the coordinates before caching!
    if (city && (latitude == null || longitude == null)) {
      const geoResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`);
      if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
        return res.status(404).json({ errorCode: '0x100B', error: 'Ciudad no encontrada' });
      }
      latitude = geoResponse.data.results[0].latitude;
      longitude = geoResponse.data.results[0].longitude;
      city = geoResponse.data.results[0].name;
    }

    // FIX B-M4: allow 0
    if (latitude == null || longitude == null) {
      return res.status(400).json({ errorCode: '0x100C', error: 'Se requiere latitud y longitud o nombre de ciudad' });
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({ errorCode: '0x100D', error: 'Coordenadas de latitud/longitud inválidas' });
    }
    
    // Normalised cache key based on coordinates only
    const cacheKey = `coord_${latNum.toFixed(2)}_${lonNum.toFixed(2)}`;
    
    // Check in-memory cache first (10 min TTL)
    let responseData;
    if (weatherCache.has(cacheKey)) {
      const cached = weatherCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
        responseData = cached.data;
      } else {
        weatherCache.delete(cacheKey);
        const idx = weatherCacheKeys.indexOf(cacheKey);
        if (idx > -1) weatherCacheKeys.splice(idx, 1);
      }
    }

    if (!responseData) {
      const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lonNum}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,uv_index,surface_pressure,cloud_cover&daily=temperature_2m_max,temperature_2m_min&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto`);
      
      responseData = {
        location: city || `${latitude}, ${longitude}`,
        lat: latitude,
        lon: longitude,
        current: weatherResponse.data.current,
        daily: weatherResponse.data.daily,
        hourly: weatherResponse.data.hourly
      };

      // Save to in-memory cache
      if (weatherCache.size >= 500) {
        const oldestKey = weatherCacheKeys.shift();
        if (oldestKey) weatherCache.delete(oldestKey);
      }
      weatherCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      weatherCacheKeys.push(cacheKey);
    }

    const isFav = await prisma.favoriteCity.findFirst({
      where: { userId: req.user.id, cityName: responseData.location }
    });

    res.json({ ...responseData, isFavoriteCity: !!isFav, favoriteCityId: isFav?.id || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorCode: '0x100E', error: 'Error al obtener el clima' });
  }
});

// Lightweight weather for favorite city cards (temp, condition, feel, wind)
router.get('/weather-mini', authMiddleware, async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    let latitude = lat;
    let longitude = lon;

    if (city && (!latitude || !longitude)) {
      const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`);
      if (!geoRes.data.results || geoRes.data.results.length === 0) {
        return res.status(404).json({ errorCode: '0x100F', error: 'Ciudad no encontrada' });
      }
      latitude = geoRes.data.results[0].latitude;
      longitude = geoRes.data.results[0].longitude;
    }

    if (!latitude || !longitude) return res.status(400).json({ errorCode: '0x1010', error: 'Parámetros insuficientes' });

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    // Re-use main weather cache if available
    const cacheKey = `coord_${latNum.toFixed(2)}_${lonNum.toFixed(2)}`;
    if (weatherCache.has(cacheKey)) {
      const cached = weatherCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
        const c = cached.data.current;
        // Map Open-Meteo WMO code to OWM-style code
        const code = c.weather_code;
        let owmCode = 800;
        if (code === 0) owmCode = 800;
        else if (code <= 3) owmCode = 801;
        else if (code <= 48) owmCode = 741;
        else if (code <= 67) owmCode = 500;
        else if (code <= 77) owmCode = 601;
        else if (code <= 82) owmCode = 521;
        else if (code <= 86) owmCode = 601;
        else owmCode = 211;

        const descs = { 0:'Despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',45:'Niebla',51:'Llovizna',53:'Llovizna',61:'Lluvia ligera',63:'Lluvia',65:'Lluvia fuerte',71:'Nieve ligera',73:'Nieve',75:'Nieve fuerte',80:'Chubascos ligeros',81:'Chubascos',82:'Chubascos fuertes',95:'Tormenta',96:'Tormenta con granizo',99:'Tormenta con granizo fuerte' };

        return res.json({
          temp: Math.round(c.temperature_2m),
          feels: Math.round(c.apparent_temperature),
          desc: descs[code] || 'Variable',
          code: owmCode,
          humidity: c.relative_humidity_2m,
          wind: Math.round((c.wind_speed_10m || 0))
        });
      }
    }

    // Fetch fresh
    const wRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lonNum}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`);
    const c = wRes.data.current;
    const code = c.weather_code;
    let owmCode = 800;
    if (code === 0) owmCode = 800;
    else if (code <= 3) owmCode = 801;
    else if (code <= 48) owmCode = 741;
    else if (code <= 67) owmCode = 500;
    else if (code <= 77) owmCode = 601;
    else if (code <= 82) owmCode = 521;
    else if (code <= 86) owmCode = 601;
    else owmCode = 211;

    const descs = { 0:'Despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',45:'Niebla',51:'Llovizna',53:'Llovizna',61:'Lluvia ligera',63:'Lluvia',65:'Lluvia fuerte',71:'Nieve ligera',73:'Nieve',75:'Nieve fuerte',80:'Chubascos ligeros',81:'Chubascos',82:'Chubascos fuertes',95:'Tormenta',96:'Tormenta con granizo',99:'Tormenta con granizo fuerte' };

    res.json({
      temp: Math.round(c.temperature_2m),
      feels: Math.round(c.apparent_temperature),
      desc: descs[code] || 'Variable',
      code: owmCode,
      humidity: c.relative_humidity_2m,
      wind: Math.round((c.wind_speed_10m || 0))
    });
  } catch (err) {
    console.error('weather-mini error:', err.message);
    res.status(500).json({ errorCode: '0x1011', error: 'Error al obtener el clima' });
  }
});

// In-memory lock (serverless-safe fallback) - also tries DB lock when tables available
router.post('/recomendacion', authMiddleware, async (req, res) => {
  if (activeRequests.has(req.user.id)) {
    return res.status(429).json({ errorCode: '0x1012', error: "Ya estamos generando un outfit para ti, por favor espera." });
  }
  activeRequests.set(req.user.id, true);



  try {
    const { lat, lon, ubicacion, clima, daily } = req.body;

    if (!clima) return res.status(400).json({ errorCode: '0x1013', error: 'Se requieren datos del clima' });
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'INSERT_YOUR_GEMINI_KEY_HERE') {
      return res.status(500).json({ errorCode: '0x1014', error: 'La API Key de Gemini no está configurada en el backend.'});
    }

    // --- Optimizacion: Ejecutar peticiones a DB en paralelo ---
    const [dbUser, armario, allNonFavsCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id } }),
      prisma.prendaArmario.findMany({ where: { userId: req.user.id } }),
      prisma.consulta.count({ where: { userId: req.user.id, isFavorite: false } })
    ]);

    if (!dbUser) return res.status(401).json({ errorCode: '0x1015', error: 'Usuario no encontrado' });
    
    // --- LÍMITE DE HISTORIAL ---
    const historyLimit = dbUser.isPremium || dbUser.role === 'ADMIN' ? 50 : 15;
    if (allNonFavsCount >= historyLimit) {
      return res.status(403).json({ errorCode: '0x1016', error: `Has alcanzado el límite máximo de tu historial (${historyLimit}/${historyLimit}). Borra algunos outfits desde tu Armario para generar nuevos.` });
    }

    // --- SISTEMA FREEMIUM: Límite de 5 outfits al día ---
    if (!dbUser.isPremium && dbUser.role !== 'ADMIN') {
      const now = new Date();
      // FIX B-M5: use UTC timezone for daily limits
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const consultasHoy = await prisma.consulta.count({
          where: { userId: req.user.id, createdAt: { gte: today } }
      });
  
      if (consultasHoy >= 5) {
          activeRequests.delete(req.user.id);
          return res.status(403).json({ errorCode: '0x1017', error: "Has alcanzado tu límite gratuito de 5 outfits por día. Vuelve mañana o actualiza a Premium." });
      }
    }
    // ----------------------------------------------------

    let armarioText = "";
    if (armario.length > 0) {
      armarioText = "El usuario TIENE las siguientes prendas en su armario:\n" + armario.map(p => `- ID [${p.id}]: [${p.categoria}] ${p.descripcion} (${p.color || ''})`).join('\n') + "\nIMPORTANTE: PRIORIZA usar estas prendas exactas en tu recomendación si son adecuadas para el clima. Si usas una de estas prendas, incluye obligatoriamente su ID en el campo 'id_armario'. Si necesitas algo que no tiene, recomiéndalo normalmente (id_armario = null).";
    }

    const amazonTag = process.env.AMAZON_AFFILIATE_TAG || 'ventoo-21';
    
    let genderText = "";
    if (dbUser.gender) {
      const g = dbUser.gender.toLowerCase();
      if (g === 'hombre') genderText = "IMPORTANTE: El cliente es un HOMBRE. Asegúrate de recomendar exclusivamente ropa de hombre o masculina.";
      else if (g === 'mujer') genderText = "IMPORTANTE: El cliente es una MUJER. Asegúrate de recomendar exclusivamente ropa de mujer o femenina.";
    }

    let styleText = "";
    if (dbUser.estiloPersonal || dbUser.estiloDetalles) {
      styleText = "IMPORTANTE: El estilo personal del usuario es: " + (dbUser.estiloPersonal || "No especificado") + ". " + (dbUser.estiloDetalles ? "Detalles extra: " + dbUser.estiloDetalles : "");
    }

    let gorrasText = "";
    if (dbUser.usaGorras === true) {
      gorrasText = "IMPORTANTE: El usuario SÍ usa gorras/sombreros. Incluye una gorra o sombrero que combine perfectamente con el outfit.";
    } else if (dbUser.usaGorras === false) {
      gorrasText = "IMPORTANTE: El usuario NO usa gorras/sombreros. NO incluyas bajo ningún concepto gorras o sombreros.";
    }

    let ageText = "";
    if (dbUser.age) {
      ageText = `IMPORTANTE: El usuario tiene ${dbUser.age} años de edad. CRÍTICO: Las prendas sugeridas DEBEN SER estrictamente acordes y apropiadas para alguien de ${dbUser.age} años.`;
    }
    
    let nameText = "";
    if (dbUser.name) {
      nameText = `- Nombre: ${dbUser.name} (Dirígete a esta persona por su nombre en el resumen)`;
    }

    let weatherExtraText = "";
    if (daily && daily.temperature_2m_max && daily.temperature_2m_min) {
      const maxTemp = daily.temperature_2m_max[0];
      const minTemp = daily.temperature_2m_min[0];
      const diff = maxTemp - minTemp;
      let layeringTip = "";
      if (diff >= 10) {
        layeringTip = " Hay una gran amplitud térmica hoy. Es OBLIGATORIO recomendar vestirse en capas (layering) para que el usuario pueda adaptarse a medida que cambie la temperatura.";
      }
      weatherExtraText = `\n- Temperatura Máxima: ${maxTemp}°C\n- Temperatura Mínima: ${minTemp}°C\n${layeringTip}`;
    }

const prompt = `Actúas como un Personal Shopper y Asesor de Imagen de altísimo nivel, reconocido por tu impecable gusto, conocimiento de tendencias y capacidad para crear "looks" de revista.

[PERFIL DEL CLIENTE]
${nameText}
${genderText}
${ageText}
${styleText}
${gorrasText}
${armarioText}

[CONDICIONES METEOROLÓGICAS - ${ubicacion}]
- Clima Actual: ${clima.temperature_2m}°C (Sensación: ${clima.apparent_temperature}°C)
- Humedad: ${clima.relative_humidity_2m}%
- Viento: ${clima.wind_speed_10m} km/h${weatherExtraText}
IMPORTANTE: Basa el outfit en las condiciones de TODO el día, no solo en la actual.

[INSTRUCCIONES DE DISEÑO]
1. Diseña un outfit impecable, moderno y estéticamente superior que resuelva perfectamente el clima y encaje con el perfil del usuario.
2. REQUISITOS DE PRENDAS OBLIGATORIAS:
   - Debes incluir SIEMPRE: Camiseta/Top, Pantalón/Bottom, Calzado y Calcetines (especifica su color/modelo, ej: "Calcetines altos blancos de canalé").
   - SI la temperatura actual o máxima es MENOR a 20°C, debes incluir obligatoriamente Sudadera/Jersey y/o Abrigo/Chaqueta.
   - SI la temperatura actual o máxima es MAYOR O IGUAL a 25°C, ESTÁ TERMINANTEMENTE PROHIBIDO INCLUIR ABRIGOS, CHAQUETAS, SUDADERAS O JERSEYS. Solo ropa fresca.
   - SI el usuario usa gorras, SIEMPRE incluye Gorra.
3. El "resumen" debe sonar experto, cálido y persuasivo.
4. El "consejo_extra" debe ser un "pro-tip" de estilismo útil y avanzado aplicable al outfit recomendado.
5. CRÍTICO PARA LA IA DE IMÁGENES:
   - "descripcion": DEBE ser extremadamente detallada, altamente visual y fotográfica. Especifica el tejido, el corte (fit), el tono exacto del color, y detalles de diseño.
   - "english_query": DEBE ser la traducción al inglés exacta, corta y optimizada para un generador de imágenes.
   - "nombre_corto": debe ser el título simple de la prenda para mostrar en grande en la app.

Debes devolver la respuesta ESTRICTAMENTE en el siguiente formato JSON, sin bloques de código markdown ni explicaciones adicionales:
{
  "resumen": "Resumen experto y persuasivo del look y por qué funciona para hoy",
  "prendas": [
    { 
      "categoria": "TOP|BOTTOM|CALZADO|ABRIGO|ACCESORIO", 
      "nombre_corto": "Nombre corto y comercial de la prenda (Ej: Pantalón de Lino (Arena))",
      "descripcion": "Descripción ultra-detallada y fotográfica de la prenda en español", 
      "english_query": "English translation optimized for image generation (e.g. 'white oversized t-shirt')",
      "razon": "Justificación técnica o estilística para incluir esta prenda",
      "tienda_recomendada": "Amazon",
      "enlace_compra": "https://www.amazon.es/s?k=busqueda+de+la+prenda&tag=${amazonTag}",
      "id_armario": 123 // OBLIGATORIO incluir el número de ID si usaste una prenda del armario del usuario. Si es una prenda nueva o inventada, pon null.
    }
  ],
  "timeline": [
    { "hora": "08:00", "temp": 15, "emoji": "🧥", "consejo": "Breve consejo de qué llevar o qué acción tomar a esta hora (máx 60 chars)" },
    { "hora": "13:00", "temp": 24, "emoji": "☀️", "consejo": "Puedes quitarte la chaqueta, quédate con la camiseta" },
    { "hora": "20:00", "temp": 17, "emoji": "🌙", "consejo": "Recupera la chaqueta, la noche refresca" }
  ],
  "consejo_extra": "Pro-tip de estilismo avanzado aplicable a este look",
  "infraccion": null
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    const result = await model.generateContent(prompt);
    let textResult = result.response.text();
    
    if(textResult.includes('\`\`\`json')) {
        textResult = textResult.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }
    
    let recomendacionJSON;
    try {
      recomendacionJSON = JSON.parse(textResult);
    } catch(e) {
      console.error("Error parseando JSON de Gemini:", textResult);
      return res.status(500).json({ errorCode: '0x1018', error: 'Error procesando respuesta de IA' });
    }

    // --- HYDRATE ARMARIO IMAGES ---
    if (recomendacionJSON.prendas) {
      for (let prenda of recomendacionJSON.prendas) {
        if (prenda.id_armario) {
          const prendaArmario = armario.find(p => p.id === prenda.id_armario);
          if (prendaArmario && prendaArmario.imageUrl) {
            prenda.imageUrl = prendaArmario.imageUrl; // Enviar la URL real de la prenda al frontend
          }
        }
      }
    }

    // --- AUTO-MODERATOR: Check for violations ---
    if (recomendacionJSON.infraccion && recomendacionJSON.infraccion.es_infraccion) {
      const severidad = recomendacionJSON.infraccion.nivel_severidad || 'bajo';
      const days = severidad === 'alto' ? 30 : severidad === 'medio' ? 7 : 1;
      const bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + days);
      const banReason = `[AutoModerator] ${recomendacionJSON.infraccion.razon}`;

      await prisma.user.update({
        where: { id: req.user.id },
        data: { isBanned: true, bannedUntil, banReason }
      });
      // Try to send email async
      setTimeout(() => {
        sendBanNotificationEmail(dbUser, true, bannedUntil, banReason).catch(console.error);
      }, 0);

      return res.status(403).json({ 
        errorCode: '0x1019', error: 'BANNED', 
        message: 'Tu cuenta ha sido bloqueada por violar las normas.',
        bannedUntil,
        banReason 
      });
    }

    const consulta = await prisma.consulta.create({
      data: {
        userId: req.user.id,
        ubicacion: ubicacion,
        clima_json: JSON.stringify(clima),
        recomendacion_json: JSON.stringify(recomendacionJSON)
      }
    });

    const userWithPoints = await prisma.user.update({
      where: { id: req.user.id },
      data: { points: { increment: 10 } }
    });
    if (getLevelFromPoints(userWithPoints.points) !== userWithPoints.level) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { level: getLevelFromPoints(userWithPoints.points) }
      });
    }

    res.json({ consultaId: consulta.id, recomendacion: recomendacionJSON });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorCode: '0x101A', error: 'Error al generar la recomendación' });
  } finally {
    // Release in-memory lock
    activeRequests.delete(req.user.id);
  }
});

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { consultaId, mensaje, imageBase64, imageMimeType } = req.body;
    if (!consultaId || !mensaje) return res.status(400).json({ errorCode: '0x101B', error: 'Faltan datos' });

    // FIX B-M6: MIME type validation for image uploads
    if (imageBase64 && imageMimeType) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(imageMimeType)) {
        return res.status(400).json({ errorCode: '0x101C', error: 'Tipo de imagen no soportado. Usa JPEG, PNG o WebP.' });
      }
    }

    // FIX B-M7: Pagination limit for chat history to prevent unbounded memory growth
    const consulta = await prisma.consulta.findUnique({ 
      where: { id: consultaId }, 
      include: { mensajes: { take: 50, orderBy: { createdAt: 'desc' } } } 
    });
    if (!consulta) return res.status(404).json({ errorCode: '0x101D', error: 'Consulta no encontrada' });
    if (consulta.userId !== req.user.id) return res.status(403).json({ errorCode: '0x101E', error: 'No autorizado' });

    // Ensure they are in chronological order for the model
    consulta.mensajes.reverse();

    await prisma.mensajeChat.create({
      data: { consultaId, rol: 'user', contenido: mensaje }
    });

    const history = consulta.mensajes.map(m => ({
      role: m.rol === 'user' ? 'user' : 'model',
      parts: [{ text: m.contenido }],
    }));

    const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    let styleTextChat = "";
    if (dbUser && (dbUser.estiloPersonal || dbUser.estiloDetalles)) {
      styleTextChat = `Toma en cuenta el estilo personal del usuario: ${dbUser.estiloPersonal || "No especificado"}. ${dbUser.estiloDetalles ? "Detalles: " + dbUser.estiloDetalles : ""}`;
    }

    let ageTextChat = "";
    if (dbUser && dbUser.age) {
      ageTextChat = `Toma en cuenta que el usuario tiene ${dbUser.age} años de edad. Adapta tus recomendaciones y tono para alguien de su edad.`;
    }
    
    let nameTextChat = "";
    if (dbUser && dbUser.name) {
      nameTextChat = `El usuario se llama ${dbUser.name}. Respóndele por su nombre para ser amigable y cercano.`;
    }

    const model = genAI.getGenerativeModel({ 
      // FIX: Use gemini-3.1-flash-lite as it supports vision and is in the user's quota
      model: "gemini-3.1-flash-lite", // Soporta vision
      systemInstruction: `Eres un experto asesor de moda personal de la app Ventoo. Acabas de recomendar este outfit: ${consulta.recomendacion_json} basado en este clima: ${consulta.clima_json} en ${consulta.ubicacion}. 
${nameTextChat}
${ageTextChat}
${styleTextChat}
REGLA ESTRICTA 1: SÓLO puedes responder a preguntas de moda y clima. Niégate educadamente a otros temas.
REGLA ESTRICTA 2: SIEMPRE RESPONDE EN FORMATO JSON VÁLIDO puro, sin etiquetas markdown de bloque de código (\`\`\`json).
Estructura obligatoria del JSON:
{
  "texto": "Tu respuesta amigable y conversacional",
  "nuevas_prendas": [
    // OPCIONAL. SÓLO si el usuario pide cambiar el outfit o sugiere otra prenda, añade aquí la prenda.
    // { "categoria": "TOP" (o BOTTOM, CALZADO), "nombre_corto": "Nombre simple (Ej: Botas Chelsea Negras)", "descripcion": "Descripción mega detallada y visual", "razon": "Por qué es mejor opción", "color": "...", "enlace_compra": "https://amazon.es/s?k=...", "tienda_recomendada": "Amazon" }
  ],
  "infraccion": null // Pon null si todo es correcto. SI el usuario pide cosas ilegales, contenido sexual explícito, o viola gravemente las reglas, devuelve { "es_infraccion": true, "razon": "Motivo detallado", "nivel_severidad": "bajo|medio|alto" }
}
1. Responde siempre en JSON.
2. Si sugieres prendas nuevas (por ejemplo, porque el usuario quiere cambiar una zapatilla por botas), devuélvelas en la clave "nuevas_prendas". Cada nueva prenda debe seguir el formato estricto: {"categoria": "TOP|BOTTOM|CALZADO|ACCESORIO", "nombre_corto": "Nombre corto (Ej: Botas Chelsea)", "descripcion": "Descripción mega detallada y visual", "razon": "Por qué es mejor opción", "tienda_recomendada": "Amazon", "enlace_compra": "https://www.amazon.es/s?k=..."}.
3. NO incluyas "nuevas_prendas" si solo estás conversando o dando un tip general.
4. "nombre_corto" es OBLIGATORIO en "nuevas_prendas" y debe ser el título corto de la prenda.`
    });
    
    const chat = model.startChat({ history });

    let parts = [{ text: mensaje }];
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType
        }
      });
    }

    const result = await chat.sendMessage(parts);
    let textResponse = result.response.text();
    
    // Parse to check for infractions
    if(textResponse.includes('\`\`\`json')) {
        textResponse = textResponse.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }
    
    try {
      const responseJSON = JSON.parse(textResponse);
      if (responseJSON.infraccion && responseJSON.infraccion.es_infraccion) {
        const severidad = responseJSON.infraccion.nivel_severidad || 'bajo';
        const days = severidad === 'alto' ? 30 : severidad === 'medio' ? 7 : 1;
        const bannedUntil = new Date();
        bannedUntil.setDate(bannedUntil.getDate() + days);
        const banReason = `[AutoModerator] ${responseJSON.infraccion.razon}`;

        await prisma.user.update({
          where: { id: req.user.id },
          data: { isBanned: true, bannedUntil, banReason }
        });
        
        setTimeout(() => {
          sendBanNotificationEmail(dbUser, true, bannedUntil, banReason).catch(console.error);
        }, 0);

        // Guardar el mensaje del modelo en el historial para auditoría en el panel de admin
        await prisma.mensajeChat.create({
          data: { consultaId, rol: 'model', contenido: textResponse }
        });

        return res.status(403).json({ 
          errorCode: '0x101F', error: 'BANNED', 
          message: 'Tu cuenta ha sido bloqueada por violar las normas.',
          bannedUntil,
          banReason 
        });
      }
    } catch(e) {
      // Ignoramos errores de parseo aquí, si falla se enviará como texto plano
    }

    const nuevoMensaje = await prisma.mensajeChat.create({
      data: { consultaId, rol: 'model', contenido: textResponse }
    });

    res.json({ respuesta: textResponse, mensajeId: nuevoMensaje.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorCode: '0x1020', error: 'Error al procesar el mensaje de chat' });
  }
});

// Armario Routes
router.get('/armario', authMiddleware, async (req, res) => {
  try {
    const prendas = await prisma.prendaArmario.findMany({ where: { userId: req.user.id } });
    res.json(prendas);
  } catch (error) {
    res.status(500).json({ errorCode: '0x1021', error: 'Error al obtener el armario' });
  }
});

router.post('/armario', authMiddleware, async (req, res) => {
  try {
    const { categoria, descripcion, color } = req.body;
    if (!categoria || !descripcion) return res.status(400).json({ errorCode: '0x1022', error: 'Faltan datos' });
    if (descripcion.length > 500) return res.status(400).json({ errorCode: '0x1023', error: 'La descripción no puede superar los 500 caracteres' });
    const nuevaPrenda = await prisma.prendaArmario.create({
      data: { userId: req.user.id, categoria, descripcion, color }
    });
    res.json(nuevaPrenda);
  } catch (error) {
    res.status(500).json({ errorCode: '0x1024', error: 'Error al añadir prenda' });
  }
});

router.delete('/armario/:id', authMiddleware, async (req, res) => {
  try {
    // FIX: Validate ID is a valid integer
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ errorCode: '0x1025', error: 'ID inválido' });
    await prisma.prendaArmario.delete({ 
      where: { id, userId: req.user.id } 
    });
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ errorCode: '0x1026', error: 'Prenda no encontrada' });
    res.status(500).json({ errorCode: '0x1027', error: 'Error al eliminar prenda' });
  }
});

// Historial Routes
router.get('/historial', authMiddleware, async (req, res) => {
  try {
    const historial = await prisma.consulta.findMany({ 
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ errorCode: '0x1028', error: 'Error al obtener historial' });
  }
});

router.put('/historial/:id/favorito', authMiddleware, async (req, res) => {
  try {
    // FIX: Validate ID is a valid integer
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ errorCode: '0x1029', error: 'ID inválido' });
    // FIX B-M10: type validation
    const { isFavorite } = req.body;
    if (typeof isFavorite !== 'boolean') return res.status(400).json({ errorCode: '0x102A', error: 'isFavorite debe ser un booleano' });
    
    let consulta = await prisma.consulta.findFirst({ 
      where: { id, userId: req.user.id } 
    });
    if (!consulta) return res.status(404).json({ errorCode: '0x102E', error: 'Consulta no encontrada' });
    
    consulta = await prisma.consulta.update({
      where: { id },
      data: { isFavorite }
    });
    res.json(consulta);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ errorCode: '0x102B', error: 'Consulta no encontrada' });
    res.status(500).json({ errorCode: '0x102C', error: 'Error al actualizar favorito' });
  }
});

router.delete('/historial/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ errorCode: '0x102D', error: 'ID inválido' });

    // Verificar propiedad
    const consulta = await prisma.consulta.findFirst({ where: { id, userId: req.user.id } });
    if (!consulta) return res.status(404).json({ errorCode: '0x102E', error: 'Consulta no encontrada' });

    // Borrar mensajes asociados primero (Foreign Key constraint)
    await prisma.mensajeChat.deleteMany({ where: { consultaId: id } });
    
    // Borrar la consulta
    await prisma.consulta.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al borrar historial:', error);
    res.status(500).json({ errorCode: '0x102F', error: 'Error al borrar la consulta' });
  }
});

router.post('/historial/save-shared/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ errorCode: '0x1030', error: 'ID inválido' });

    // Buscar la consulta compartida
    const sharedConsulta = await prisma.consulta.findUnique({ where: { id } });
    if (!sharedConsulta) return res.status(404).json({ errorCode: '0x1031', error: 'Consulta no encontrada' });

    // FIX A-6 (Actualizado): IDOR prevention — only allow saving outfits that were explicitly shared with THIS user
    const receivedMessage = await prisma.directMessage.findFirst({
      where: {
        receiverId: req.user.id,
        outfitId: id
      }
    });

    if (!receivedMessage) {
      return res.status(403).json({ errorCode: '0x1032', error: 'No tienes permiso para guardar este outfit porque no te ha sido compartido directamente.' });
    }

    // Verificar si ya la tiene guardada (para no duplicar innecesariamente)
    const existing = await prisma.consulta.findFirst({
      where: {
        userId: req.user.id,
        ubicacion: sharedConsulta.ubicacion,
        clima_json: sharedConsulta.clima_json,
        recomendacion_json: sharedConsulta.recomendacion_json
      }
    });

    if (existing) {
      return res.json({ success: true, message: 'Ya tienes este outfit en tu historial', consulta: existing });
    }

    // Crear una copia para el usuario actual
    const newConsulta = await prisma.consulta.create({
      data: {
        userId: req.user.id,
        ubicacion: sharedConsulta.ubicacion,
        clima_json: sharedConsulta.clima_json,
        recomendacion_json: sharedConsulta.recomendacion_json,
        isFavorite: true, // Se guarda como favorito por defecto al ser compartido
        isShared: true
      }
    });

    res.json({ success: true, consulta: newConsulta });
  } catch (error) {
    console.error('Error al guardar outfit compartido:', error);
    res.status(500).json({ errorCode: '0x1033', error: 'Error al guardar el outfit compartido' });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// --- GESTIÓN DE OUTFITS Y COMUNIDAD ---
router.get('/admin/community', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const posts = await prisma.consulta.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 200, // Limitar a los últimos 200 posts
      include: {
        user: { select: { id: true, email: true, name: true, profilePicture: true } }
      }
    });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorCode: '0x107A', error: 'Error al obtener publicaciones de la comunidad' });
  }
});

router.delete('/admin/community/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.consulta.update({
      where: { id },
      data: { isPublic: false }
    });
    res.json({ success: true, message: 'Publicación restringida de la comunidad.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorCode: '0x107B', error: 'Error al eliminar la publicación' });
  }
});
router.get('/admin/outfits', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.query;
    
    let whereClause = {};
    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    const outfits = await prisma.consulta.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: userId ? 500 : 100, // Limitar a los últimos 100 si es global, 500 si es de un usuario
      include: {
        user: { select: { email: true, name: true, role: true, isPremium: true } }
      }
    });
    res.json(outfits);
  } catch (error) {
    console.error('Error fetching admin outfits:', error);
    res.status(500).json({ errorCode: '0x1034', error: 'Error obteniendo los outfits' });
  }
});

router.delete('/admin/outfits/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ errorCode: '0x1035', error: 'ID inválido' });

    // Delete chat messages first
    await prisma.mensajeChat.deleteMany({ where: { consultaId: id } });
    
    // Delete consulta
    await prisma.consulta.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar el outfit:', error);
    res.status(500).json({ errorCode: '0x1036', error: 'Error al eliminar el outfit' });
  }
});

router.delete('/admin/outfits', authMiddleware, adminMiddleware, async (req, res) => {
  // FIX C-7: Require explicit confirmation to prevent accidental data wipe
  if (req.body.confirmDelete !== 'DELETE_ALL_OUTFITS') {
    return res.status(400).json({ errorCode: '0x1037', error: 'Se requiere confirmación. Envia confirmDelete: "DELETE_ALL_OUTFITS" en el body.' });
  }
  try {
    // Delete all chat messages first
    await prisma.mensajeChat.deleteMany();
    
    // Delete all consultas
    await prisma.consulta.deleteMany();

    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar TODOS los outfits:', error);
    res.status(500).json({ errorCode: '0x1038', error: 'Error al eliminar todos los outfits' });
  }
});

router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const premiumUsers = await prisma.user.count({ where: { isPremium: true } });
    const totalOutfits = await prisma.consulta.count();
    const totalMessages = await prisma.mensajeChat.count();
    const totalClothes = await prisma.prendaArmario.count();
    const totalTickets = await prisma.ticket.count();
    
    // Obtenemos el último ticket para la fecha
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    
    // Online = pinged in the last 45 seconds (heartbeat every 15s)
    const ninetySecondsAgo = new Date(Date.now() - 45 * 1000);
    const onlineUsers = await prisma.user.count({
      where: { lastActive: { gte: ninetySecondsAgo } }
    });

    res.json({
      totalUsers,
      premiumUsers,
      totalOutfits,
      totalMessages,
      totalClothes,
      onlineUsers,
      totalTickets,
      lastTicketDate: lastTicket ? lastTicket.createdAt : null,
      maxUsersCapacity: 50000 // Free tier calculation estimate
    });
  } catch (error) {
    res.status(500).json({ errorCode: '0x1039', error: 'Error al obtener estadísticas' });
  }
});

router.get('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      select: { 
        id: true, email: true, name: true, gender: true, age: true, role: true, isPremium: true, premiumPlan: true, createdAt: true,
        isBanned: true, bannedUntil: true, banReason: true,
        friendCode: true,
        consultas: {
          where: { createdAt: { gte: startOfDay } },
          select: { id: true }
        },
        friendshipsSent: {
          where: { status: 'accepted' },
          select: { id: true }
        },
        friendshipsReceived: {
          where: { status: 'accepted' },
          select: { id: true }
        },
        _count: {
          select: { consultas: true }
        }
      }
    });

    const result = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      gender: u.gender,
      age: u.age,
      role: u.role,
      isPremium: u.isPremium,
      premiumPlan: u.premiumPlan,
      isBanned: u.isBanned,
      bannedUntil: u.bannedUntil,
      banReason: u.banReason,
      createdAt: u.createdAt,
      friendCode: u.friendCode,
      friendsCount: u.friendshipsSent.length + u.friendshipsReceived.length,
      outfitsHoy: u.consultas.length,
      totalHistory: u._count.consultas,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ errorCode: '0x103A', error: 'Error al obtener usuarios' });
  }
});

router.post('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, password, name, gender, role, isPremium } = req.body;
    // FIX: bcrypt now used from top-level import
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        name,
        gender,
        role: role || 'USER', 
        isPremium: isPremium || false 
      }
    });
    res.json({ id: newUser.id, email: newUser.email, name: newUser.name, gender: newUser.gender });
  } catch (error) {
    res.status(500).json({ errorCode: '0x103B', error: 'Error al crear usuario' });
  }
});

router.put('/admin/users/:id/premium', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // FIX: Validate ID is a valid integer
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ errorCode: '0x103C', error: 'ID inválido' });
    const { isPremium, premiumPlan } = req.body;
    // FIX B-M12: Validate boolean and include premiumPlan
    if (typeof isPremium !== 'boolean') return res.status(400).json({ errorCode: '0x103D', error: 'isPremium debe ser booleano' });
    const user = await prisma.user.update({
      where: { id },
      data: { isPremium, premiumPlan: isPremium ? premiumPlan || 'pro' : null }
    });
    res.json({ id: user.id, isPremium: user.isPremium, premiumPlan: user.premiumPlan });
  } catch (error) {
    res.status(500).json({ errorCode: '0x103E', error: 'Error al actualizar estado premium' });
  }
});

router.put('/admin/users/:id/ban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ errorCode: '0x103F', error: 'ID inválido' });
    
    const { isBanned, bannedUntil, banReason } = req.body;
    
    const user = await prisma.user.update({
      where: { id },
      data: { isBanned, bannedUntil, banReason }
    });
    
    // Enviar correo de notificación si el usuario ha sido baneado
    if (isBanned) {
      // Usar setTimeout para no bloquear la respuesta HTTP, el correo se enviará en background
      setTimeout(() => {
        sendBanNotificationEmail(user, isBanned, bannedUntil, banReason).catch(console.error);
      }, 0);
    }
    
    res.json({ id: user.id, isBanned: user.isBanned, bannedUntil: user.bannedUntil, banReason: user.banReason });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ errorCode: '0x1040', error: 'Error al banear usuario' });
  }
});

router.put('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // FIX: Validate ID is a valid integer
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ errorCode: '0x1041', error: 'ID inválido' });
    const { email, name, gender, age, role, password } = req.body;
    // FIX: Only include defined fields to avoid overwriting with undefined
    const dataToUpdate = {};
    if (email !== undefined) dataToUpdate.email = email;
    if (name !== undefined) dataToUpdate.name = name;
    if (gender !== undefined) dataToUpdate.gender = gender;
    if (age !== undefined) dataToUpdate.age = age === '' || age === null ? null : parseInt(age);
    if (role !== undefined) dataToUpdate.role = role;
    if (password && password.trim() !== '') {
      // FIX: bcrypt now used from top-level import
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });
    res.json({ id: user.id, email: user.email, name: user.name, gender: user.gender, role: user.role });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ errorCode: '0x1042', error: 'El email ya está en uso por otro usuario' });
    res.status(500).json({ errorCode: '0x1043', error: 'Error al editar usuario' });
  }
});

router.delete('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // FIX: Validate ID is a valid integer
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ errorCode: '0x1044', error: 'ID inválido' });

    // FIX: Wrapped in a transaction to prevent orphaned records if the process crashes mid-delete
    await prisma.$transaction(async (tx) => {
      await tx.prendaArmario.deleteMany({ where: { userId: id } });
      const consultas = await tx.consulta.findMany({ where: { userId: id }, select: { id: true } });
      for (const c of consultas) {
        await tx.mensajeChat.deleteMany({ where: { consultaId: c.id } });
      }
      await tx.consulta.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') return res.status(404).json({ errorCode: '0x1045', error: 'Usuario no encontrado' });
    res.status(500).json({ errorCode: '0x1046', error: 'Error al eliminar usuario' });
  }
});

// TICKETS
router.post('/tickets', authMiddleware, async (req, res) => {
  try {
    const { asunto, mensaje } = req.body;
    if (!asunto || !mensaje) return res.status(400).json({ errorCode: '0x1047', error: 'Faltan datos' });

    const ticket = await prisma.ticket.create({
      data: {
        userId: req.user.id,
        asunto,
        mensaje
      }
    });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user) {
      await sendNewTicketEmail(user, ticket).catch(console.error);
    }

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ errorCode: '0x1048', error: 'Error al enviar ticket' });
  }
});

router.get('/admin/tickets', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ errorCode: '0x1049', error: 'Error obteniendo tickets' });
  }
});

router.put('/admin/tickets/:id/close', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ errorCode: '0x104A', error: 'ID inválido' });

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { estado: 'CERRADO' },
      include: {
        user: { select: { name: true, email: true } }
      }
    });
    res.json(ticket);
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ errorCode: '0x104B', error: 'Error al cerrar ticket' });
  }
});

// GET: All reports
router.get('/admin/reports', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { id: true, email: true, name: true, friendCode: true } },
        reported: { select: { id: true, email: true, name: true, friendCode: true, isBanned: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ errorCode: '0x104C', error: 'Error al obtener reportes' });
  }
});

// PUT: Resolve report
router.put('/admin/reports/:id/resolve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const report = await prisma.report.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'resolved' }
    });
    res.json({ report });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ errorCode: '0x104D', error: 'Error al resolver reporte' });
  }
});

router.delete('/admin/tickets', authMiddleware, adminMiddleware, async (req, res) => {
  // FIX C-8: Require explicit confirmation to prevent accidental data wipe
  if (req.body.confirmDelete !== 'DELETE_ALL_TICKETS') {
    return res.status(400).json({ errorCode: '0x104E', error: 'Se requiere confirmación. Envia confirmDelete: "DELETE_ALL_TICKETS" en el body.' });
  }
  try {
    await prisma.ticket.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tickets:', error);
    res.status(500).json({ errorCode: '0x104F', error: 'Error al borrar tickets' });
  }
});

// CHATS ADMIN
router.get('/admin/chats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const chats = await prisma.consulta.findMany({
      where: { mensajes: { some: {} } },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, isBanned: true, bannedUntil: true, name: true, gender: true } },
        mensajes: { orderBy: { createdAt: 'asc' } }
      }
    });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching admin chats:', error);
    res.status(500).json({ errorCode: '0x1050', error: 'Error obteniendo chats' });
  }
});

// IMAGE GENERATION & CACHING
router.get('/images/generate', authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) return res.status(400).json({ errorCode: '0x1051', error: 'Falta prompt' });

    const promptKey = prompt.trim().toLowerCase();

    // Check cache
    let cached = await prisma.imageCache.findUnique({
      where: { promptKey }
    });

    if (cached) {
      // update hitCount in background
      prisma.imageCache.update({
        where: { id: cached.id },
        data: { hitCount: { increment: 1 } }
      }).catch(console.error);
      
      return res.json({ imageUrl: cached.imageUrl, cached: true });
    }

    // Generate new image if not found
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true`;

    // Save to cache
    await prisma.imageCache.create({
      data: {
        promptKey,
        imageUrl
      }
    });

    return res.json({ imageUrl, cached: false });
  } catch (error) {
    console.error('Error in /images/generate:', error);
    res.status(500).json({ errorCode: '0x1052', error: 'Error generando imagen' });
  }
});

// ── FEATURE 1: Travel Packing Assistant ──────────────────────────────────────
router.post('/travel-packing', authMiddleware, async (req, res) => {
  try {
    const { destination, startDate, endDate, activities } = req.body;
    if (!destination || !startDate || !endDate) {
      return res.status(400).json({ errorCode: '0x1060', error: 'Destination, startDate, and endDate are required.' });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!dbUser) return res.status(401).json({ errorCode: '0x1061', error: 'User not found' });
    if (!dbUser.isPremium && dbUser.role !== 'ADMIN') {
      return res.status(403).json({ errorCode: '0x1062', error: 'Esta función es exclusiva para usuarios Premium.' });
    }

    // Geocode the destination
    const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=es&format=json`);
    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      return res.status(404).json({ errorCode: '0x1063', error: 'Destino no encontrado. Intenta con una ciudad más grande.' });
    }
    const { latitude, longitude, name: cityName, country } = geoRes.data.results[0];

    // Get forecast for the trip dates
    const weatherRes = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&start_date=${startDate}&end_date=${endDate}`
    );
    const daily = weatherRes.data.daily;

    // Build weather summary for the AI
    const daysData = daily.time.map((day, i) => ({
      date: day,
      max: daily.temperature_2m_max[i],
      min: daily.temperature_2m_min[i],
      rain: daily.precipitation_sum[i],
      code: daily.weather_code[i]
    }));

    const weatherSummary = daysData.map(d => `- ${d.date}: Max ${d.max}°C / Min ${d.min}°C, lluvia: ${d.rain}mm`).join('\n');
    const totalDays = daysData.length;
    const avgMax = (daysData.reduce((s, d) => s + d.max, 0) / totalDays).toFixed(1);
    const avgMin = (daysData.reduce((s, d) => s + d.min, 0) / totalDays).toFixed(1);
    const hasRain = daysData.some(d => d.rain > 2);
    const hasCold = daysData.some(d => d.min < 12);
    const hasHeat = daysData.some(d => d.max > 25);

    const genderText = dbUser.gender ? `Género: ${dbUser.gender}.` : '';
    const styleText = dbUser.estiloPersonal ? `Estilo personal: ${dbUser.estiloPersonal}.` : '';
    const activitiesText = activities ? `Actividades planificadas: ${activities}.` : '';

    const packingPrompt = `Eres un experto en viajes y moda. El usuario va a viajar a ${cityName}, ${country} durante ${totalDays} días (del ${startDate} al ${endDate}).

[PERFIL]
${genderText} ${styleText} ${activitiesText}

[PREVISIÓN METEOROLÓGICA]
Temperatura promedio: Max ${avgMax}°C / Min ${avgMin}°C
${weatherSummary}
Lluvia: ${hasRain ? 'Sí, lleva ropa impermeable' : 'No se espera lluvia'}
Frío notable: ${hasCold ? 'Sí' : 'No'}
Calor notable: ${hasHeat ? 'Sí' : 'No'}

Genera una lista de maleta PERFECTAMENTE OPTIMIZADA (ni demasiado ni muy poco). Devuelve SOLO JSON:
{
  "resumen": "Descripción breve y experta del clima y qué esperar en el viaje",
  "maleta": [
    { "categoria": "Nombre de categoría (ej: Camisetas)", "emoji": "👕", "cantidad": 3, "tipo": "Descripción específica de qué tipo (ej: Camisetas de manga corta en tonos neutros)", "esencial": true },
    { "categoria": "Pantalones", "emoji": "👖", "cantidad": 2, "tipo": "Un vaquero y un chino/lino ligero", "esencial": true }
  ],
  "accesorios": ["Neceser", "Adaptador de enchufes si aplica", "Gafas de sol"],
  "consejo_maleta": "Un consejo clave de packing pro (ej: método de enrollado para ahorrar espacio)"
}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const result = await model.generateContent(packingPrompt);
    let textResult = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    let packingList;
    try {
      packingList = JSON.parse(textResult);
    } catch(e) {
      return res.status(500).json({ errorCode: '0x1064', error: 'Error generando la lista de maleta.' });
    }

    res.json({ destination: cityName, country, totalDays, avgMax, avgMin, hasRain, packingList, forecast: daysData });
  } catch (err) {
    console.error('Travel packing error:', err);
    res.status(500).json({ errorCode: '0x1065', error: 'Error al generar la lista de maleta.' });
  }
});
const fs = require('fs');

const getLevelFromPoints = (points) => {
  if (points >= 1000) return "Icono de Moda";
  if (points >= 500) return "Creador de Tendencias";
  if (points >= 100) return "Aficionado";
  return "Novato";
};

// ── RUTA 0: Configuración inicial ─────────────────────────────────────────────────
// GET /api/community — paginated public outfits feed
router.get('/community', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const outfits = await prisma.consulta.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        user: { select: { id: true, name: true, profilePicture: true, estiloPersonal: true } },
        outfitLikes: { select: { userId: true } },
        _count: { select: { outfitLikes: true } }
      }
    });

    const total = await prisma.consulta.count({ where: { isPublic: true } });

    const formatted = outfits.map(o => {
      let rec = null;
      try { rec = JSON.parse(o.recomendacion_json); } catch {}
      return {
        id: o.id,
        ubicacion: o.ubicacion,
        createdAt: o.createdAt,
        user: o.user,
        likesCount: o._count.outfitLikes,
        likedByMe: o.outfitLikes.some(l => l.userId === req.user.id),
        outfit: rec
      };
    });

    res.json({ outfits: formatted, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Community feed error:', err);
    res.status(500).json({ errorCode: '0x1070', error: 'Error obteniendo el feed.' });
  }
});

// POST /api/community/:id/share — toggle public visibility of an outfit
router.post('/community/:id/share', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const consulta = await prisma.consulta.findUnique({ where: { id } });
    if (!consulta) return res.status(404).json({ errorCode: '0x1071', error: 'Outfit no encontrado' });
    if (consulta.userId !== req.user.id) return res.status(403).json({ errorCode: '0x1072', error: 'No autorizado' });

    const updated = await prisma.consulta.update({
      where: { id },
      data: { isPublic: !consulta.isPublic }
    });
    res.json({ isPublic: updated.isPublic });
  } catch (err) {
    console.error('Share error:', err);
    res.status(500).json({ errorCode: '0x1073', error: 'Error al compartir' });
  }
});

// POST /api/community/:id/like — toggle like on a public outfit
router.post('/community/:id/like', authMiddleware, async (req, res) => {
  try {
    const consultaId = parseInt(req.params.id);
    const userId = req.user.id;

    const existing = await prisma.outfitLike.findUnique({
      where: { userId_consultaId: { userId, consultaId } }
    });

    if (existing) {
      await prisma.outfitLike.delete({ where: { id: existing.id } });
      const count = await prisma.outfitLike.count({ where: { consultaId } });
      return res.json({ liked: false, likesCount: count });
    } else {
      await prisma.outfitLike.create({ data: { userId, consultaId } });
      const count = await prisma.outfitLike.count({ where: { consultaId } });
      
      const consulta = await prisma.consulta.findUnique({ where: { id: consultaId } });
      if (consulta && consulta.userId !== userId) {
        const owner = await prisma.user.update({
          where: { id: consulta.userId },
          data: { points: { increment: 5 } }
        });
        if (getLevelFromPoints(owner.points) !== owner.level) {
          await prisma.user.update({
            where: { id: owner.id },
            data: { level: getLevelFromPoints(owner.points) }
          });
        }
      }

      return res.json({ liked: true, likesCount: count });
    }
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ errorCode: '0x1074', error: 'Error al dar like' });
  }
});

// ── FEATURE 5: Morning Alerts ─────────────────────────────────────────────────
// GET/POST /api/morning-alerts/trigger — called by a CRON job (secured with internal key)
router.all('/morning-alerts/trigger', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const key = req.headers['x-cron-key'];
    const expectedToken = process.env.CRON_SECRET;
    
    const isAuthorized = key === expectedToken || (authHeader && authHeader === `Bearer ${expectedToken}`);
    if (!isAuthorized) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hour = parseInt(req.query.hour) || new Date().getHours();
    
    // Hobby Vercel plan only allows once-a-day cron, so we send to all users with morningAlerts enabled
    const users = await prisma.user.findMany({
      where: { morningAlerts: true },
      include: { favoriteCities: { orderBy: { createdAt: 'desc' } } }
    });
    
    let sent = 0;

    for (const user of users) {
      if (!user.favoriteCities || user.favoriteCities.length === 0) continue;
      // Prefer the selected alertCityName, or fallback to the most recent favorite city
      const city = user.alertCityName 
        ? user.favoriteCities.find(c => c.cityName === user.alertCityName) || user.favoriteCities[0]
        : user.favoriteCities[0];

      try {
        // Get weather for the city
        let lat = city.lat, lon = city.lon;
        if (!lat || !lon) {
          const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.cityName)}&count=1&language=es&format=json`);
          if (!geoRes.data.results?.length) continue;
          lat = geoRes.data.results[0].latitude;
          lon = geoRes.data.results[0].longitude;
        }

        const wRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,apparent_temperature,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
        const current = wRes.data.current;
        const daily = wRes.data.daily;
        const tempMax = daily.temperature_2m_max[0];
        const tempMin = daily.temperature_2m_min[0];

        // Send morning alert email
        const { sendMorningAlertEmail } = require('../services/emailService');
        await sendMorningAlertEmail(user, city.cityName, current, tempMax, tempMin);
        
        // Create in-app notification
        const notificationContent = `¡Buenos días! En ${city.cityName} hace ${current.temperature_2m}°C. Máxima de ${tempMax}°C y mínima de ${tempMin}°C. ¡Prepárate para un gran día!`;
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'morning_alert',
            content: notificationContent
          }
        });
        
        sent++;
      } catch (userErr) {
        console.error(`Morning alert failed for user ${user.id}:`, userErr.message);
      }
    }

    res.json({ ok: true, sent, total: users.length });
  } catch (err) {
    console.error('Morning alerts trigger error:', err);
    res.status(500).json({ error: 'Error triggering morning alerts' });
  }
});

// ── FEATURE 2: Wardrobe Photo Upload ─────────────────────────────────────────
// POST /api/armario/upload-prenda-photo — upload a photo for a wardrobe item
router.post('/armario/upload-prenda-photo', authMiddleware, async (req, res) => {
  try {
    const { prendaId, imageBase64 } = req.body;
    if (!prendaId || !imageBase64) return res.status(400).json({ errorCode: '0x1075', error: 'Faltan datos.' });

    const prenda = await prisma.prendaArmario.findUnique({ where: { id: parseInt(prendaId) } });
    if (!prenda) return res.status(404).json({ errorCode: '0x1076', error: 'Prenda no encontrada.' });
    if (prenda.userId !== req.user.id) return res.status(403).json({ errorCode: '0x1077', error: 'No autorizado.' });

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) return res.status(500).json({ errorCode: '0x1078', error: 'El servicio de imágenes no está configurado.' });

    const base64Data = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
    const formData = new URLSearchParams();
    formData.append('image', base64Data);

    const imgRes = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!imgRes.data?.data?.url) return res.status(500).json({ errorCode: '0x1079', error: 'Error subiendo la imagen.' });

    const imageUrl = imgRes.data.data.url;
    await prisma.prendaArmario.update({ where: { id: prenda.id }, data: { imageUrl } });

    res.json({ imageUrl });
  } catch (err) {
    console.error('Wardrobe photo upload error:', err);
    res.status(500).json({ errorCode: '0x107A', error: 'Error al subir la foto.' });
  }
});

// GET /api/armario/prendas — get all wardrobe items with photos
router.get('/armario/prendas', authMiddleware, async (req, res) => {
  try {
    const prendas = await prisma.prendaArmario.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ prendas });
  } catch (err) {
    res.status(500).json({ errorCode: '0x107B', error: 'Error obteniendo armario.' });
  }
});

// ── FEATURE: VIAJES GUARDADOS (PROGRESO DE MALETA) ──────────────────────────

// Guardar un nuevo viaje
router.post('/viajes', authMiddleware, async (req, res) => {
  try {
    const { destination, startDate, endDate, packingListJson, checkedItemsJson } = req.body;
    if (!destination || !packingListJson) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const newViaje = await prisma.viajeGuardado.create({
      data: {
        userId: req.user.id,
        destination,
        startDate,
        endDate,
        packingListJson: JSON.stringify(packingListJson),
        checkedItemsJson: JSON.stringify(checkedItemsJson || {}),
      }
    });

    res.json(newViaje);
  } catch (error) {
    console.error("Error saving viaje:", error);
    res.status(500).json({ error: 'Error al guardar el viaje' });
  }
});

// Obtener los viajes del usuario
router.get('/viajes', authMiddleware, async (req, res) => {
  try {
    const viajes = await prisma.viajeGuardado.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    // Parse json
    const parsed = viajes.map(v => ({
      ...v,
      packingListJson: JSON.parse(v.packingListJson),
      checkedItemsJson: JSON.parse(v.checkedItemsJson)
    }));
    res.json(parsed);
  } catch (error) {
    console.error("Error fetching viajes:", error);
    res.status(500).json({ error: 'Error al obtener viajes' });
  }
});

// Actualizar el progreso de la maleta
router.put('/viajes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { checkedItemsJson } = req.body;
    
    // Check ownership
    const viaje = await prisma.viajeGuardado.findUnique({ where: { id: parseInt(id) } });
    if (!viaje || viaje.userId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const updated = await prisma.viajeGuardado.update({
      where: { id: parseInt(id) },
      data: { checkedItemsJson: JSON.stringify(checkedItemsJson) }
    });
    
    res.json({ ...updated, checkedItemsJson: JSON.parse(updated.checkedItemsJson) });
  } catch (error) {
    console.error("Error updating viaje:", error);
    res.status(500).json({ error: 'Error al actualizar viaje' });
  }
});

// Eliminar un viaje
router.delete('/viajes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const viaje = await prisma.viajeGuardado.findUnique({ where: { id: parseInt(id) } });
    if (!viaje || viaje.userId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await prisma.viajeGuardado.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting viaje:", error);
    res.status(500).json({ error: 'Error al eliminar viaje' });
  }
});

// ── FEATURE: IN-APP NOTIFICATIONS ──────────────────────────────────────────────

router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

router.put('/notifications/read', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({ error: 'Error al actualizar notificaciones' });
  }
});

// ── GAMIFICATION & CALENDAR ─────────────────────────────────────────────────
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { points: 'desc' },
      select: { id: true, name: true, points: true, level: true, profilePicture: true }
    });
    res.json(topUsers);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener leaderboard' });
  }
});

router.get('/calendar', authMiddleware, async (req, res) => {
  try {
    const events = await prisma.outfitCalendar.findMany({
      where: { userId: req.user.id },
      include: { consulta: true }
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener calendario' });
  }
});

router.post('/calendar/add', authMiddleware, async (req, res) => {
  try {
    const { consultaId, scheduledDate } = req.body;
    const event = await prisma.outfitCalendar.create({
      data: {
        userId: req.user.id,
        consultaId: parseInt(consultaId),
        scheduledDate: new Date(scheduledDate)
      },
      include: { consulta: true }
    });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Error al añadir al calendario' });
  }
});

router.delete('/calendar/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.outfitCalendar.deleteMany({
      where: { id, userId: req.user.id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar del calendario' });
  }
});

module.exports = router;
