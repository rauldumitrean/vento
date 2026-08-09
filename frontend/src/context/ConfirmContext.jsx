import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {confirmState.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm rounded-3xl p-6 bg-gray-900 text-white border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Confirmar Acción</h3>
                  <p className="text-gray-400 text-sm">{confirmState.message}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={confirmState.onCancel}
                  className="flex-1 py-2.5 rounded-xl font-bold transition-colors bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmState.onConfirm}
                  className="flex-1 py-2.5 rounded-xl font-bold transition-colors bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 text-sm"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};
