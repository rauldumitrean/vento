import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shirt, Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind, ArrowLeft } from 'lucide-react';

const getWeatherStyle = (weatherCode, temp) => {
  if (weatherCode >= 95) return { Icon: CloudLightning, label: 'Tormenta', gradient: 'from-gray-900 via-slate-800 to-gray-900', accent: '#6366f1' };
  if (weatherCode >= 71) return { Icon: Snowflake, label: 'Nieve', gradient: 'from-sky-950 via-blue-900 to-slate-900', accent: '#93c5fd' };
  if (weatherCode >= 51) return { Icon: CloudRain, label: 'Lluvia', gradient: 'from-slate-900 via-blue-950 to-gray-900', accent: '#60a5fa' };
  if (weatherCode >= 45) return { Icon: Wind, label: 'Niebla', gradient: 'from-gray-800 via-gray-900 to-slate-900', accent: '#9ca3af' };
  if (weatherCode >= 1) return { Icon: Cloud, label: 'Nublado', gradient: 'from-slate-900 via-indigo-950 to-gray-900', accent: '#a5b4fc' };
  if (temp >= 30) return { Icon: Sun, label: 'Calor intenso', gradient: 'from-orange-950 via-red-950 to-gray-900', accent: '#fb923c' };
  if (temp >= 20) return { Icon: Sun, label: 'Soleado', gradient: 'from-amber-950 via-yellow-950 to-gray-900', accent: '#fbbf24' };
  return { Icon: Sun, label: 'Fresco', gradient: 'from-indigo-950 via-slate-900 to-gray-900', accent: '#818cf8' };
};

export const ClothingIcon = ({ tipo, size = 20 }) => {
  const t = (tipo || '').toLowerCase();
  if (t.includes('pantal')) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l1 18-4-1-3-10-3 10-4 1 1-18z"/></svg>;
  if (t.includes('zapat') || t.includes('zapa') || t.includes('bot') || t.includes('snaker')) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M4 16h16M4 16l2-4h12l2 4M8 12V8a4 4 0 0 1 8 0v4"/></svg>;
  if (t.includes('chaquet') || t.includes('abrig') || t.includes('sudadera') || t.includes('jerse')) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/><path d="M12 2v20"/></svg>;
  return <Shirt size={size} />;
};

const SharedOutfitView = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    try {
      const b64 = searchParams.get('data');
      if (b64) {
        const decoded = JSON.parse(decodeURIComponent(atob(b64)));
        setData(decoded);
      }
    } catch (e) {
      console.error('Error decoding shared data', e);
    }
  }, [searchParams]);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-white text-xl font-bold mb-2">Outfit no encontrado</h2>
        <p className="text-gray-400 mb-6">El enlace parece ser inválido o estar corrupto.</p>
        <button onClick={() => window.location.href = '/'} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all">
          Ir a Ventoo
        </button>
      </div>
    );
  }

  const temp = data.weather?.temperature_2m ?? 0;
  const code = data.weather?.weather_code ?? 0;
  const style = getWeatherStyle(code, temp);
  const prendas = data.outfit?.prendas || [];

  const WeatherIcon = style.Icon;

  return (
    <div className={`min-h-[100dvh] bg-gradient-to-br ${style.gradient} flex flex-col p-4 md:p-8 font-sans`}>
      <div className="max-w-md w-full mx-auto relative flex-1 flex flex-col">
        {/* Nav */}
        <button onClick={() => window.location.href = '/'} className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span className="font-semibold text-sm">Crear mi propio outfit</span>
        </button>

        {/* Card */}
        <div className="bg-gray-950/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, ${style.accent}44 0%, transparent 60%), radial-gradient(circle at 80% 20%, ${style.accent}22 0%, transparent 60%)`
            }}
          />

          <div className="relative z-10 flex items-center justify-between mb-8">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: style.accent }}>
                 <Wind size={18} />
               </div>
               <span className="text-white font-black text-xl tracking-tight">Ventoo</span>
             </div>
             <WeatherIcon size={32} className="text-white drop-shadow-md" />
          </div>

          <div className="relative z-10 mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-black text-white drop-shadow-lg">{Math.round(temp)}°</span>
              <div>
                <p className="text-white font-bold text-lg leading-tight">{data.city}</p>
                <p className="text-sm font-medium" style={{ color: style.accent }}>{style.label}</p>
              </div>
            </div>
          </div>

          {data.outfit?.resumen && (
            <div className="relative z-10 mb-8 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm" style={{ borderLeft: `4px solid ${style.accent}` }}>
              <p className="text-white text-base leading-relaxed">"{data.outfit.resumen}"</p>
            </div>
          )}

          <div className="relative z-10 grid grid-cols-1 gap-3">
            {prendas.map((prenda, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-transform hover:scale-[1.02]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white/90" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <ClothingIcon tipo={prenda.tipo} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{prenda.nombre || prenda.tipo}</p>
                  {prenda.color && <p className="text-gray-400 text-xs font-medium mt-0.5">{prenda.color}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center pb-8">
          <p className="text-white/60 text-sm mb-4">¿Quieres saber qué ponerte hoy según el clima?</p>
          <button onClick={() => window.location.href = '/'} className="w-full py-4 rounded-2xl text-white font-bold shadow-xl shadow-indigo-600/20 active:scale-95 transition-all" style={{ background: style.accent }}>
            Probar Ventoo
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedOutfitView;
