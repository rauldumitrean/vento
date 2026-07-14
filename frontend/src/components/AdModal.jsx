import { useState, useEffect } from 'react';

export default function AdModal({ onClose }) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  useEffect(() => {
    try {
      if (window.adsbygoogle && !window.adsbygoogle.loaded) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-lg aspect-video rounded flex items-center justify-center overflow-hidden">
        {/* Simulación de anuncio */}
        <div className="absolute inset-0 bg-neutral-100 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Apoya a Ventoo</h2>
          <p className="text-gray-600 mb-6 text-sm max-w-md">
            Para poder seguir ofreciéndote este servicio de Inteligencia Artificial de forma 100% gratuita, financiamos los servidores mediante publicidad.
          </p>
          <div className="w-full h-48 rounded overflow-hidden flex items-center justify-center bg-gray-50">
            <ins className="adsbygoogle"
                 style={{ display: 'inline-block', width: '100%', height: '100%' }}
                 data-ad-client="ca-pub-7031196086140700"
                 data-ad-slot="" // Aquí podrás poner el ID de un bloque de anuncios más adelante si quieres
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
              onClick={onClose}
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
