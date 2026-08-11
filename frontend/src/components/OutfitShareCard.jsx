import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, X, Copy, Check, Clock } from 'lucide-react';

// ─── Weather styles ────────────────────────────────────────────────────────────
const getWeatherStyle = (code, temp) => {
  if (code >= 95) return { label: 'Tormenta',     bgA: '#0d1117', bgB: '#1c2333', acc: '#6366f1', accRgb: '99,102,241',   headerBg: '#1e1b4b' };
  if (code >= 71) return { label: 'Nieve',         bgA: '#0a1628', bgB: '#0f2744', acc: '#93c5fd', accRgb: '147,197,253', headerBg: '#0c2254' };
  if (code >= 51) return { label: 'Lluvia',        bgA: '#0d1117', bgB: '#111827', acc: '#60a5fa', accRgb: '96,165,250',  headerBg: '#0d1f3c' };
  if (code >= 45) return { label: 'Niebla',        bgA: '#111318', bgB: '#1a1d2e', acc: '#94a3b8', accRgb: '148,163,184', headerBg: '#1a1d2e' };
  if (code >= 1)  return { label: 'Nublado',       bgA: '#0d1117', bgB: '#13113d', acc: '#a5b4fc', accRgb: '165,180,252', headerBg: '#1e1b4b' };
  if (temp >= 35) return { label: 'Calor extremo', bgA: '#150800', bgB: '#2a0d00', acc: '#f97316', accRgb: '249,115,22',  headerBg: '#431407' };
  if (temp >= 28) return { label: 'Calor intenso', bgA: '#120a00', bgB: '#241400', acc: '#fb923c', accRgb: '251,146,60',  headerBg: '#3b1507' };
  if (temp >= 20) return { label: 'Soleado',       bgA: '#11100a', bgB: '#1f1b00', acc: '#fbbf24', accRgb: '251,191,36',  headerBg: '#3b2800' };
  return           { label: 'Fresco',              bgA: '#0d1117', bgB: '#0f1a33', acc: '#818cf8', accRgb: '129,140,248', headerBg: '#1e1b4b' };
};

// Category badge config (for canvas — no emojis, reliable colored badges)
const getCatBadge = (cat = '', nombre = '') => {
  const c = (cat + ' ' + nombre).toLowerCase();
  if (c.includes('top') || c.includes('camiset') || c.includes('camisa') || c.includes('polo'))
    return { letter: 'TOP', color: '#3b82f6' };
  if (c.includes('bottom') || c.includes('pantal') || c.includes('falda') || c.includes('short'))
    return { letter: 'BTM', color: '#8b5cf6' };
  if (c.includes('calzado') || c.includes('zapat') || c.includes('bota') || c.includes('sneak') || c.includes('zapatilla'))
    return { letter: 'CAL', color: '#10b981' };
  if (c.includes('accesorio') || c.includes('calcet') || c.includes('gorra') || c.includes('gorro') || c.includes('cinturon'))
    return { letter: 'ACC', color: '#f59e0b' };
  if (c.includes('chaqueta') || c.includes('abrigo') || c.includes('sudadera') || c.includes('jersey') || c.includes('outer'))
    return { letter: 'OUT', color: '#ec4899' };
  return { letter: 'PND', color: '#6366f1' };
};

