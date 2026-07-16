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

// ─── PLANTILLA BASE ──────────────────────────────────────────────────────────
const baseTemplate = (title, content, preheader = '') => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060608; color: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #111116; border-radius: 24px; overflow: hidden; border: 1px solid #ffffff15; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5); }
    .header { padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #3730a3 0%, #6b21a8 100%); border-bottom: 1px solid #ffffff15; }
    .header img { width: 48px; height: 48px; margin-bottom: 16px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
    .header h1 { margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
    .content { padding: 40px 30px; }
    .content p { font-size: 16px; line-height: 1.6; color: #d1d5db; margin: 0 0 20px 0; }
    .content h2 { font-size: 20px; font-weight: bold; color: #ffffff; margin: 0 0 16px 0; }
    .footer { padding: 30px; text-align: center; background: #0a0a0f; border-top: 1px solid #ffffff10; }
    .footer p { font-size: 13px; color: #6b7280; margin: 0 0 8px 0; }
    .footer a { color: #818cf8; text-decoration: none; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #4f46e5, #9333ea); color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 12px; margin-top: 10px; }
    .data-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 20px; }
    .data-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .data-row:last-child { margin-bottom: 0; }
    .data-label { color: #9ca3af; font-size: 14px; }
    .data-value { color: #ffffff; font-weight: bold; font-size: 14px; }
    .preheader { display: none; max-height: 0px; overflow: hidden; }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="container">
    <div class="header">
      <img src="${getLogoUrl()}" alt="Ventoo Logo">
      <h1>VENTOO</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Este correo electrónico fue enviado por Ventoo AI.</p>
      <p>¿Tienes alguna duda? <a href="#">Contacta con soporte</a></p>
    </div>
  </div>
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
    <h2>Tu cuenta ha sido creada con éxito</h2>
    <p>Hola <strong>${user.name}</strong>,</p>
    <p>Estamos encantados de darte la bienvenida a Ventoo. A partir de hoy, nunca más tendrás que preocuparte por qué ponerte. Nuestra Inteligencia Artificial cruzará el clima exacto de tu ubicación con tu estilo personal para darte recomendaciones perfectas.</p>
    <p>Ya tienes tu plan <strong>Básico</strong> activado con 5 outfits diarios.</p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.FRONTEND_URL || 'https://ventoo.app'}/app" class="btn">Entrar a mi Panel</a>
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
    <h2>Alerta de Seguridad</h2>
    <p>Hola ${user.name},</p>
    <p>Hemos detectado un nuevo inicio de sesión en tu cuenta de Ventoo.</p>
    <div class="data-box">
      <div class="data-row"><span class="data-label">Fecha:</span><span class="data-value">${dateStr} (CET)</span></div>
      <div class="data-row"><span class="data-label">IP:</span><span class="data-value">${reqIp}</span></div>
      <div class="data-row"><span class="data-label">Dispositivo:</span><span class="data-value">${userAgent.substring(0, 40)}...</span></div>
    </div>
    <p style="font-size: 14px; color: #9ca3af;">Si has sido tú, puedes ignorar este mensaje. Si no reconoces esta actividad, por favor cambia tu contraseña inmediatamente.</p>
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
    <h2>¡Gracias por tu compra!</h2>
    <p>Hola <strong>${user.name}</strong>,</p>
    <p>Tu cuenta ha sido actualizada con éxito al plan <strong>${planName}</strong>. Ahora tienes acceso a todas las funciones premium de Ventoo, incluyendo:</p>
    <ul style="color: #d1d5db; line-height: 1.6; font-size: 15px; margin-bottom: 20px;">
      <li>Generación ilimitada de outfits</li>
      <li>Visión por IA (subir fotos de tu ropa)</li>
      <li>Chatbot de estilo avanzado sin límites</li>
      <li>Experiencia 100% libre de anuncios</li>
    </ul>
    <p>Disfruta de la experiencia definitiva de estilismo inteligente.</p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.FRONTEND_URL || 'https://ventoo.app'}/app" class="btn">Explorar funciones Premium</a>
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
