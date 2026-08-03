import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Trash2, MapPin, Cloud, Sun, CloudRain, CloudSnow,
  CloudLightning, Wind, Thermometer, Plus, RefreshCw, Loader2
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getWeatherIcon = (code) => {
  if (!code) return { icon: Cloud, color: "text-gray-400", bg: "from-gray-500/20 to-gray-600/10" };
  if (code >= 200 && code < 300) return { icon: CloudLightning, color: "text-yellow-300", bg: "from-yellow-500/20 to-yellow-600/10" };
  if (code >= 300 && code < 600) return { icon: CloudRain, color: "text-blue-300", bg: "from-blue-500/20 to-blue-600/10" };
  if (code >= 600 && code < 700) return { icon: CloudSnow, color: "text-cyan-300", bg: "from-cyan-500/20 to-cyan-600/10" };
  if (code >= 700 && code < 800) return { icon: Wind, color: "text-gray-300", bg: "from-gray-500/15 to-gray-600/10" };
  if (code === 800) return { icon: Sun, color: "text-yellow-400", bg: "from-yellow-500/20 to-orange-500/10" };
  return { icon: Cloud, color: "text-indigo-300", bg: "from-indigo-500/20 to-indigo-600/10" };
};

const FavCityCard = ({ fav, onSelect, onDelete }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetchW = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/weather-mini?city=${encodeURIComponent(fav.cityName)}${fav.lat ? "&lat=" + fav.lat + "&lon=" + fav.lon : ""}`
        );
        if (!cancelled && res.data) setWeather(res.data);
      } catch {
        // Fallback silently
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchW();
    return () => { cancelled = true; };
  }, [fav.id, fav.cityName, fav.lat, fav.lon]);

  const { icon: WeatherIcon, color, bg } = weather
    ? getWeatherIcon(weather.code)
    : { icon: Cloud, color: "text-gray-500", bg: "from-gray-600/10 to-gray-700/5" };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className="relative group"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(fav.id); }}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <Trash2 size={14} />
      </button>

      <button
        onClick={() => onSelect(fav.cityName, fav.lat, fav.lon)}
        className={`w-full text-left p-5 rounded-3xl border border-white/10 bg-gradient-to-br ${bg} bg-white/[0.04] backdrop-blur-md shadow-xl hover:border-white/25 hover:bg-white/10 transition-all duration-300 group-hover:scale-[1.02] active:scale-[0.98]`}
      >
        <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
          <MapPin size={12} />
          <span className="truncate font-medium">{fav.cityName}</span>
          {loading && <Loader2 size={12} className="text-gray-600 animate-spin ml-auto shrink-0" />}
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-10 w-24 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-3 w-20 rounded-full bg-white/5 animate-pulse" />
          </div>
        ) : weather ? (
          <>
            <div className="flex items-end gap-3 mb-1">
              <WeatherIcon size={34} className={`${color} shrink-0 drop-shadow-lg`} />
              <span className="text-4xl font-black text-white leading-none">{weather.temp}°</span>
            </div>
            <p className="text-gray-400 text-xs capitalize mb-3">{weather.desc}</p>
            <div className="flex gap-3 text-[10px] text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><Thermometer size={10} />{weather.feels}° sensación</span>
              <span className="flex items-center gap-1"><Wind size={10} />{weather.wind} km/h</span>
            </div>
          </>
        ) : (
          <p className="text-gray-600 text-xs italic mt-2">Sin datos disponibles</p>
        )}

        <div className="mt-4 text-[10px] text-indigo-400/70 font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
          Ver outfit →
        </div>
      </button>
    </motion.div>
  );
};

export default function FavoriteCitiesView({ token, onSelectCity }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(res.data.favorites || []);
    } catch {
      setError("No se pudieron cargar las ciudades favoritas.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const handleDelete = async (id) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
    try {
      await axios.delete(`${API_URL}/api/favorites/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      fetchFavorites();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-400/20 flex items-center justify-center shrink-0">
              <Star size={20} className="text-yellow-400" fill="currentColor" />
            </span>
            Ciudades Favoritas
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-[52px]">
            {favorites.length > 0
              ? `${favorites.length} ciudad${favorites.length !== 1 ? "es" : ""} guardada${favorites.length !== 1 ? "s" : ""} · Pulsa una para ver el outfit`
              : "Guarda ciudades con el botón ⭐ al buscar el clima"}
          </p>
        </div>
        <button
          onClick={fetchFavorites}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-5 rounded-3xl border border-white/10 bg-white/5 animate-pulse">
              <div className="h-3 w-20 rounded-full bg-white/10 mb-4" />
              <div className="h-10 w-24 rounded-xl bg-white/10 mb-2" />
              <div className="h-3 w-16 rounded-full bg-white/5" />
            </div>
          ))}
        </div>
      )}

      {!loading && favorites.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-400/10 to-orange-500/10 border border-yellow-400/10 flex items-center justify-center mb-6">
            <Star size={40} className="text-yellow-400/40" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Sin ciudades favoritas</h3>
          <p className="text-gray-500 text-sm max-w-xs mb-8">
            Busca una ciudad en el dashboard y pulsa el icono ⭐ para guardarla aquí.
          </p>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm">
            <Plus size={16} />
            <span>Las ciudades guardadas aparecerán aquí</span>
          </div>
        </motion.div>
      )}

      {!loading && favorites.length > 0 && (
        <AnimatePresence mode="popLayout">
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(fav => (
              <FavCityCard
                key={fav.id}
                fav={fav}
                onSelect={onSelectCity}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
