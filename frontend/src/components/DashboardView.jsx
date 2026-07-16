import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Send, Heart, Camera, X, ShoppingCart, Sparkles, RefreshCw, Archive } from 'lucide-react';
import AdModal from './AdModal';
import AdminView from './AdminView';
import ArmarioHistorial from './ArmarioHistorial';
import ProfileSettings from './ProfileSettings';
import Navbar from './Navbar';
import MobileNavBar from './MobileNavBar';
import StyleOnboardingModal from './StyleOnboardingModal';

const PrendaCard = ({ prenda, darkMode, canLoad, onLoadComplete }) => {
  const [imgStatus, setImgStatus] = useState('waiting'); // 'waiting', 'loading', 'loaded', 'error'
  const [imgSrc, setImgSrc] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const buildPromptUrl = () => {
    const simplePrompt = `${prenda.descripcion}, product photography, flat lay, white background, no humans`.trim();
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(simplePrompt)}?width=300&height=300&model=flux-schnell&nologo=true&enhance=false&seed=${loadAttempt}`;
  };

  useEffect(() => {
    let timeoutId;
    if (canLoad && imgStatus === 'waiting') {
      setImgStatus('loading');
      setImgSrc(buildPromptUrl());
      
      // 20 second timeout - Pollinations can be slow
      timeoutId = setTimeout(() => {
        setImgStatus('error');
        if (onLoadComplete) onLoadComplete();
      }, 20000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [canLoad, imgStatus, loadAttempt]);

  const handleSuccess = () => {
    if (imgStatus !== 'loaded') {
      setImgStatus('loaded');
      if (onLoadComplete) onLoadComplete();
    }
  };

  const handleError = () => {
    if (imgStatus !== 'error') {
      setImgStatus('error');
      if (onLoadComplete) onLoadComplete();
    }
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    setImgStatus('waiting');
    setImgSrc(null);
    setLoadAttempt(prev => prev + 1);
  };

  return (
    <motion.div whileHover={{ scale: 1.03, y: -5 }} className={`group overflow-hidden rounded-2xl flex flex-col shadow-lg transition-all duration-300 ${darkMode ? 'bg-gray-800/40 backdrop-blur-xl border border-white/10 shadow-black/50' : 'bg-white/80 backdrop-blur-xl border border-white/60 shadow-indigo-900/5'}`}>
      <div className={`w-full h-56 flex items-center justify-center overflow-hidden relative ${darkMode ? 'bg-black/20' : 'bg-gray-50/50'}`}>
        
        {(imgStatus === 'waiting' || imgStatus === 'loading') && (
          <div className={`absolute inset-0 z-10 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-200/70'}`}>
            {/* Shimmer sweep */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
                style={{
                  background: darkMode
                    ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)'
                    : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)'
                }}
              />
            </div>
          </div>
        )}

        {imgStatus === 'error' && (
          <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 ${darkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
            <span className="text-xs text-gray-400">No se pudo cargar</span>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-full transition-colors"
            >
              <RefreshCw size={12} /> Reintentar
            </button>
          </div>
        )}

        {imgSrc && (
          <img 
            src={imgSrc} 
            alt={prenda.descripcion} 
            className={`w-full h-full object-cover hover:scale-110 transition-transform duration-700 ${imgStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`} 
            loading="lazy"
            onLoad={handleSuccess}
            onError={handleError}
          />
        )}

        {imgStatus === 'loaded' && (
          <button
            onClick={handleRefresh}
            title="Recargar imagen"
            className="absolute top-2 right-2 z-20 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1 relative z-20">
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">
          {prenda.categoria === 'TOP' ? 'PARTE SUPERIOR' : prenda.categoria === 'BOTTOM' ? 'PARTE INFERIOR' : prenda.categoria}
        </span>
        <span className="font-bold text-lg leading-tight mb-2">{prenda.descripcion}</span>
        <span className="text-sm opacity-70 mb-5 flex-1 leading-relaxed">{prenda.razon}</span>
        <div className="mt-auto flex justify-center">
          {(prenda.enlace_compra && prenda.tienda_recomendada) && (
            <a 
              href={prenda.enlace_compra} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex items-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full transition-all duration-300 shadow-md shadow-indigo-500/20 overflow-hidden h-10 w-10 hover:w-[200px]"
            >
              <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm absolute left-5">
                Buscar en {prenda.tienda_recomendada}
              </span>
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center absolute right-0">
                <ShoppingCart size={18} />
              </div>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Manages sequential image loading: card 0 first, then card 1, then card 2...
const OutfitGrid = ({ prendas, darkMode }) => {
  const [loadIndex, setLoadIndex] = useState(0);
  const handleLoadComplete = () => setLoadIndex(prev => prev + 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {prendas.map((prenda, idx) => (
        <PrendaCard
          key={idx}
          prenda={prenda}
          darkMode={darkMode}
          canLoad={idx <= loadIndex}
          onLoadComplete={idx === loadIndex ? handleLoadComplete : undefined}
        />
      ))}
    </div>
  );
};

const ChatMessage = ({ msg, darkMode }) => {
  if (msg.role === 'user') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-end gap-2 max-w-[85%] self-end">
        {msg.image && (
          <img
            src={msg.image}
            alt="Imagen adjunta"
            className="w-full max-w-[220px] rounded-xl object-cover border-2 border-indigo-400 shadow-lg"
          />
        )}
        {msg.content && (
          <div className="p-3 rounded-lg text-sm bg-indigo-600 text-white">
            {msg.content}
          </div>
        )}
      </motion.div>
    );
  }

  let textContent = msg.content;
  let nuevasPrendas = [];

  try {
    const cleaned = msg.content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.texto) textContent = parsed.texto;
    if (parsed.nuevas_prendas && Array.isArray(parsed.nuevas_prendas)) nuevasPrendas = parsed.nuevas_prendas;
  } catch (e) {
    // Es texto normal o falló el parseo
  }

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2 max-w-[95%] self-start">
      <div className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-neutral-100 text-neutral-900'}`}>
        {textContent}
      </div>
      {nuevasPrendas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {nuevasPrendas.map((prenda, idx) => (
            <PrendaCard key={idx} prenda={prenda} darkMode={darkMode} canLoad={true} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default function DashboardView({ token, defaultView = 'dashboard', onLogout }) {
  const [showAd, setShowAd] = useState(() => {
    if (sessionStorage.getItem('isPremium') === 'true') return false;
    return !sessionStorage.getItem('adShown');
  });
  const [view, setView] = useState(defaultView); // 'dashboard' | 'armario' | 'admin'
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  // FIX: Added toast state to replace alert() calls
  const [toast, setToast] = useState(null);
  
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState(null);
  const [outfit, setOutfit] = useState(null);
  const [consultaId, setConsultaId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const userName = sessionStorage.getItem('userName');
  const isPremium = sessionStorage.getItem('isPremium') === 'true';
  const historyLimit = isPremium ? 50 : 15;
  const [historyCount, setHistoryCount] = useState(0);
  const [limitWarning, setLimitWarning] = useState(null); // { type: 'close' | 'reached', params: { lat, lon, city } }
  
  const [showStyleOnboarding, setShowStyleOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.user) {
          setHistoryCount(res.data.user.historyCount || 0);
          if (!res.data.user.estiloPersonal) {
            setShowStyleOnboarding(true);
          }
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      }
    };
    if (token) {
      checkOnboarding();
    }
  }, [token]);

  // Seleccionar frase aleatoria solo una vez al montar el componente
  const [randomGreeting] = useState(() => {
    const greetings = [
      "¿Qué destino nos espera hoy?",
      "¿A dónde te llevamos hoy?",
      "¿Preparando tu próximo viaje?",
      "Descubre el clima de tu próxima aventura.",
      "Vístete para el éxito, vayas donde vayas."
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  });

  // FIX: Helper to show non-blocking toast instead of alert()
  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
  
  // Lógica de checkout y pagos
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const payment = params.get('payment');
    const plan = params.get('plan');
    const pendingCheckout = sessionStorage.getItem('pendingCheckout');

    if (pendingCheckout) {
      sessionStorage.removeItem('pendingCheckout');
      handleCheckout(pendingCheckout);
    } else if (checkout) {
      handleCheckout(checkout);
    }

    if (payment === 'success') {
      // FIX: Update state in-place instead of alert()+reload() to preserve app state
      sessionStorage.setItem('isPremium', 'true');
      if (plan) sessionStorage.setItem('premiumPlan', plan);
      window.history.replaceState({}, '', '/app');
      setShowAd(false);
      showToast(`¡Gracias por tu compra! Tu plan ${plan || 'Premium'} ha sido activado. 🎉`, 'success');
    }
    if (payment === 'cancelled') {
      window.history.replaceState({}, '', '/app');
      showToast('Has cancelado el proceso de pago. Puedes retomarlo cuando quieras.', 'info');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckout = async (planType) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await axios.post(`${API_URL}/api/payments/create-checkout-session`, { plan: planType }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert('Error al iniciar el pago: ' + (err.response?.data?.error || err.message));
    }
  };

  const defaultCities = [
    { name: 'Madrid', admin1: 'Comunidad de Madrid', country: 'España', latitude: 40.4165, longitude: -3.70256 },
    { name: 'Barcelona', admin1: 'Cataluña', country: 'España', latitude: 41.38879, longitude: 2.15899 },
    { name: 'Londres', admin1: 'Inglaterra', country: 'Reino Unido', latitude: 51.50853, longitude: -0.12574 },
    { name: 'Nueva York', admin1: 'Nueva York', country: 'Estados Unidos', latitude: 40.71427, longitude: -74.00597 },
    { name: 'Tokio', admin1: 'Tokio', country: 'Japón', latitude: 35.6895, longitude: 139.69171 }
  ];

  // FIX: Removed redundant useEffect - isPremium check is already handled in the useState initializer above

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!location.trim()) {
        setSuggestions(defaultCities);
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
    }, 150); // 150ms de debounce para que sea casi instantáneo

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
    const interval = setInterval(ping, 15000); // then every 15 seconds
    return () => clearInterval(interval); // cleanup on unmount (tab closed / logout)
  }, [token]);

  const handleCloseAd = () => {
    setShowAd(false);
    sessionStorage.setItem('adShown', 'true');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (location) {
      if (historyCount === historyLimit - 1) {
        setLimitWarning({ type: 'close', params: { lat: null, lon: null, city: location } });
      } else if (historyCount >= historyLimit) {
        setLimitWarning({ type: 'reached', params: { lat: null, lon: null, city: location } });
      } else {
        fetchWeatherAndOutfit(null, null, location);
      }
    }
  };

  const handleSelectSuggestion = (city) => {
    setLocation(city.name);
    setShowSuggestions(false);
    if (historyCount === historyLimit - 1) {
      setLimitWarning({ type: 'close', params: { lat: city.latitude, lon: city.longitude, city: city.name } });
    } else if (historyCount >= historyLimit) {
      setLimitWarning({ type: 'reached', params: { lat: city.latitude, lon: city.longitude, city: city.name } });
    } else {
      fetchWeatherAndOutfit(city.latitude, city.longitude, city.name);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        if (historyCount === historyLimit - 1) {
          setLimitWarning({ type: 'close', params: { lat: pos.coords.latitude, lon: pos.coords.longitude, city: null } });
        } else if (historyCount >= historyLimit) {
          setLimitWarning({ type: 'reached', params: { lat: pos.coords.latitude, lon: pos.coords.longitude, city: null } });
        } else {
          fetchWeatherAndOutfit(pos.coords.latitude, pos.coords.longitude, null);
        }
      },
      err => showToast('No se pudo obtener la ubicación. Asegúrate de que tienes los permisos activados.')
    );
  };

  const confirmGeneration = () => {
    if (limitWarning) {
      const { lat, lon, city } = limitWarning.params;
      fetchWeatherAndOutfit(lat, lon, city);
      setLimitWarning(null);
    }
  };

  const fetchWeatherAndOutfit = async (lat, lon, city) => {
    setLoading(true);
    setIsFavorite(false);
    setOutfit(null); // Clear previous outfit so it doesn't linger on error
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
      
      // Update local history count if we generated successfully and aren't at the limit yet
      setHistoryCount(prev => Math.min(prev + 1, historyLimit));
    } catch (error) {
      showToast(error.response?.data?.error || 'Error al obtener los datos');
    } finally {
      setLoading(false);
    }
  };

  // Se eliminaron las funciones originales de handleSearch, handleSelectSuggestion y handleGeolocation porque se movieron arriba

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

    const currentBase64 = imageBase64;
    const currentMime = imageMimeType;
    const currentPreview = selectedImage; // Save preview BEFORE clearing

    // Build user message with optional image preview
    const userMsg = { role: 'user', content: message || '', image: currentPreview || null };
    const newChat = [...chat, userMsg];
    setChat(newChat);
    setMessage('');
    setSelectedImage(null);
    setImageBase64('');
    setImageMimeType('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await axios.post(`${API_URL}/api/chat`, {
        consultaId,
        // Send the actual message text to backend (not the display string)
        mensaje: message || 'Analiza esta imagen',
        imageBase64: currentBase64,
        imageMimeType: currentMime
      }, { headers: { Authorization: `Bearer ${token}` } });

      setChat([...newChat, { role: 'model', content: res.data.respuesta }]);
    } catch (error) {
      showToast('Error enviando mensaje');
    }
  };

  const handleToggleFavorite = async () => {
    if (!consultaId) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.put(`${API_URL}/api/historial/${consultaId}/favorito`, { isFavorite: !isFavorite }, { headers: { Authorization: `Bearer ${token}` } });
      setIsFavorite(!isFavorite);
    } catch(e) {
      showToast('Error guardando favorito');
    }
  };

  // Sync browser/Safari theme-color with dark mode
  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', darkMode ? '#030712' : '#f9fafb');
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  if (showAd) return <AdModal onClose={handleCloseAd} />;

  return (
    <div className={`min-h-screen transition-colors duration-300 relative ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-neutral-50 text-neutral-900'} font-sans overflow-x-hidden`}>
      {/* Background blobs for glassmorphism effect */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[120px] opacity-30 ${darkMode ? 'bg-indigo-900' : 'bg-indigo-200'}`}></div>
        <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[150px] opacity-30 ${darkMode ? 'bg-purple-900' : 'bg-purple-200'}`}></div>
      </div>

      {/* FIX: Non-blocking toast notification replacing all alert() calls */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium max-w-sm text-center ${
              toast.type === 'success' ? 'bg-green-600 text-white' :
              toast.type === 'info' ? 'bg-indigo-600 text-white' :
              'bg-red-600 text-white'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 pb-24 md:pb-0">
        {/* Desktop nav */}
        <Navbar view={view} setView={setView} darkMode={darkMode} setDarkMode={setDarkMode} handleLogout={onLogout} />
        {/* Mobile sticky top bar */}
        <div
          className={`md:hidden flex items-center justify-between px-5 py-3 sticky top-0 z-50 border-b backdrop-blur-md ${darkMode ? 'bg-gray-950/80 border-white/10' : 'bg-white/80 border-gray-100'}`}
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
              <img src="/favicon.svg" alt="Ventoo" className="w-full h-full object-cover p-0.5" />
            </div>
            <span className="text-base font-bold tracking-widest bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Ventoo</span>
          </div>
          <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${sessionStorage.getItem('isPremium') === 'true' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
            {sessionStorage.getItem('isPremium') === 'true' ? '✦ Premium' : 'Básico'}
          </div>
        </div>
        {/* Mobile bottom pill nav */}
        <MobileNavBar view={view} setView={setView} darkMode={darkMode} setDarkMode={setDarkMode} handleLogout={onLogout} />

      {view === 'armario' ? (
        <ArmarioHistorial token={token} darkMode={darkMode} />
      ) : view === 'admin' ? (
        // FIX: Only render AdminView if user actually has ADMIN role
        sessionStorage.getItem('userRole') === 'ADMIN'
          ? <AdminView token={token} darkMode={darkMode} />
          : <div className="flex items-center justify-center h-64"><p className="text-red-500">Acceso denegado</p></div>
      ) : view === 'profile' ? (
        <main className="flex-1 px-4 sm:px-8 pb-8 max-w-7xl mx-auto w-full pt-8">
          <ProfileSettings token={token} darkMode={darkMode} />
        </main>
      ) : (
        <main className="flex-1 px-4 sm:px-8 pb-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <div className="mb-2">
              <h2 className="text-3xl font-extrabold tracking-tight flex items-center flex-wrap">
                Hola de nuevo, {userName || 'aventurero'}
                <Sparkles className="ml-3 w-7 h-7 text-yellow-500 animate-[pulse_3s_ease-in-out_infinite]" />
              </h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{randomGreeting}</p>
            </div>
            <motion.div 
              initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className={`relative z-50 p-4 sm:p-6 rounded-3xl shadow-xl flex gap-3 sm:gap-4 flex-col sm:flex-row transition-colors backdrop-blur-xl border ${darkMode ? 'bg-gray-900/50 border-white/10 shadow-black/50' : 'bg-white/70 border-white shadow-indigo-900/5'}`}
            >
              <form onSubmit={handleSearch} className={`flex-1 flex items-center px-5 py-2 rounded-2xl relative transition-all duration-300 shadow-sm border ${darkMode ? 'bg-gray-800/80 border-gray-700/50 focus-within:border-indigo-500/50 focus-within:bg-gray-800' : 'bg-gray-100/50 border-gray-200/50 focus-within:border-indigo-400/30 focus-within:bg-white'}`}>
                <Search className={`w-5 h-5 mr-3 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <input 
                  type="text" 
                  placeholder="¿Dónde vas a ir hoy? (Ej: Madrid, Tokio...)" 
                  className={`w-full py-2 bg-transparent focus:outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
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
                className={`flex items-center justify-center gap-2 px-6 py-3 sm:py-2 rounded-xl text-sm transition-all shadow-md w-full sm:w-auto font-medium ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white shadow-black/50 border border-white/10' : 'bg-white hover:bg-neutral-50 text-neutral-800 shadow-indigo-900/10 border border-white'}`}
              >
                <MapPin className="w-4 h-4" /> Mi Ubicación
              </button>
            </motion.div>

            {loading && (
              <div className="flex flex-col gap-6 w-full animate-pulse mt-4">
                {/* Weather Skeleton */}
                <div className={`p-6 sm:p-8 rounded-3xl shadow-xl backdrop-blur-xl border ${darkMode ? 'bg-gray-900/50 border-white/10 shadow-black/50' : 'bg-white/70 border-white shadow-indigo-900/5'}`}>
                  <div className={`h-4 w-48 rounded mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className="flex items-end gap-4">
                    <div className={`h-16 w-32 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className="flex flex-col gap-2 mb-2">
                      <div className={`h-3 w-40 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                      <div className={`h-3 w-64 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    </div>
                  </div>
                </div>

                {/* Outfit Skeleton */}
                <div className={`p-6 sm:p-8 rounded-3xl shadow-xl backdrop-blur-xl border ${darkMode ? 'bg-gray-900/50 border-white/10 shadow-black/50' : 'bg-white/70 border-white shadow-indigo-900/5'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`h-4 w-40 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-10 w-10 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  </div>
                  
                  <div className={`h-4 w-full rounded mb-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className={`h-4 w-5/6 rounded mb-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`rounded-xl aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {weather && !loading && (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-6 sm:p-8 rounded-3xl shadow-xl backdrop-blur-xl border ${darkMode ? 'bg-gray-900/50 border-white/10 shadow-black/50' : 'bg-white/70 border-white shadow-indigo-900/5'}`}>
                <h2 className="text-sm tracking-widest uppercase mb-4 opacity-50">Clima Actual en {weather.location}</h2>
                <div className="flex items-end gap-4">
                  {/* FIX: Added °C unit so users know the temperature scale */}
                  <span className="text-6xl font-light">{weather.current.temperature_2m}°C</span>
                  <div className="opacity-70 mb-2">
                    <p>Sensación térmica: {weather.current.apparent_temperature}°</p>
                    <p>Viento: {weather.current.wind_speed_10m} km/h • Humedad: {weather.current.relative_humidity_2m}%</p>
                  </div>
                </div>
              </motion.div>
            )}

            {outfit && !loading && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`p-6 sm:p-8 rounded-3xl shadow-xl backdrop-blur-xl border relative ${darkMode ? 'bg-gray-900/50 border-white/10 shadow-black/50' : 'bg-white/70 border-white shadow-indigo-900/5'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-sm tracking-widest uppercase opacity-50">Outfit Recomendado</h2>
                  <button onClick={handleToggleFavorite} className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:bg-gray-500/10'}`}>
                    <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
                
                <p className="mb-6 italic opacity-80">"{outfit.resumen}"</p>
                
                <OutfitGrid prendas={outfit.prendas} darkMode={darkMode} />
                
                {outfit.consejo_extra && (
                  <div className={`mt-6 p-4 rounded-lg text-sm border ${darkMode ? 'bg-indigo-900/20 border-indigo-500/20 text-indigo-200' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}>
                    <span className="font-semibold mr-2">Consejo:</span> {outfit.consejo_extra}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className={`rounded-3xl shadow-xl flex flex-col h-[500px] lg:h-auto lg:max-h-[calc(100vh-8rem)] backdrop-blur-xl border ${darkMode ? 'bg-gray-900/50 border-white/10 shadow-black/50' : 'bg-white/70 border-white shadow-indigo-900/5'}`}>
            <div className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-neutral-200/50'}`}>
              <h2 className="text-sm tracking-widest uppercase opacity-50 font-bold">Asistente de Estilo</h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              {!outfit ? (
                <p className="text-sm text-center mt-10 opacity-50">Busca una ubicación para comenzar a chatear.</p>
              ) : chat.length === 0 ? (
                <p className="text-sm text-center mt-10 opacity-50">¿Tienes dudas sobre el outfit? Pregúntame.</p>
              ) : (
                chat.map((msg, idx) => (
                  <ChatMessage key={idx} msg={msg} darkMode={darkMode} />
                ))
              )}
            </div>

            <div className={`p-4 border-t flex flex-col gap-2 ${darkMode ? 'border-white/10' : 'border-neutral-200/50'}`}>
              {selectedImage && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-md">
                  <img src={selectedImage} alt="preview" className="w-full h-full object-cover" />
                  {/* FIX: Also clear imageBase64 and imageMimeType when user removes image preview */}
                  <button type="button" onClick={() => { setSelectedImage(null); setImageBase64(''); setImageMimeType(''); }} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
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
                  className={`p-3 rounded-xl cursor-pointer transition-colors shadow-sm ${darkMode ? 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700' : 'bg-white text-gray-500 hover:text-indigo-600 hover:bg-gray-50 border border-gray-100'}`}
                >
                  <Camera className="w-5 h-5" />
                </label>

                <input 
                  type="text"
                  placeholder="Escribe tu mensaje..."
                  className={`flex-1 px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm shadow-sm transition-colors ${darkMode ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500' : 'bg-white/50 border-neutral-200/50'}`}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  disabled={!outfit}
                />
                <button 
                  type="submit" 
                  disabled={!outfit || (!message && !selectedImage)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 px-5 rounded-xl disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </main>
      )}
      </div>

      {/* Limit Warning Modal */}
      <AnimatePresence>
        {limitWarning && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`max-w-md w-full p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} shadow-2xl relative overflow-hidden`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 border-4 border-orange-50">
                  <Archive size={28} className="text-orange-500" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">
                  {limitWarning.type === 'close' ? 'Estás a punto de alcanzar tu límite' : 'Has alcanzado tu límite de historial'}
                </h3>
                
                <p className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {limitWarning.type === 'close' 
                    ? `Tienes ${historyCount} outfits guardados. Si llegas a ${historyLimit}, no podrás generar nuevos outfits hasta que elimines alguno de tu historial (los guardados como Favoritos no se borran, pero cuentan para el límite si no liberas espacio).`
                    : `Tienes el máximo de ${historyLimit} outfits guardados. Para poder generar uno nuevo, primero debes ir a tu Armario y eliminar outfits antiguos.`
                  }
                  <br/><br/>
                  {limitWarning.type === 'close' ? '¿Deseas generar este outfit de todos modos?' : 'Dirígete a "Armario & Historial" para liberar espacio.'}
                </p>
                
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setLimitWarning(null)}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                  >
                    {limitWarning.type === 'close' ? 'Cancelar' : 'Entendido'}
                  </button>
                  {limitWarning.type === 'close' && (
                    <button 
                      onClick={confirmGeneration}
                      className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-orange-500/30"
                    >
                      Sí, Generar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showStyleOnboarding && (
        <StyleOnboardingModal 
          token={token} 
          darkMode={darkMode} 
          onClose={() => setShowStyleOnboarding(false)} 
        />
      )}
    </div>
  );
}
