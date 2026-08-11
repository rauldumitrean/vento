import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, X, Copy, Check, Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind } from 'lucide-react';
import html2canvas from 'html2canvas';
import { ClothingIcon } from '../utils/ClothingIcon';

// Mapeo de código de clima a icono y gradiente de fondo
const getWeatherStyle = (weatherCode, temp) => {
  if (weatherCode >= 95) return { Icon: CloudLightning, label: 'Tormenta', gradient: 'from-gray-900 via-slate-800 to-gray-900', accent: '#6366f1' };
  if (weatherCode >= 71) return { Icon: Snowflake, label: 'Nieve', gradient: 'from-sky-950 via-blue-900 to-slate-900', accent: '#93c5fd' };
  if (weatherCode >= 51) return { Icon: CloudRain, label: 'Lluvia', gradient: 'from-slate-900 via-blue-950 to-gray-900', accent: '#60a5fa' };
  if (weatherCode >= 45) return { Icon: Wind, label: 'Niebla', gradient: 'from-gray-800 via-gray-900 to-slate-900', accent: '#9ca3af' };
  if (weatherCode >= 1) return { Icon: Cloud, label: 'Nublado', gradient: 'from-slate-900 via-indigo-950 to-gray-900', accent: '#a5b4fc' };
  // Soleado — varía por temperatura
  if (temp >= 30) return { Icon: Sun, label: 'Calor intenso', gradient: 'from-orange-950 via-red-950 to-gray-900', accent: '#fb923c' };
  if (temp >= 20) return { Icon: Sun, label: 'Soleado', gradient: 'from-amber-950 via-yellow-950 to-gray-900', accent: '#fbbf24' };
  return { Icon: Sun, label: 'Fresco', gradient: 'from-indigo-950 via-slate-900 to-gray-900', accent: '#818cf8' };
};

