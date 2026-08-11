import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, X, Copy, Check, Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind } from 'lucide-react';

// Mapeo de código de clima a colores y gradiente
const getWeatherStyle = (weatherCode, temp) => {
  if (weatherCode >= 95) return { label: 'Tormenta', bgTop: '#0f172a', bgBot: '#1e293b', accent: '#6366f1', accentRgb: '99,102,241' };
  if (weatherCode >= 71) return { label: 'Nieve', bgTop: '#0c2841', bgBot: '#1e3a5f', accent: '#93c5fd', accentRgb: '147,197,253' };
  if (weatherCode >= 51) return { label: 'Lluvia', bgTop: '#0f172a', bgBot: '#1e3a5f', accent: '#60a5fa', accentRgb: '96,165,250' };
  if (weatherCode >= 45) return { label: 'Niebla', bgTop: '#1c1c27', bgBot: '#2d2d3a', accent: '#9ca3af', accentRgb: '156,163,175' };
  if (weatherCode >= 1)  return { label: 'Nublado', bgTop: '#0f172a', bgBot: '#1e1b4b', accent: '#a5b4fc', accentRgb: '165,180,252' };
  // Soleado
  if (temp >= 30) return { label: 'Calor intenso', bgTop: '#1a0a00', bgBot: '#3b0d00', accent: '#fb923c', accentRgb: '251,146,60' };
  if (temp >= 20) return { label: 'Soleado', bgTop: '#1a1000', bgBot: '#3b2000', accent: '#fbbf24', accentRgb: '251,191,36' };
  return { label: 'Fresco', bgTop: '#0f172a', bgBot: '#1e1b4b', accent: '#818cf8', accentRgb: '129,140,248' };
};

