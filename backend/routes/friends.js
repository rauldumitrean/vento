const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/authMiddleware');
const crypto = require('crypto');

// Generar un friend code único
function generateFriendCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // Ej: "8F3A2B1C"
}

// Obtener o generar el friendCode del usuario actual
router.get('/code', authMiddleware, async (req, res) => {
  try {
    let user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    if (!user.friendCode) {
      // Generar uno nuevo y asegurar que sea único
      let isUnique = false;
      let newCode = '';
      while (!isUnique) {
        newCode = generateFriendCode();
        const exists = await prisma.user.findUnique({ where: { friendCode: newCode } });
        if (!exists) isUnique = true;
      }
      
      user = await prisma.user.update({
        where: { id: req.user.id },
        data: { friendCode: newCode }
      });
    }

    res.json({ friendCode: user.friendCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo código de amigo' });
  }
});

// Enviar solicitud de amistad
router.post('/request', authMiddleware, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Falta el código' });

  try {
    const friend = await prisma.user.findUnique({ where: { friendCode: code.toUpperCase() } });
    if (!friend) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (friend.id === req.user.id) return res.status(400).json({ error: 'No puedes añadirte a ti mismo' });

    // Comprobar si ya existe una solicitud o amistad
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: req.user.id, user2Id: friend.id },
          { user1Id: friend.id, user2Id: req.user.id }
        ]
      }
    });

    if (existing) {
      if (existing.status === 'accepted') return res.status(400).json({ error: 'Ya sois amigos' });
      return res.status(400).json({ error: 'Ya existe una solicitud pendiente' });
    }

    await prisma.friendship.create({
      data: {
        user1Id: req.user.id,
        user2Id: friend.id,
        status: 'pending'
      }
    });

    res.json({ success: true, message: 'Solicitud enviada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error enviando solicitud' });
  }
});

// Ver solicitudes pendientes
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await prisma.friendship.findMany({
      where: { user2Id: req.user.id, status: 'pending' },
      include: {
        user1: {
          select: { id: true, name: true, profilePicture: true, friendCode: true }
        }
      }
    });
    res.json({ requests: requests.map(r => ({ id: r.id, user: r.user1 })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo solicitudes' });
  }
});

// Aceptar o rechazar solicitud
router.post('/accept', authMiddleware, async (req, res) => {
  const { friendshipId, accept } = req.body;
  
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship || friendship.user2Id !== req.user.id) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (accept) {
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' }
      });
      res.json({ success: true, message: 'Solicitud aceptada' });
    } else {
      await prisma.friendship.delete({ where: { id: friendshipId } });
      res.json({ success: true, message: 'Solicitud rechazada' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error procesando solicitud' });
  }
});

// Obtener amigos aceptados
router.get('/', authMiddleware, async (req, res) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: req.user.id, status: 'accepted' },
          { user2Id: req.user.id, status: 'accepted' }
        ]
      },
      include: {
        user1: { select: { id: true, name: true, profilePicture: true, friendCode: true } },
        user2: { select: { id: true, name: true, profilePicture: true, friendCode: true } }
      }
    });

    const friends = friendships.map(f => {
      const isUser1 = f.user1Id === req.user.id;
      const friendData = isUser1 ? f.user2 : f.user1;
      return {
        friendshipId: f.id,
        ...friendData
      };
    });

    res.json({ friends });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo amigos' });
  }
});

// Obtener mensajes del chat
router.get('/:friendId/messages', authMiddleware, async (req, res) => {
  const friendId = parseInt(req.params.friendId);
  try {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: friendId },
          { senderId: friendId, receiverId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        outfit: true // Si hay un outfit compartido, devolverlo
      }
    });
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo mensajes' });
  }
});

// Enviar un mensaje de texto
router.post('/:friendId/messages', authMiddleware, async (req, res) => {
  const friendId = parseInt(req.params.friendId);
  const { content } = req.body;
  
  if (!content) return res.status(400).json({ error: 'El contenido no puede estar vacío' });

  try {
    // Validar amistad
    const isFriend = await prisma.friendship.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { user1Id: req.user.id, user2Id: friendId },
          { user1Id: friendId, user2Id: req.user.id }
        ]
      }
    });

    if (!isFriend) return res.status(403).json({ error: 'No eres amigo de este usuario' });

    const message = await prisma.directMessage.create({
      data: {
        senderId: req.user.id,
        receiverId: friendId,
        content
      }
    });

    res.json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error enviando mensaje' });
  }
});

// Compartir un outfit
router.post('/:friendId/share', authMiddleware, async (req, res) => {
  const friendId = parseInt(req.params.friendId);
  const { consultaId } = req.body;

  if (!consultaId) return res.status(400).json({ error: 'Falta el ID del outfit' });

  try {
    // Validar amistad
    const isFriend = await prisma.friendship.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { user1Id: req.user.id, user2Id: friendId },
          { user1Id: friendId, user2Id: req.user.id }
        ]
      }
    });

    if (!isFriend) return res.status(403).json({ error: 'No eres amigo de este usuario' });

    // Validar que el outfit es del usuario
    const consulta = await prisma.consulta.findFirst({
      where: { id: consultaId, userId: req.user.id }
    });

    if (!consulta) return res.status(404).json({ error: 'Outfit no encontrado' });

    const message = await prisma.directMessage.create({
      data: {
        senderId: req.user.id,
        receiverId: friendId,
        content: '¡Mira este outfit que me ha generado la IA!',
        outfitId: consulta.id
      },
      include: {
        outfit: true
      }
    });

    res.json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error compartiendo outfit' });
  }
});

// Reportar a un usuario
router.post('/:friendId/report', authMiddleware, async (req, res) => {
  const friendId = parseInt(req.params.friendId);
  const { reason, description } = req.body;

  if (!reason) return res.status(400).json({ error: 'El motivo es obligatorio' });

  try {
    // Check if already reported
    const existingReport = await prisma.report.findUnique({
      where: {
        reporterId_reportedId: {
          reporterId: req.user.id,
          reportedId: friendId
        }
      }
    });

    if (existingReport) {
      return res.status(400).json({ error: 'Ya has reportado a este usuario anteriormente' });
    }

    // Create report
    await prisma.report.create({
      data: {
        reporterId: req.user.id,
        reportedId: friendId,
        reason,
        description
      }
    });

    // Count distinct reporters for this user
    const reportsCount = await prisma.report.count({
      where: { reportedId: friendId }
    });

    // Auto-ban logic based on thresholds (5, 9, 12)
    let banDays = 0;
    if (reportsCount >= 12) {
      banDays = 36500; // Permanent (100 years)
    } else if (reportsCount >= 9) {
      banDays = 7;
    } else if (reportsCount >= 5) {
      banDays = 1;
    }

    if (banDays > 0) {
      const bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + banDays);
      const banReason = `[AutoModerator] Has acumulado múltiples reportes de diferentes usuarios de la comunidad. (Total: ${reportsCount})`;

      await prisma.user.update({
        where: { id: friendId },
        data: {
          isBanned: true,
          bannedUntil,
          banReason
        }
      });
      // Optionally could trigger an email here, but we'll stick to DB update for now.
    }

    res.json({ message: 'Reporte enviado con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error enviando el reporte' });
  }
});

module.exports = router;