// Componente visual de la tarjeta (lo que se captura como imagen)
const CardVisual = ({ outfit, weather, city, cardRef }) => {
  const temp = weather?.current?.temperature_2m ?? null;
  const code = weather?.current?.weather_code ?? 0;
  const style = getWeatherStyle(code, temp);
  const prendas = outfit?.prendas?.slice(0, 4) || [];
  const WeatherIcon = style.Icon;

  return (
    <div
      ref={cardRef}
      style={{ width: 540, height: 540, fontFamily: 'Arial, sans-serif' }}
      className={`relative bg-gradient-to-br ${style.gradient} overflow-hidden flex flex-col`}
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, ${style.accent}44 0%, transparent 60%), radial-gradient(circle at 80% 20%, ${style.accent}22 0%, transparent 60%)`
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${style.accent}66, transparent)` }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-8 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: style.accent }}>
            <Wind size={18} />
          </div>
          <span className="text-white font-bold text-xl" style={{ letterSpacing: 'normal' }}>Ventoo</span>
        </div>
        <div className="text-right text-white drop-shadow-md">
          <WeatherIcon size={36} />
        </div>
      </div>

      {/* Ciudad y temperatura */}
      <div className="relative z-10 px-8 pb-3">
        <div className="flex items-center gap-4">
          {temp !== null && (
            <span className="text-6xl font-bold text-white drop-shadow-lg" style={{ letterSpacing: 'normal' }}>{Math.round(temp)}°</span>
          )}
          <div className="flex flex-col justify-center">
            <p className="text-white font-bold text-xl" style={{ lineHeight: '1.2' }}>{city || 'Mi ciudad'}</p>
            <p className="text-base font-medium" style={{ color: style.accent }}>{style.label}</p>
          </div>
        </div>
      </div>

      {/* Resumen del outfit */}
      {outfit?.resumen && (
        <div className="relative z-10 mx-8 mb-4 px-5 py-4 rounded-xl backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.06)', borderLeft: `4px solid ${style.accent}` }}>
          <p className="text-white text-base" style={{ fontStyle: 'normal', lineHeight: '1.5', letterSpacing: 'normal', wordWrap: 'break-word', whiteSpace: 'normal' }}>"{outfit.resumen}"</p>
        </div>
      )}

      {/* Prendas */}
      {prendas.length > 0 && (
        <div className="relative z-10 flex-1 px-8 mt-2">
          <div className="grid grid-cols-2 gap-3">
            {prendas.map((prenda, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-white/90">
                  <ClothingIcon tipo={prenda.tipo} size={24} />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center" style={{ overflow: 'hidden' }}>
                  <p className="text-white text-sm font-semibold" style={{ whiteSpace: 'normal', lineHeight: '1.3' }}>{prenda.nombre || prenda.tipo}</p>
                  {prenda.color && <p className="text-gray-400 text-xs mt-1" style={{ whiteSpace: 'normal' }}>{prenda.color}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 mt-auto border-t border-white/5">
        <p className="text-gray-400 font-medium text-sm">ventoo.vercel.app</p>
        <p className="text-sm font-medium" style={{ color: style.accent + 'cc' }}>
          {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
        </p>
      </div>
    </div>
  );
};

// Componente principal del modal de compartir
const OutfitShareCard = ({ outfit, weather, city, onClose }) => {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateImage = async () => {
    if (!cardRef.current) return null;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      setIsGenerating(false);
      return canvas;
    } catch (e) {
      console.error('Error generando imagen:', e);
      setIsGenerating(false);
      return null;
    }
  };

  const handleDownload = async () => {
    const canvas = await generateImage();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ventoo-outfit-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const generateShareLink = () => {
    try {
      const payload = btoa(encodeURIComponent(JSON.stringify({ 
        city: city || 'Ciudad', 
        weather: weather?.current, 
        outfit: outfit 
      })));
      return `https://ventoo.vercel.app/shared?data=${payload}`;
    } catch {
      return 'https://ventoo.vercel.app';
    }
  };

  const handleShare = async () => {
    const canvas = await generateImage();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'ventoo-outfit.png', { type: 'image/png' });

      // Web Share API (disponible en móvil)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Mi outfit de hoy 💫',
            text: `Hoy en ${city}: ${outfit?.resumen || ''} — Mira mi outfit completo aquí: ${generateShareLink()}`,
          });
        } catch (e) {
          if (e.name !== 'AbortError') handleDownload();
        }
      } else {
        // Fallback: descargar
        handleDownload();
      }
    }, 'image/png');
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = generateShareLink();
      const copyText = `¡Mira mi outfit recomendado para ${city || 'hoy'} en Ventoo!\n\n${outfit?.resumen || ''}\n\nPuedes verlo aquí: ${shareUrl}`;
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op */
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-gray-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full"
        >
          {/* Header del modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
            <div>
              <h3 className="text-white font-bold text-lg">Compartir outfit</h3>
              <p className="text-gray-400 text-sm">Comparte tu look de hoy en redes sociales</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Preview de la tarjeta */}
          <div className="p-6 flex justify-center">
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ transform: 'scale(0.72)', transformOrigin: 'top center', height: 390 }}>
              <CardVisual outfit={outfit} weather={weather} city={city} cardRef={cardRef} />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="px-6 pb-6 grid grid-cols-3 gap-3">
            {/* Compartir (nativo en móvil, descarga en escritorio) */}
            <button
              onClick={handleShare}
              disabled={isGenerating}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Share2 size={20} />
              )}
              <span className="text-xs font-semibold">{isGenerating ? 'Generando...' : 'Compartir'}</span>
            </button>

            {/* Descargar como PNG */}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/8 hover:bg-white/12 text-white border border-white/10 transition-all disabled:opacity-50"
            >
              <Download size={20} />
              <span className="text-xs font-semibold">Guardar PNG</span>
            </button>

            {/* Copiar enlace de Ventoo */}
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/8 hover:bg-white/12 text-white border border-white/10 transition-all"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
              <span className="text-xs font-semibold">{copied ? '¡Copiado!' : 'Copiar link'}</span>
            </button>
          </div>

          {/* Tip Instagram */}
          <div className="mx-6 mb-6 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-950/40 to-purple-950/40 border border-pink-900/30 flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400 shrink-0"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            <p className="text-gray-400 text-xs leading-relaxed">
              Descarga la imagen y súbela a tus Stories o al feed de Instagram para mostrar tu look de hoy.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OutfitShareCard;
