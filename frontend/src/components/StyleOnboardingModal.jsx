import React, { useState } from 'react';
import axios from 'axios';
import { Shirt, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function StyleOnboardingModal({ token, darkMode, onClose }) {
  const [estiloPersonal, setEstiloPersonal] = useState('');
  const [estiloDetalles, setEstiloDetalles] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const meRes = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = meRes.data.user;
      
      await axios.put(`${API_URL}/api/auth/profile`, { 
        name: user.name, 
        gender: user.gender, 
        estiloPersonal, 
        estiloDetalles 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`}
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-3">
            <Shirt className="text-white w-8 h-8 -rotate-3" />
          </div>
        </div>
        
        <h2 className={`text-2xl sm:text-3xl font-black text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Configura tu Estilo
        </h2>
        <p className={`text-center mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Cuéntale a la IA cómo te gusta vestir para que genere los outfits perfectos para ti.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Estilo Principal
            </label>
            <select 
              value={estiloPersonal}
              onChange={e => setEstiloPersonal(e.target.value)}
              className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border shadow-sm`}
              required
            >
              <option value="" disabled>Selecciona tu estilo...</option>
              <option value="Urbano / Streetwear">Urbano / Streetwear</option>
              <option value="Casual">Casual</option>
              <option value="Elegante / Formal">Elegante / Formal</option>
              <option value="Minimalista">Minimalista</option>
              <option value="Deportivo">Deportivo</option>
              <option value="Vintage / Retro">Vintage / Retro</option>
              <option value="Bohemio / Boho">Bohemio / Boho</option>
              <option value="Gótico / Dark">Gótico / Dark</option>
              <option value="Y2K">Y2K</option>
              <option value="Preppy">Preppy</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Detalles específicos (Opcional)
            </label>
            <textarea 
              value={estiloDetalles}
              onChange={e => setEstiloDetalles(e.target.value)}
              placeholder="Ej: Prefiero colores oscuros, ropa muy ancha, zapatos cómodos..."
              rows={3}
              className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border shadow-sm resize-none`}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !estiloPersonal}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Guardando...' : (
              <>
                <Sparkles size={18} />
                Comenzar a usar Ventoo
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
