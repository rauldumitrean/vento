import Cookies from 'js-cookie';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import Skeleton from './ui/Skeleton';
import { Cloud, Search, ArrowRight, ArrowLeft, Activity, MapPin, Wind, Thermometer, Droplets, Sun, Sparkles, LogOut, Star, TrendingUp, CloudRain, ShieldCheck, CheckCircle2, ChevronRight, Share2, Upload, MessageSquare, Send, Camera, Save, X, ShoppingCart, User, Users, CloudSnow, Snowflake, CloudLightning, Lock, RefreshCw, Archive, Info, Heart, Gauge, LayoutDashboard, Luggage, Globe, Moon, Flame } from 'lucide-react';
import { lazy, Suspense } from 'react';
import SupportView from './SupportView';
import TermsView from './TermsView';
import PrivacyView from './PrivacyView';
import ArmarioHistorial from './ArmarioHistorial';
import AdminView from './AdminView';
import ProfileSettings from './ProfileSettings';
import BanView from './BanView';
import AdModal from './AdModal';
import FriendsView from './FriendsView';
import FavoriteCitiesView from './FavoriteCitiesView';
import TravelPackingView from './TravelPackingView';
import CommunityView from './CommunityView';
import EstudioEstiloView from './EstudioEstiloView';
import NotificationBell from './NotificationBell';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import OutfitShareCard from './OutfitShareCard';
import MobileNavBar from './MobileNavBar';
import StyleOnboardingModal from './StyleOnboardingModal';
import VerticalAd from './VerticalAd';

const loadingSteps = [
  "Analizando la temperatura local...",
  "Consultando al Personal Shopper de IA...",
  "Buscando combinaciones perfectas...",
  "Diseñando el outfit pieza a pieza...",
  "Generando imágenes de alta resolución...",
  "Añadiendo últimos detalles...",
  "A punto de terminar..."
];

