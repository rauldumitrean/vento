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
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${title}</title>
  <style>
    /* Reset */
    body, p, h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030305; color: #f3f4f6; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #030305; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background: #0c0c10; border-radius: 20px; border: 1px solid #1f1f2e; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.7); }
    .header { padding: 40px 40px 20px; text-align: center; }
    .header img { width: 56px; height: 56px; margin-bottom: 20px; }
    .header h1 { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
    .divider { height: 1px; background: linear-gradient(90deg, transparent, #3f3f5a, transparent); margin: 0 40px 30px; }
    .content { padding: 0 40px 40px; }
    .content p { font-size: 16px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0; }
    .content h2 { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 20px 0; letter-spacing: -0.5px; text-align: center; }
    .content strong { color: #f4f4f5; font-weight: 600; }
    .footer { padding: 30px 40px; text-align: center; background: #050508; border-top: 1px solid #1f1f2e; }
    .footer p { font-size: 13px; color: #52525b; margin: 0 0 12px 0; }
    .footer a { color: #818cf8; text-decoration: none; font-weight: 500; transition: color 0.2s; }
    .footer a:hover { color: #a5b4fc; }
    .btn-container { text-align: center; margin: 35px 0 10px; }
    .btn { display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 14px; box-shadow: 0 8px 20px -6px rgba(79, 70, 229, 0.5); border: 1px solid rgba(255,255,255,0.1); transition: transform 0.2s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -6px rgba(79, 70, 229, 0.7); }
    .data-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 24px; border-radius: 16px; margin: 24px 0; }
    .data-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed rgba(255,255,255,0.05); padding-bottom: 12px; }
    .data-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
    .data-label { color: #8b8b99; font-size: 15px; font-weight: 500; }
    .data-value { color: #e4e4e7; font-weight: 600; font-size: 15px; text-align: right; }
    .preheader { display: none; max-height: 0px; overflow: hidden; color: transparent; opacity: 0; }
    .social-links { margin-top: 20px; }
    .social-links a { display: inline-block; margin: 0 8px; color: #52525b; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    ul.features-list { list-style-type: none; padding: 0; margin: 0 0 24px 0; }
    ul.features-list li { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; color: #d1d5db; display: flex; align-items: center; }
    ul.features-list li::before { content: "✨"; margin-right: 12px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="preheader">\${preheader}</div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="\${getLogoUrl()}" alt="Ventoo Logo">
        <h1>VENTOO</h1>
      </div>
      <div class="divider"></div>
      <div class="content">
        \${content}
      </div>
      <div class="footer">
        <p>&copy; \${new Date().getFullYear()} Ventoo AI. Todos los derechos reservados.</p>
        <p>¿Tienes alguna duda? <a href="\${process.env.FRONTEND_URL || 'https://ventoo.app'}/support">Contacta con soporte</a></p>
      </div>
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
    <div class="btn-container">
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
    <ul class="features-list">
      <li>Generación ilimitada de outfits</li>
      <li>Visión por IA (subir fotos de tu ropa)</li>
      <li>Chatbot de estilo avanzado sin límites</li>
      <li>Experiencia 100% libre de anuncios</li>
    </ul>
    <p>Disfruta de la experiencia definitiva de estilismo inteligente.</p>
    <div class="btn-container">
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

exports.sendBanNotificationEmail = async (user, isBanned, bannedUntil, banReason) => {
  if (!process.env.SMTP_HOST || !isBanned) return;

  const subject = `Aviso importante sobre tu cuenta de Ventoo`;
  const preheader = 'Tu cuenta ha sido suspendida.';
  
  let durationText = 'de forma permanente';
  if (bannedUntil) {
    const date = new Date(bannedUntil);
    durationText = `hasta el ${date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }

  const reasonText = banReason ? `<p><strong>Motivo de la suspensión:</strong> ${banReason}</p>` : '';

  const content = `
    <h2 style="text-align: center;">Aviso de Suspensión de Cuenta</h2>
    <p>Hola <strong>${user.name || 'Usuario'}</strong>,</p>
    <p>Te escribimos para informarte de que tu cuenta de Ventoo ha sido suspendida <strong>${durationText}</strong> por infringir nuestros términos de servicio.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 50%; border: 1px solid rgba(239, 68, 68, 0.2);">
        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
    </div>
    
    ${reasonText}
    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="color: #fca5a5; margin: 0; font-size: 14px;">Durante este tiempo, no podrás acceder a la plataforma ni utilizar los servicios de inteligencia artificial.</p>
    </div>
    <p>Si crees que esto ha sido un error, por favor, contacta con nuestro equipo de soporte.</p>
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
    <h2>Nuevo Ticket de Soporte</h2>
    <div class="data-box">
      <div class="data-row">
        <span class="data-label">Usuario:</span>
        <span class="data-value">${user.name} (${user.email})</span>
      </div>
      <div class="data-row">
        <span class="data-label">ID Usuario:</span>
        <span class="data-value">${user.id}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Asunto:</span>
        <span class="data-value">${ticket.asunto}</span>
      </div>
    </div>
    <h2>Mensaje:</h2>
    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <p style="margin: 0; white-space: pre-wrap;">${ticket.mensaje}</p>
    </div>
    <div class="btn-container">
      <a href="${process.env.FRONTEND_URL || 'https://ventoo.app'}/admin" class="btn">Abrir Panel de Admin</a>
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
/**
 * Send a morning alert email with today's weather and outfit tip.
 */
exports.sendMorningAlertEmail = async (user, cityName, current, tempMax, tempMin) => {
  if (!process.env.SMTP_HOST) return;

  const hour = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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
    <h2>Buenos días${user.name ? `, ${user.name}` : ''} 👋</h2>
    <p>Aquí tienes tu resumen meteorológico matutino para <strong>${cityName}</strong>.</p>
    
    <div style="text-align: center; margin: 30px 0; padding: 30px; background: linear-gradient(135deg, rgba(79,70,229,0.15), rgba(147,51,234,0.15)); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="font-size: 56px; margin-bottom: 8px;">${emoji}</div>
      <div style="font-size: 52px; font-weight: 900; color: ${tempColor}; margin-bottom: 4px;">${Math.round(current.temperature_2m)}°C</div>
      <div style="color: #9ca3af; font-size: 14px;">Sensación: ${Math.round(current.apparent_temperature)}°C</div>
    </div>

    <div class="data-box">
      <div class="data-row"><span class="data-label">🌡️ Máxima hoy</span><span class="data-value">${Math.round(tempMax)}°C</span></div>
      <div class="data-row"><span class="data-label">🌙 Mínima hoy</span><span class="data-value">${Math.round(tempMin)}°C</span></div>
      <div class="data-row"><span class="data-label">💧 Humedad</span><span class="data-value">${current.relative_humidity_2m || '—'}%</span></div>
      <div class="data-row"><span class="data-label">💨 Viento</span><span class="data-value">${Math.round(current.wind_speed_10m || 0)} km/h</span></div>
    </div>

    <h2>🎽 Consejo de Vestuario</h2>
    <p style="font-size: 16px; color: #e5e7eb;">${clothingTip}</p>
    
    <div class="btn-container">
      <a href="${process.env.FRONTEND_URL || 'https://ventoo.app'}/app" class="btn">✨ Generar Outfit Completo</a>
    </div>
    <p style="font-size: 12px; color: #4b5563; text-align: center; margin-top: 20px;">
      Para dejar de recibir estas alertas, desactívalas en tus <a href="${process.env.FRONTEND_URL || 'https://ventoo.app'}/app" style="color: #6366f1;">ajustes de perfil</a>.
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
    <h2>Hola${user.name ? ' ' + user.name : ''},</h2>
    <p>Te confirmamos que tu cuenta de Ventoo ha sido eliminada correctamente, junto con todos tus datos, consultas, outfits y preferencias, tal y como solicitaste.</p>
    <p>Si cambias de opinión en el futuro, siempre serás bienvenido/a para crear una nueva cuenta.</p>
    <p>¡Gracias por haber probado Ventoo!</p>
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
