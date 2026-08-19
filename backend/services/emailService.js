const nodemailer = require('nodemailer');

// Configuración del transporte usando SMTP genérico (funciona para Brevo y Postmark)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const getFromEmail = () => process.env.EMAIL_FROM || '"Ventoo" <hola@ventoo.app>';
const getLogoUrl = () => `${process.env.FRONTEND_URL || 'https://ventoo.app'}/favicon.svg`;

const baseTemplate = (title, content, preheader = '') => `
<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <style>
    /* Retain some basic resets for clients that support it */
    body, p, h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030305 !important; color: #f3f4f6 !important; -webkit-font-smoothing: antialiased; }
    .btn:hover { background-color: #6366f1 !important; }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, h1, h2, h3, h4 {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="background-color: #030305; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <div style="display: none; max-height: 0px; overflow: hidden; color: transparent; opacity: 0; font-size: 0px; line-height: 0px;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #030305;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0c0c10; border-radius: 20px; border: 1px solid #1f1f2e; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${getLogoUrl()}" alt="Ventoo Logo" width="56" height="56" style="display: block; width: 56px; height: 56px; margin-bottom: 20px; outline: none; text-decoration: none;">
              <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px; margin: 0; text-transform: uppercase;">VENTOO</h1>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px;">
              <div style="height: 1px; background-color: #1f1f2e; width: 100%; line-height: 1px; font-size: 1px;">&nbsp;</div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px; color: #a1a1aa; font-size: 16px; line-height: 1.7;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 40px; background-color: #050508; border-top: 1px solid #1f1f2e;">
              <p style="font-size: 13px; color: #52525b; margin: 0 0 12px 0;">&copy; ${new Date().getFullYear()} Ventoo AI. Todos los derechos reservados.</p>
              <p style="font-size: 13px; color: #52525b; margin: 0;">¿Tienes alguna duda? <a href="${process.env.FRONTEND_URL || 'https://ventoo.app'}/support" style="color: #818cf8; text-decoration: none; font-weight: 500;">Contacta con soporte</a></p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── FUNCIONES DE ENVÍO ───────────────────────────────────────────────────────

/**
 * Enviar correo de bienvenida al registrarse.
 */
exports.sendWelcomeEmail = async (user) => {
  if (!process.env.SMTP_HOST) return; // Silent skip if not configured

  const subject = `¡Bienvenido a Ventoo, ${user.name}!`;
  const preheader = 'Tu IA meteorológica de moda te está esperando.';
  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 20px 0; letter-spacing: -0.5px; text-align: center;">Tu cuenta ha sido creada con éxito</h2>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Hola <strong style="color: #f4f4f5; font-weight: 600;">${user.name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Estamos encantados de darte la bienvenida a Ventoo. A partir de hoy, nunca más tendrás que preocuparte por qué ponerte. Nuestra Inteligencia Artificial cruzará el clima exacto de tu ubicación con tu estilo personal para darte recomendaciones perfectas.</p>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Ya tienes tu plan <strong style="color: #f4f4f5; font-weight: 600;">Básico</strong> activado con 5 outfits diarios.</p>
    <div style="text-align: center; margin: 35px 0 10px;">
      <a href="${process.env.FRONTEND_URL || 'https://ventoo.app'}/app" style="display: inline-block; padding: 16px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 14px;">Entrar a mi Panel</a>
    </div>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getFromEmail(),
      to: user.email,
      subject,
      html: baseTemplate('Bienvenido a Ventoo', content, preheader)
    });
    console.log(`Welcome email sent to ${user.email}`);
  } catch (err) {
    console.error('Error sending welcome email:', err);
  }
};

/**
 * Enviar alerta de nuevo inicio de sesión.
 */
exports.sendLoginAlertEmail = async (user, reqIp = 'IP desconocida', userAgent = 'Dispositivo desconocido') => {
  if (!process.env.SMTP_HOST) return;

  const subject = 'Nuevo inicio de sesión en Ventoo';
  const preheader = 'Hemos detectado un nuevo inicio de sesión en tu cuenta.';
  const dateStr = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  
  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 20px 0; letter-spacing: -0.5px; text-align: center;">Alerta de Seguridad</h2>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Hola <strong style="color: #f4f4f5; font-weight: 600;">${user.name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Hemos detectado un nuevo inicio de sesión en tu cuenta de Ventoo.</p>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121218; border: 1px solid #1f1f2e; border-radius: 16px; margin: 24px 0;">
      <tr><td style="padding: 24px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding-bottom: 12px; border-bottom: 1px dashed #1f1f2e; color: #8b8b99; font-size: 15px; font-weight: 500;">Fecha:</td>
            <td align="right" style="padding-bottom: 12px; border-bottom: 1px dashed #1f1f2e; color: #e4e4e7; font-size: 15px; font-weight: 600;">${dateStr} (CET)</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px dashed #1f1f2e; color: #8b8b99; font-size: 15px; font-weight: 500;">IP:</td>
            <td align="right" style="padding: 12px 0; border-bottom: 1px dashed #1f1f2e; color: #e4e4e7; font-size: 15px; font-weight: 600;">${reqIp}</td>
          </tr>
          <tr>
            <td style="padding-top: 12px; color: #8b8b99; font-size: 15px; font-weight: 500;">Dispositivo:</td>
            <td align="right" style="padding-top: 12px; color: #e4e4e7; font-size: 15px; font-weight: 600;">${userAgent.substring(0, 40)}...</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="font-size: 14px; line-height: 1.7; color: #71717a; margin: 0;">Si has sido tú, puedes ignorar este mensaje. Si no reconoces esta actividad, por favor cambia tu contraseña inmediatamente.</p>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getFromEmail(),
      to: user.email,
      subject,
      html: baseTemplate('Alerta de Seguridad', content, preheader)
    });
    console.log(`Login alert email sent to ${user.email}`);
  } catch (err) {
    console.error('Error sending login alert email:', err);
  }
};

/**
 * Enviar recibo/confirmación de pago (Premium).
 */
exports.sendPaymentSuccessEmail = async (user, plan) => {
  if (!process.env.SMTP_HOST) return;

  const planName = plan === 'lifetime' ? 'Premium Lifetime' : 'Premium Mensual';
  const subject = `Suscripción a ${planName} confirmada`;
  const preheader = '¡Gracias por mejorar a Premium!';
  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 20px 0; letter-spacing: -0.5px; text-align: center;">¡Gracias por tu compra!</h2>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Hola <strong style="color: #f4f4f5; font-weight: 600;">${user.name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Tu cuenta ha sido actualizada con éxito al plan <strong style="color: #f4f4f5; font-weight: 600;">${planName}</strong>. Ahora tienes acceso a todas las funciones premium de Ventoo, incluyendo:</p>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr><td style="background-color: #121218; border: 1px solid #1f1f2e; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; color: #d1d5db; font-size: 15px;">✨ Generación ilimitada de outfits</td></tr>
      <tr><td style="padding: 4px;"></td></tr>
      <tr><td style="background-color: #121218; border: 1px solid #1f1f2e; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; color: #d1d5db; font-size: 15px;">✨ Visión por IA (subir fotos de tu ropa)</td></tr>
      <tr><td style="padding: 4px;"></td></tr>
      <tr><td style="background-color: #121218; border: 1px solid #1f1f2e; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; color: #d1d5db; font-size: 15px;">✨ Chatbot de estilo avanzado sin límites</td></tr>
      <tr><td style="padding: 4px;"></td></tr>
      <tr><td style="background-color: #121218; border: 1px solid #1f1f2e; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; color: #d1d5db; font-size: 15px;">✨ Experiencia 100% libre de anuncios</td></tr>
    </table>
    
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Disfruta de la experiencia definitiva de estilismo inteligente.</p>
    <div style="text-align: center; margin: 35px 0 10px;">
      <a href="${process.env.FRONTEND_URL || 'https://ventoo.app'}/app" style="display: inline-block; padding: 16px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 14px;">Explorar funciones Premium</a>
    </div>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getFromEmail(),
      to: user.email,
      subject,
      html: baseTemplate('Suscripción Confirmada', content, preheader)
    });
    console.log(`Payment success email sent to ${user.email} for plan ${plan}`);
  } catch (err) {
    console.error('Error sending payment success email:', err);
  }
};

exports.sendBanNotificationEmail = async (user, isBanned, bannedUntil, banReason) => {
  if (!process.env.SMTP_HOST || !isBanned) return;

  const subject = `Aviso importante sobre tu cuenta de Ventoo`;
  const preheader = 'Tu cuenta ha sido suspendida.';
  
  let durationText = 'de forma permanente';
  if (bannedUntil) {
    const date = new Date(bannedUntil);
    durationText = `hasta el ${date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }

  const reasonText = banReason ? `<p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;"><strong style="color: #f4f4f5; font-weight: 600;">Motivo de la suspensión:</strong> ${banReason}</p>` : '';

  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 20px 0; letter-spacing: -0.5px; text-align: center;">Aviso de Suspensión de Cuenta</h2>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Hola <strong style="color: #f4f4f5; font-weight: 600;">${user.name || 'Usuario'}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Te escribimos para informarte de que tu cuenta de Ventoo ha sido suspendida <strong style="color: #f4f4f5; font-weight: 600;">${durationText}</strong> por infringir nuestros términos de servicio.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background-color: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 50%; border: 1px solid rgba(239, 68, 68, 0.2);">
        <img src="https://img.icons8.com/ios-filled/50/ef4444/cancel.png" alt="Ban" width="48" height="48" style="display: block;">
      </div>
    </div>
    
    ${reasonText}
    
    <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="color: #fca5a5; margin: 0; font-size: 14px; line-height: 1.5;">Durante este tiempo, no podrás acceder a la plataforma ni utilizar los servicios de inteligencia artificial.</p>
    </div>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Si crees que esto ha sido un error, por favor, contacta con nuestro equipo de soporte.</p>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getFromEmail(),
      to: user.email,
      subject,
      html: baseTemplate('Cuenta Suspendida', content, preheader)
    });
    console.log(`Ban notification email sent to ${user.email}`);
  } catch (err) {
    console.error('Error sending ban notification email:', err);
  }
};

