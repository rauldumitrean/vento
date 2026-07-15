import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Send, Heart, Camera, X } from 'lucide-react';
import AdModal from './AdModal';
import Navbar from './Navbar';
import ArmarioHistorial from './ArmarioHistorial';
import AdminView from './AdminView';

const PrendaCard = ({ prenda, darkMode, canLoad, onLoadComplete }) => {
  const [imgStatus, setImgStatus] = useState('waiting'); // 'waiting', 'loading', 'loaded', 'error'
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    if (canLoad && imgStatus === 'waiting') {
      setImgStatus('loading');
      // enhance=false salta el LLM intermedio y width=300 genera un renderizado un 40% más veloz
      setImgSrc(`https://image.pollinations.ai/prompt/${encodeURIComponent(prenda.categoria + " " + prenda.descripcion)}?width=300&height=300&nologo=true&enhance=false`);
    }
  }, [canLoad, imgStatus, prenda]);

  const handleSuccess = () => {
    if (imgStatus !== 'loaded') {
      setImgStatus('loaded');
      if (onLoadComplete) onLoadComplete();
    }
  };

  const handleError = () => {
    if (imgSrc && imgSrc.includes('pollinations')) {
      // Si falla la IA, usamos el placeholder
      const fallbackUrl = `https://placehold.co/400x400/${darkMode ? '1f2937/9ca3af' : 'f3f4f6/9ca3af'}?text=${encodeURIComponent(prenda.categoria.toUpperCase())}`;
      setImgSrc(fallbackUrl);
    } else {
      if (imgStatus !== 'error') {
        setImgStatus('error');
        if (onLoadComplete) onLoadComplete();
      }
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} className={`border overflow-hidden rounded-xl flex flex-col ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-neutral-100 bg-white'}`}>
      <div className={`w-full h-48 flex items-center justify-center overflow-hidden relative ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        
        {(imgStatus === 'waiting' || imgStatus === 'loading') && (
          <div className={`absolute inset-0 z-10 animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
        )}

        {imgSrc && (
          <img 
            src={imgSrc} 
            alt={prenda.descripcion} 
            className={`w-full h-full object-cover hover:scale-105 transition-all duration-700 ${imgStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`} 
            loading="lazy"
            onLoad={handleSuccess}
            onError={handleError}
          />
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 relative z-20 bg-inherit">
        <span className="text-xs uppercase tracking-widest text-indigo-500 mb-1">{prenda.categoria}</span>
        <span className="font-medium text-base leading-tight">{prenda.descripcion}</span>
        <span className="text-sm opacity-60 mt-2 mb-4 flex-1">{prenda.razon}</span>
        
        {(prenda.enlace_compra && prenda.tienda_recomendada) && (
          <a 
            href={prenda.enlace_compra} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            🛒 Ver en {prenda.tienda_recomendada}
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default function DashboardView({ token, defaultView = 'dashboard', onLogout }) {
  const [showAd, setShowAd] = useState(true);
  const [view, setView] = useState(defaultView); // 'dashboard' | 'armario' | 'admin'
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState(null);
  const [outfit, setOutfit] = useState(null);
  const [consultaId, setConsultaId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('adShown')) {
      setShowAd(false);
    }
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (location.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=5&language=es&format=json`);
        if (res.data.results) {
          setSuggestions(res.data.results);
        } else {
          setSuggestions([]);
        }
      } catch (e) {
        console.error("Error al obtener sugerencias");
      }
    };

    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300); // 300ms de debounce para no saturar la API

    return () => clearTimeout(timeoutId);
  }, [location]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Heartbeat: ping the server every 30s so the admin dashboard knows this user has the tab open
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const ping = () => axios.post(`${API_URL}/api/ping`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});

    ping(); // ping immediately on mount
    const interval = setInterval(ping, 30000); // then every 30 seconds
    return () => clearInterval(interval); // cleanup on unmount (tab closed / logout)
  }, [token]);

  const handleCloseAd = () => {
    setShowAd(false);
    sessionStorage.setItem('adShown', 'true');
  };

  const fetchWeatherAndOutfit = async (lat, lon, city) => {
    setLoading(true);
    setIsFavorite(false);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      let url = `${API_URL}/api/weather?`;
      if (lat && lon) url += `lat=${lat}&lon=${lon}`;
      else url += `city=${city}`;

      const wRes = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setWeather(wRes.data);

      const oRes = await axios.post(`${API_URL}/api/recomendacion`, {
        lat: wRes.data.lat,
        lon: wRes.data.lon,
        ubicacion: wRes.data.location,
        clima: wRes.data.current
      }, { headers: { Authorization: `Bearer ${token}` } });

      setOutfit(oRes.data.recomendacion);
      setConsultaId(oRes.data.consultaId);
      setChat([]);
      setLoadingIndex(0);
    } catch (error) {
      alert(error.response?.data?.error || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (location) fetchWeatherAndOutfit(null, null, location);
  };

  const handleSelectSuggestion = (city) => {
    setLocation(city.name);
    setShowSuggestions(false);
    fetchWeatherAndOutfit(city.latitude, city.longitude, city.name);
  };

  const handleGeolocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeatherAndOutfit(pos.coords.latitude, pos.coords.longitude, null),
      err => alert('No se pudo obtener la ubicación')
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        // Result is like "data:image/jpeg;base64,/9j/4AAQSk..."
        const parts = result.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const base64 = parts[1];
        
        setSelectedImage(result);
        setImageBase64(base64);
        setImageMimeType(mime);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!message && !imageBase64) || !consultaId) return;

    const newMessageContent = message + (selectedImage ? ' [Imagen adjunta]' : '');
    const newChat = [...chat, { role: 'user', content: newMessageContent }];
    setChat(newChat);
    setMessage('');
    
    const currentBase64 = imageBase64;
    const currentMime = imageMimeType;
    setSelectedImage(null);
    setImageBase64('');
    setImageMimeType('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await axios.post(`${API_URL}/api/chat`, {
        consultaId,
        mensaje: newMessageContent,
        imageBase64: currentBase64,
        imageMimeType: currentMime
      }, { headers: { Authorization: `Bearer ${token}` } });

      setChat([...newChat, { role: 'model', content: res.data.respuesta }]);
    } catch (error) {
      alert('Error enviando mensaje');
    }
  };

  const handleToggleFavorite = async () => {
    if (!consultaId) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.put(`${API_URL}/api/historial/${consultaId}/favorito`, { isFavorite: !isFavorite }, { headers: { Authorization: `Bearer ${token}` } });
      setIsFavorite(!isFavorite);
    } catch(e) {
      alert("Error guardando favorito");
    }
  };

  if (showAd) return <AdModal onClose={handleCloseAd} />;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-neutral-50 text-neutral-900'} font-sans`}>
      <Navbar view={view} setView={setView} darkMode={darkMode} setDarkMode={setDarkMode} handleLogout={onLogout} />

      {view === 'armario' ? (
        <ArmarioHistorial token={token} darkMode={darkMode} />
      ) : view === 'admin' ? (
        <AdminView token={token} darkMode={darkMode} />
      ) : (
        <main className="flex-1 px-4 sm:px-8 pb-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <motion.div 
              initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className={`p-4 sm:p-6 rounded-xl shadow-sm border flex gap-3 sm:gap-4 flex-col sm:flex-row ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-neutral-100'}`}
            >
              <form onSubmit={handleSearch} className={`flex-1 flex items-center border-b relative ${darkMode ? 'border-gray-700' : 'border-neutral-200'}`}>
                <Search className={`w-5 h-5 mr-2 ${darkMode ? 'text-gray-400' : 'text-neutral-400'}`} />
                <input 
                  type="text" 
                  placeholder="Busca una ciudad..." 
                  className={`w-full py-2 bg-transparent focus:outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-neutral-900'}`}
                  value={location}
                  onChange={e => {
                    setLocation(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />

                {/* Dropdown de Autocompletado */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute top-[120%] left-0 right-0 rounded-lg shadow-xl border overflow-hidden z-[100] ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                    >
                      {suggestions.map((city, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleSelectSuggestion(city)}
                          className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${idx !== suggestions.length - 1 ? (darkMode ? 'border-b border-gray-700' : 'border-b border-gray-100') : ''}`}
                        >
                          <MapPin size={16} className="text-indigo-500 opacity-70 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className={`font-medium text-sm leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{city.name}</span>
                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {city.admin1 ? city.admin1 + ', ' : ''}{city.country}
                            </span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
              <button 
                onClick={handleGeolocation}
                className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-2 border rounded text-sm transition-colors w-full sm:w-auto ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-neutral-200 hover:bg-neutral-50'}`}
              >
                <MapPin className="w-4 h-4" /> Mi Ubicación
              </button>
            </motion.div>

            {loading && <p className="text-indigo-500 animate-pulse text-center mt-12">Analizando el clima y generando recomendación inteligente...</p>}

            {weather && !loading && (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-6 sm:p-8 rounded-xl shadow-sm border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-neutral-100'}`}>
                <h2 className="text-sm tracking-widest uppercase mb-4 opacity-50">Clima Actual en {weather.location}</h2>
                <div className="flex items-end gap-4">
                  <span className="text-6xl font-light">{weather.current.temperature_2m}°</span>
                  <div className="opacity-70 mb-2">
                    <p>Sensación térmica: {weather.current.apparent_temperature}°</p>
                    <p>Viento: {weather.current.wind_speed_10m} km/h • Humedad: {weather.current.relative_humidity_2m}%</p>
                  </div>
                </div>
              </motion.div>
            )}

            {outfit && !loading && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`p-6 sm:p-8 rounded-xl shadow-sm border relative ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-neutral-100'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-sm tracking-widest uppercase opacity-50">Outfit Recomendado</h2>
                  <button onClick={handleToggleFavorite} className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:bg-gray-500/10'}`}>
                    <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
                
                <p className="mb-6 italic opacity-80">"{outfit.resumen}"</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {outfit.prendas.map((prenda, idx) => (
                    <PrendaCard 
                      key={idx} 
                      prenda={prenda} 
                      darkMode={darkMode} 
                      canLoad={idx <= loadingIndex}
                      onLoadComplete={() => {
                        if (idx === loadingIndex) {
                          setLoadingIndex(prev => prev + 1);
                        }
                      }}
                    />
                  ))}
                </div>
                
                {outfit.consejo_extra && (
                  <div className={`mt-6 p-4 rounded-lg text-sm border ${darkMode ? 'bg-indigo-900/20 border-indigo-500/20 text-indigo-200' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}>
                    <span className="font-semibold mr-2">Consejo:</span> {outfit.consejo_extra}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className={`rounded-xl shadow-sm border flex flex-col h-[500px] lg:h-auto lg:max-h-[calc(100vh-8rem)] ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-neutral-100'}`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-neutral-100'}`}>
              <h2 className="text-sm tracking-widest uppercase opacity-50">Asistente de Estilo</h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              {!outfit ? (
                <p className="text-sm text-center mt-10 opacity-50">Busca una ubicación para comenzar a chatear.</p>
              ) : chat.length === 0 ? (
                <p className="text-sm text-center mt-10 opacity-50">¿Tienes dudas sobre el outfit? Pregúntame.</p>
              ) : (
                chat.map((msg, idx) => (
                  <motion.div initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} key={idx} className={`p-3 rounded-lg text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white self-end' : (darkMode ? 'bg-gray-800 text-gray-200 self-start' : 'bg-neutral-100 text-neutral-900 self-start')}`}>
                    {msg.content}
                  </motion.div>
                ))
              )}
            </div>

            <div className={`p-4 border-t flex flex-col gap-2 ${darkMode ? 'border-gray-800' : 'border-neutral-100'}`}>
              {selectedImage && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <img src={selectedImage} alt="preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  id="cameraInput" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
                <label 
                  htmlFor="cameraInput" 
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100'}`}
                >
                  <Camera className="w-5 h-5" />
                </label>

                <input 
                  type="text"
                  placeholder="Escribe tu mensaje..."
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-neutral-200'}`}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  disabled={!outfit}
                />
                <button 
                  type="submit" 
                  disabled={!outfit || (!message && !selectedImage)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

        </main>
      )}
    </div>
  );
}
