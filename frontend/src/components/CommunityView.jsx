import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Heart, MapPin, Loader2, RefreshCw, Share2, ChevronLeft, ChevronRight, User as UserIcon, Sparkles, Shirt, Layers, Footprints, CloudSnow, Crown, Trash2, X, Plus } from 'lucide-react';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora mismo';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
};

const categoriaIcon = { TOP: Shirt, BOTTOM: Layers, CALZADO: Footprints, ABRIGO: CloudSnow, ACCESORIO: Crown, CALCETINES: Layers };

function OutfitCard({ outfit, token, currentUserId, onDelete, onClickCard }) {
  const [liked, setLiked] = useState(outfit.likedByMe);
  const [likesCount, setLikesCount] = useState(outfit.likesCount);
  const [liking, setLiking] = useState(false);
  const rec = outfit.outfit;

  const handleLike = async (e) => {
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    try {
      const res = await axios.post(`${API_URL}/api/community/${outfit.id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta publicación de la comunidad?')) return;
    try {
      await axios.post(`${API_URL}/api/community/${outfit.id}/share`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onDelete) onDelete(outfit.id);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (!rec) return null;

  const firstPrenda = rec.prendas?.[0];
  const imageSrc = firstPrenda?.imageUrl || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClickCard && onClickCard(outfit)}
      className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.07] transition-all duration-300 shadow-xl shadow-black/20 flex flex-col cursor-pointer"
    >
      {/* Outfit thumbnail / gradient header */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-pink-900/20 flex items-center justify-center gap-4 p-4">
        {rec.prendas?.slice(0, 4).map((p, i) => {
          const Icon = categoriaIcon[p.categoria] || Shirt;
          return (
            <div key={i} className="text-white opacity-80" title={p.nombre_corto}>
              <Icon size={28} />
            </div>
          );
        })}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10">
          <MapPin size={11} className="text-gray-400" />
          <span className="text-xs text-gray-300 font-medium truncate max-w-[80px]">{outfit.ubicacion}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* User info */}
        <div className="flex items-center gap-2.5 mb-3">
          {outfit.user?.profilePicture ? (
            <img src={outfit.user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <UserIcon size={14} className="text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{outfit.user?.name || 'Usuario'}</p>
            <p className="text-xs text-gray-500">{timeAgo(outfit.createdAt)}</p>
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-3 flex-1">{rec.resumen}</p>

        {/* Prendas tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {rec.prendas?.slice(0, 3).map((p, i) => {
            const Icon = categoriaIcon[p.categoria] || Shirt;
            return (
              <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-400">
                <Icon size={10} /> {p.nombre_corto?.split('(')[0].trim().slice(0, 16)}
              </span>
            );
          })}
          {(rec.prendas?.length || 0) > 3 && (
            <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-500">+{rec.prendas.length - 3}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-2 w-fit px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              liked
                ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-red-400'
            }`}
          >
            <motion.div animate={liked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
            </motion.div>
            <span>{likesCount}</span>
          </button>
          
          {outfit.user?.id === currentUserId && (
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Eliminar publicación"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CommunityView({ token, consultaId, isCurrentOutfitPublic, onShareToggle }) {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState(isCurrentOutfitPublic);
  const currentUserId = parseInt(Cookies.get('userId'));
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [historyOutfits, setHistoryOutfits] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await axios.get(`${API_URL}/api/leaderboard`, { headers: { Authorization: `Bearer ${token}` } });
      setLeaderboard(res.data || []);
    } catch (e) {
      console.error('Leaderboard error:', e);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'ranking') fetchLeaderboard();
  }, [activeTab, fetchLeaderboard]);

  const handleDeletePost = (deletedId) => {
    setOutfits(prev => prev.filter(o => o.id !== deletedId));
  };

  const fetchFeed = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/community?page=${p}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOutfits(res.data.outfits);
      setPages(res.data.pages);
      setTotal(res.data.total);
      setPage(p);
    } catch (err) {
      console.error('Community feed error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchFeed(1); }, [fetchFeed]);

  const handleShare = async () => {
    if (!consultaId) return;
    setSharing(true);
    try {
      const res = await axios.post(`${API_URL}/api/community/${consultaId}/share`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShareStatus(res.data.isPublic);
      if (onShareToggle) onShareToggle(res.data.isPublic);
      if (res.data.isPublic) fetchFeed(1);
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setSharing(false);
    }
  };

  const openUploadModal = async () => {
    setShowUploadModal(true);
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_URL}/api/historial`, { headers: { Authorization: `Bearer ${token}` } });
      setHistoryOutfits(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleHistoryShare = async (id, currentPublicState) => {
    try {
      const res = await axios.post(`${API_URL}/api/community/${id}/share`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setHistoryOutfits(prev => prev.map(o => o.id === id ? { ...o, isPublic: res.data.isPublic } : o));
      fetchFeed(1);
    } catch(e) {}
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Globe size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Comunidad</h1>
              <p className="text-gray-400 text-sm">{total} outfits compartidos · Inspírate con los looks de la comunidad</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openUploadModal}
              className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20"
              title="Subir mi outfit a la comunidad"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => fetchFeed(1)}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refrescar
            </button>
            {consultaId && (
              <button
                onClick={handleShare}
                disabled={sharing}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${
                  shareStatus
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400'
                }`}
              >
                <Share2 size={14} />
                {sharing ? 'Guardando...' : shareStatus ? 'Compartido ✓' : 'Compartir mi outfit'}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-white/10 mb-6 px-2">
        <button 
          onClick={() => setActiveTab('feed')} 
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'feed' ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          Explorar Outfits
        </button>
        <button 
          onClick={() => setActiveTab('ranking')} 
          className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'ranking' ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <Crown size={16} /> Top Estilistas
        </button>
      </div>

      {activeTab === 'feed' ? (
        <>
          {/* Feed */}
      {loading && outfits.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-emerald-400" />
        </div>
      ) : outfits.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
          <Globe size={48} className="text-gray-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sé el primero</h2>
          <p className="text-gray-400 max-w-sm">Todavía no hay outfits compartidos. ¡Genera uno y compártelo con la comunidad!</p>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {outfits.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} token={token} currentUserId={currentUserId} onDelete={handleDeletePost} onClickCard={setSelectedOutfit} />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => fetchFeed(page - 1)}
                disabled={page === 1 || loading}
                className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-400 font-medium">Página {page} de {pages}</span>
              <button
                onClick={() => fetchFeed(page + 1)}
                disabled={page === pages || loading}
                className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
      </>
      ) : (
        /* LEADERBOARD VIEW */
        <div className="flex flex-col gap-3">
          {loadingLeaderboard ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-yellow-400" />
            </div>
          ) : (
            leaderboard.map((user, idx) => (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-2xl border ${
                  idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-900/20 border-yellow-500/30 shadow-lg shadow-yellow-900/20' : 
                  idx === 1 ? 'bg-gray-400/10 border-gray-400/20' :
                  idx === 2 ? 'bg-orange-600/10 border-orange-600/20' :
                  'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    idx === 0 ? 'bg-yellow-500 text-black' : 
                    idx === 1 ? 'bg-gray-300 text-black' :
                    idx === 2 ? 'bg-orange-400 text-black' :
                    'bg-black/40 text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 border border-white/10 shrink-0">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={20} className="text-gray-400 m-auto mt-3" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{user.name || 'Usuario'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${
                        user.level === 'Icono de Moda' ? 'bg-yellow-500/20 text-yellow-400' :
                        user.level === 'Creador de Tendencias' ? 'bg-purple-500/20 text-purple-400' :
                        user.level === 'Aficionado' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.level}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-white">{user.points}</span>
                  <span className="text-xs text-gray-400 font-medium">Puntos</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Modal Detalles */}
      <AnimatePresence>
        {selectedOutfit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOutfit(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#1a1c23] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1c23] z-10">
                <div className="flex items-center gap-3">
                  <Globe className="text-emerald-400" size={24} />
                  <h2 className="text-xl font-bold text-white">Detalle de la Publicación</h2>
                </div>
                <button onClick={() => setSelectedOutfit(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto hide-scrollbar flex-1">
                <div className="flex items-center gap-3 mb-6">
                  {selectedOutfit.user?.profilePicture ? (
                    <img src={selectedOutfit.user.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                      <UserIcon size={18} className="text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">{selectedOutfit.user?.name || 'Usuario'}</p>
                    <p className="text-sm text-gray-400">{timeAgo(selectedOutfit.createdAt)} en {selectedOutfit.ubicacion}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-6 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
                  {selectedOutfit.outfit.resumen}
                </p>

                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Prendas del Outfit</h3>
                <div className="flex flex-col gap-3">
                  {selectedOutfit.outfit.prendas?.map((p, i) => {
                    const Icon = categoriaIcon[p.categoria] || Shirt;
                    return (
                      <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                          {p.imageUrl ? (
                             <img src={p.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                             <Icon size={24} className="text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{p.nombre_corto}</p>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1">{p.descripcion}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal (Share from History) */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#1A1A24] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85vh] flex flex-col">
              <button onClick={() => setShowUploadModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Plus className="text-emerald-400" />
                Subir tu Outfit
              </h2>
              <p className="text-sm text-gray-400 mb-6">Elige un outfit de tu historial para compartirlo con la comunidad o hacerlo privado.</p>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {loadingHistory ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-400" /></div>
                ) : historyOutfits.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No tienes outfits en tu historial. ¡Genera uno primero!</p>
                ) : (
                  historyOutfits.map(o => {
                    const rec = typeof o.recomendacion_json === 'string' ? JSON.parse(o.recomendacion_json) : o.recomendacion_json;
                    return (
                      <div key={o.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-lg flex items-center justify-center">
                            <Shirt size={20} className="text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{o.ubicacion}</p>
                            <p className="text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleHistoryShare(o.id, o.isPublic)}
                          className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${o.isPublic ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
                        >
                          {o.isPublic ? 'Público' : 'Privado'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
