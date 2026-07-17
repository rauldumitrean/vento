import { useState, useEffect } from 'react';

export default function AdModal({ onClose }) {
  const [timeLeft, setTimeLeft] = useState(8);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  useEffect(() => {
    // FIX: Use correct AdSense push pattern without checking non-standard .loaded property
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  // FIX: Guard against undefined onClose to prevent crash
  const handleClose = () => {
    if (typeof onClose === 'function') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Anuncio obligatorio"
    >
      <div className="relative bg-white w-full max-w-3xl aspect-[4/3] sm:aspect-video rounded flex items-center justify-center overflow-hidden shadow-2xl">
        {/* Simulación de anuncio */}
        <div className="absolute inset-0 bg-neutral-100 flex flex-col items-center justify-center p-6 sm:p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Apoya a Ventoo</h2>
          <p className="text-gray-600 mb-8 text-sm sm:text-base max-w-xl">
            Para poder seguir ofreciéndote este servicio de Inteligencia Artificial de forma 100% gratuita, financiamos los servidores mediante publicidad.
          </p>
          {/* FIX: Added a real ad-slot placeholder. Replace "XXXXXXXXXX" with your actual AdSense slot ID */}
          <div className="w-full flex-1 min-h-[250px] max-h-[400px] rounded overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-200 shadow-inner">
            <ins className="adsbygoogle"
                 style={{ display: 'block', width: '100%', height: '100%' }}
                 data-ad-client="ca-pub-7031196086140700"
                 data-ad-slot="4164504071"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
          </div>
        </div>

        {/* Controles del anuncio */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          {timeLeft > 0 ? (
            <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">
              Podrás cerrar en {timeLeft}s
            </span>
          ) : (
            <button 
              onClick={handleClose}
              className="bg-black/50 text-white hover:bg-black/80 text-sm px-3 py-1 rounded-full transition-colors flex items-center"
            >
              Cerrar ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
