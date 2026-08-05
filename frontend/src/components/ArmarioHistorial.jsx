import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
// FIX: Removed unused imports: Check, Shirt
import { Trash2, Heart, Clock, Plus, MapPin, Send, Users, Share2, Camera, Loader2, Tag, Palette } from 'lucide-react';

// FIX: Use env variable instead of hardcoded localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ArmarioHistorial = ({ token, darkMode }) => {
  const [activeTab, setActiveTab] = useState('armario');
  const [historialFilter, setHistorialFilter] = useState('mis_generaciones');
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

  const handlePhotoUpload = async (prendaId, file) => {
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageBase64 = reader.result;
        setArmario(armario.map(p => p.id === prendaId ? { ...p, uploading: true } : p));
        try {
          const res = await axios.post(`${API_URL}/api/armario/upload-prenda-photo`, {
            prendaId,
            imageBase64
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          setArmario(armario.map(p => p.id === prendaId ? { ...p, imageUrl: res.data.imageUrl, uploading: false } : p));
        } catch (err) {
          console.error(err);
          alert('Error al subir la imagen');
          setArmario(armario.map(p => p.id === prendaId ? { ...p, uploading: false } : p));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
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
      <div className="flex bg-black/10 dark:bg-black/20 backdrop-blur-md p-1.5 rounded-2xl mb-8 max-w-sm mx-auto border border-white/5">
        <button 
          onClick={() => setActiveTab('armario')}
          className={`flex-1 py-2.5 px-4 text-center text-sm font-bold rounded-xl transition-all ${activeTab === 'armario' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-400'}`}
        >
          Mi Armario Virtual
        </button>
        <button 
          onClick={() => setActiveTab('historial')}
          className={`flex-1 py-2.5 px-4 text-center text-sm font-bold rounded-xl transition-all ${activeTab === 'historial' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-400'}`}
        >
          Historial de Outfits
        </button>
      </div>

      {loading ? (
        activeTab === 'armario' ? (
          <div>
            <div className={`flex flex-col sm:flex-row gap-3 mb-8 p-4 rounded-lg border ${'bg-black/20 border-white/10 backdrop-blur-xl'}`}>
              <div className={`h-10 w-full sm:w-48 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
              <div className={`h-10 flex-1 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
              <div className={`h-10 w-full sm:w-32 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
              <div className={`h-10 w-full sm:w-24 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-indigo-100'}`}></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`p-4 rounded-lg flex justify-between items-start border ${'bg-black/20 border-white/10 backdrop-blur-xl'}`}>
                  <div className="w-full">
                    <div className={`h-5 w-16 rounded mb-3 animate-pulse ${darkMode ? 'bg-white/10' : 'bg-indigo-50'}`}></div>
                    <div className={`h-4 w-3/4 rounded mb-2 animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                    <div className={`h-3 w-1/2 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`p-6 rounded-xl border ${'bg-black/20 border-white/10 backdrop-blur-xl'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`h-4 w-48 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                  <div className="flex gap-2">
                    <div className={`h-8 w-8 rounded-full animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                    <div className={`h-8 w-8 rounded-full animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
                <div className={`h-4 w-full rounded mb-2 animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                <div className={`h-4 w-5/6 rounded mb-6 animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                <div className="flex flex-wrap gap-2">
                  <div className={`h-6 w-24 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                  <div className={`h-6 w-32 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                  <div className={`h-6 w-20 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'armario' ? (
        <div>
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-200 text-sm flex items-start gap-3">
            <Camera size={20} className="shrink-0 text-indigo-400" />
            <div>
              <p className="font-bold mb-0.5 text-indigo-300">¡NUEVO! Fotos de tu ropa real</p>
              <p>Puedes subir fotos a las prendas de tu armario haciendo clic en el recuadro gris con icono de cámara que aparece al lado de cada prenda guardada.</p>
            </div>
          </div>
          <form onSubmit={handleAddPrenda} className={`flex flex-col sm:flex-row gap-3 mb-8 p-5 rounded-2xl border shadow-xl ${'bg-white/5 border-white/10 backdrop-blur-xl'}`}>
            <div className="relative flex-1 sm:max-w-[200px]">
              <select 
                value={nuevaPrenda.categoria} 
                onChange={e => setNuevaPrenda({...nuevaPrenda, categoria: e.target.value})}
                className={`w-full p-3 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${'bg-black/40 border border-white/10 text-white'}`}
              >
                <option value="top">Parte superior (Top)</option>
                <option value="bottom">Parte inferior (Bottom)</option>
                <option value="abrigo">Abrigo / Chaqueta</option>
                <option value="calzado">Calzado</option>
                <option value="accesorio">Accesorio</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag size={16} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Ej: Camiseta básica blanca" 
                value={nuevaPrenda.descripcion}
                onChange={e => setNuevaPrenda({...nuevaPrenda, descripcion: e.target.value})}
                className={`w-full pl-10 p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${'bg-black/40 border-white/10 text-white placeholder-gray-500'}`}
                required
              />
            </div>
            
            <div className="relative w-full sm:w-32">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Palette size={16} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Color" 
                value={nuevaPrenda.color}
                onChange={e => setNuevaPrenda({...nuevaPrenda, color: e.target.value})}
                className={`w-full pl-10 p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${'bg-black/40 border-white/10 text-white placeholder-gray-500'}`}
              />
            </div>
            
            <button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-3 rounded-xl px-6 font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 w-full sm:w-auto shadow-lg shadow-indigo-500/25">
              <Plus size={18} /> Añadir
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {armario.length === 0 ? (
               <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                   <Tag size={32} className="text-gray-500" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">Tu armario está vacío</h3>
                 <p className="text-gray-400 max-w-md">Añade algunas prendas arriba para que la IA las utilice en sus recomendaciones de equipaje.</p>
               </div>
            ) : (
              armario.map(prenda => (
                <motion.div key={prenda.id} whileHover={{ y: -4 }} className={`p-4 rounded-2xl flex flex-col justify-between border shadow-lg transition-all ${'bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 hover:shadow-xl'}`}>
                  <div className="flex justify-between items-start w-full">
                    <div className="flex gap-4">
                      {prenda.imageUrl ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md relative group">
                          <img src={prenda.imageUrl} alt={prenda.descripcion} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                            <Camera size={18} className="text-white" />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(prenda.id, e.target.files[0])} />
                          </label>
                        </div>
                      ) : (
                        <label className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0 border-2 border-dashed cursor-pointer transition-all ${'border-gray-600 bg-gray-800/40 hover:bg-gray-700/60 hover:border-indigo-400 text-gray-400'}`}>
                          {prenda.uploading ? (
                            <Loader2 size={16} className="animate-spin text-indigo-400" />
                          ) : (
                            <>
                              <Camera size={18} className="mb-1 text-gray-500" />
                              <span className="text-[10px] font-bold text-center leading-tight">Foto</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handlePhotoUpload(prenda.id, e.target.files[0])}
                              />
                            </>
                          )}
                        </label>
                      )}
                      
                      <div className="flex-1 mt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">{prenda.categoria}</span>
                        <h3 className="font-semibold mt-2 text-white leading-tight">{prenda.descripcion}</h3>
                        {prenda.color && <p className="text-xs font-medium text-gray-400 mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span>{prenda.color}</p>}
                      </div>
                    </div>
                    
                    <button onClick={() => handleDeletePrenda(prenda.id)} className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors p-2 rounded-full shrink-0 ml-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex bg-black/10 dark:bg-black/20 backdrop-blur-md p-1.5 rounded-2xl mb-6 max-w-sm border border-white/5">
            <button
              onClick={() => setHistorialFilter('mis_generaciones')}
              className={`flex-1 py-2 px-4 text-center text-sm font-bold rounded-xl transition-all ${historialFilter === 'mis_generaciones' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-400'}`}
            >
              Mis Generaciones
            </button>
            <button
              onClick={() => setHistorialFilter('compartidos')}
              className={`flex-1 py-2 px-4 text-center text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${historialFilter === 'compartidos' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-400'}`}
            >
              <Users size={16} /> Amigos
            </button>
          </div>

          {(() => {
            const displayHistorial = historial.filter(h => historialFilter === 'compartidos' ? h.isShared : !h.isShared);

            if (displayHistorial.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Clock size={32} className="text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No hay historial</h3>
                  <p className="text-gray-400 max-w-md">
                    {historialFilter === 'compartidos' 
                      ? 'No tienes outfits guardados de tus amigos todavía. ¡Invítalos a compartir!' 
                      : 'Cuando uses el Asistente de Maleta o guardes un outfit, aparecerá aquí.'}
                  </p>
                </div>
              );
            }

            return displayHistorial.map(h => {
              // FIX: JSON.parse wrapped in try/catch to avoid crashes on malformed data
              let clima = {};
              let outfit = { resumen: '', prendas: [] };
              try { clima = JSON.parse(h.clima_json); } catch (e) { console.error('Error parsing clima_json', e); }
              try { outfit = JSON.parse(h.recomendacion_json); } catch (e) { console.error('Error parsing recomendacion_json', e); }

              return (
                <div key={h.id} className={`p-6 rounded-xl border ${'bg-white/5 border-white/10 backdrop-blur-xl shadow-lg'}`}>
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
                        className={`p-2 rounded-full transition-colors ${h.isFavorite ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                        title="Marcar como favorito"
                      >
                        <Heart size={20} fill={h.isFavorite ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                  {outfit.resumen && <p className={`font-medium mb-4 italic ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>"{outfit.resumen}"</p>}
                  <div className="flex flex-wrap gap-2">
                    {(outfit.prendas || []).map((p, i) => (
                      <span key={i} className={`text-xs px-2 py-1 rounded border ${darkMode ? 'bg-white/10 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'}`}>
                        {p.descripcion}
                      </span>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
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
            
            <button onClick={() => setShareModalOpen(false)} className={`mt-6 w-full py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-gray-800 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ArmarioHistorial;
