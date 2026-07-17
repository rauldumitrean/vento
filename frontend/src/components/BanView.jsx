import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function BanView({ banDetails, setBannedData, onLogout }) {
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const token = localStorage.getItem('token');
      // Intenta hacer ping al servidor. Si ya no está baneado, devolverá 200 OK.
      await axios.post(`${API_URL}/api/ping`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Si llega aquí, significa que el ban ha sido levantado
      setBannedData(null);
      localStorage.removeItem('bannedData');
    } catch (err) {
      // Si sigue baneado, el interceptor volverá a dispararse (o simplemente lo ignoramos aquí)
    } finally {
      // Damos un mínimo de tiempo para que se vea la animación
      setTimeout(() => setChecking(false), 800);
    }
  };

  const handleLogoutClick = () => {
    onLogout();
  };

  return (
    <div className="min-h-[100dvh] bg-black font-sans flex items-center justify-center p-4 fixed inset-0 z-[1000]">
      <AnimatePresence mode="wait">
        {checking ? (
          <motion.div 
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-md w-full bg-gray-900 rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center border border-gray-800"
          >
            <div className="w-24 h-24 mb-6 rounded-full bg-gray-800 animate-pulse"></div>
            <div className="h-8 w-3/4 bg-gray-800 rounded animate-pulse mb-6"></div>
            <div className="w-full bg-gray-800/50 p-4 rounded-xl mb-6 h-32 animate-pulse"></div>
            <div className="flex flex-col gap-3 w-full mb-4">
              <div className="h-12 w-full bg-gray-800 rounded-xl animate-pulse"></div>
              <div className="h-12 w-full bg-gray-800 rounded-xl animate-pulse"></div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="max-w-md w-full bg-gray-900 rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center border border-red-900/30"
          >
            <motion.div
              initial={{ y: -50, rotate: -10 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ type: 'spring', bounce: 0.6, duration: 1 }}
              className="w-24 h-24 mb-6 text-red-500"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-lg">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Cuenta Bloqueada</h2>
            <p className="text-gray-400 mb-6">Tu cuenta ha sido suspendida por el sistema de seguridad o un administrador.</p>
            <div className="bg-red-950/50 text-red-300 p-4 rounded-xl w-full mb-6 font-medium border border-red-900/40">
              {banDetails?.banReason && (
                <p className="mb-4 text-sm text-red-200 bg-red-900/30 p-2 rounded italic">"{banDetails.banReason}"</p>
              )}
              {banDetails?.bannedUntil ? (
                <p>El bloqueo expirará el: <br/><strong className="text-lg">{new Date(banDetails.bannedUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
              ) : (
                <p className="text-lg font-bold">Bloqueo Permanente</p>
              )}
            </div>
            <div className="flex flex-col gap-3 w-full mb-4">
              <button 
                onClick={handleRefresh}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-600/20"
              >
                Refrescar estado
              </button>
              <a 
                href="mailto:soporte@ventoo.app?subject=Revisión de bloqueo de cuenta"
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors border border-gray-700"
              >
                Contactar Soporte (Apelar)
              </a>
              <button 
                onClick={handleLogoutClick}
                className="text-sm font-semibold text-gray-500 hover:text-white transition-colors py-2 mt-2"
              >
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
