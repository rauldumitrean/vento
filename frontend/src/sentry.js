import * as Sentry from '@sentry/react';

// Sentry solo se inicializa en producción para no contaminar los reportes con errores de desarrollo
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,

    // Captura el 10% de las sesiones para replay de errores (grabación de pantalla del error)
    // Sube al 100% cuando hay un error
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,       // Oculta texto sensible (emails, contraseñas)
        blockAllMedia: false,
      }),
    ],

    // Performance Monitoring: muestra cuánto tarda cada pantalla en cargar
    tracesSampleRate: 0.1,         // 10% de las transacciones normales

    // Session Replay: graba la sesión del usuario cuando ocurre un error
    replaysSessionSampleRate: 0.05,  // 5% de sesiones normales
    replaysOnErrorSampleRate: 1.0,   // 100% de sesiones con error

    // No capturar errores de extensiones de navegador o scripts externos
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      /^Loading chunk \d+ failed/,
    ],

    beforeSend(event) {
      // No enviar errores de desarrollo o localhost
      if (window.location.hostname === 'localhost') {
        return null;
      }
      return event;
    },
  });
}

export default Sentry;
