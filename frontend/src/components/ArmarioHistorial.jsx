import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
// FIX: Removed unused imports: Check, Shirt
import { Trash2, Heart, Clock, Plus, MapPin, Send, Users, Share2 } from 'lucide-react';

// FIX: Use env variable instead of hardcoded localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ArmarioHistorial = ({ token, darkMode }) => {
  const [activeTab, setActiveTab] = useState('armario');
  const [armario, setArmario] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [nuevaPrenda, setNuevaPrenda] = useState({ categoria: 'top', descripcion: '', color: '' });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareConsultaId, setShareConsultaId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [shareMessage, setShareMessage] = useState('');
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

  const handleDeleteHistorial = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este outfit de tu historial?')) return;
    try {
      await axios.delete(`${API_URL}/api/historial/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setHistorial(historial.filter(h => h.id !== id));
    } catch (error) {
      alert("Error al borrar el historial");
    }
  };

  const toggleFavorite = async (id, isFav) => {
    try {
      // FIX: Using API_URL env variable
      await axios.put(`${API_URL}/api/historial/${id}/favorito`, { isFavorite: !isFav }, { headers: { Authorization: `Bearer ${token}` } });
      setHistorial(historial.map(h => h.id === id ? { ...h, isFavorite: !isFav } : h));
    } catch (err) {
      console.error("Error toggleando favorito", err);
    }
  };

  const openShareModal = async (id) => {
    setShareConsultaId(id);
    setShareModalOpen(true);
    setShareMessage('');
    try {
      const res = await axios.get(`${API_URL}/api/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(res.data.friends);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (friendId) => {
    try {
      await axios.post(`${API_URL}/api/friends/${friendId}/share`, { consultaId: shareConsultaId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShareMessage('¡Outfit compartido!');
      setTimeout(() => setShareModalOpen(false), 2000);
    } catch (err) {
      setShareMessage('Error al compartir');
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
        activeTab === 'armario' ? (
          <div>
            <div className={`flex flex-col sm:flex-row gap-3 mb-8 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className={`h-10 w-full sm:w-48 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <div className={`h-10 flex-1 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <div className={`h-10 w-full sm:w-32 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <div className={`h-10 w-full sm:w-24 rounded animate-pulse ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`p-4 rounded-lg flex justify-between items-start border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="w-full">
                    <div className={`h-5 w-16 rounded mb-3 animate-pulse ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}></div>
                    <div className={`h-4 w-3/4 rounded mb-2 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-3 w-1/2 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`h-4 w-48 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className="flex gap-2">
                    <div className={`h-8 w-8 rounded-full animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-8 w-8 rounded-full animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
                <div className={`h-4 w-full rounded mb-2 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-4 w-5/6 rounded mb-6 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className="flex flex-wrap gap-2">
                  <div className={`h-6 w-24 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className={`h-6 w-32 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className={`h-6 w-20 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                </div>
              </div>
            ))}
          </div>
        )
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
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openShareModal(h.id)}
                        className={`p-2 rounded-full transition-colors text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}
                        title="Compartir con un amigo"
                      >
                        <Share2 size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteHistorial(h.id)}
                        className={`p-2 rounded-full transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
                        title="Eliminar del historial"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button 
                        onClick={() => toggleFavorite(h.id, h.isFavorite)}
                        className={`p-2 rounded-full transition-colors ${h.isFavorite ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        title="Marcar como favorito"
                      >
                        <Heart size={20} fill={h.isFavorite ? "currentColor" : "none"} />
                      </button>
                    </div>
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

      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 ${darkMode ? 'bg-gray-900 text-white border border-gray-800' : 'bg-white text-gray-900 shadow-2xl'}`}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Share2 size={24} className="text-indigo-500" /> Compartir Outfit</h3>
            
            {shareMessage ? (
              <div className="py-8 text-center text-green-500 font-bold">{shareMessage}</div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {friends.length === 0 ? (
                  <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No tienes amigos para compartir. ¡Añade amigos en la Comunidad!</p>
                ) : (
                  friends.map(f => (
                    <button key={f.friendshipId} onClick={() => handleShare(f.id)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${darkMode ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          {f.profilePicture ? <img src={f.profilePicture} className="w-full h-full object-cover" /> : <Users size={16} />}
                        </div>
                        <span className="font-bold">{f.name || 'Usuario'}</span>
                      </div>
                      <Send size={16} className="text-indigo-500" />
                    </button>
                  ))
                )}
              </div>
            )}
            
            <button onClick={() => setShareModalOpen(false)} className={`mt-6 w-full py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ArmarioHistorial;
