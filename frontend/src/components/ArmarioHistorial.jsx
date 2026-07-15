import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
// FIX: Removed unused imports: Check, Shirt
import { Trash2, Heart, Clock, Plus, MapPin } from 'lucide-react';

// FIX: Use env variable instead of hardcoded localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ArmarioHistorial = ({ token, darkMode }) => {
  const [activeTab, setActiveTab] = useState('armario');
  const [armario, setArmario] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [nuevaPrenda, setNuevaPrenda] = useState({ categoria: 'top', descripcion: '', color: '' });
  const [loading, setLoading] = useState(true);

  // FIX: Added token to dependency array to avoid stale closure
  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // FIX: Using API_URL env variable
      const resArmario = await axios.get(`${API_URL}/api/armario`, { headers: { Authorization: `Bearer ${token}` } });
      const resHistorial = await axios.get(`${API_URL}/api/historial`, { headers: { Authorization: `Bearer ${token}` } });
      setArmario(resArmario.data);
      setHistorial(resHistorial.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrenda = async (e) => {
    e.preventDefault();
    if (!nuevaPrenda.descripcion) return;
    try {
      // FIX: Using API_URL env variable
      const res = await axios.post(`${API_URL}/api/armario`, nuevaPrenda, { headers: { Authorization: `Bearer ${token}` } });
      setArmario([...armario, res.data]);
      setNuevaPrenda({ categoria: 'top', descripcion: '', color: '' });
    } catch (error) {
      alert("Error al añadir prenda");
    }
  };

  const handleDeletePrenda = async (id) => {
    // FIX: Added confirmation dialog before delete
    if (!window.confirm('¿Seguro que quieres eliminar esta prenda? Esta acción no se puede deshacer.')) return;
    try {
      // FIX: Using API_URL env variable
      await axios.delete(`${API_URL}/api/armario/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setArmario(armario.filter(p => p.id !== id));
    } catch (error) {
      alert("Error al borrar prenda");
    }
  };

  const toggleFavorite = async (id, isFav) => {
    try {
      // FIX: Using API_URL env variable
      await axios.put(`${API_URL}/api/historial/${id}/favorito`, { isFavorite: !isFav }, { headers: { Authorization: `Bearer ${token}` } });
      setHistorial(historial.map(h => h.id === id ? { ...h, isFavorite: !isFav } : h));
    } catch (error) {
      alert("Error al actualizar favorito");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-4xl mx-auto rounded-xl shadow-sm p-6 ${darkMode ? 'bg-gray-900 text-white border-gray-800 border' : 'bg-white'}`}
    >
      <div className="flex border-b mb-6">
        <button 
          onClick={() => setActiveTab('armario')}
          className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${activeTab === 'armario' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-gray-500 hover:text-gray-400'}`}
        >
          Mi Armario Virtual
        </button>
        <button 
          onClick={() => setActiveTab('historial')}
          className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${activeTab === 'historial' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-gray-500 hover:text-gray-400'}`}
        >
          Historial de Outfits
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div>
      ) : activeTab === 'armario' ? (
        <div>
          <form onSubmit={handleAddPrenda} className={`flex flex-col sm:flex-row gap-3 mb-8 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <select 
              value={nuevaPrenda.categoria} 
              onChange={e => setNuevaPrenda({...nuevaPrenda, categoria: e.target.value})}
              className={`p-2 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="top">Parte superior (Top)</option>
              <option value="bottom">Parte inferior (Bottom)</option>
              <option value="abrigo">Abrigo / Chaqueta</option>
              <option value="calzado">Calzado</option>
              <option value="accesorio">Accesorio</option>
            </select>
            <input 
              type="text" 
              placeholder="Descripción (ej. Camiseta básica)" 
              value={nuevaPrenda.descripcion}
              onChange={e => setNuevaPrenda({...nuevaPrenda, descripcion: e.target.value})}
              className={`flex-1 p-2 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
              required
            />
            <input 
              type="text" 
              placeholder="Color (opcional)" 
              value={nuevaPrenda.color}
              onChange={e => setNuevaPrenda({...nuevaPrenda, color: e.target.value})}
              className={`w-full sm:w-32 p-2 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded px-4 flex items-center justify-center gap-2 transition-colors w-full sm:w-auto">
              <Plus size={16} /> Añadir
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {armario.length === 0 ? (
               <p className="text-gray-500 col-span-full text-center py-8">Tu armario está vacío. Añade algunas prendas para que la IA las utilice en sus recomendaciones.</p>
            ) : (
              armario.map(prenda => (
                <div key={prenda.id} className={`p-4 rounded-lg flex justify-between items-start border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">{prenda.categoria}</span>
                    <h3 className="font-medium mt-2">{prenda.descripcion}</h3>
                    {prenda.color && <p className="text-sm text-gray-500">{prenda.color}</p>}
                  </div>
                  <button onClick={() => handleDeletePrenda(prenda.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {historial.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tienes historial de consultas todavía.</p>
          ) : (
            historial.map(h => {
              // FIX: JSON.parse wrapped in try/catch to avoid crashes on malformed data
              let clima = {};
              let outfit = { resumen: '', prendas: [] };
              try { clima = JSON.parse(h.clima_json); } catch (e) { console.error('Error parsing clima_json', e); }
              try { outfit = JSON.parse(h.recomendacion_json); } catch (e) { console.error('Error parsing recomendacion_json', e); }

              return (
                <div key={h.id} className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={16} /> {new Date(h.createdAt).toLocaleDateString()} - <MapPin size={16} className="ml-2"/> {h.ubicacion} {clima.temperature_2m != null ? `(${clima.temperature_2m}ºC)` : ''}
                    </div>
                    <button 
                      onClick={() => toggleFavorite(h.id, h.isFavorite)}
                      className={`p-2 rounded-full transition-colors ${h.isFavorite ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      <Heart size={20} fill={h.isFavorite ? "currentColor" : "none"} />
                    </button>
                  </div>
                  {outfit.resumen && <p className={`font-medium mb-4 italic ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>"{outfit.resumen}"</p>}
                  <div className="flex flex-wrap gap-2">
                    {(outfit.prendas || []).map((p, i) => (
                      <span key={i} className={`text-xs px-2 py-1 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'}`}>
                        {p.descripcion}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ArmarioHistorial;