// ─── Canvas image generator (pure native Canvas API) ──────────────────────────
const generateCanvasImage = (outfit, weatherCurrent, city) => {
  return new Promise((resolve) => {
    const S = 2;          // retina scale
    const W = 540;
    const H = 680;        // taller to have room for all items
    const canvas = document.createElement('canvas');
    canvas.width  = W * S;
    canvas.height = H * S;
    const ctx = canvas.getContext('2d');
    ctx.scale(S, S);

    const temp = weatherCurrent?.temperature_2m ?? null;
    const code = weatherCurrent?.weather_code ?? 0;
    const st   = getWeatherStyle(code, temp ?? 20);
    const prendas = (outfit?.prendas || []).slice(0, 5);

    // ── Background ─────────────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W * 0.4, H);
    bgGrad.addColorStop(0, st.bgA);
    bgGrad.addColorStop(1, st.bgB);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Ambient glow — bottom left
    const glow1 = ctx.createRadialGradient(W * 0.1, H * 0.85, 0, W * 0.1, H * 0.85, W * 0.6);
    glow1.addColorStop(0, `rgba(${st.accRgb},0.18)`);
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    // Ambient glow — top right
    const glow2 = ctx.createRadialGradient(W * 0.9, H * 0.12, 0, W * 0.9, H * 0.12, W * 0.45);
    glow2.addColorStop(0, `rgba(${st.accRgb},0.10)`);
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // ── Helpers ─────────────────────────────────────────────────────────────────
    const rr = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    };

    const wrapText = (text, x, y, maxW, lineH, maxLines = 99) => {
      const words = text.split(' ');
      let line = '';
      let drawn = 0;
      let outY = y;
      for (let i = 0; i < words.length; i++) {
        const test = line + (line ? ' ' : '') + words[i];
        if (ctx.measureText(test).width > maxW && line) {
          if (drawn + 1 >= maxLines) {
            ctx.fillText(line + (i < words.length - 1 ? '…' : ''), x, outY);
            return outY + lineH;
          }
          ctx.fillText(line, x, outY);
          outY += lineH;
          drawn++;
          line = words[i];
        } else {
          line = test;
        }
      }
      if (line) { ctx.fillText(line, x, outY); outY += lineH; }
      return outY;
    };

    // ── Header strip ────────────────────────────────────────────────────────────
    // Logo pill
    const LX = 28, LY = 28;
    rr(LX, LY, 36, 36, 10);
    ctx.fillStyle = st.acc;
    ctx.fill();
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V', LX + 18, LY + 19);

    // App name
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Ventoo', LX + 46, LY + 25);

    // "Outfit del día" label — top right
    ctx.textAlign = 'right';
    ctx.font = '12px Arial';
    ctx.fillStyle = `rgba(${st.accRgb},0.8)`;
    ctx.fillText('Outfit del día', W - 28, LY + 25);

    // Top accent line
    const topLine = ctx.createLinearGradient(0, 0, W, 0);
    topLine.addColorStop(0, 'transparent');
    topLine.addColorStop(0.4, `rgba(${st.accRgb},0.7)`);
    topLine.addColorStop(1, 'transparent');
    ctx.strokeStyle = topLine;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.stroke();

    // ── Temperature hero block ───────────────────────────────────────────────────
    const heroY = 92;

    // Big temperature
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px Arial';
    const tempStr = temp !== null ? `${Math.round(temp)}` : '--';
    ctx.fillText(tempStr, 28, heroY + 80);

    // Degree symbol (smaller, superscript-like)
    const tempW = ctx.measureText(tempStr).width;
    ctx.font = 'bold 38px Arial';
    ctx.fillStyle = `rgba(${st.accRgb}, 0.85)`;
    ctx.fillText('°', 28 + tempW + 4, heroY + 34);

    // City name — separate row below temperature
    ctx.textAlign = 'left';
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(city || 'Mi ciudad', 28, heroY + 110);

    // Weather label pill
    const labelText = st.label;
    ctx.font = 'bold 13px Arial';
    const labelW = ctx.measureText(labelText).width;
    const pillW = labelW + 24;
    const pillH = 26;
    const pillX = 28;
    const pillY = heroY + 122;
    rr(pillX, pillY, pillW, pillH, 13);
    ctx.fillStyle = `rgba(${st.accRgb}, 0.18)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${st.accRgb}, 0.45)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = st.acc;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, pillX + 12, pillY + pillH / 2);

    // Divider
    const divY = heroY + 164;
    const divGrad = ctx.createLinearGradient(28, 0, W - 28, 0);
    divGrad.addColorStop(0, `rgba(${st.accRgb},0.6)`);
    divGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, divY);
    ctx.lineTo(W - 28, divY);
    ctx.stroke();

    // ── Resumen box ──────────────────────────────────────────────────────────────
    let curY = divY + 16;

    if (outfit?.resumen) {
      const boxX = 28, boxW = W - 56;
      // Estimate height
      ctx.font = '14px Arial';
      const approxLines = Math.min(3, Math.ceil(outfit.resumen.length / 58));
      const boxH = approxLines * 20 + 24;

      rr(boxX, curY, boxW, boxH, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.045)';
      ctx.fill();
      // Left accent bar
      ctx.fillStyle = st.acc;
      ctx.fillRect(boxX, curY, 3, boxH);

      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      wrapText(`"${outfit.resumen}"`, boxX + 16, curY + 20, boxW - 28, 20, 3);

      curY += boxH + 14;
    }

    // ── Prendas list ────────────────────────────────────────────────────────────
    const itemH = 56;
    const itemGap = 8;

    prendas.forEach((p) => {
      const nombre = p.nombre_corto || p.nombre || p.tipo || 'Prenda';
      const cat    = p.categoria || p.tipo || '';
      const badge  = getCatBadge(cat, nombre);

      // Row bg
      rr(28, curY, W - 56, itemH, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.042)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Badge circle
      const bCX = 28 + 16 + 18; // center x of badge
      const bCY = curY + itemH / 2;
      ctx.beginPath();
      ctx.arc(bCX, bCY, 18, 0, Math.PI * 2);
      ctx.fillStyle = badge.color + '28';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bCX, bCY, 18, 0, Math.PI * 2);
      ctx.strokeStyle = badge.color + '55';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = badge.color;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badge.letter, bCX, bCY);

      // Name
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Arial';
      const maxNombreW = W - 56 - 70;
      let displayNombre = nombre;
      while (ctx.measureText(displayNombre).width > maxNombreW && displayNombre.length > 4) {
        displayNombre = displayNombre.slice(0, -4) + '…';
      }
      ctx.fillText(displayNombre, 28 + 52, curY + 26);

      // Color / category subtitle
      const sub = p.color || cat;
      if (sub) {
        ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.font = '12px Arial';
        let displaySub = sub;
        while (ctx.measureText(displaySub).width > maxNombreW && displaySub.length > 4) {
          displaySub = displaySub.slice(0, -4) + '…';
        }
        ctx.fillText(displaySub, 28 + 52, curY + 43);
      }

      curY += itemH + itemGap;
    });

    curY += 8;

    // ── Footer ──────────────────────────────────────────────────────────────────
    const footerY = H - 42;
    // Footer line
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, footerY - 10);
    ctx.lineTo(W - 28, footerY - 10);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font = '13px Arial';
    ctx.fillText('ventoo.vercel.app', 28, footerY + 14);

    ctx.textAlign = 'right';
    ctx.fillStyle = `rgba(${st.accRgb},0.55)`;
    ctx.font = '13px Arial';
    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillText(dateStr, W - 28, footerY + 14);

    resolve(canvas);
  });
};

// ─── Preview card (inside modal — DOM only, no capture) ───────────────────────
const CardPreview = ({ outfit, weather, city }) => {
  const temp = weather?.current?.temperature_2m ?? null;
  const code = weather?.current?.weather_code ?? 0;
  const st   = getWeatherStyle(code, temp ?? 20);
  const prendas = (outfit?.prendas || []).slice(0, 4);

  const weatherLabel = (() => {
    if (code >= 95) return '⛈';
    if (code >= 71) return '❄️';
    if (code >= 51) return '🌧';
    if (code >= 45) return '🌫';
    if (code >= 1)  return '⛅';
    return (temp ?? 20) >= 28 ? '🔥' : (temp ?? 20) >= 20 ? '☀️' : '🌤';
  })();

  return (
    <div
      className="relative overflow-hidden rounded-2xl flex flex-col select-none"
      style={{
        width: 270,
        minHeight: 340,
        background: `linear-gradient(145deg, ${st.bgA}, ${st.bgB})`,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Glows */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(circle at 10% 85%, rgba(${st.accRgb},.2) 0%, transparent 55%),
                     radial-gradient(circle at 90% 10%, rgba(${st.accRgb},.10) 0%, transparent 50%)`
      }} />
      {/* Top line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{
        background: `linear-gradient(to right, rgba(${st.accRgb},.8), transparent)`
      }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: st.acc }}>V</div>
          <span className="text-white font-bold text-base">Ventoo</span>
        </div>
        <span className="text-xl">{weatherLabel}</span>
      </div>

      {/* Temp + city */}
      <div className="relative z-10 px-4 pt-1 pb-3">
        <div className="flex items-start gap-1">
          <span className="text-white font-black" style={{ fontSize: 52, lineHeight: 1 }}>
            {temp !== null ? Math.round(temp) : '--'}
          </span>
          <span className="font-bold mt-1" style={{ fontSize: 22, color: st.acc }}>°</span>
        </div>
        <p className="text-white font-bold text-base mt-0.5">{city || 'Mi ciudad'}</p>
        <span
          className="inline-block text-xs font-semibold mt-1 px-2 py-0.5 rounded-full"
          style={{ background: `rgba(${st.accRgb},.18)`, color: st.acc, border: `1px solid rgba(${st.accRgb},.35)` }}
        >{st.label}</span>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-3" style={{ height: 1, background: `linear-gradient(to right, rgba(${st.accRgb},.6), transparent)` }} />

      {/* Resumen */}
      {outfit?.resumen && (
        <div className="relative z-10 mx-4 mb-3 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.045)', borderLeft: `3px solid ${st.acc}` }}>
          <p className="text-white text-xs leading-relaxed opacity-80"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            "{outfit.resumen}"
          </p>
        </div>
      )}

      {/* Prendas */}
      <div className="relative z-10 px-4 pb-4 flex flex-col gap-2">
        {prendas.map((p, i) => {
          const badge = getCatBadge(p.categoria || '', p.nombre_corto || p.nombre || '');
          return (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.042)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ background: badge.color + '28', color: badge.color, border: `1px solid ${badge.color}55` }}>
                {badge.letter.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre_corto || p.nombre || p.tipo || ''}</p>
                <p className="text-xs opacity-40"
                  style={{ color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.color || p.categoria || ''}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-auto px-4 pb-3 pt-2 border-t flex justify-between items-center"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <span className="text-xs opacity-30 text-white">ventoo.vercel.app</span>
        <span className="text-xs" style={{ color: `rgba(${st.accRgb},.55)` }}>
          {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
        </span>
      </div>
    </div>
  );
};

// ─── Share link (with 45-min expiry embedded) ─────────────────────────────────
const generateShareLink = (outfit, weather, city) => {
  try {
    const payload = {
      city: city || 'Ciudad',
      weather: weather?.current,
      outfit,
      exp: Date.now() + 45 * 60 * 1000,  // expires in 45 minutes
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
    return `https://ventoo.vercel.app/shared?data=${encoded}`;
  } catch {
    return 'https://ventoo.vercel.app';
  }
};

// ─── Helpers de texto para compartir ─────────────────────────────────────────
const buildShareText = (outfit, city) => {
  const temp = outfit?.temperatura || '';
  const resumen = outfit?.resumen || '';
  const prendas = (outfit?.prendas || []).map(p => `• ${p.nombre_corto || p.nombre || p.tipo}`).join('\n');
  const cityStr = city ? ` en ${city}` : '';
  return `✨ Mi outfit de hoy${cityStr}${temp ? ` (${temp})` : ''}:\n\n${prendas}${resumen ? `\n\n"${resumen}"` : ''}\n\nGenerado con Ventoo 🌤`;
};

// ─── Modal principal ──────────────────────────────────────────────────────────
const OutfitShareCard = ({ outfit, weather, city, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInstagramLoading, setIsInstagramLoading] = useState(false);
  const [copied, setCopied]             = useState(false);
  const [instagramDone, setInstagramDone] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCanvasImage(outfit, weather?.current, city);
      const link   = document.createElement('a');
      link.download = `ventoo-outfit-${new Date().toISOString().split('T')[0]}.png`;
      link.href     = canvas.toDataURL('image/png');
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
      const shareUrl = generateShareLink(outfit, weather, city);
      const shareText = buildShareText(outfit, city);

      canvas.toBlob(async (blob) => {
        if (!blob) { setIsGenerating(false); return; }
        const file = new File([blob], 'ventoo-outfit.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Mi outfit de hoy 💫', text: shareText, url: shareUrl });
          } catch (e) {
            if (e.name !== 'AbortError') {
              try { await navigator.share({ title: 'Mi outfit de hoy 💫', text: shareText, url: shareUrl }); } catch {}
            }
          }
        } else if (navigator.share) {
          try { await navigator.share({ title: 'Mi outfit de hoy 💫', text: shareText, url: shareUrl }); } catch {}
        } else {
          // Desktop fallback: download
          const a = document.createElement('a');
          a.download = `ventoo-outfit-${new Date().toISOString().split('T')[0]}.png`;
          a.href = canvas.toDataURL('image/png');
          a.click();
        }
        setIsGenerating(false);
      }, 'image/png');
    } catch (e) {
      console.error('Error:', e);
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = generateShareLink(outfit, weather, city);
      const text = buildShareText(outfit, city);
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* no-op */ }
  };

  const handleWhatsApp = () => {
    const url  = generateShareLink(outfit, weather, city);
    const text = buildShareText(outfit, city);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`;
    window.open(waUrl, '_blank', 'noopener');
  };

  const handleTwitter = () => {
    const url    = generateShareLink(outfit, weather, city);
    const prendas = (outfit?.prendas || []).map(p => p.nombre_corto || p.nombre || p.tipo).slice(0, 3).join(', ');
    const city2  = city ? ` en ${city}` : '';
    const tweet  = `✨ Mi outfit de hoy${city2}: ${prendas}. Generado con @ventooapp 🌤 #Moda #Outfit`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'noopener');
  };

  // Instagram: descarga la imagen automáticamente y abre Instagram
  const handleInstagram = async () => {
    setIsInstagramLoading(true);
    try {
      const canvas = await generateCanvasImage(outfit, weather?.current, city);
      // Descarga la imagen para que el usuario la suba
      const link = document.createElement('a');
      link.download = `ventoo-outfit-instagram.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      // Pequeña pausa, luego abrimos Instagram
      setTimeout(() => {
        window.open('https://www.instagram.com/', '_blank', 'noopener');
        setInstagramDone(true);
        setTimeout(() => setInstagramDone(false), 3000);
      }, 800);
    } catch (e) {
      console.error('Error para Instagram:', e);
    } finally {
      setIsInstagramLoading(false);
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
              <p className="text-gray-400 text-sm flex items-center gap-1">
                <Clock size={12} className="inline" />
                El enlace expira en 45 minutos
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Preview */}
          <div className="p-6 flex justify-center">
            <CardPreview outfit={outfit} weather={weather} city={city} />
          </div>

          {/* Fila 1: Compartir nativo + Descargar PNG */}
          <div className="px-6 pb-3 grid grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              disabled={isGenerating}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              {isGenerating
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Share2 size={20} />}
              <span className="text-xs font-semibold">{isGenerating ? 'Generando…' : 'Compartir'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/8 hover:bg-white/12 text-white border border-white/10 transition-all disabled:opacity-50"
            >
              <Download size={20} />
              <span className="text-xs font-semibold">Guardar PNG</span>
            </button>
          </div>

          {/* Fila 2: WhatsApp + Twitter/X + Instagram + Copiar link */}
          <div className="px-6 pb-3 grid grid-cols-4 gap-2">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl text-white border border-white/10 transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(37,211,102,0.12)', borderColor: 'rgba(37,211,102,0.25)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#25d366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-xs font-semibold text-[#25d366]" style={{ fontSize: 9 }}>WhatsApp</span>
            </button>

            {/* Twitter / X */}
            <button
              onClick={handleTwitter}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl text-white border border-white/10 transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(29,161,242,0.12)', borderColor: 'rgba(29,161,242,0.25)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#1da1f2]">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.774-8.907L1.254 2.25H8.08l4.261 5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-xs font-semibold text-[#1da1f2]" style={{ fontSize: 9 }}>Twitter / X</span>
            </button>

            {/* Instagram — descarga + abre Instagram */}
            <button
              onClick={handleInstagram}
              disabled={isInstagramLoading}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl text-white border transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, rgba(131,58,180,0.18), rgba(253,29,29,0.12), rgba(252,176,69,0.12))', borderColor: 'rgba(219,39,119,0.35)' }}
            >
              {isInstagramLoading ? (
                <div className="w-5 h-5 border-2 border-pink-400/40 border-t-pink-400 rounded-full animate-spin" />
              ) : instagramDone ? (
                <Check size={20} className="text-green-400" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              )}
              <span className="text-pink-300 font-semibold" style={{ fontSize: 9 }}>
                {instagramDone ? '¡Listo!' : 'Instagram'}
              </span>
            </button>

            {/* Copiar link */}
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/8 hover:bg-white/12 text-white border border-white/10 transition-all hover:scale-105 active:scale-95"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
              <span className="text-xs font-semibold" style={{ fontSize: 9 }}>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          {/* Instagram tip mejorado */}
          <div className="mx-6 mb-6 mt-2 px-4 py-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(219,39,119,0.08), rgba(124,58,237,0.08))', border: '1px solid rgba(219,39,119,0.18)' }}>
            <p className="text-gray-400 text-xs leading-relaxed">
              📸 <b className="text-pink-300">Instagram</b>: pulsa el botón para descargar la imagen automáticamente y se abrirá Instagram. Sube la imagen a Stories o al feed desde tu galería.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OutfitShareCard;
