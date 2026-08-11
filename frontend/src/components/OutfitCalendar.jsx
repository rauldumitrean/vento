import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CloudRain, Sun, Cloud, Snowflake, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function OutfitCalendar({ token, darkMode }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null); // the outfit data for the clicked day

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/historial`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0 is Monday
  };

  const getDayIcon = (weatherJson) => {
    if (!weatherJson) return <Cloud size={16} />;
    let w = null;
    try { w = JSON.parse(weatherJson); } catch(e) {}
    if (!w) return <Cloud size={16} />;
    
    // Simple logic for weather icon based on string or temp
    const temp = w.temperature_2m || 15;
    if (w.precipitation > 0) return <CloudRain size={16} className="text-blue-400" />;
    if (temp < 10) return <Snowflake size={16} className="text-blue-200" />;
    if (temp > 25) return <Sun size={16} className="text-yellow-400" />;
    return <Cloud size={16} className="text-gray-400" />;
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty slots before 1st of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 md:p-4 opacity-50"></div>);
    }
    
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      // Find outfit for this day (first one if multiple)
      const outfitOfTheDay = history.find(h => {
        const hDate = new Date(h.createdAt);
        return hDate.getFullYear() === year && hDate.getMonth() === month && hDate.getDate() === i;
      });

      const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();
      
      days.push(
        <div 
          key={i} 
          onClick={() => outfitOfTheDay && setSelectedDay(outfitOfTheDay)}
          className={`relative p-2 md:p-3 min-h-[80px] rounded-2xl border transition-all ${outfitOfTheDay ? 'cursor-pointer hover:scale-105 shadow-sm' : ''} ${
            isToday 
              ? (darkMode ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200')
              : (darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100')
          }`}
        >
          <span className={`text-xs font-bold ${isToday ? 'text-indigo-500' : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
            {i}
          </span>
          
          {outfitOfTheDay && (
            <div className="absolute bottom-2 left-2 right-2 flex flex-col items-center gap-1">
              {getDayIcon(outfitOfTheDay.clima_json)}
              <div className={`w-full h-1.5 rounded-full ${darkMode ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-indigo-400 to-purple-400'}`}></div>
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className={`w-full max-w-5xl mx-auto ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className={`p-6 md:p-8 rounded-[2rem] border shadow-2xl ${darkMode ? 'bg-black/40 border-white/10 backdrop-blur-xl' : 'bg-white border-gray-200'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <CalendarIcon className="text-indigo-500" />
            Historial Mensual
          </h2>
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
              <ChevronLeft />
            </button>
            <span className="text-lg font-bold w-32 text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
              <ChevronRight />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className={`text-center text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {loading ? (
            <div className="col-span-7 flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : renderCalendarDays()}
        </div>
      </div>

      {/* Modal for Day Details */}
      {selectedDay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg rounded-[2rem] border overflow-hidden relative shadow-2xl ${darkMode ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'}`}
          >
            <button onClick={() => setSelectedDay(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10">
              <X size={20} />
            </button>
            
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1 block">
                  {new Date(selectedDay.createdAt).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <h3 className="text-2xl font-black">{selectedDay.ubicacion}</h3>
              </div>
              
              <div className={`p-4 rounded-2xl mb-6 ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                {(() => {
                  try {
                    const rec = JSON.parse(selectedDay.recomendacion_json);
                    return (
                      <div>
                        <p className={`italic mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>"{rec.resumen}"</p>
                        <div className="flex flex-wrap gap-2">
                          {(rec.prendas || []).map((p, idx) => (
                            <span key={idx} className={`text-xs px-2 py-1 rounded-lg border ${darkMode ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
                              {p.descripcion}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  } catch(e) {
                    return <p>Detalles no disponibles</p>;
                  }
                })()}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