const PrendaCard = ({ prenda, darkMode, canLoad, onLoadComplete, token, isOpen, onOpen, onClose, onPrev, onNext, viewMode = 'grid', delayIdx = 0 }) => {
  if (!prenda) return null;
  const [imgStatus, setImgStatus] = useState('waiting'); // 'waiting', 'loading', 'loaded', 'error'
  const [imgSrc, setImgSrc] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState(false);
  // FIX A-2: Store timer ID in a ref so we can clear it on unmount
  const retryTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen || fullScreenImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, fullScreenImage]);


  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      if (!canLoad || imgStatus !== 'waiting') return;
      
      if (isMounted) setImgStatus('loading');
      
      let url = prenda.imgUrl || prenda.imageUrl;
      // If we have a user uploaded image, skip generation
      if (!url || (loadAttempt > 0 && !prenda.imageUrl)) {
        const queryText = prenda.english_query || prenda.nombre_corto || (prenda.descripcion || '').substring(0, 60);
        const simplePrompt = `a single ${queryText} garment, product photography, white background, no people, flat lay, strictly clothing`;
        
        // Use deterministic seed based on prompt so Pollinations and CDNs cache the image automatically
        let seed = 0;
        for (let i = 0; i < simplePrompt.length; i++) {
          seed = (seed << 5) - seed + simplePrompt.charCodeAt(i);
          seed |= 0;
        }
        seed = Math.abs(seed);
        // If it's a retry, we change the seed slightly to get a new image
        if (loadAttempt > 0) seed += loadAttempt;

        url = `https://image.pollinations.ai/prompt/${encodeURIComponent(simplePrompt)}?width=512&height=512&seed=${seed}&nologo=true&enhance=false`;
        prenda.imgUrl = url;
      }
      
      if (isMounted) setImgSrc(url);
    };

    if (canLoad && loadAttempt === 0) {
      fetchImage();
    } else if (loadAttempt > 0) {
      fetchImage();
    }

    return () => {
      isMounted = false;
      // FIX A-2: Clear any pending retry timer when component unmounts
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [canLoad, loadAttempt, prenda.descripcion, token]);

  const handleSuccess = () => {
    if (imgStatus !== 'loaded') {
      setImgStatus('loaded');
      if (onLoadComplete) onLoadComplete();
    }
  };

  const handleError = () => {
    if (loadAttempt < 2) {
      // FIX A-2: Store timer ID so we can cancel it on unmount
      retryTimerRef.current = setTimeout(() => {
        setImgStatus('waiting');
        setImgSrc(null);
        setLoadAttempt(prev => prev + 1);
      }, 3000);
    } else {
      if (imgStatus !== 'error') {
        setImgStatus('error');
        if (onLoadComplete) onLoadComplete();
      }
    }
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    setImgStatus('waiting');
    setImgSrc(null);
    setLoadAttempt(prev => prev + 1);
  };

  return (
    <>
      {/* ── STRIP / HORIZONTAL layout (mobile list view) ── */}
      {viewMode === 'strip' && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={onOpen}
          className={`cursor-pointer flex flex-row items-center gap-4 rounded-2xl overflow-hidden shadow-md p-3 transition-all duration-200 ${darkMode ? 'bg-gray-800/50 border border-white/10' : 'bg-white/90 border border-gray-100 shadow-gray-100'}`}
        >
          {/* Thumbnail */}
          <div className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden relative flex items-center justify-center ${darkMode ? 'bg-black/30' : 'bg-gray-100'}`}>
            <img 
              src={imgSrc || ''} 
              alt={prenda.nombre_corto} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imgStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
              onLoad={handleSuccess}
              onError={handleError}
            />
            {imgStatus !== 'loaded' && (
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute z-10">
                <Sparkles size={22} className="text-indigo-400" />
              </motion.div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>
              {prenda.categoria === 'TOP' ? 'SUPERIOR' : prenda.categoria === 'BOTTOM' ? 'INFERIOR' : prenda.categoria}
            </span>
            <p className="font-bold text-sm leading-tight truncate">{prenda.nombre_corto || prenda.descripcion}</p>
            <p className="text-xs opacity-60 line-clamp-2 mt-0.5 leading-relaxed">{prenda.descripcion}</p>
          </div>
          {/* Arrow */}
          <ChevronRight size={18} className={`shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`} />
        </motion.div>
      )}

      {/* ── GRID / CARD layout (default) ── */}
      {viewMode !== 'strip' && (
      <motion.div 
        whileHover={{ scale: 1.02, y: -4 }} 
        onClick={onOpen}
        className={`group cursor-pointer relative rounded-2xl flex flex-col shadow-lg transition-shadow duration-300 overflow-hidden bg-black/20 backdrop-blur-xl border border-white/10 shadow-black/40`}
      >
        {imgStatus !== 'loaded' && (
          <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-30">
            <span className={`p-1.5 rounded-full inline-flex ${darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
              <Info size={16} />
            </span>
          </div>
        )}
      <div className={`w-full h-56 flex items-center justify-center overflow-hidden relative bg-black/20`}>
        
        {(imgStatus === 'waiting' || imgStatus === 'loading') && (
          <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/5`}>
            {/* Shimmer sweep */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
                style={{
                  background: darkMode
                    ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
                    : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)'
                }}
              />
            </div>
            {/* New premium loading indicator instead of circle */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="z-20 text-indigo-400 mb-3"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <span className={`z-20 text-xs font-semibold tracking-widest uppercase ${darkMode ? 'text-indigo-300' : 'text-indigo-500'}`}>
              Generando
            </span>
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
            fetchpriority="high"
            onLoad={handleSuccess}
            onError={handleError}
          />
        )}

        {/* Shopping Button - Circular expandable */}
        {(() => {
          const searchUrl = prenda.enlace_compra || `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(prenda.descripcion || prenda.nombre_corto || 'ropa')}`;
          const storeName = prenda.tienda_recomendada || "Google Shopping";
          return (
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="group/shop absolute bottom-3 right-3 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xl border border-white/20 text-white rounded-full h-10 w-10 hover:w-auto hover:px-4 transition-all duration-300 shadow-lg shadow-black/50 overflow-hidden"
            >
              <ShoppingCart size={18} className="shrink-0 group-hover/shop:text-indigo-400 transition-colors" />
              <span className="w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/shop:w-auto group-hover/shop:opacity-100 group-hover/shop:ml-2 font-semibold text-sm transition-all duration-300">
                Buscar en {storeName}
              </span>
            </a>
          );
        })()}

        {imgStatus === 'loaded' && (
          <button
            onClick={(e) => { e.stopPropagation(); handleRefresh(e); }}
            title="Generar otra imagen"
            className="absolute top-2 left-2 z-20 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1 relative z-20">
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">
          {prenda.categoria === 'TOP' ? 'PARTE SUPERIOR' : prenda.categoria === 'BOTTOM' ? 'PARTE INFERIOR' : prenda.categoria}
        </span>
        <span className="font-bold text-lg leading-tight mb-2">{prenda.nombre_corto || prenda.descripcion}</span>
        <p className="text-sm opacity-70 mb-3 leading-relaxed line-clamp-4">
          {prenda.nombre_corto ? prenda.descripcion : prenda.razon}
        </p>
        {prenda.nombre_corto && (
          <p className="text-xs opacity-50 mb-3 leading-relaxed italic line-clamp-2">{prenda.razon}</p>
        )}
        <div className="mt-auto pt-3 border-t border-gray-200/20 flex justify-center">
          {/* Espacio reservado si se necesita otro elemento, el botón de compra ahora flota */}
        </div>
      </div>
    </motion.div>
      )}

    {typeof document !== 'undefined' && createPortal(
      <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col hide-scrollbar bg-black/40 backdrop-blur-3xl border border-white/10`}
            >
              {/* Modal Header */}
              <div className={`sticky top-0 z-20 flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-black/20 backdrop-blur-md`}>
                <h3 className={`text-lg sm:text-xl font-bold pr-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{prenda.nombre_corto || prenda.descripcion.substring(0, 30) + '...'}</h3>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {onPrev && (
                    <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className={`p-1.5 sm:p-2 rounded-full transition-colors hover:bg-white/10 text-indigo-300`}>
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  {onNext && (
                    <button onClick={(e) => { e.stopPropagation(); onNext(); }} className={`p-1.5 sm:p-2 rounded-full transition-colors hover:bg-white/10 text-indigo-300`}>
                      <ArrowRight size={20} />
                    </button>
                  )}
                  <button onClick={onClose} className={`ml-2 p-1.5 sm:p-2 rounded-full transition-colors hover:bg-white/10 text-gray-300`}>
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 sm:p-8 flex-1 flex flex-col sm:flex-row gap-8">
                {/* Modal Image */}
                <div className={`w-full sm:w-1/2 shrink-0 rounded-2xl overflow-hidden relative flex items-center justify-center bg-black/30 border border-white/5`}>
                  {imgSrc && imgStatus === 'loaded' ? (
                    <img 
                      src={imgSrc} 
                      alt={prenda.nombre_corto || "Prenda"} 
                      className="w-full h-auto max-h-[60vh] object-contain rounded-xl cursor-pointer hover:scale-[1.02] transition-transform" 
                      onClick={(e) => { e.stopPropagation(); setFullScreenImage(true); }}
                    />
                  ) : (
                    <SkeletonImageLoader darkMode={darkMode} />
                  )}
                </div>

                {/* Text Info */}
                <div className="w-full sm:w-1/2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest rounded-full">
                        {prenda.categoria === 'TOP' ? 'PARTE SUPERIOR' : prenda.categoria === 'BOTTOM' ? 'PARTE INFERIOR' : prenda.categoria}
                      </span>
                      {imgStatus !== 'loaded' && <SkeletonProgressStatus darkMode={darkMode} />}
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 opacity-70 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Descripción</h4>
                        <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{prenda.descripcion}</p>
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 opacity-70 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>¿Por qué esta prenda?</h4>
                        <p className={`text-base leading-relaxed italic border-l-4 pl-4 ${darkMode ? 'text-indigo-200 border-indigo-500/50' : 'text-indigo-700 border-indigo-200'}`}>{prenda.razon}</p>
                      </div>
                    </div>
                  </div>
                {(prenda.enlace_compra && prenda.tienda_recomendada) && (
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <a 
                      href={prenda.enlace_compra} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
                    >
                      <ShoppingCart size={18} />
                      Buscar en Amazon
                    </a>
                  </div>
                )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
            onClick={() => setFullScreenImage(false)}
          >
            <img src={imgSrc} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            <button className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </>,
      document.body
    )}
    </>
  );
};

// Step icon components (SVG, no emoji)
const StepIcons = [
  // Palette
  <svg key={0} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  // Scissors
  <svg key={1} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
  // Layers / textures
  <svg key={2} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  // Sun / lighting
  <svg key={3} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  // Search / details
  <svg key={4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  // Sparkles
  <svg key={5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 3l1.88 5.76L20 10.5l-5.12 3.99L16.76 21 12 17.27 7.24 21l1.88-6.51L4 10.5l6.12-1.74z"/></svg>,
];
const skeletonStepLabels = [
  'Creando paleta de colores...',
  'Trazando la silueta...',
  'Tejiendo los detalles...',
  'Aplicando iluminación...',
  'Definiendo bordes...',
  '\u00a1Casi lista!',
];

const SkeletonProgressStatus = ({ darkMode }) => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(prev => (prev + 1) % skeletonStepLabels.length), 2000);
    return () => clearInterval(t);
  }, []);
  const progress = Math.round(((step + 1) / skeletonStepLabels.length) * 100);

  return (
    <div className="flex flex-col items-end gap-2 shrink-0 max-w-[50%]">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 6 }}
          transition={{ duration: 0.25 }}
          className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
            darkMode ? 'bg-gray-800/80 border-gray-700 text-indigo-300' : 'bg-white border-gray-200 text-indigo-600'
          }`}
        >
          <span className="flex items-center w-3 h-3">{StepIcons[step]}</span>
          <span className="truncate">{skeletonStepLabels[step]}</span>
        </motion.div>
      </AnimatePresence>
      <div className={`w-full h-1 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div
          className="h-full bg-indigo-500 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

const SkeletonImageLoader = ({ darkMode }) => {
  const bg = 'bg-white/5 border border-white/10';
  const bar = 'bg-white/10';
  const shimmer = 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)';

  return (
    <div className={`w-full h-72 sm:h-80 rounded-xl overflow-hidden relative flex items-center justify-center p-8 ${bg}`}>
      {/* ─ Skeleton background shape (image placeholder) ─ */}
      <div className={`w-full h-full rounded-lg relative overflow-hidden ${bar}`}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.7s_ease-in-out_infinite]" style={{ background: shimmer }} />
      </div>
    </div>
  );
};


const OutfitGrid = ({ prendas = [], darkMode, token }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [openIdx, setOpenIdx] = useState(null);
  const scrollPosRef = useRef(0);
  const isModalOpen = openIdx !== null;

  useEffect(() => {
    if (isModalOpen) {
      scrollPosRef.current = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosRef.current}px`;
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollPosRef.current);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isModalOpen]);

  // 'grid' | 'strip' toggle state for mobile
  const [mobileView, setMobileView] = useState('grid');

  if (!prendas || !Array.isArray(prendas)) return null;

  const cardProps = (prenda, idx) => ({
    prenda,
    darkMode,
    canLoad: idx <= currentIdx,
    onLoadComplete: () => setCurrentIdx(prev => Math.max(prev, idx + 1)),
    token,
    isOpen: openIdx === idx,
    onOpen: () => setOpenIdx(idx),
    onClose: () => setOpenIdx(null),
    onPrev: idx > 0 ? () => setOpenIdx(idx - 1) : null,
    onNext: idx < prendas.length - 1 ? () => setOpenIdx(idx + 1) : null,
  });

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-end mb-3 gap-2">
        <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vista:</span>
        <button
          onClick={() => setMobileView('grid')}
          className={`p-1.5 rounded-lg transition-colors ${
            mobileView === 'grid'
              ? 'bg-indigo-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
          }`}
          title="Vista cuadrícula"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z"/>
          </svg>
        </button>
        <button
          onClick={() => setMobileView('strip')}
          className={`p-1.5 rounded-lg transition-colors ${
            mobileView === 'strip'
              ? 'bg-indigo-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
          }`}
          title="Vista lista"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M3 4h18v3H3zm0 7h18v2H3zm0 6h18v3H3z"/>
          </svg>
        </button>
      </div>

      {/* Strip layout */}
      {mobileView === 'strip' && (
        <div className="flex flex-col gap-3">
          {prendas.map((prenda, idx) => (
            <PrendaCard key={`strip-${prenda.nombre_corto || 'prenda'}-${idx}`} {...cardProps(prenda, idx)} viewMode="strip" />
          ))}
        </div>
      )}

      {/* Grid layout */}
      <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${
        mobileView === 'strip' ? 'hidden' : ''
      }`}>
        {prendas.map((prenda, idx) => (
          <PrendaCard key={`grid-${prenda.nombre_corto || 'prenda'}-${idx}`} {...cardProps(prenda, idx)} viewMode="grid" />
        ))}
      </div>
    </div>
  );
};

const AnimatedWeatherIcon = ({ temperature, size = 120 }) => {
  if (temperature > 25) {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"
      >
        <Sun size={size} strokeWidth={1.5} />
      </motion.div>
    );
  } else if (temperature > 15) {
    return (
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="text-gray-400 drop-shadow-[0_0_15px_rgba(156,163,175,0.4)] relative"
      >
        <Cloud size={size} strokeWidth={1.5} />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-4 -right-4 text-yellow-500 -z-10"
        >
          <Sun size={size * 0.5} strokeWidth={2} />
        </motion.div>
      </motion.div>
    );
  } else if (temperature > 5) {
    return (
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-blue-300 drop-shadow-[0_0_15px_rgba(147,197,253,0.5)]"
      >
        <CloudRain size={size} strokeWidth={1.5} />
      </motion.div>
    );
  } else {
    return (
      <motion.div
        animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-blue-100 drop-shadow-[0_0_20px_rgba(219,234,254,0.6)]"
      >
        <CloudSnow size={size} strokeWidth={1.5} />
      </motion.div>
    );
  }
};

const ChatMessage = ({ msg, darkMode, token }) => {
  // FIX C-1: Hook must be called unconditionally BEFORE any conditional return
  const [currentChatIdx, setCurrentChatIdx] = useState(0);

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
          <div className="p-4 rounded-2xl rounded-tr-sm text-sm bg-indigo-600/80 backdrop-blur-md border border-indigo-500/20 text-white shadow-lg shadow-indigo-600/20">
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
      <div className={`p-4 rounded-2xl rounded-tl-sm text-sm bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-lg`}>
        {textContent}
      </div>
      {nuevasPrendas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {nuevasPrendas.map((prenda, idx) => (
            <PrendaCard 
              key={idx} 
              prenda={prenda} 
              darkMode={darkMode} 
              canLoad={idx <= currentChatIdx} 
              onLoadComplete={() => setCurrentChatIdx(prev => Math.max(prev, idx + 1))}
              token={token} 
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const FloatingAssistant = ({ outfit, consultaId, token, darkMode, isPremium, setView, showToast }) => {
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('');
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    setChat([]);
  }, [consultaId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('La imagen es muy grande (máximo 5MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
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
    const currentPreview = selectedImage;

    const userMsg = { role: 'user', content: message || '', image: currentPreview || null };
    const newChat = [...chat, userMsg];
    setChat(newChat);
    setMessage('');
    setSelectedImage(null);
    setImageBase64('');
    setImageMimeType('');

    try {
      setIsChatLoading(true);
      const res = await axios.post(`${API_URL}/api/chat`, {
        consultaId,
        mensaje: userMsg.content || 'Analiza esta imagen',
        imageBase64: currentBase64,
        imageMimeType: currentMime
      }, { headers: { Authorization: `Bearer ${token}` } });

      setChat([...newChat, { role: 'model', content: res.data.respuesta }]);
    } catch (error) {
      console.error(error);
      showToast('Error enviando mensaje: ' + (error.response?.data?.error || error.message), 'error');
      setChat(prev => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className={`rounded-3xl shadow-xl flex flex-col border relative overflow-hidden h-full min-h-0 bg-black/20 backdrop-blur-md border-white/10 shadow-black/50`}>
      <div className={`flex flex-col h-full w-full transition-all duration-300 ${!isPremium ? 'blur-sm opacity-50 pointer-events-none select-none' : ''}`}>
        <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between">
           <h2 className="text-sm tracking-widest uppercase text-white font-bold flex items-center gap-2">
             <Sparkles size={14} className="text-indigo-400" /> Asistente de Estilo
           </h2>
           <button onClick={() => setView('dashboard')} className="lg:hidden p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
             <ArrowLeft size={20} />
           </button>
         </div>
        
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
          {!outfit ? (
            <div className="flex justify-center mt-10">
              <p className="text-sm text-center text-white font-medium bg-[#18181b] px-6 py-3 rounded-2xl shadow-xl border border-white/5">Busca una ubicación para comenzar a chatear.</p>
            </div>
          ) : chat.length === 0 ? (
            <div className="flex justify-center mt-10">
              <p className="text-sm text-center text-white font-medium bg-[#18181b] px-6 py-3 rounded-2xl shadow-xl border border-white/5">¿Tienes dudas sobre el outfit? Pregúntame.</p>
            </div>
          ) : (
            <>
              {chat.map((msg, idx) => (
                <ChatMessage key={`${idx}-${msg.content?.substring(0,10)}`} msg={msg} darkMode={darkMode} token={token} />
              ))}
              {isChatLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <Skeleton className="h-16 w-3/4 max-w-[85%] rounded-2xl rounded-tl-sm" rounded="rounded-2xl rounded-tl-sm" />
                </motion.div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex flex-col gap-2 bg-white/5 backdrop-blur-md">
          {selectedImage && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-md">
              <img src={selectedImage} alt="preview" className="w-full h-full object-cover" />
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
              className={`flex-1 px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm shadow-sm transition-colors bg-white/5 border-white/10 text-white placeholder-gray-400`}
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

      {!isPremium && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-black/20 dark:bg-black/40 backdrop-blur-[2px]">
          <div className={`p-4 rounded-full mb-4 ${darkMode ? 'bg-gray-800/80 text-gray-300' : 'bg-white/80 text-gray-600'} shadow-lg backdrop-blur-md`}>
            <Lock size={32} />
          </div>
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Asistente IA Exclusivo</h3>
          <p className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xs mx-auto`}>
            El Asistente de Estilo impulsado por IA está disponible únicamente para usuarios Premium.
          </p>
          <button 
            onClick={(e) => { e.preventDefault(); setView('profile'); }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
          >
            <Star size={18} />
            Desbloquear Premium
          </button>
        </div>
      )}
    </div>
  );
};

