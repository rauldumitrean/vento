const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

router.get('/weather', authMiddleware, async (req, res) => {

  try {
    const { lat, lon, city } = req.query;
    
    let latitude = lat;
    let longitude = lon;
    
    if (city && (!lat || !lon)) {
      const geoResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=es&format=json`);
      if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
        return res.status(404).json({ error: 'Ciudad no encontrada' });
      }
      latitude = geoResponse.data.results[0].latitude;
      longitude = geoResponse.data.results[0].longitude;
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Se requiere latitud y longitud o nombre de ciudad' });
    }

    const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`);
    
    res.json({
      location: city || `${latitude}, ${longitude}`,
      lat: latitude,
      lon: longitude,
      current: weatherResponse.data.current
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el clima' });
  }
});

router.post('/recomendacion', authMiddleware, async (req, res) => {
  try {
    const { lat, lon, ubicacion, clima } = req.body;

    // --- SISTEMA FREEMIUM: Límite de 5 outfits al día ---
    const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    // Si es Premium o Admin, salta el límite
    if (!dbUser.isPremium && dbUser.role !== 'ADMIN') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const consultasHoy = await prisma.consulta.count({
          where: {
              userId: req.user.id,
              createdAt: {
                  gte: today
              }
          }
      });
  
      if (consultasHoy >= 5) {
          return res.status(403).json({ error: "Has alcanzado tu límite gratuito de 5 outfits por día. Vuelve mañana o actualiza a Premium." });
      }
    }
    // ----------------------------------------------------
    
    if (!clima) return res.status(400).json({ error: 'Se requieren datos del clima' });

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'INSERT_YOUR_GEMINI_KEY_HERE') {
      return res.status(500).json({ error: 'La API Key de Gemini no está configurada en el backend.'});
    }

    const armario = await prisma.prendaArmario.findMany({ where: { userId: req.user.id } });
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

    const prompt = `Eres un asesor de moda experto. El clima actual en ${ubicacion} es de ${clima.temperature_2m}°C (sensación térmica de ${clima.apparent_temperature}°C) con una humedad del ${clima.relative_humidity_2m}% y velocidad del viento de ${clima.wind_speed_10m} km/h. 
${genderText}
${armarioText}

Genera un outfit elegante y moderno, combinando prendas adecuadamente.
Debes devolver la respuesta ESTRICTAMENTE en el siguiente formato JSON, sin texto markdown ni explicaciones adicionales fuera del JSON:
{
  "resumen": "Un resumen corto del por qué elegiste esto",
  "prendas": [
    { 
      "categoria": "top", 
      "descripcion": "ej. Camiseta básica blanca de algodón", 
      "razon": "ej. Fresca para la temperatura",
      "tienda_recomendada": "Amazon",
      "enlace_compra": "https://www.amazon.es/s?k=camiseta+basica+blanca+algodon&tag=${amazonTag}"
    },
    { 
      "categoria": "bottom", 
      "descripcion": "ej. Pantalón chino oscuro", 
      "razon": "ej. Cómodo y versátil",
      "tienda_recomendada": "Amazon",
      "enlace_compra": "https://www.amazon.es/s?k=pantalon+chino+oscuro&tag=${amazonTag}"
    }
    // ... OBLIGATORIO: La tienda siempre debe ser "Amazon". El enlace debe ser de búsqueda de amazon.es y debe contener EXACTAMENTE la etiqueta &tag=${amazonTag} al final.
  ],
  "consejo_extra": "Un consejo de estilo corto"
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

    const consulta = await prisma.consulta.create({
      data: {
        userId: req.user.id,
        ubicacion: ubicacion,
        clima_json: JSON.stringify(clima),
        recomendacion_json: JSON.stringify(recomendacionJSON)
      }
    });

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

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite", // Soporta vision
      systemInstruction: `Eres un experto asesor de moda de la app Ventoo. Acabas de recomendar este outfit: ${consulta.recomendacion_json} basado en este clima: ${consulta.clima_json} en ${consulta.ubicacion}. 
REGLA ESTRICTA 1: SÓLO puedes responder a preguntas de moda y clima. Niégate educadamente a otros temas.
REGLA ESTRICTA 2: SIEMPRE RESPONDE EN FORMATO JSON VÁLIDO puro, sin etiquetas markdown de bloque de código (\`\`\`json).
Estructura obligatoria del JSON:
{
  "texto": "Tu respuesta amigable y conversacional",
  "nuevas_prendas": [
    // OPCIONAL. SÓLO si el usuario pide cambiar el outfit o sugiere otra prenda, añade aquí la prenda.
    // { "categoria": "TOP" (o BOTTOM, CALZADO), "descripcion": "...", "razon": "...", "color": "...", "enlace_compra": "https://amazon.es/s?k=...", "tienda_recomendada": "Amazon" }
  ]
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
    const textResponse = result.response.text();

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
    await prisma.prendaArmario.delete({ 
      where: { id: parseInt(req.params.id), userId: req.user.id } 
    });
    res.json({ success: true });
  } catch (error) {
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
    const { isFavorite } = req.body;
    const consulta = await prisma.consulta.update({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      data: { isFavorite }
    });
    res.json(consulta);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar favorito' });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================
router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const premiumUsers = await prisma.user.count({ where: { isPremium: true } });
    const totalOutfits = await prisma.consulta.count();
    const totalMessages = await prisma.mensajeChat.count();
    const totalClothes = await prisma.prendaArmario.count();
    
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
        id: true, email: true, name: true, gender: true, role: true, isPremium: true, premiumPlan: true, createdAt: true,
        consultas: {
          where: { createdAt: { gte: startOfDay } },
          select: { id: true }
        }
      }
    });

    const result = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      gender: u.gender,
      role: u.role,
      isPremium: u.isPremium,
      premiumPlan: u.premiumPlan,
      createdAt: u.createdAt,
      outfitsHoy: u.consultas.length,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.post('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, password, name, gender, role, isPremium } = req.body;
    const bcrypt = require('bcryptjs');
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
    const { isPremium } = req.body;
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isPremium }
    });
    res.json({ id: user.id, isPremium: user.isPremium });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado premium' });
  }
});

router.put('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, name, gender, role, password } = req.body;
    const dataToUpdate = { email, name, gender, role };
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: dataToUpdate
    });
    res.json({ id: user.id, email: user.email, name: user.name, gender: user.gender, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Error al editar usuario' });
  }
});

router.delete('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Eliminar cascada manual (prendas, mensajes, consultas)
    await prisma.prendaArmario.deleteMany({ where: { userId: id } });
    const consultas = await prisma.consulta.findMany({ where: { userId: id } });
    for (const c of consultas) {
      await prisma.mensajeChat.deleteMany({ where: { consultaId: c.id } });
    }
    await prisma.consulta.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