/**
 * Send an email to the support team when a new ticket is opened.
 */
exports.sendNewTicketEmail = async (user, ticket) => {
  if (!process.env.SMTP_HOST) return;

  const subject = `Nuevo ticket de soporte de ${user.name || 'Usuario'}`;
  const preheader = `Problema reportado: ${ticket.asunto}`;
  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 20px 0; letter-spacing: -0.5px; text-align: center;">Nuevo Ticket de Soporte</h2>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121218; border: 1px solid #1f1f2e; border-radius: 16px; margin: 24px 0;">
      <tr><td style="padding: 24px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding-bottom: 12px; border-bottom: 1px dashed #1f1f2e; color: #8b8b99; font-size: 15px; font-weight: 500;">Usuario:</td>
            <td align="right" style="padding-bottom: 12px; border-bottom: 1px dashed #1f1f2e; color: #e4e4e7; font-size: 15px; font-weight: 600;">${user.name} (${user.email})</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px dashed #1f1f2e; color: #8b8b99; font-size: 15px; font-weight: 500;">ID Usuario:</td>
            <td align="right" style="padding: 12px 0; border-bottom: 1px dashed #1f1f2e; color: #e4e4e7; font-size: 15px; font-weight: 600;">${user.id}</td>
          </tr>
          <tr>
            <td style="padding-top: 12px; color: #8b8b99; font-size: 15px; font-weight: 500;">Asunto:</td>
            <td align="right" style="padding-top: 12px; color: #e4e4e7; font-size: 15px; font-weight: 600;">${ticket.asunto}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <h2 style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 20px 0 10px 0; letter-spacing: -0.5px;">Mensaje:</h2>
    <div style="background-color: #121218; border: 1px solid #1f1f2e; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <p style="margin: 0; white-space: pre-wrap; font-size: 15px; color: #d1d5db; line-height: 1.6;">${ticket.mensaje}</p>
    </div>
    <div style="text-align: center; margin: 35px 0 10px;">
      <a href="${process.env.FRONTEND_URL || 'https://ventoo.app'}/admin" style="display: inline-block; padding: 16px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 14px;">Abrir Panel de Admin</a>
    </div>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getFromEmail(),
      to: 'equipo.ventoo@gmail.com',
      subject,
      html: baseTemplate('Nuevo Ticket de Soporte', content, preheader)
    });
    console.log(`New ticket email sent for ticket ${ticket.id}`);
  } catch (err) {
    console.error('Error sending new ticket email:', err);
  }
};