export default function DashboardView({ token, defaultView = 'dashboard', onLogout }) {
  const [showAd, setShowAd] = useState(() => {
    if (Cookies.get('isPremium') === 'true') return false;
    return !Cookies.get('adShown');
  });
  const [view, setView] = useState(defaultView); // 'dashboard' | 'armario' | 'admin'
  const [darkMode, setDarkMode] = useState(Cookies.get('darkMode') === 'true');
  const { showToast } = useToast();
  
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState(null);
  const [outfit, setOutfit] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [consultaId, setConsultaId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState("Novato");

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex(prev => Math.min(prev + 1, loadingSteps.length - 1));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const userName = Cookies.get('userName');
  const isPremium = Cookies.get('isPremium') === 'true';
  const historyLimit = isPremium ? 50 : 15;
  const [historyCount, setHistoryCount] = useState(0);
  const [limitWarning, setLimitWarning] = useState(null); // { type: 'close' | 'reached', params: { lat, lon, city } }
  
  const [showStyleOnboarding, setShowStyleOnboarding] = useState(false);
  const [showAgePrompt, setShowAgePrompt] = useState(false);
  const [ageInput, setAgeInput] = useState('');
  const [savingAge, setSavingAge] = useState(false);
  const [showGorrasPrompt, setShowGorrasPrompt] = useState(false);
  const [usaGorrasInput, setUsaGorrasInput] = useState(false);
  const [savingGorras, setSavingGorras] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.user) {
          setHistoryCount(res.data.user.historyCount || 0);
          setUserPoints(res.data.user.points || 0);
          setUserLevel(res.data.user.level || "Novato");
          if (res.data.user.age === null) {
            setShowAgePrompt(true);
            if (!res.data.user.estiloPersonal) {
              Cookies.set('needsStyleOnboarding', 'true', { expires: 365 });
            }
          } else if (res.data.user.usaGorras === null) {
            setShowGorrasPrompt(true);
            if (!res.data.user.estiloPersonal) {
              Cookies.set('needsStyleOnboarding', 'true', { expires: 365 });
            }
          } else if (!res.data.user.estiloPersonal) {
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

  const handleSaveAge = async (e) => {
    e.preventDefault();
    if (!ageInput || ageInput < 13 || ageInput > 100) return;
    setSavingAge(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.put(`${API_URL}/api/auth/profile`, { age: parseInt(ageInput) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Cookies.set('userAge', ageInput, { expires: 365 });
      setShowAgePrompt(false);
      
      if (Cookies.get('needsStyleOnboarding') === 'true') {
        Cookies.remove('needsStyleOnboarding');
        setShowStyleOnboarding(true);
      } else {
        // If age was just saved, check if we need to ask for gorras
        // Removed explicit checkOnboarding here, re-check logic if needed
      }
    } catch (err) {
      showToast('Error guardando la edad');
    } finally {
      setSavingAge(false);
    }
  };

  const handleSaveGorras = async (e) => {
    e.preventDefault();
    setSavingGorras(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.post(`${API_URL}/api/auth/update-preferences`, { usaGorras: usaGorrasInput }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowGorrasPrompt(false);
      
      if (Cookies.get('needsStyleOnboarding') === 'true') {
        Cookies.remove('needsStyleOnboarding');
        setShowStyleOnboarding(true);
      }
    } catch (err) {
      showToast('Error guardando tus preferencias');
    } finally {
      setSavingGorras(false);
    }
  };

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

  // Lógica de checkout y pagos
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const payment = params.get('payment');
    const plan = params.get('plan');
    const pendingCheckout = Cookies.get('pendingCheckout');

    if (pendingCheckout) {
      Cookies.remove('pendingCheckout');
      handleCheckout(pendingCheckout);
    } else if (checkout) {
      handleCheckout(checkout);
    }

    if (payment === 'success') {
      Cookies.set('isPremium', 'true', { expires: 365 });
      if (plan) Cookies.set('premiumPlan', plan, { expires: 365 });
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
      showToast('Error al iniciar el pago: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const defaultCities = [
    { name: 'Madrid', admin1: 'Comunidad de Madrid', country: 'España', latitude: 40.4165, longitude: -3.70256 },
    { name: 'Barcelona', admin1: 'Cataluña', country: 'España', latitude: 41.38879, longitude: 2.15899 },
    { name: 'Londres', admin1: 'Inglaterra', country: 'Reino Unido', latitude: 51.50853, longitude: -0.12574 },
    { name: 'Nueva York', admin1: 'Nueva York', country: 'Estados Unidos', latitude: 40.71427, longitude: -74.00597 },
    { name: 'Tokio', admin1: 'Tokio', country: 'Japón', latitude: 35.6895, longitude: 139.69171 }
  ];

  useEffect(() => {
    let isMounted = true;
    
    const fetchSuggestions = async () => {
      const loc = location.trim();
      if (loc.length < 2) {
        if (isMounted) setSuggestions(defaultCities);
        return;
      }
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/autocomplete?q=${encodeURIComponent(loc)}`, {
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
        console.error("Error al obtener sugerencias");
        if (isMounted) setSuggestions([{ name: 'Demasiadas búsquedas. Usa la lupa o Enter.' }]);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [location, token]);

  useEffect(() => {
    Cookies.set('darkMode', String(darkMode), { expires: 365 });
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', darkMode ? '#030712' : '#f9fafb');
  }, [darkMode]);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const ping = () => axios.post(`${API_URL}/api/ping`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});

    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const handleCloseAd = () => {
    setShowAd(false);
    Cookies.set('adShown', 'true', { expires: 365 });
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
      async pos => {
        let cityName = 'Tu Ubicación';
        try {
          const res = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=es`);
          cityName = res.data.city || res.data.locality || 'Tu Ubicación';
        } catch (e) {
          console.error('Error al obtener la ciudad:', e);
        }

        if (historyCount === historyLimit - 1) {
          setLimitWarning({ type: 'close', params: { lat: pos.coords.latitude, lon: pos.coords.longitude, city: cityName } });
        } else if (historyCount >= historyLimit) {
          setLimitWarning({ type: 'reached', params: { lat: pos.coords.latitude, lon: pos.coords.longitude, city: cityName } });
        } else {
          fetchWeatherAndOutfit(pos.coords.latitude, pos.coords.longitude, cityName);
        }
      },
      err => showToast('No se pudo obtener la ubicación. Asegúrate de que tienes los permisos activados.')
    );
  };

  const fetchWeatherAndOutfit = async (lat, lon, city) => {
    setLoading(true);
    setIsFavorite(false);
    setOutfit(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      let url = `${API_URL}/api/weather?`;
      const params = new URLSearchParams();
      if (lat) params.append('lat', lat);
      if (lon) params.append('lon', lon);
      if (city) params.append('city', city);
      url += params.toString();

      const wRes = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setWeather(wRes.data);

      const oRes = await axios.post(`${API_URL}/api/recomendacion`, {
        lat: wRes.data.lat,
        lon: wRes.data.lon,
        ubicacion: wRes.data.location,
        clima: wRes.data.current,
        daily: wRes.data.daily
      }, { headers: { Authorization: `Bearer ${token}` } });

      setOutfit(oRes.data.recomendacion);
      setConsultaId(oRes.data.consultaId);
      
      setHistoryCount(prev => Math.min(prev + 1, historyLimit));
    } catch (error) {
      showToast(error.response?.data?.error || 'Error al obtener los datos', 'error');
    } finally {
      setLoading(false);
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

  const [isCityFavorite, setIsCityFavorite] = useState(false);
  const [favoriteCityId, setFavoriteCityId] = useState(null);
  const [savingCityFav, setSavingCityFav] = useState(false);

  useEffect(() => { 
    setIsCityFavorite(!!weather?.isFavoriteCity); 
    setFavoriteCityId(weather?.favoriteCityId || null);
  }, [weather]);

  const handleSaveCityFavorite = async () => {
    if (!weather) return;
    setSavingCityFav(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      if (isCityFavorite && favoriteCityId) {
        await axios.delete(`${API_URL}/api/favorites/${favoriteCityId}`, { headers: { Authorization: `Bearer ${token}` } });
        setIsCityFavorite(false);
        setFavoriteCityId(null);
        showToast(`${weather.location} eliminada de favoritos`);
      } else {
        const res = await axios.post(`${API_URL}/api/favorites`, {
          cityName: weather.location,
          lat: weather.lat,
          lon: weather.lon
        }, { headers: { Authorization: `Bearer ${token}` } });
        setIsCityFavorite(true);
        setFavoriteCityId(res.data.favorite?.id || null);
        showToast(`${weather.location} guardada en favoritos`, 'success');
      }
    } catch (e) {
      showToast('Error guardando ciudad favorita');
    } finally {
      setSavingCityFav(false);
    }
  };

  const handleSelectFavoriteCity = (cityName, lat, lon) => {
    setView('dashboard');
    setLocation(cityName);
    fetchWeatherAndOutfit(lat || null, lon || null, cityName);
  };

  if (showAd) return <AdModal onClose={handleCloseAd} />;

  return (
    <div className="flex fixed inset-0 font-sans overflow-hidden text-white bg-[#0A0A0B] w-full max-w-full" style={{ overscrollBehavior: 'none' }}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0A0A0B]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10 flex w-full h-full p-2 sm:p-4 gap-2 sm:gap-4 overflow-hidden">
        <Sidebar 
          view={view} 
          setView={setView} 
          handleLogout={onLogout} 
          userName={userName} 
          isPremium={isPremium} 
          userPoints={userPoints}
          userLevel={userLevel}
          onNewConsulta={() => {
            setView('dashboard');
            setWeather(null);
            setOutfit(null);
            setLocation('');
          }}
          token={token}
        />

        <div className="flex-1 min-w-0 h-full rounded-[2rem] overflow-hidden flex flex-col relative shadow-2xl border border-white/10 bg-black/40">
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
             <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 group">
               <Cloud className="w-6 h-6 text-white group-hover:text-indigo-400 transition-colors" />
               <span className="text-xl font-bold tracking-widest text-white group-hover:text-indigo-400 transition-colors">Ventoo</span>
             </button>
             <div className="flex items-center gap-3">
               <button onClick={() => setView('friends')} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 relative shadow-sm ${view === 'friends' ? 'bg-indigo-500 text-white shadow-indigo-500/30' : 'bg-white/10 hover:bg-white/20 text-gray-200 border border-white/5'}`}>
                 <User size={20} />
               </button>
               <NotificationBell token={token} />
             </div>
          </div>

          <div className={`flex-1 min-w-0 overflow-x-hidden hide-scrollbar flex flex-col relative pb-24 lg:pb-0 bg-[#0A0A0B]/60 ${view === 'dashboard' && !weather && !loading ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <main className="flex-1 p-4 sm:p-6 lg:p-10 flex flex-col w-full max-w-6xl mx-auto min-h-full overflow-x-hidden">
              {view === 'armario' ? (
                <ArmarioHistorial token={token} darkMode={true} />
              ) : view === 'admin' && Cookies.get('userRole') === 'ADMIN' ? (
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>}><AdminView token={token} darkMode={true} /></Suspense>
              ) : view === 'profile' ? (
                <ProfileSettings token={token} darkMode={true} onLogout={onLogout} onBack={() => setView('dashboard')} />
              ) : view === 'friends' ? (
                <FriendsView token={token} darkMode={true} onNavigate={setView} />
              ) : view === 'favorites' ? (
                <FavoriteCitiesView token={token} onSelectCity={handleSelectFavoriteCity} />
              ) : view === 'packing' ? (
                <TravelPackingView token={token} />
              ) : view === 'studio' ? (
                <EstudioEstiloView token={token} />
              ) : view === 'community' ? (
                <CommunityView token={token} consultaId={consultaId} isCurrentOutfitPublic={false} />
              ) : view === 'chat' ? (
                <div className="h-full flex flex-col pt-8 pb-[100px] lg:pb-0">
                  <FloatingAssistant 
                    outfit={outfit} 
                    consultaId={consultaId} 
                    token={token} 
                    darkMode={darkMode}
                    isPremium={isPremium}
                    setView={setView}
                    showToast={showToast}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
                  
                  {!weather && !loading ? (
                    <div className="flex flex-col items-center w-full max-w-3xl justify-center mt-[-10vh]">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-8 flex items-center justify-center shadow-lg shadow-indigo-500/50 animate-[pulse_3s_ease-in-out_infinite]">
                         <CloudSnow className="text-white w-12 h-12" />
                      </div>
                      <div className="text-center mb-2">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                          {userName ? `¡Bienvenido, ${userName}!` : '¡Bienvenido!'}
                        </span>
                      </div>
                      <h1 className="text-4xl sm:text-5xl font-black text-white text-center mb-10 tracking-tight">
                        ¿Listo para crear algo nuevo?
                      </h1>
                      
                      <div className="w-full relative z-10">
                        <form onSubmit={handleSearch} className="flex-1 flex items-center px-6 py-4 rounded-3xl relative transition-all duration-300 shadow-2xl border bg-black/40 border-white/20 focus-within:border-indigo-500/50 focus-within:bg-black/60 backdrop-blur-xl">
                          <Search className="w-6 h-6 mr-4 text-gray-400" />
                          <input 
                            type="text" 
                            placeholder="¿Para qué ciudad quieres un outfit hoy?" 
                            className="w-full py-2 bg-transparent focus:outline-none text-white placeholder-gray-500 text-lg"
                            value={location}
                            onChange={e => {
                              setLocation(e.target.value);
                              setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                          />
                          {location && (
                            <button 
                              type="button" 
                              onClick={() => {
                                setLocation('');
                                setSuggestions([]);
                              }}
                              className="ml-3 p-2 rounded-full transition-colors text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <X size={20} />
                            </button>
                          )}

                          <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-[110%] left-0 right-0 rounded-2xl shadow-2xl border overflow-hidden z-[100] bg-[#0f111a]/95 border-white/10 backdrop-blur-2xl"
                              >
                                {suggestions.map((city, idx) => (
                                  <div 
                                    key={`${city.name || 'sugg'}-${idx}`}
                                    onClick={() => {
                                      if (!city.latitude) return;
                                      handleSelectSuggestion(city);
                                    }}
                                    className={`px-5 py-4 cursor-pointer flex items-center gap-4 transition-colors hover:bg-white/10 ${idx !== suggestions.length - 1 ? 'border-b border-white/10' : ''}`}
                                  >
                                    <MapPin size={18} className="text-indigo-400 opacity-70 flex-shrink-0" />
                                    <div className="flex flex-col">
                                      <span className="font-medium text-base text-gray-200">{city.name}</span>
                                      <span className="text-sm text-gray-500">
                                        {city.admin1 ? city.admin1 + ', ' : ''}{city.country}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </form>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full mt-6 sm:mt-10">
                        <button onClick={handleGeolocation} className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl shadow-xl transition-all text-left flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-3 group">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                            <MapPin size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-white">Mi Ubicación Actual</span>
                            <span className="text-xs text-gray-400 hidden sm:block">Descubre outfits para tu ciudad al instante.</span>
                          </div>
                        </button>
                        <button onClick={() => {setLocation('Madrid'); handleSearch({preventDefault:()=>{}});}} className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl shadow-xl transition-all text-left flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-3 group">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <Sun size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-white">Escapada de Verano</span>
                            <span className="text-xs text-gray-400 hidden sm:block">Playa, sol y looks frescos.</span>
                          </div>
                        </button>
                        <button onClick={() => {setLocation('Londres'); handleSearch({preventDefault:()=>{}});}} className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl shadow-xl transition-all text-left flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-3 group">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <CloudRain size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-white">City Break Lluvioso</span>
                            <span className="text-xs text-gray-400 hidden sm:block">Estilo urbano para la lluvia.</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Result state
                    <div className="w-full h-full flex flex-col">
                       <div className="w-full mb-6 flex items-center gap-3">
                         <button onClick={() => {setWeather(null); setOutfit(null);}} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 w-fit shadow-lg shadow-black/20">
                            <ArrowLeft size={16} /> Volver a buscar
                         </button>
                         {/* Save city to favorites */}
                         <button
                           onClick={handleSaveCityFavorite}
                           disabled={savingCityFav}
                           title={isCityFavorite ? 'Ciudad guardada en favoritos' : 'Agregar a favoritos'}
                           className={`flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md border transition-all shadow-lg shadow-black/20 text-sm font-medium ${
                             isCityFavorite
                               ? 'bg-yellow-400/15 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20'
                               : 'bg-white/5 border-white/10 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400/20'
                           } disabled:opacity-50`}
                         >
                           <Star size={15} fill={isCityFavorite ? 'currentColor' : 'none'} className="transition-all" />
                           <span className="hidden sm:inline">{isCityFavorite ? 'Guardada' : 'Agregar a favoritos'}</span>
                         </button>
                       </div>

                       {weather && (
                           <div className="w-full mb-8">
                             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={() => setShowWeatherModal(true)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-8 backdrop-blur-xl cursor-pointer hover:bg-white/10 transition-colors flex justify-between items-center relative overflow-hidden shadow-lg shadow-black/20">
                               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-[60px]" />
                               <div className="relative z-10">
                                  <h2 className="text-sm tracking-widest uppercase opacity-50 mb-2 font-bold text-indigo-400">Clima Actual</h2>
                                  <div className="flex flex-wrap items-end gap-4">
                                     <span className="text-6xl sm:text-7xl font-light text-white">{weather.current.temperature_2m}°</span>
                                     <div className="pb-1 sm:pb-2">
                                        <h3 className="text-xl font-bold text-white mb-1">{weather.location}</h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
                                          <div className="flex items-center gap-1.5 text-gray-300 text-sm bg-black/20 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                                            <Thermometer size={14} className="text-rose-400" />
                                            <span>Sensación {weather.current.apparent_temperature}°</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-gray-300 text-sm bg-black/20 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                                            <Droplets size={14} className="text-blue-400" />
                                            <span>{weather.current.relative_humidity_2m}% humedad</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-gray-300 text-sm bg-black/20 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                                            <Wind size={14} className="text-teal-400" />
                                            <span>{weather.current.wind_speed_10m} km/h</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-gray-300 text-sm bg-black/20 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                                            <Sun size={14} className="text-yellow-400" />
                                            <span>UV {weather.current.uv_index}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-gray-300 text-sm bg-black/20 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                                            <CloudRain size={14} className="text-indigo-400" />
                                            <span>{weather.current.precipitation} mm</span>
                                          </div>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               <div className="relative z-10 opacity-70 hidden sm:block">
                                  <AnimatedWeatherIcon temperature={weather.current.temperature_2m} size={80} />
                               </div>
                             </motion.div>
                           </div>
                       )}

                       <div className="w-full flex flex-col xl:flex-row gap-8 relative">
                          <div className="flex-1 flex flex-col space-y-8 min-w-0">
                             {/* Result state below */}
                          
                             {loading && (
                               <div className="flex flex-col items-center justify-center py-20 gap-4">
                                 <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
                                 <p className="text-lg font-medium text-indigo-300">{loadingSteps[loadingStepIndex]}</p>
                               </div>
                             )}

                          {/* Weather block moved up */}

                          {outfit && !loading && (
                             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-8 backdrop-blur-xl relative">
                               <div className="flex justify-between items-start mb-6">
                                 <div>
                                   <h2 className="text-sm tracking-widest uppercase font-bold text-purple-400 mb-2">Generado por IA</h2>
                                   <p className="text-lg italic text-gray-300 max-w-2xl">"{outfit.resumen}"</p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   <button onClick={() => setShowShareCard(true)} className={`p-3 rounded-full transition-colors text-gray-400 bg-black/20 hover:bg-white/10`} title="Compartir Outfit">
                                     <Share2 size={20} />
                                   </button>
                                   <button onClick={handleToggleFavorite} className={`p-3 rounded-full transition-colors ${isFavorite ? 'text-red-400 bg-red-500/20' : 'text-gray-400 bg-black/20 hover:bg-white/10'}`}>
                                     <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                                   </button>
                                 </div>
                               </div>

                               {/* Using the standard OutfitGrid */}
                               <OutfitGrid prendas={outfit.prendas} darkMode={true} token={token} />

                               {/* Layering Timeline - Feature 3 */}
                               {outfit.timeline && outfit.timeline.length > 0 && (
                                 <div className="mt-6">
                                   <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                                     <span className="w-4 h-0.5 bg-gray-700"></span>
                                     Tu día en capas
                                     <span className="flex-1 h-0.5 bg-gray-700"></span>
                                   </h3>
                                   <div className="relative flex gap-0 overflow-x-auto hide-scrollbar pb-2">
                                     {outfit.timeline.map((slot, idx) => {
                                       const getTimelineIcon = (emojiString) => {
                                         if (!emojiString) return <Cloud className="text-indigo-300 w-5 h-5" />;
                                         if (emojiString.includes('☀️') || emojiString.includes('🌞')) return <Sun className="text-yellow-400 w-5 h-5" />;
                                         if (emojiString.includes('🌙') || emojiString.includes('🌛') || emojiString.includes('🌜')) return <Moon className="text-yellow-200 w-5 h-5" />;
                                         if (emojiString.includes('🌧') || emojiString.includes('🌦')) return <CloudRain className="text-blue-400 w-5 h-5" />;
                                         if (emojiString.includes('❄️')) return <Snowflake className="text-blue-200 w-5 h-5" />;
                                         if (emojiString.includes('🔥')) return <Flame className="text-orange-500 w-5 h-5" />;
                                         return <Cloud className="text-indigo-300 w-5 h-5" />;
                                       };
                                       return (
                                         <div key={idx} className="flex-1 min-w-[90px] relative">
                                           {/* Connector line */}
                                           {idx < outfit.timeline.length - 1 && (
                                             <div className="absolute top-5 left-1/2 right-0 h-0.5 bg-gradient-to-r from-indigo-500/40 to-purple-500/20 z-0" />
                                           )}
                                           <div className="flex flex-col items-center text-center relative z-10 px-2">
                                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600/40 to-purple-600/40 border border-indigo-500/30 flex items-center justify-center text-lg mb-2 backdrop-blur-sm">
                                               {getTimelineIcon(slot.emoji)}
                                             </div>
                                             <span className="text-xs font-bold text-indigo-300">{slot.hora}</span>
                                             <span className="text-xs text-gray-400 mt-0.5">{slot.temp}°C</span>
                                             <p className="text-[10px] text-gray-500 mt-1.5 leading-snug line-clamp-3">{slot.consejo}</p>
                                           </div>
                                         </div>
                                       );
                                     })}
                                   </div>
                                 </div>
                               )}

                               {outfit.consejo_extra && (
                                  <div className="mt-8 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                    <span className="font-bold block mb-1">Consejo:</span>
                                    {outfit.consejo_extra}
                                  </div>
                                )}
                              </motion.div>
                          )}
                       </div>
                       
                       {showShareCard && outfit && weather && (
                         <OutfitShareCard
                           outfit={outfit}
                           weather={weather}
                           city={weather.location || location || 'Mi ciudad'}
                           onClose={() => setShowShareCard(false)}
                         />
                       )}
                       
                       {/* Floating Chat Widget */}
                       {outfit && (
                         <div className="fixed bottom-[100px] lg:bottom-6 right-4 lg:right-6 z-[100]">
                           <AnimatePresence>
                             {isChatOpen && (
                               <motion.div
                                 initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                 animate={{ opacity: 1, y: 0, scale: 1 }}
                                 exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                 className="hidden lg:block absolute bottom-16 right-0 w-[400px] h-[600px] mb-4 origin-bottom-right"
                               >
                                 <FloatingAssistant outfit={outfit} consultaId={consultaId} token={token} darkMode={darkMode} isPremium={isPremium} setView={setView} />
                               </motion.div>
                             )}
                           </AnimatePresence>
                           <button
                             onClick={() => {
                               if (window.innerWidth < 1024) {
                                 setView('chat');
                               } else {
                                 setIsChatOpen(!isChatOpen);
                               }
                             }}
                             className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 flex items-center justify-center transition-transform hover:scale-110"
                           >
                             <span className="hidden lg:flex items-center justify-center">
                               {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
                             </span>
                             <span className="flex lg:hidden items-center justify-center">
                               <MessageSquare size={24} />
                             </span>
                           </button>
                         </div>
                       )}
                    </div>
                  </div>
                 )}
               </div>
             )}
            </main>
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-3 mb-3 flex items-end justify-around bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl px-1 py-2 shadow-2xl shadow-black/50">

          {/* Armario */}
          <button
            onClick={() => setView('armario')}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all duration-300 ${
              view === 'armario' ? 'bg-indigo-600/25 text-indigo-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Archive size={19} />
            <span className="text-[8px] font-semibold uppercase tracking-wider">Armario</span>
          </button>

          {/* Comunidad */}
          <button
            onClick={() => setView('community')}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all duration-300 ${
              view === 'community' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-emerald-400'
            }`}
          >
            <Globe size={19} />
            <span className="text-[8px] font-semibold uppercase tracking-wider">Feed</span>
          </button>

          {/* Buscar - center elevated button */}
          <button
            onClick={() => { setView('dashboard'); setWeather(null); setOutfit(null); setLocation(''); }}
            className="flex flex-col items-center gap-1 -mt-7 px-3 py-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Search size={20} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Buscar</span>
          </button>

          {/* Maleta */}
          <button
            onClick={() => setView('packing')}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all duration-300 ${
              view === 'packing' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-amber-400'
            }`}
          >
            <Luggage size={19} />
            <span className="text-[8px] font-semibold uppercase tracking-wider">Maleta</span>
          </button>

          {/* Perfil */}
          <button
            onClick={() => setView('profile')}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all duration-300 overflow-hidden ${
              view === 'profile' ? 'bg-indigo-600/25 text-indigo-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {Cookies.get('userProfilePicture') ? (
              <img src={Cookies.get('userProfilePicture')} alt="Profile" className="w-5 h-5 rounded-full object-cover border border-white/20" />
            ) : (
              <User size={19} />
            )}
            <span className="text-[8px] font-semibold uppercase tracking-wider">Perfil</span>
          </button>
        </div>
      </div>

      {/* Weather Details Modal */}
      <AnimatePresence>
        {showWeatherModal && weather && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowWeatherModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col hide-scrollbar ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`}
            >
              {/* Header */}
              <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${darkMode ? 'bg-gray-900/90 border-gray-700 backdrop-blur-md' : 'bg-white/90 border-gray-100 backdrop-blur-md'}`}>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Detalles del Tiempo - {weather.location}</h3>
                <button onClick={() => setShowWeatherModal(false)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <X size={20} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-8">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-2xl flex flex-col justify-between ${darkMode ? 'bg-gray-800' : 'bg-indigo-50/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer size={16} className={darkMode ? 'text-indigo-400' : 'text-indigo-500'} />
                      <span className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Temperatura</span>
                    </div>
                    <span className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{weather.current.temperature_2m}°C</span>
                  </div>
                  <div className={`p-4 rounded-2xl flex flex-col justify-between ${darkMode ? 'bg-gray-800' : 'bg-indigo-50/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer size={16} className={darkMode ? 'text-orange-400' : 'text-orange-500'} />
                      <span className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sensación</span>
                    </div>
                    <span className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{weather.current.apparent_temperature}°C</span>
                  </div>
                  <div className={`p-4 rounded-2xl flex flex-col justify-between ${darkMode ? 'bg-gray-800' : 'bg-indigo-50/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets size={16} className={darkMode ? 'text-blue-400' : 'text-blue-500'} />
                      <span className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Humedad</span>
                    </div>
                    <span className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{weather.current.relative_humidity_2m}%</span>
                  </div>
                  <div className={`p-4 rounded-2xl flex flex-col justify-between ${darkMode ? 'bg-gray-800' : 'bg-indigo-50/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Wind size={16} className={darkMode ? 'text-teal-400' : 'text-teal-500'} />
                      <span className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Viento</span>
                    </div>
                    <span className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{weather.current.wind_speed_10m} km/h</span>
                  </div>
                  
                  {weather.current.uv_index !== undefined && (
                    <div className={`p-4 rounded-2xl flex flex-col justify-between ${darkMode ? 'bg-gray-800' : 'bg-indigo-50/50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sun size={16} className={darkMode ? 'text-yellow-400' : 'text-yellow-500'} />
                        <span className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Índice UV</span>
                      </div>
                      <span className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{weather.current.uv_index}</span>
                    </div>
                  )}
                  {weather.current.precipitation !== undefined && (
                    <div className={`p-4 rounded-2xl flex flex-col justify-between ${darkMode ? 'bg-gray-800' : 'bg-indigo-50/50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <CloudRain size={16} className={darkMode ? 'text-blue-400' : 'text-blue-500'} />
                        <span className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Precipitación</span>
                      </div>
                      <span className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{weather.current.precipitation} mm</span>
                    </div>
                  )}
                  {weather.current.cloud_cover !== undefined && (
                    <div className={`p-4 rounded-2xl flex flex-col justify-between ${darkMode ? 'bg-gray-800' : 'bg-indigo-50/50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Cloud size={16} className={darkMode ? 'text-gray-400' : 'text-gray-400'} />
                        <span className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nubes</span>
                      </div>
                      <span className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{weather.current.cloud_cover}%</span>
                    </div>
                  )}
                  {weather.current.surface_pressure !== undefined && (
                    <div className={`p-4 rounded-2xl flex flex-col justify-between ${darkMode ? 'bg-gray-800' : 'bg-indigo-50/50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge size={16} className={darkMode ? 'text-purple-400' : 'text-purple-500'} />
                        <span className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Presión</span>
                      </div>
                      <span className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{weather.current.surface_pressure} hPa</span>
                    </div>
                  )}
                </div>

                {weather.latitude && weather.longitude && (
                  <div className={`mt-8 p-1 rounded-2xl overflow-hidden shadow-inner ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="p-4">
                      <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <MapPin size={16} className="text-indigo-500"/> Ubicación Interactiva
                      </h4>
                    </div>
                    <div className="w-full h-80 rounded-b-xl overflow-hidden border-t border-gray-200 dark:border-gray-700">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight="0" 
                        marginWidth="0" 
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${weather.longitude-0.1}%2C${weather.latitude-0.1}%2C${weather.longitude+0.1}%2C${weather.latitude+0.1}&layer=mapnik&marker=${weather.latitude}%2C${weather.longitude}`}
                      ></iframe>
                    </div>
                  </div>
                )}

                {/* 24-Hour Forecast */}
                {weather.hourly && (
                  <div>
                    <h4 className={`text-sm font-semibold mb-4 uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Previsión 24 Horas</h4>
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x custom-scrollbar">
                      {weather.hourly.time.slice(0, 24).map((timeStr, idx) => {
                        const date = new Date(timeStr);
                        const hours = date.getHours().toString().padStart(2, '0') + ':00';
                        return (
                          <div key={idx} className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl shrink-0 snap-center ${darkMode ? 'bg-gray-800' : 'bg-indigo-50/50'}`}>
                            <span className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{hours}</span>
                            <span className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{weather.hourly.temperature_2m[idx] ?? '--'}°</span>
                            {weather.hourly.precipitation_probability && (
                              <span className="text-[10px] text-blue-500 font-medium flex items-center justify-center gap-0.5 mt-1">
                                {weather.hourly.precipitation_probability[idx]}% <Droplets size={10} className="opacity-80" />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Map Embed */}
                <div>
                  <h4 className={`text-sm font-semibold mb-4 uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mapa de la Zona</h4>
                  <div className={`w-full h-[400px] rounded-2xl overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <iframe
                      title="Weather Map"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight="0"
                      marginWidth="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(weather.lon)-0.05},${parseFloat(weather.lat)-0.05},${parseFloat(weather.lon)+0.05},${parseFloat(weather.lat)+0.05}&layer=mapnik&marker=${weather.lat},${weather.lon}`}
                      style={{ border: 0 }}
                    ></iframe>
                  </div>
                  <div className="mt-2 text-right">
                     <a href={`https://www.openstreetmap.org/?mlat=${weather.lat}&mlon=${weather.lon}#map=13/${weather.lat}/${weather.lon}`} target="_blank" rel="noopener noreferrer" className={`text-xs hover:underline ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Ver mapa más grande</a>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {showStyleOnboarding && (
          <StyleOnboardingModal 
            token={token} 
            darkMode={darkMode} 
            onClose={() => setShowStyleOnboarding(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAgePrompt && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAgePrompt(false)}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className={`max-w-md w-full p-8 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} shadow-2xl relative overflow-hidden`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 border-4 border-indigo-50">
                  <Sparkles size={28} className="text-indigo-600" />
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight">Mejora tus resultados</h3>
                <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Para que la Inteligencia Artificial te recomiende outfits que se adapten mejor a ti, necesitamos saber tu edad.
                </p>
                
                <form onSubmit={handleSaveAge} className="w-full">
                  <div className="mb-6">
                    <label className={`block text-left text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tu Edad</label>
                    <input
                      type="number"
                      min="13"
                      max="100"
                      required
                      value={ageInput}
                      onChange={e => setAgeInput(e.target.value)}
                      placeholder="Ej: 25"
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingAge}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                  >
                    {savingAge ? 'Guardando...' : 'Guardar y Continuar'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGorrasPrompt && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowGorrasPrompt(false)}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className={`max-w-md w-full p-8 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} shadow-2xl relative overflow-hidden`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 border-4 border-indigo-50">
                  <Sparkles size={28} className="text-indigo-600" />
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight">Afina tus outfits</h3>
                <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ¿Te gusta usar gorras o sombreros? Si marcas que sí, la IA los incluirá en tus outfits cuando el clima y el estilo lo pidan.
                </p>
                
                <form onSubmit={handleSaveGorras} className="w-full">
                  <div className="mb-6 flex items-center justify-center gap-3">
                    <input type="checkbox" id="usaGorras" checked={usaGorrasInput} onChange={(e) => setUsaGorrasInput(e.target.checked)} className="w-6 h-6 text-indigo-600 rounded focus:ring-indigo-500" />
                    <label htmlFor="usaGorras" className={`font-semibold cursor-pointer ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Sí, uso gorras o sombreros
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={savingGorras}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                  >
                    {savingGorras ? 'Guardando...' : 'Guardar y Continuar'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
