import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
                toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' :
                toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-100' :
                'bg-indigo-500/20 border-indigo-500/30 text-indigo-100'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
                {toast.type === 'error' && <AlertCircle size={18} className="text-red-400" />}
                {toast.type === 'info' && <Info size={18} className="text-indigo-400" />}
              </div>
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={16} className="text-white/70 hover:text-white" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
