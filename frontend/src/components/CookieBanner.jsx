import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = Cookies.get('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    Cookies.set('cookieConsent', 'accepted', { expires: 365 });
    setIsVisible(false);
  };

  const handleDeny = () => {
    Cookies.set('cookieConsent', 'denied', { expires: 365 });
    // Aquí puedes limpiar cookies no esenciales si tuvieras analíticas
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none flex justify-center"
        >
          <div className="pointer-events-auto w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-5 flex flex-col md:flex-row items-center gap-6">
            
            <div className="flex-1 flex items-start gap-4">
              <div className="hidden sm:flex shrink-0 w-12 h-12 bg-indigo-500/20 rounded-full items-center justify-center">
                <Shield size={24} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Tu Privacidad es Importante</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Utilizamos cookies estrictamente necesarias para mantener tu sesión activa y guardar tus preferencias de tema (modo oscuro). También nos gustaría utilizar cookies opcionales para entender cómo usas nuestra plataforma y mejorar tu experiencia.
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 shrink-0">
              <button 
                onClick={handleDeny}
                className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 transition-colors w-full sm:w-auto"
              >
                Rechazar
              </button>
              <button 
                onClick={handleAccept}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-600/20 w-full sm:w-auto"
              >
                Aceptar Todas
              </button>
              <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-white md:hidden"
              >
                <X size={16} />
              </button>
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
