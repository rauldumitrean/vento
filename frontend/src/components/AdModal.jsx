import { useState, useEffect } from 'react';

export default function AdModal({ onClose }) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-lg aspect-video rounded flex items-center justify-center overflow-hidden">
        {/* Simulación de anuncio */}
        <div className="absolute inset-0 bg-neutral-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-gray-100 dark:bg-gray-700 h-48 rounded flex flex-col items-center justify-center text-gray-500 mb-6">
            <span className="text-sm border border-gray-400 px-2 py-1 mb-2">PUBLICIDAD</span>
            <p className="text-xs text-center px-4">
              (Espacio reservado para Google AdSense) <br/><br/>
              Copia y pega aquí tu código <code>&lt;ins class="adsbygoogle" ...&gt;</code> cuando Google apruebe tu cuenta.
            </p>
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
