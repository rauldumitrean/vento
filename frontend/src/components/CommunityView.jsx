import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Heart, MapPin, Loader2, RefreshCw, Share2, ChevronLeft, ChevronRight, User as UserIcon, Sparkles, Shirt, Layers, Footprints, CloudSnow, Crown, Trash2, X } from 'lucide-react';
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
              onClick={() => fetchFeed(page)}
              disabled={loading}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              title="Actualizar"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
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
    </div>
  );
}
