import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Luggage, MapPin, Calendar, CheckCircle, ChevronDown, ChevronUp, Sparkles, Lock, Cloud, Sun, CloudRain, Loader2, Package, X, Shirt, Footprints, Glasses, Umbrella, CloudSnow, Layers, Briefcase, Archive } from 'lucide-react';
import Cookies from 'js-cookie';
import CalendarPicker from './CalendarPicker';
import Skeleton from './ui/Skeleton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';



export default function TravelPackingView({ token }) {
  const isPremium = Cookies.get('isPremium') === 'true';
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activities, setActivities] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checkedItems, setCheckedItems] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viajesGuardados, setViajesGuardados] = useState([]);
  const [activeViajeId, setActiveViajeId] = useState(null);
  const [isSavingViaje, setIsSavingViaje] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    
    // Fetch Viajes Guardados
    const fetchViajes = async () => {
      if (!isPremium) return;
      try {
        const res = await axios.get(`${API_URL}/api/viajes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) setViajesGuardados(res.data);
      } catch (err) {
        console.error("Error fetching saved trips:", err);
      }
    };
    
    fetchViajes();

    const fetchSuggestions = async () => {
      const loc = destination.trim();
      if (loc.length < 2) {
        if (isMounted) setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/autocomplete?q=${encodeURIComponent(loc)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (isMounted) {
          if (res.data.results && res.data.results.length > 0) {
            setSuggestions(res.data.results);
          } else {
            setSuggestions([{ name: 'No se encontraron resultados' }]);
          }
        }
      } catch (e) {
        if (isMounted) setSuggestions([{ name: 'Demasiadas búsquedas. Usa Enter.' }]);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [destination, token]);

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 15);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const [recentTrips, setRecentTrips] = useState(() => {
    try {
      const saved = localStorage.getItem('vento_recent_trips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!destination || !startDate || !endDate) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/travel-packing`, {
        destination, startDate, endDate, activities
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
      setCheckedItems({});
      
      // Save to recent trips
      const newTrip = { destination, startDate, endDate, activities };
      setRecentTrips(prev => {
        const filtered = prev.filter(t => t.destination !== destination);
        const updated = [newTrip, ...filtered].slice(0, 5);
        localStorage.setItem('vento_recent_trips', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Error generando la lista de maleta.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveViaje = async () => {
    if (!result?.packingList) return;
    setIsSavingViaje(true);
    try {
      const res = await axios.post(`${API_URL}/api/viajes`, {
        destination, startDate, endDate,
        packingListJson: result.packingList,
        checkedItemsJson: checkedItems
      }, { headers: { Authorization: `Bearer ${token}` } });
      setActiveViajeId(res.data.id);
      setViajesGuardados([res.data, ...viajesGuardados]);
    } catch (err) {
      console.error("Error guardando el viaje:", err);
    } finally {
      setIsSavingViaje(false);
    }
  };

  const toggleCheck = async (key) => {
    const newChecked = { ...checkedItems, [key]: !checkedItems[key] };
    setCheckedItems(newChecked);
    
    // Sync if it's a saved trip
    if (activeViajeId) {
      try {
        await axios.put(`${API_URL}/api/viajes/${activeViajeId}`, {
          checkedItemsJson: newChecked
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch(e) {
        console.error("Error syncing checked items", e);
      }
    }
  };
  const totalItems = result?.packingList?.maleta?.length || 0;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-28 lg:pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Luggage size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Asistente de Maleta</h1>
            <p className="text-gray-400 text-sm">La IA crea tu lista perfecta según el clima exacto de tu viaje</p>
          </div>
          {isPremium && (
            <span className="ml-auto px-3 py-1 text-xs font-bold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-full text-purple-300 flex items-center gap-1">
              <Sparkles size={12} /> Premium
            </span>
          )}
        </div>
      </motion.div>

      {!isPremium ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
            <Lock size={32} className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Función Premium</h2>
          <p className="text-gray-400 max-w-md mb-8 leading-relaxed">El Asistente de Maleta analiza el pronóstico real de tu destino para generar una lista de equipaje perfectamente optimizada. Activa Premium para usarlo.</p>
          <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:scale-105 transition-transform flex items-center justify-center gap-2">
            <Sparkles size={18} /> Desbloquear Premium
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          {viajesGuardados.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
              <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                <Cloud size={14} /> Mis Maletas Guardadas
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {viajesGuardados.map((viaje) => (
                  <button
                    key={viaje.id}
                    onClick={() => {
                      setDestination(viaje.destination);
                      setStartDate(viaje.startDate);
                      setEndDate(viaje.endDate);
                      setResult({ packingList: viaje.packingListJson });
                      setCheckedItems(viaje.checkedItemsJson);
                      setActiveViajeId(viaje.id);
                    }}
                    className={`flex-shrink-0 px-4 py-3 border rounded-xl text-sm transition-colors flex flex-col items-start gap-1 ${activeViajeId === viaje.id ? 'bg-emerald-500/20 border-emerald-500/50 text-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'}`}
                  >
                    <span className="font-bold text-white flex items-center gap-2"><MapPin size={12}/> {viaje.destination.split(',')[0]}</span>
                    <span className="text-xs opacity-70 flex items-center gap-1"><Calendar size={10}/> {new Date(viaje.startDate).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {recentTrips.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <MapPin size={14} /> Viajes Recientes
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {recentTrips.map((trip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDestination(trip.destination);
                      setStartDate(trip.startDate);
                      setEndDate(trip.endDate);
                      if (trip.activities) setActivities(trip.activities);
                    }}
                    className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-gray-300 transition-colors flex items-center gap-2"
                  >
                    <span className="font-medium text-white">{trip.destination.split(',')[0]}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-5">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin size={14} className="inline mr-1.5 text-amber-400" />
                  Destino
                </label>
                <input
                  type="text"
                  placeholder="Ej: París, Japón, Maldivas..."
                  value={destination}
                  onChange={e => {
                    setDestination(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all"
                />
                
                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {showSuggestions && destination.length >= 2 && suggestions.length > 0 && (
                    <motion.ul 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-2 bg-[#1a1c23] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto"
                    >
                      {suggestions.map((sugg, i) => (
                        <li 
                          key={i}
                          onClick={() => {
                            if (sugg.country) {
                              setDestination(`${sugg.name}, ${sugg.country}`);
                            } else {
                              setDestination(sugg.name);
                            }
                            setShowSuggestions(false);
                          }}
                          className="px-4 py-3 hover:bg-white/5 cursor-pointer flex flex-col border-b border-white/5 last:border-0 transition-colors"
                        >
                          <span className="text-white font-medium">{sugg.name}</span>
                          {sugg.country && (
                            <span className="text-xs text-gray-400">
                              {sugg.admin1 ? `${sugg.admin1}, ` : ''}{sugg.country}
                            </span>
                          )}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CalendarPicker
                  label="Salida"
                  placeholder="DD/MM/YYYY"
                  value={startDate}
                  minDate={today}
                  maxDate={maxDateStr}
                  onChange={(date) => setStartDate(date)}
                />
                <CalendarPicker
                  label="Vuelta"
                  placeholder="DD/MM/YYYY"
                  value={endDate}
                  minDate={startDate || today}
                  maxDate={maxDateStr}
                  onChange={(date) => setEndDate(date)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Actividades (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: playa, senderismo, cenas elegantes..."
                  value={activities}
                  onChange={e => setActivities(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                />
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !destination || !startDate || !endDate}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Generando tu maleta...</>
                ) : (
                  <><Sparkles size={18} /> Generar Lista de Maleta</>
                )}
              </button>
            </form>
          </motion.div>

          {/* Result Panel */}
          <div className="space-y-4">
            {!result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center py-12 bg-white/5 border border-white/10 rounded-3xl">
                <Luggage size={48} className="text-gray-600 mb-4" />
                <p className="text-gray-500">Tu lista de maleta aparecerá aquí</p>
                <p className="text-gray-600 text-sm mt-1">Rellena el formulario y la IA generará tu equipaje perfecto</p>
              </motion.div>
            )}

            {loading && (
              <div className="h-full space-y-5 bg-white/5 border border-white/10 rounded-3xl p-6">
                <Skeleton className="h-24 w-full" rounded="rounded-2xl" variant="dark" />
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" rounded="rounded-xl" variant="dark" />
                  <Skeleton className="h-10 w-3/4" rounded="rounded-xl" variant="dark" />
                  <Skeleton className="h-10 w-5/6" rounded="rounded-xl" variant="dark" />
                </div>
              </div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-3xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">{result.destination}, {result.country}</h2>
                      <p className="text-amber-300 text-sm flex items-center gap-1 mt-1">
                        {result.totalDays} días · {result.avgMin}°C–{result.avgMax}°C · 
                        {result.hasRain ? (
                          <><CloudRain size={14} className="text-amber-400" /> Posible lluvia</>
                        ) : (
                          <><Sun size={14} className="text-amber-400" /> Sin lluvia prevista</>
                        )}
                      </p>
                    </div>
                    <Package size={24} className="text-amber-400 shrink-0 mt-1" />
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{result.packingList?.resumen}</p>
                </div>

                {/* Progress */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">Progreso del packing</span>
                    <span className="text-sm font-bold text-amber-400">{checkedCount}/{totalItems}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
                      className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600"
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Packing Items */}
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Lista de Ropa</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {result.packingList?.maleta?.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => toggleCheck(`item-${i}`)}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${checkedItems[`item-${i}`] ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                          {checkedItems[`item-${i}`] && <CheckCircle size={12} className="text-white" />}
                        </div>
                        {(() => {
                          const getCategoryIcon = (categoria) => {
                            const cat = categoria.toLowerCase();
                            if (cat.includes('camiseta') || cat.includes('top') || cat.includes('camisa')) return <Shirt size={24} className="text-amber-400" />;
                            if (cat.includes('pantalon') || cat.includes('jeans') || cat.includes('short') || cat.includes('bermuda')) return <Layers size={24} className="text-amber-400" />;
                            if (cat.includes('zapato') || cat.includes('calzado') || cat.includes('zapatilla') || cat.includes('sneaker')) return <Footprints size={24} className="text-amber-400" />;
                            if (cat.includes('abrigo') || cat.includes('chaqueta') || cat.includes('sudadera') || cat.includes('jersey')) return <CloudSnow size={24} className="text-amber-400" />;
                            if (cat.includes('accesorio') || cat.includes('gafas') || cat.includes('sombrero') || cat.includes('gorra')) return <Glasses size={24} className="text-amber-400" />;
                            if (cat.includes('lluvia') || cat.includes('paraguas') || cat.includes('impermeable')) return <Umbrella size={24} className="text-amber-400" />;
                            if (cat.includes('interior') || cat.includes('calcetin') || cat.includes('ropa interior')) return <Archive size={24} className="text-amber-400" />;
                            if (cat.includes('baño') || cat.includes('bikini') || cat.includes('bañador') || cat.includes('playa')) return <Sun size={24} className="text-amber-400" />;
                            if (cat.includes('neceser') || cat.includes('aseo')) return <Briefcase size={24} className="text-amber-400" />;
                            return <Package size={24} className="text-amber-400" />;
                          };
                          return (
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                              {getCategoryIcon(item.categoria)}
                            </div>
                          );
                        })()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium text-sm ${checkedItems[`item-${i}`] ? 'text-gray-500 line-through' : 'text-white'}`}>{item.categoria}</span>
                            {item.esencial && <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/20 font-bold">ESENCIAL</span>}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{item.tipo}</p>
                        </div>
                        <div className="shrink-0">
                          <span className="text-sm font-bold text-amber-400">×{item.cantidad}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Accessories */}
                {result.packingList?.accesorios?.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">Otros Esenciales</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.packingList.accesorios.map((acc, i) => (
                        <motion.button key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                          onClick={() => toggleCheck(`acc-${i}`)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${checkedItems[`acc-${i}`] ? 'bg-green-500/20 border-green-500/30 text-green-400 line-through' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                        >
                          {checkedItems[`acc-${i}`] ? '✓ ' : ''}{acc}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Trip Button */}
                {!activeViajeId ? (
                  <button 
                    onClick={handleSaveViaje}
                    disabled={isSavingViaje}
                    className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSavingViaje ? <Loader2 size={20} className="animate-spin" /> : <Cloud size={20} />}
                    {isSavingViaje ? 'Guardando...' : 'Guardar Viaje en Nube'}
                  </button>
                ) : (
                  <div className="w-full mt-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-2xl font-medium flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Progreso sincronizado en la nube
                  </div>
                )}

                {/* Pro Tip */}
                {result.packingList?.consejo_maleta && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex gap-3">
                    <Sparkles size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-indigo-200 text-sm leading-relaxed">{result.packingList.consejo_maleta}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