exports.sendMorningAlertEmail = async (user, cityName, current, tempMax, tempMin) => {
  if (!process.env.SMTP_HOST) return;

  const subject = `☀️ Buenos días${user.name ? `, ${user.name}` : ''} — Tu resumen del clima en ${cityName}`;
  const preheader = `Hoy en ${cityName}: ${Math.round(current.temperature_2m)}°C. ¡Vístete con estilo!`;

  const weatherCodeEmojis = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 61: '🌧️', 71: '🌨️', 80: '🌦️', 95: '⛈️' };
  const emoji = weatherCodeEmojis[current.weather_code] || '🌡️';

  const tempColor = current.temperature_2m >= 25 ? '#f97316' : current.temperature_2m <= 8 ? '#60a5fa' : '#a78bfa';

  let clothingTip = '';
  if (tempMax >= 28) clothingTip = 'Día de calor. Ropa ligera, lino o algodón. Hidratación clave. ☀️';
  else if (tempMax >= 20) clothingTip = 'Temperatura ideal. Un look casual es perfecto para hoy. 😎';
  else if (tempMax >= 12) clothingTip = 'Fresco. Lleva una chaqueta ligera o sudadera por si refresca. 🧥';
  else clothingTip = 'Día frío. Abrígate bien, jersey grueso y abrigo son imprescindibles. 🧣';

  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 20px 0; letter-spacing: -0.5px; text-align: center;">Buenos días${user.name ? `, ${user.name}` : ''} 👋</h2>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0; text-align: center;">Aquí tienes tu resumen meteorológico matutino para <strong style="color: #f4f4f5; font-weight: 600;">${cityName}</strong>.</p>
    
    <div style="text-align: center; margin: 30px 0; padding: 30px; background-color: #1a1528; border-radius: 20px; border: 1px solid #2d2446;">
      <div style="font-size: 56px; margin-bottom: 8px;">${emoji}</div>
      <div style="font-size: 52px; font-weight: 900; color: ${tempColor}; margin-bottom: 4px;">${Math.round(current.temperature_2m)}°C</div>
      <div style="color: #9ca3af; font-size: 14px;">Sensación: ${Math.round(current.apparent_temperature)}°C</div>
    </div>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121218; border: 1px solid #1f1f2e; border-radius: 16px; margin: 24px 0;">
      <tr><td style="padding: 24px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding-bottom: 12px; border-bottom: 1px dashed #1f1f2e; color: #8b8b99; font-size: 15px; font-weight: 500;">🌡️ Máxima hoy</td>
            <td align="right" style="padding-bottom: 12px; border-bottom: 1px dashed #1f1f2e; color: #e4e4e7; font-size: 15px; font-weight: 600;">${Math.round(tempMax)}°C</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px dashed #1f1f2e; color: #8b8b99; font-size: 15px; font-weight: 500;">🌙 Mínima hoy</td>
            <td align="right" style="padding: 12px 0; border-bottom: 1px dashed #1f1f2e; color: #e4e4e7; font-size: 15px; font-weight: 600;">${Math.round(tempMin)}°C</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px dashed #1f1f2e; color: #8b8b99; font-size: 15px; font-weight: 500;">💧 Humedad</td>
            <td align="right" style="padding: 12px 0; border-bottom: 1px dashed #1f1f2e; color: #e4e4e7; font-size: 15px; font-weight: 600;">${current.relative_humidity_2m || '—'}%</td>
          </tr>
          <tr>
            <td style="padding-top: 12px; color: #8b8b99; font-size: 15px; font-weight: 500;">💨 Viento</td>
            <td align="right" style="padding-top: 12px; color: #e4e4e7; font-size: 15px; font-weight: 600;">${Math.round(current.wind_speed_10m || 0)} km/h</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 24px 0 16px 0; letter-spacing: -0.5px; text-align: center;">🎽 Consejo de Vestuario</h2>
    <p style="font-size: 16px; line-height: 1.7; color: #e5e7eb; margin: 0 0 24px 0; text-align: center;">${clothingTip}</p>
    
    <div style="text-align: center; margin: 35px 0 10px;">
      <a href="${process.env.FRONTEND_URL || 'https://ventoo.app'}/app" style="display: inline-block; padding: 16px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 14px;">✨ Generar Outfit Completo</a>
    </div>
    <p style="font-size: 12px; color: #52525b; text-align: center; margin-top: 20px;">
      Para dejar de recibir estas alertas, desactívalas en tus <a href="${process.env.FRONTEND_URL || 'https://ventoo.app'}/app" style="color: #818cf8; text-decoration: none;">ajustes de perfil</a>.
    </p>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getFromEmail(),
      to: user.email,
      subject,
      html: baseTemplate('Resumen Matutino de Ventoo', content, preheader)
    });
    console.log(`Morning alert email sent to ${user.email}`);
  } catch (err) {
    console.error('Error sending morning alert email:', err);
  }
};

exports.sendAccountDeletedEmail = async (user) => {
  const subject = 'Tu cuenta de Ventoo ha sido eliminada';
  const preheader = 'Confirmación de eliminación de cuenta';
  
  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 20px 0; letter-spacing: -0.5px; text-align: center;">Hola${user.name ? ' ' + user.name : ''},</h2>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Te confirmamos que tu cuenta de Ventoo ha sido eliminada correctamente, junto con todos tus datos, consultas, outfits y preferencias, tal y como solicitaste.</p>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0;">Si cambias de opinión en el futuro, siempre serás bienvenido/a para crear una nueva cuenta.</p>
    <p style="font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0; text-align: center; font-weight: 600; color: #f4f4f5;">¡Gracias por haber probado Ventoo!</p>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getFromEmail(),
      to: user.email,
      subject,
      html: baseTemplate('Cuenta Eliminada', content, preheader)
    });
    console.log(`Account deleted email sent to ${user.email}`);
  } catch (err) {
    console.error('Error sending account deleted email:', err);
  }
};
