import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Settings2, Check } from 'lucide-react';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  const [preferences, setPreferences] = useState({
    essential: true, // Always true
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = Cookies.get('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    } else {
      try {
        const savedPrefs = JSON.parse(consent);
        setPreferences(savedPrefs);
      } catch (e) {
        // Legacy consent string "accepted" or "denied"
        if (consent === 'accepted') {
          setPreferences({ essential: true, analytics: true, marketing: true });
        } else if (consent === 'denied') {
          setPreferences({ essential: true, analytics: false, marketing: false });
        }
      }
    }
  }, []);

  const savePreferences = (prefs) => {
    Cookies.set('cookieConsent', JSON.stringify(prefs), { expires: 365 });
    setPreferences(prefs);
    setIsVisible(false);
    setShowConfig(false);
  };

  const handleAcceptAll = () => {
    savePreferences({ essential: true, analytics: true, marketing: true });
  };

  const handleDenyAll = () => {
    savePreferences({ essential: true, analytics: false, marketing: false });
  };

  const handleSaveConfig = () => {
    savePreferences(preferences);
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && !showConfig && (
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
                    Utilizamos cookies estrictamente necesarias para el funcionamiento de la web (como tu sesión y modo oscuro). También podemos usar cookies opcionales para entender el uso de nuestra plataforma y personalizar tu experiencia.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 shrink-0">
                <button 
                  onClick={() => setShowConfig(true)}
                  className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings2 size={18} /> Configurar
                </button>
                <button 
                  onClick={handleDenyAll}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors"
                >
                  Rechazar
                </button>
                <button 
                  onClick={handleAcceptAll}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Aceptar Todas
                </button>
              </div>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Settings2 className="text-indigo-500" /> Configuración de Cookies
                </h3>
                <button onClick={() => setShowConfig(false)} className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-800">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pr-2 flex-1">
                {/* Esenciales */}
                <div className="p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-lg">Estrictamente Necesarias</h4>
                    <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold bg-indigo-500/10 px-2 py-1 rounded">
                      <Check size={14} /> Siempre Activas
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">Son imprescindibles para que la web funcione (login, modo oscuro). No se pueden desactivar.</p>
                </div>

                {/* Analíticas */}
                <div className="p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-lg">Analíticas y Rendimiento</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-400">Nos ayudan a entender cómo interactúas con la web para mejorar la plataforma.</p>
                </div>

                {/* Marketing */}
                <div className="p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-lg">Publicidad y Marketing</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-400">Se utilizan para mostrar anuncios relevantes y atractivos para el usuario individual.</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800 flex flex-col gap-3">
                <button 
                  onClick={handleSaveConfig}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
                >
                  Guardar mis preferencias
                </button>
                <button 
                  onClick={handleAcceptAll}
                  className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors"
                >
                  Aceptar Todas
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CookieBanner;
