import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Tag, Loader2, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function HistorialOutfits({ token, darkMode }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/historial`, { headers: { Authorization: `Bearer ${token}` } });
      setHistorial(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  if (historial.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Tag size={32} className="text-gray-500" />
        </div>
        <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Aún no hay historial</h3>
        <p className="text-gray-400 max-w-md">No has generado ningún outfit todavía.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {historial.map(outfit => (
        <div key={outfit.id} className={`p-6 rounded-xl border ${darkMode ? 'bg-black/20 border-white/10 backdrop-blur-xl' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex justify-between items-start mb-4">
            <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Outfit del {new Date(outfit.createdAt).toLocaleDateString()}</h4>
          </div>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{outfit.recomendacion}</p>
        </div>
      ))}
    </div>
  );
}
