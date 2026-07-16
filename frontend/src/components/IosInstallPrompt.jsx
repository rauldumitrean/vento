import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, PlusSquare, X } from 'lucide-react';

const IosInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if it's an iOS device
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Check if it's Safari
    const isSafari = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return userAgent.includes('safari') && !userAgent.includes('crios') && !userAgent.includes('fxios');
    };

    // Check if already in PWA mode
    const isStandalone = () => {
      return ('standalone' in window.navigator) && (window.navigator.standalone);
    };

    // Only show if iOS, Safari, not already installed, and hasn't been dismissed recently
    if (isIos() && isSafari() && !isStandalone()) {
      const hasDismissed = localStorage.getItem('ios-pwa-dismissed');
      if (!hasDismissed) {
        // Delay prompt slightly so it's not jarring on immediate load
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    // Hide permanently once dismissed to not annoy the user
    localStorage.setItem('ios-pwa-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div 
          initial={{ y: '100%', opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 sm:pb-4 mx-auto max-w-md w-full"
        >
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl p-6 relative">
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100/50 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
            
            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Instala Ventoo</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Añade Ventoo a tu pantalla de inicio para disfrutar de una experiencia a pantalla completa como una app nativa.
              </p>
              
              <div className="bg-gray-50/80 rounded-2xl p-5 w-full text-left space-y-4 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center text-blue-500 shrink-0">
                    <Share size={20} />
                  </div>
                  <p className="text-sm text-gray-700 font-medium">1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.</p>
                </div>
                <div className="w-px h-4 bg-gray-200 ml-5 -my-2"></div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center text-gray-700 shrink-0">
                    <PlusSquare size={20} />
                  </div>
                  <p className="text-sm text-gray-700 font-medium">2. Selecciona <strong>"Añadir a la pantalla de inicio"</strong>.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IosInstallPrompt;
