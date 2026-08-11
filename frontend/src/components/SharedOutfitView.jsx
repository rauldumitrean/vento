import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shirt, Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind, ArrowLeft, Clock, AlertCircle } from 'lucide-react';

// ─── Weather style ─────────────────────────────────────────────────────────────
const getWeatherStyle = (code, temp) => {
  if (code >= 95) return { Icon: CloudLightning, label: 'Tormenta',     gradient: 'from-gray-900 via-slate-800 to-gray-900', accent: '#6366f1', accRgb: '99,102,241'   };
  if (code >= 71) return { Icon: Snowflake,      label: 'Nieve',         gradient: 'from-sky-950 via-blue-900 to-slate-900',  accent: '#93c5fd', accRgb: '147,197,253' };
  if (code >= 51) return { Icon: CloudRain,      label: 'Lluvia',        gradient: 'from-slate-900 via-blue-950 to-gray-900', accent: '#60a5fa', accRgb: '96,165,250'  };
  if (code >= 45) return { Icon: Wind,           label: 'Niebla',        gradient: 'from-gray-800 via-gray-900 to-slate-900', accent: '#94a3b8', accRgb: '148,163,184' };
  if (code >= 1)  return { Icon: Cloud,          label: 'Nublado',       gradient: 'from-slate-900 via-indigo-950 to-gray-900',accent: '#a5b4fc',accRgb: '165,180,252' };
  if (temp >= 35) return { Icon: Sun,            label: 'Calor extremo', gradient: 'from-red-950 via-orange-950 to-gray-900',  accent: '#f97316', accRgb: '249,115,22' };
  if (temp >= 28) return { Icon: Sun,            label: 'Calor intenso', gradient: 'from-orange-950 via-red-950 to-gray-900', accent: '#fb923c', accRgb: '251,146,60'  };
  if (temp >= 20) return { Icon: Sun,            label: 'Soleado',       gradient: 'from-amber-950 via-yellow-950 to-gray-900',accent: '#fbbf24',accRgb: '251,191,36' };
  return           { Icon: Sun,                  label: 'Fresco',        gradient: 'from-indigo-950 via-slate-900 to-gray-900',accent: '#818cf8', accRgb: '129,140,248'};
};

// ─── Category badge config ──────────────────────────────────────────────────────
const getCatBadge = (cat = '', nombre = '') => {
  const c = (cat + ' ' + nombre).toLowerCase();
  if (c.includes('top') || c.includes('camiset') || c.includes('camisa') || c.includes('polo'))
    return { label: 'TOP',  color: '#3b82f6' };
  if (c.includes('bottom') || c.includes('pantal') || c.includes('falda') || c.includes('short'))
    return { label: 'BTM',  color: '#8b5cf6' };
  if (c.includes('calzado') || c.includes('zapat') || c.includes('bota') || c.includes('sneak'))
    return { label: 'CAL',  color: '#10b981' };
  if (c.includes('accesorio') || c.includes('calcet') || c.includes('gorra'))
    return { label: 'ACC',  color: '#f59e0b' };
  if (c.includes('chaqueta') || c.includes('abrigo') || c.includes('sudadera') || c.includes('jersey'))
    return { label: 'OUT',  color: '#ec4899' };
  return                      { label: 'PND',  color: '#6366f1' };
};

// ─── Clothing icon (vector SVG) ────────────────────────────────────────────────
export const ClothingIcon = ({ tipo, size = 20 }) => {
  const t = (tipo || '').toLowerCase();
  if (t.includes('pantal') || t.includes('bottom') || t.includes('falda'))
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l1 18-4-1-3-10-3 10-4 1 1-18z"/></svg>;
  if (t.includes('calzado') || t.includes('zapat') || t.includes('bota') || t.includes('sneak'))
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M4 16h16M4 16l2-4h12l2 4M8 12V8a4 4 0 0 1 8 0v4"/></svg>;
  if (t.includes('chaqueta') || t.includes('abrigo') || t.includes('sudadera') || t.includes('jersey') || t.includes('outer'))
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/><path d="M12 2v20"/></svg>;
  if (t.includes('calcet') || t.includes('accesorio') || t.includes('gorra'))
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z"/><path d="M12 13V2"/><path d="M12 13l-4-4"/><path d="M12 13l4-4"/></svg>;
  return <Shirt size={size} />;
};

// ─── Expired screen ────────────────────────────────────────────────────────────
const ExpiredView = () => (
  <div className="min-h-[100dvh] bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5">
      <Clock size={28} className="text-orange-400" />
    </div>
    <h2 className="text-white text-2xl font-bold mb-2">Enlace expirado</h2>
    <p className="text-gray-400 mb-2 max-w-xs">
      Este outfit compartido ya no está disponible. Los enlaces de Ventoo expiran a los 45 minutos.
    </p>
    <p className="text-gray-600 text-sm mb-8">Pide al usuario que genere un nuevo enlace desde la app.</p>
    <button
      onClick={() => window.location.href = '/'}
      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
    >
      Crear mi propio outfit →
    </button>
  </div>
);

// ─── Error screen ──────────────────────────────────────────────────────────────
const ErrorView = () => (
  <div className="min-h-[100dvh] bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
      <AlertCircle size={28} className="text-red-400" />
    </div>
    <h2 className="text-white text-xl font-bold mb-2">Outfit no encontrado</h2>
    <p className="text-gray-400 mb-8">El enlace parece ser inválido o estar corrupto.</p>
    <button
      onClick={() => window.location.href = '/'}
      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-bold transition-all"
    >
      Ir a Ventoo
    </button>
  </div>
);

