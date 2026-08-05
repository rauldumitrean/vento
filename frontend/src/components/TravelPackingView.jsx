import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Luggage, MapPin, Calendar, CheckCircle, ChevronDown, ChevronUp, Sparkles, Lock, Cloud, Sun, CloudRain, Loader2, Package, X } from 'lucide-react';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const weatherCodeLabel = (code) => {
  if (code === 0) return 'Despejado ☀️';
  if (code <= 3) return 'Nuboso ⛅';
  if (code <= 48) return 'Niebla 🌫️';
  if (code <= 67) return 'Lluvia 🌧️';
  if (code <= 77) return 'Nieve 🌨️';
  if (code <= 82) return 'Chubascos 🌦️';
  return 'Tormenta ⛈️';
};

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

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 15);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      setError(err.response?.data?.error || 'Error generando la lista de maleta.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (key) => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  const totalItems = result?.packingList?.maleta?.length || 0;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
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
            <span className="ml-auto px-3 py-1 text-xs font-bold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-full text-purple-300">
              ✨ Premium
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
          <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:scale-105 transition-transform">
            ✨ Desbloquear Premium
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin size={14} className="inline mr-1.5 text-amber-400" />
                  Destino
                </label>
                <input
                  type="text"
                  placeholder="Ej: París, Japón, Maldivas..."
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar size={14} className="inline mr-1.5 text-amber-400" />
                    Salida
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={today}
                    max={maxDateStr}
                    onChange={e => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar size={14} className="inline mr-1.5 text-amber-400" />
                    Vuelta
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || today}
                    max={maxDateStr}
                    onChange={e => setEndDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all [color-scheme:dark]"
                  />
                </div>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center py-16 bg-white/5 border border-white/10 rounded-3xl">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full mb-4" />
                <p className="text-white font-medium">Consultando el clima de tu destino...</p>
                <p className="text-gray-400 text-sm mt-1">La IA está preparando tu maleta perfecta ✨</p>
              </motion.div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-3xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">{result.destination}, {result.country}</h2>
                      <p className="text-amber-300 text-sm">{result.totalDays} días · {result.avgMin}°C–{result.avgMax}°C · {result.hasRain ? '🌧️ Posible lluvia' : '☀️ Sin lluvia prevista'}</p>
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
                        <span className="text-2xl">{item.emoji}</span>
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
      )}
    </div>
  );
}
