const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// FIX: Moved bcrypt require to top level instead of inside route handlers
const bcrypt = require('bcryptjs');
const { sendBanNotificationEmail, sendNewTicketEmail } = require('../services/emailService');

const prisma = new PrismaClient();
// Fallback if no key is provided during prototype to prevent hard crashes on boot, though it will fail on use
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

// Admin Middleware
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador.' });
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verificando rol de administrador' });
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
    res.status(500).json({ error: 'Ping error' });
  }
});

// Upload avatar to ImgBB
router.post('/upload-avatar', authMiddleware, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No se envió ninguna imagen.' });

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
      res.status(500).json({ error: 'Error inesperado al subir la imagen a ImgBB.' });
    }
  } catch (error) {
    console.error('Error uploading avatar:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Error al subir la imagen.' });
  }
});

// Cache in-memory simple para el clima
const weatherCache = new Map();

router.get('/weather', authMiddleware, async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    const cacheKey = city ? `city_${city.toLowerCase()}` : `coord_${lat}_${lon}`;
    
    // Check cache (10 min TTL)
    if (weatherCache.has(cacheKey)) {
      const cached = weatherCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return res.json(cached.data);
      }
      weatherCache.delete(cacheKey);
    }

    let latitude = lat;
    let longitude = lon;
    
    if (city && (!lat || !lon)) {
      const geoResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`);
      if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
        return res.status(404).json({ error: 'Ciudad no encontrada' });
      }
      latitude = geoResponse.data.results[0].latitude;
      longitude = geoResponse.data.results[0].longitude;
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Se requiere latitud y longitud o nombre de ciudad' });
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({ error: 'Coordenadas de latitud/longitud inválidas' });
    }

    const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lonNum}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
    
    const responseData = {
      location: city || `${latitude}, ${longitude}`,
      lat: latitude,
      lon: longitude,
      current: weatherResponse.data.current,
      daily: weatherResponse.data.daily
    };

    weatherCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el clima' });
  }
});

router.post('/recomendacion', authMiddleware, async (req, res) => {
  try {
    const { lat, lon, ubicacion, clima, daily } = req.body;

    if (!clima) return res.status(400).json({ error: 'Se requieren datos del clima' });
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'INSERT_YOUR_GEMINI_KEY_HERE') {
      return res.status(500).json({ error: 'La API Key de Gemini no está configurada en el backend.'});
    }

    // --- Optimizacion: Ejecutar peticiones a DB en paralelo ---
    const [dbUser, armario, allNonFavsCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id } }),
      prisma.prendaArmario.findMany({ where: { userId: req.user.id } }),
      prisma.consulta.count({ where: { userId: req.user.id, isFavorite: false } })
    ]);

    if (!dbUser) return res.status(401).json({ error: 'Usuario no encontrado' });
    
    // --- LÍMITE DE HISTORIAL ---
    const historyLimit = dbUser.isPremium || dbUser.role === 'ADMIN' ? 50 : 15;
    if (allNonFavsCount >= historyLimit) {
      return res.status(403).json({ error: `Has alcanzado el límite máximo de tu historial (${historyLimit}/${historyLimit}). Borra algunos outfits desde tu Armario para generar nuevos.` });
    }

    // --- SISTEMA FREEMIUM: Límite de 5 outfits al día ---
    if (!dbUser.isPremium && dbUser.role !== 'ADMIN') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const consultasHoy = await prisma.consulta.count({
          where: { userId: req.user.id, createdAt: { gte: today } }
      });
  
      if (consultasHoy >= 5) {
          return res.status(403).json({ error: "Has alcanzado tu límite gratuito de 5 outfits por día. Vuelve mañana o actualiza a Premium." });
      }
    }
    // ----------------------------------------------------

    let armarioText = "";
    if (armario.length > 0) {
      armarioText = "El usuario TIENE las siguientes prendas en su armario:\n" + armario.map(p => `- [${p.categoria}] ${p.descripcion} (${p.color || ''})`).join('\n') + "\nIMPORTANTE: PRIORIZA usar estas prendas exactas en tu recomendación si son adecuadas para el clima. Si necesitas algo que no tiene, recomiéndalo normalmente.";
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
${armarioText}

[CONDICIONES METEOROLÓGICAS - ${ubicacion}]
- Clima Actual: ${clima.temperature_2m}°C (Sensación: ${clima.apparent_temperature}°C)
- Humedad: ${clima.relative_humidity_2m}%
- Viento: ${clima.wind_speed_10m} km/h${weatherExtraText}
IMPORTANTE: Basa el outfit en las condiciones de TODO el día, no solo en la actual.

[INSTRUCCIONES DE DISEÑO]
1. Diseña un outfit impecable, moderno y estéticamente superior que resuelva perfectamente el clima y encaje con el perfil del usuario.
2. El "resumen" debe sonar experto, cálido y persuasivo.
3. El "consejo_extra" debe ser un "pro-tip" de estilismo útil y avanzado aplicable al outfit recomendado.
4. CRÍTICO PARA LA IA DE IMÁGENES: La "descripcion" de cada prenda DEBE ser extremadamente detallada, altamente visual y fotográfica. Especifica el tejido, el corte (fit), el tono exacto del color, y detalles de diseño (ej. "Jersey oversize de punto grueso en lana merino color verde musgo con cuello perkins" en lugar de "Jersey verde").

Debes devolver la respuesta ESTRICTAMENTE en el siguiente formato JSON, sin bloques de código markdown ni explicaciones adicionales:
{
  "resumen": "Resumen experto y persuasivo del look y por qué funciona para hoy",
  "prendas": [
    { 
      "categoria": "top", 
      "descripcion": "Descripción ultra-detallada y fotográfica de la prenda", 
      "razon": "Justificación técnica o estilística para incluir esta prenda",
      "tienda_recomendada": "Amazon",
      "enlace_compra": "https://www.amazon.es/s?k=busqueda+de+la+prenda&tag=${amazonTag}"
    }
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
      return res.status(500).json({ error: 'Error procesando respuesta de IA' });
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
        error: 'BANNED', 
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

    // (La lógica de limpieza automática se ha eliminado porque ahora bloqueamos la generación si superan el límite)

    res.json({ consultaId: consulta.id, recomendacion: recomendacionJSON });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar la recomendación' });
  }
});

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { consultaId, mensaje, imageBase64, imageMimeType } = req.body;
    if (!consultaId || !mensaje) return res.status(400).json({ error: 'Faltan datos' });

    const consulta = await prisma.consulta.findUnique({ where: { id: consultaId }, include: { mensajes: true } });
    if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });
    if (consulta.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

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
    // { "categoria": "TOP" (o BOTTOM, CALZADO), "descripcion": "...", "razon": "...", "color": "...", "enlace_compra": "https://amazon.es/s?k=...", "tienda_recomendada": "Amazon" }
  ],
  "infraccion": null // Pon null si todo es correcto. SI el usuario pide cosas ilegales, contenido sexual explícito, o viola gravemente las reglas, devuelve { "es_infraccion": true, "razon": "Motivo detallado", "nivel_severidad": "bajo|medio|alto" }
}`
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
          error: 'BANNED', 
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
    res.status(500).json({ error: 'Error al procesar el mensaje de chat' });
  }
});