// ─── Main shared view ──────────────────────────────────────────────────────────
const SharedOutfitView = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState('loading'); // loading | expired | error | ok
  const [data, setData]   = useState(null);

  useEffect(() => {
    try {
      const b64 = searchParams.get('data');
      if (!b64) { setState('error'); return; }

      const decoded = JSON.parse(decodeURIComponent(atob(b64)));

      // Check expiry (links without exp field are treated as valid — backward compat)
      if (decoded.exp && Date.now() > decoded.exp) {
        setState('expired');
        return;
      }

      setData(decoded);
      setState('ok');
    } catch (e) {
      console.error('Error decoding shared data', e);
      setState('error');
    }
  }, [searchParams]);

  if (state === 'loading') return (
    <div className="min-h-[100dvh] bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (state === 'expired') return <ExpiredView />;
  if (state === 'error')   return <ErrorView />;

  const temp    = data.weather?.temperature_2m ?? data.weather?.current?.temperature_2m ?? 0;
  const code    = data.weather?.weather_code   ?? data.weather?.current?.weather_code   ?? 0;
  const style   = getWeatherStyle(code, temp);
  const prendas = data.outfit?.prendas || [];
  const WeatherIcon = style.Icon;

  return (
    <div className={`min-h-[100dvh] bg-gradient-to-br ${style.gradient} flex flex-col p-4 md:p-8`}
      style={{ fontFamily: "'Inter', 'Arial', sans-serif" }}>
      <div className="max-w-md w-full mx-auto relative flex-1 flex flex-col">

        {/* Back nav */}
        <button
          onClick={() => window.location.href = '/'}
          className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-semibold">Crear mi propio outfit</span>
        </button>

        {/* Main card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden relative shadow-2xl">
          {/* Glows */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(circle at 10% 90%, rgba(${style.accRgb},.2) 0%, transparent 55%),
                         radial-gradient(circle at 90% 10%, rgba(${style.accRgb},.10) 0%, transparent 50%)`
          }} />
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{
            background: `linear-gradient(to right, rgba(${style.accRgb},.8), transparent)`
          }} />

          {/* Header row */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                style={{ background: style.accent }}>V</div>
              <span className="text-white font-black text-lg tracking-tight">Ventoo</span>
            </div>
            <WeatherIcon size={28} className="text-white drop-shadow-md" />
          </div>

          {/* Temperature + city */}
          <div className="relative z-10 px-6 pb-4">
            <div className="flex items-start gap-1">
              <span className="text-white font-black leading-none" style={{ fontSize: '4.5rem' }}>
                {Math.round(temp)}
              </span>
              <span className="font-bold text-3xl mt-1" style={{ color: style.accent }}>°</span>
            </div>
            <p className="text-white font-bold text-xl mt-0.5">{data.city || 'Mi ciudad'}</p>
            <span
              className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full"
              style={{
                background: `rgba(${style.accRgb},.15)`,
                color: style.accent,
                border: `1px solid rgba(${style.accRgb},.35)`
              }}
            >{style.label}</span>
          </div>

          {/* Divider */}
          <div className="mx-6 mb-4" style={{
            height: 1,
            background: `linear-gradient(to right, rgba(${style.accRgb},.6), transparent)`
          }} />

          {/* Resumen */}
          {data.outfit?.resumen && (
            <div className="relative z-10 mx-6 mb-5 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.045)',
                borderLeft: `3px solid ${style.accent}`,
                border: `1px solid rgba(255,255,255,0.07)`,
                borderLeftColor: style.accent,
                borderLeftWidth: 3,
              }}
            >
              <p className="text-white/85 text-sm leading-relaxed">"{data.outfit.resumen}"</p>
            </div>
          )}

          {/* Prendas */}
          <div className="relative z-10 px-6 pb-6 flex flex-col gap-2">
            {prendas.map((prenda, i) => {
              // Support both field naming conventions
              const nombre = prenda.nombre_corto || prenda.nombre || prenda.tipo || 'Prenda';
              const cat    = prenda.categoria || prenda.tipo || '';
              const badge  = getCatBadge(cat, nombre);

              return (
                <div key={i}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-transform hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.042)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {/* Badge */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: badge.color + '22', color: badge.color, border: `1px solid ${badge.color}44` }}
                  >
                    {badge.label}
                  </div>
                  {/* Info */}
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{nombre}</p>
                    {prenda.color && (
                      <p className="text-xs text-white/40 mt-0.5">{prenda.color}</p>
                    )}
                  </div>
                  {/* Icon */}
                  <div className="ml-auto text-white/30 shrink-0">
                    <ClothingIcon tipo={cat} size={18} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="relative z-10 px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-white/25 text-xs">ventoo.vercel.app</span>
            <div className="flex items-center gap-1 text-xs" style={{ color: `rgba(${style.accRgb},.5)` }}>
              <Clock size={10} />
              <span>Enlace con validez de 45 min</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center pb-10">
          <p className="text-white/50 text-sm mb-4">¿Quieres saber qué ponerte hoy según el clima?</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 rounded-2xl text-white font-bold shadow-xl active:scale-95 transition-all"
            style={{ background: style.accent }}
          >
            Probar Ventoo gratis →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedOutfitView;
