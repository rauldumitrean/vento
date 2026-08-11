const Sentry = require('@sentry/node');

/**
 * Inicializa Sentry para el backend Node.js.
 * Llamar a esta función en la primera línea de server.js, antes de cualquier require de rutas.
 */
function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log('[Sentry] SENTRY_DSN no configurado. Monitor de errores desactivado.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'production',

    // Captura el 10% del tráfico para performance monitoring
    tracesSampleRate: 0.1,

    // No capturar errores de health check
    ignoreErrors: [],

    beforeSend(event, hint) {
      const error = hint?.originalException;

      // No enviar errores 404 o 401 (son normales en uso)
      if (error?.status === 404 || error?.status === 401) {
        return null;
      }

      // No enviar errores de rate limiting (son esperados)
      if (error?.status === 429) {
        return null;
      }

      return event;
    },
  });

  console.log('[Sentry] Monitor de errores activo en entorno:', process.env.NODE_ENV);
}

module.exports = { initSentry, Sentry };