// Genera la imagen directamente con Canvas API (sin html2canvas)
const generateCanvasImage = (outfit, weather, city) => {
  return new Promise((resolve) => {
    const W = 540;
    const H = 540;
    const canvas = document.createElement('canvas');
    canvas.width = W * 2;   // retina
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    const temp = weather?.temperature_2m ?? null;
    const code = weather?.weather_code ?? 0;
    const style = getWeatherStyle(code, temp ?? 20);

    // --- Background gradient ---
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, style.bgTop);
    grad.addColorStop(1, style.bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle radial glow
    const glow = ctx.createRadialGradient(W * 0.2, H * 0.8, 0, W * 0.2, H * 0.8, W * 0.6);
    glow.addColorStop(0, `rgba(${style.accentRgb},0.15)`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Top accent line
    const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, `rgba(${style.accentRgb},0.6)`);
    lineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(0, 0, W, 1);

    // --- Helper: rounded rect ---
    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // --- Helper: wrap text ---
    const wrapText = (text, x, y, maxWidth, lineHeight, maxLines = 99) => {
      const words = text.split(' ');
      let line = '';
      let linesDrawn = 0;
      for (let i = 0; i < words.length; i++) {
        const test = line + (line ? ' ' : '') + words[i];
        if (ctx.measureText(test).width > maxWidth && line) {
          if (linesDrawn + 1 >= maxLines) {
            ctx.fillText(line + '...', x, y);
            return y + lineHeight;
          }
          ctx.fillText(line, x, y);
          y += lineHeight;
          linesDrawn++;
          line = words[i];
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, x, y);
      return y + lineHeight;
    };

    // ========================
    // HEADER: Logo + App name
    // ========================
    const logoX = 32, logoY = 32;
    // Logo circle
    roundRect(logoX, logoY, 36, 36, 10);
    ctx.fillStyle = style.accent;
    ctx.fill();
    // "V" inside
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('V', logoX + 18, logoY + 25);

    // App name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Ventoo', logoX + 46, logoY + 23);

    // Weather emoji-style icon (top-right)
    ctx.textAlign = 'right';
    ctx.font = '32px Arial';
    const weatherEmoji = code >= 95 ? '⛈️' : code >= 71 ? '❄️' : code >= 51 ? '🌧️' : code >= 45 ? '🌫️' : code >= 1 ? '⛅' : temp >= 30 ? '🔥' : temp >= 20 ? '☀️' : '🌤️';
    ctx.fillText(weatherEmoji, W - 32, logoY + 28);

    // ========================
    // TEMPERATURE + CITY
    // ========================
    let curY = 96;
    ctx.textAlign = 'left';
    if (temp !== null) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px Arial';
      ctx.fillText(`${Math.round(temp)}°`, 32, curY + 50);
    }
    // City & label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(city || 'Mi ciudad', 110, curY + 28);
    ctx.fillStyle = style.accent;
    ctx.font = '16px Arial';
    ctx.fillText(style.label, 110, curY + 52);

    curY += 80;

    // ========================
    // RESUMEN BOX
    // ========================
    if (outfit?.resumen) {
      const boxX = 32, boxW = W - 64;
      const resumeText = `"${outfit.resumen}"`;

      // Measure how tall it'll be
      ctx.font = '15px Arial';
      const words = resumeText.split(' ');
      let lineCount = 1, testLine = '';
      for (const w of words) {
        const t = testLine + (testLine ? ' ' : '') + w;
        if (ctx.measureText(t).width > boxW - 32) { lineCount++; testLine = w; } else testLine = t;
      }
      lineCount = Math.min(lineCount, 4);
      const boxH = lineCount * 22 + 24;

      roundRect(boxX, curY, boxW, boxH, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();

      // Left accent bar
      ctx.fillStyle = style.accent;
      ctx.fillRect(boxX, curY, 4, boxH);

      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.font = '15px Arial';
      ctx.textAlign = 'left';
      wrapText(resumeText, boxX + 18, curY + 18, boxW - 32, 22, 4);

      curY += boxH + 16;
    }

    // ========================
    // PRENDAS GRID (max 4)
    // ========================
    const prendas = (outfit?.prendas || []).slice(0, 4);
    if (prendas.length > 0) {
      const cols = 2;
      const cellW = (W - 64 - 8) / cols;
      const cellH = 60;

      // Category-to-emoji map
      const catEmoji = (cat = '', nombre = '') => {
        const c = (cat + nombre).toLowerCase();
        if (c.includes('top') || c.includes('camiset') || c.includes('camisa')) return '👕';
        if (c.includes('bottom') || c.includes('pantal')) return '👖';
        if (c.includes('calzado') || c.includes('zapat') || c.includes('bota') || c.includes('sneak')) return '👟';
        if (c.includes('gorra') || c.includes('sombrero') || c.includes('gorro')) return '🧢';
        if (c.includes('accesorio') || c.includes('calcet')) return '🧦';
        if (c.includes('chaqueta') || c.includes('abrigo') || c.includes('sudadera')) return '🧥';
        return '👗';
      };

      prendas.forEach((prenda, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = 32 + col * (cellW + 8);
        const cy = curY + row * (cellH + 8);

        // Cell bg
        roundRect(cx, cy, cellW, cellH, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fill();
        roundRect(cx, cy, cellW, cellH, 10);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Emoji icon
        ctx.font = '22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(catEmoji(prenda.categoria, prenda.nombre_corto || prenda.tipo || ''), cx + 12, cy + 38);

        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Arial';
        const nombre = prenda.nombre_corto || prenda.tipo || '';
        const maxNombreW = cellW - 55;
        let displayNombre = nombre;
        while (ctx.measureText(displayNombre).width > maxNombreW && displayNombre.length > 3) {
          displayNombre = displayNombre.slice(0, -4) + '...';
        }
        ctx.fillText(displayNombre, cx + 44, cy + 28);

        // Color/subtitle
        if (prenda.color || prenda.categoria) {
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.font = '11px Arial';
          let sub = prenda.color || prenda.categoria || '';
          while (ctx.measureText(sub).width > maxNombreW && sub.length > 3) {
            sub = sub.slice(0, -4) + '...';
          }
          ctx.fillText(sub, cx + 44, cy + 46);
        }
      });

      curY += Math.ceil(prendas.length / cols) * (cellH + 8) + 8;
    }

    // ========================
    // FOOTER
    // ========================
    // Footer line
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, H - 50);
    ctx.lineTo(W - 32, H - 50);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '13px Arial';
    ctx.fillText('ventoo.vercel.app', 32, H - 24);

    ctx.textAlign = 'right';
    ctx.fillStyle = `rgba(${style.accentRgb},0.7)`;
    ctx.font = '13px Arial';
    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    ctx.fillText(dateStr, W - 32, H - 24);

    resolve(canvas);
  });
};

// Componente preview de la tarjeta (solo visual en el modal, no se captura)
const CardPreview = ({ outfit, weather, city }) => {
  const temp = weather?.current?.temperature_2m ?? null;
  const code = weather?.current?.weather_code ?? 0;
  const style = getWeatherStyle(code, temp ?? 20);
  const prendas = (outfit?.prendas || []).slice(0, 4);

  const weatherEmoji = code >= 95 ? '⛈️' : code >= 71 ? '❄️' : code >= 51 ? '🌧️' : code >= 45 ? '🌫️' : code >= 1 ? '⛅' : (temp ?? 20) >= 30 ? '🔥' : (temp ?? 20) >= 20 ? '☀️' : '🌤️';

  const catEmoji = (cat = '', nombre = '') => {
    const c = (cat + nombre).toLowerCase();
    if (c.includes('top') || c.includes('camiset') || c.includes('camisa')) return '👕';
    if (c.includes('bottom') || c.includes('pantal')) return '👖';
    if (c.includes('calzado') || c.includes('zapat') || c.includes('bota') || c.includes('sneak')) return '👟';
    if (c.includes('gorra') || c.includes('sombrero') || c.includes('gorro')) return '🧢';
    if (c.includes('accesorio') || c.includes('calcet')) return '🧦';
    if (c.includes('chaqueta') || c.includes('abrigo') || c.includes('sudadera')) return '🧥';
    return '👗';
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl flex flex-col"
      style={{
        width: 270,
        minHeight: 270,
        background: `linear-gradient(135deg, ${style.bgTop}, ${style.bgBot})`,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(circle at 20% 80%, rgba(${style.accentRgb},0.15) 0%, transparent 60%)`
      }} />
      {/* Top line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{
        background: `linear-gradient(to right, transparent, rgba(${style.accentRgb},0.6), transparent)`
      }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: style.accent }}>V</div>
          <span className="text-white font-bold text-base">Ventoo</span>
        </div>
        <span className="text-xl">{weatherEmoji}</span>
      </div>

      {/* Temp + city */}
      <div className="relative z-10 px-4 pb-2 flex items-center gap-3">
        {temp !== null && (
          <span className="text-white font-bold text-4xl">{Math.round(temp)}°</span>
        )}
        <div>
          <p className="text-white font-bold text-sm">{city || 'Mi ciudad'}</p>
          <p className="text-xs font-medium" style={{ color: style.accent }}>{style.label}</p>
        </div>
      </div>

      {/* Resumen */}
      {outfit?.resumen && (
        <div className="relative z-10 mx-4 mb-3 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${style.accent}` }}>
          <p className="text-white text-xs leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            &ldquo;{outfit.resumen}&rdquo;
          </p>
        </div>
      )}

      {/* Prendas */}
      {prendas.length > 0 && (
        <div className="relative z-10 px-4 pb-4 grid grid-cols-2 gap-2">
          {prendas.map((p, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-base shrink-0">{catEmoji(p.categoria, p.nombre_corto || p.tipo || '')}</span>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{p.nombre_corto || p.tipo || ''}</p>
                {(p.color || p.categoria) && (
                  <p className="text-gray-400 text-xs truncate">{p.color || p.categoria}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 mt-auto px-4 pb-3 pt-2 flex justify-between items-center border-t border-white/5">
        <span className="text-gray-400 text-xs">ventoo.vercel.app</span>
        <span className="text-xs" style={{ color: `rgba(${style.accentRgb},0.7)` }}>
          {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
        </span>
      </div>
    </div>
  );
};

// Modal principal
const OutfitShareCard = ({ outfit, weather, city, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCanvasImage(outfit, weather?.current, city);
      const link = document.createElement('a');
      link.download = `ventoo-outfit-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Error generando imagen:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCanvasImage(outfit, weather?.current, city);
      canvas.toBlob(async (blob) => {
        if (!blob) { setIsGenerating(false); return; }
        const file = new File([blob], 'ventoo-outfit.png', { type: 'image/png' });
        const shareUrl = generateShareLink();

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Mi outfit de hoy 💫',
              text: `Hoy en ${city}: mira mi look completo`,
              url: shareUrl,
            });
          } catch (e) {
            if (e.name !== 'AbortError') {
              // Fallback: solo share URL
              try { await navigator.share({ title: 'Mi outfit de hoy 💫', url: shareUrl }); } catch {}
            }
          }
        } else if (navigator.share) {
          // Dispositivo soporta share pero no archivos — compartir solo la URL
          try {
            await navigator.share({ title: 'Mi outfit de hoy 💫', url: shareUrl });
          } catch (e) {
            if (e.name !== 'AbortError') handleDownload();
          }
        } else {
          // Escritorio sin Web Share API → descargar imagen
          const link = document.createElement('a');
          link.download = `ventoo-outfit-${new Date().toISOString().split('T')[0]}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
        setIsGenerating(false);
      }, 'image/png');
    } catch (e) {
      console.error('Error en handleShare:', e);
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = generateShareLink();
      await navigator.clipboard.writeText(url);
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
          className="bg-gray-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
            <div>
              <h3 className="text-white font-bold text-lg">Compartir outfit</h3>
              <p className="text-gray-400 text-sm">Comparte tu look de hoy</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Preview card */}
          <div className="p-6 flex justify-center">
            <CardPreview outfit={outfit} weather={weather} city={city} />
          </div>

          {/* Botones */}
          <div className="px-6 pb-4 grid grid-cols-3 gap-3">
            {/* Compartir */}
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

            {/* Guardar PNG */}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/8 hover:bg-white/12 text-white border border-white/10 transition-all disabled:opacity-50"
            >
              <Download size={20} />
              <span className="text-xs font-semibold">Guardar PNG</span>
            </button>

            {/* Copiar link (solo URL) */}
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400 shrink-0">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
            <p className="text-gray-400 text-xs leading-relaxed">
              Descarga la imagen y súbela a tus Stories o al feed de Instagram.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OutfitShareCard;