// Armario Routes
router.get('/armario', authMiddleware, async (req, res) => {
  try {
    const prendas = await prisma.prendaArmario.findMany({ where: { userId: req.user.id } });
    res.json(prendas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el armario' });
  }
});

router.post('/armario', authMiddleware, async (req, res) => {
  try {
    const { categoria, descripcion, color } = req.body;
    if (!categoria || !descripcion) return res.status(400).json({ error: 'Faltan datos' });
    const nuevaPrenda = await prisma.prendaArmario.create({
      data: { userId: req.user.id, categoria, descripcion, color }
    });
    res.json(nuevaPrenda);
  } catch (error) {
    res.status(500).json({ error: 'Error al añadir prenda' });
  }
});

router.delete('/armario/:id', authMiddleware, async (req, res) => {
  try {
    // FIX: Validate ID is a valid integer
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    await prisma.prendaArmario.delete({ 
      where: { id, userId: req.user.id } 
    });
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Prenda no encontrada' });
    res.status(500).json({ error: 'Error al eliminar prenda' });
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
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

router.put('/historial/:id/favorito', authMiddleware, async (req, res) => {
  try {
    // FIX: Validate ID is a valid integer
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const { isFavorite } = req.body;
    const consulta = await prisma.consulta.update({
      where: { id, userId: req.user.id },
      data: { isFavorite }
    });
    res.json(consulta);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Consulta no encontrada' });
    res.status(500).json({ error: 'Error al actualizar favorito' });
  }
});

router.delete('/historial/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    // Verificar propiedad
    const consulta = await prisma.consulta.findUnique({ where: { id, userId: req.user.id } });
    if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });

    // Borrar mensajes asociados primero (Foreign Key constraint)
    await prisma.mensajeChat.deleteMany({ where: { consultaId: id } });
    
    // Borrar la consulta
    await prisma.consulta.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al borrar historial:', error);
    res.status(500).json({ error: 'Error al borrar la consulta' });
  }
});

router.post('/historial/save-shared/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    // Buscar la consulta compartida
    const sharedConsulta = await prisma.consulta.findUnique({ where: { id } });
    if (!sharedConsulta) return res.status(404).json({ error: 'Consulta no encontrada' });

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
    res.status(500).json({ error: 'Error al guardar el outfit compartido' });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// --- GESTIÓN DE OUTFITS ---
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
    res.status(500).json({ error: 'Error obteniendo los outfits' });
  }
});

router.delete('/admin/outfits/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    // Delete chat messages first
    await prisma.mensajeChat.deleteMany({ where: { consultaId: id } });
    
    // Delete consulta
    await prisma.consulta.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar el outfit:', error);
    res.status(500).json({ error: 'Error al eliminar el outfit' });
  }
});

router.delete('/admin/outfits', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Delete all chat messages first
    await prisma.mensajeChat.deleteMany();
    
    // Delete all consultas
    await prisma.consulta.deleteMany();

    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar TODOS los outfits:', error);
    res.status(500).json({ error: 'Error al eliminar todos los outfits' });
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
    res.status(500).json({ error: 'Error al obtener estadísticas' });
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
    res.status(500).json({ error: 'Error al obtener usuarios' });
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
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/admin/users/:id/premium', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // FIX: Validate ID is a valid integer
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const { isPremium } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { isPremium }
    });
    res.json({ id: user.id, isPremium: user.isPremium });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado premium' });
  }
});

router.put('/admin/users/:id/ban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    
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
    res.status(500).json({ error: 'Error al banear usuario' });
  }
});

router.put('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // FIX: Validate ID is a valid integer
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
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
    res.status(500).json({ error: 'Error al editar usuario' });
  }
});

router.delete('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // FIX: Validate ID is a valid integer
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

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
    if (error.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado' });
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// TICKETS
router.post('/tickets', authMiddleware, async (req, res) => {
  try {
    const { asunto, mensaje } = req.body;
    if (!asunto || !mensaje) return res.status(400).json({ error: 'Faltan datos' });

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
    res.status(500).json({ error: 'Error al enviar ticket' });
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
    res.status(500).json({ error: 'Error obteniendo tickets' });
  }
});

router.put('/admin/tickets/:id/close', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

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
    res.status(500).json({ error: 'Error al cerrar ticket' });
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
    res.status(500).json({ error: 'Error al obtener reportes' });
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
    res.status(500).json({ error: 'Error al resolver reporte' });
  }
});

router.delete('/admin/tickets', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.ticket.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tickets:', error);
    res.status(500).json({ error: 'Error al borrar tickets' });
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
    res.status(500).json({ error: 'Error obteniendo chats' });
  }
});

module.exports = router;
