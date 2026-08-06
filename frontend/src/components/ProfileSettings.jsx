import Cookies from 'js-cookie';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Save, Shirt, ChevronDown, ChevronUp, CreditCard, Settings, Smartphone, AlertTriangle, LogOut, Camera, ArrowLeft, Sun } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ProfileSettings({ token, darkMode, onLogout, onBack }) {
  const [name, setName] = useState(Cookies.get('userName') || '');
  const [gender, setGender] = useState(Cookies.get('userGender') || 'Mujer');
  const [age, setAge] = useState(Cookies.get('userAge') || '');
  const [estiloPersonal, setEstiloPersonal] = useState('');
  const [estiloDetalles, setEstiloDetalles] = useState('');
  const [usaGorras, setUsaGorras] = useState(false);
  const [morningAlerts, setMorningAlerts] = useState(false);
  const [alertHour, setAlertHour] = useState(7);
  const [alertCityName, setAlertCityName] = useState('');
  const [profilePicture, setProfilePicture] = useState(Cookies.get('userProfilePicture') || '');
  const [historyCount, setHistoryCount] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportStatus, setReportStatus] = useState('idle'); // idle | loading | success | error
  const [favoriteCities, setFavoriteCities] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isPremium, setIsPremium] = useState(Cookies.get('isPremium') === 'true');
  const [premiumPlan, setPremiumPlan] = useState(Cookies.get('premiumPlan') || null);
  
  const [activeAccordion, setActiveAccordion] = useState('personal');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.user) {
          setName(res.data.user.name || '');
          setGender(res.data.user.gender || 'Mujer');
          setAge(res.data.user.age || '');
          setEstiloPersonal(res.data.user.estiloPersonal || '');
          setEstiloDetalles(res.data.user.estiloDetalles || '');
          setUsaGorras(res.data.user.usaGorras || false);
          setMorningAlerts(res.data.user.morningAlerts || false);
          setAlertHour(res.data.user.alertHour ?? 7);
          setAlertCityName(res.data.user.alertCityName || '');
          setProfilePicture(res.data.user.profilePicture || '');
          Cookies.set('userProfilePicture', res.data.user.profilePicture || '', { expires: 365 });
          setHistoryCount(res.data.user.historyCount || 0);
          setDailyCount(res.data.user.dailyCount || 0);
          
          setIsPremium(res.data.user.isPremium || false);
          Cookies.set('isPremium', res.data.user.isPremium ? 'true' : 'false', { expires: 365 });
          
          setPremiumPlan(res.data.user.premiumPlan || null);
          if (res.data.user.premiumPlan) {
            Cookies.set('premiumPlan', res.data.user.premiumPlan, { expires: 365 });
          } else {
            Cookies.remove('premiumPlan');
          }

          try {
            const favRes = await axios.get(`${API_URL}/api/favorites`, { headers: { Authorization: `Bearer ${token}` } });
            setFavoriteCities(favRes.data.favorites || []);
            if (!res.data.user.alertCityName && favRes.data.favorites?.length > 0) {
              setAlertCityName(favRes.data.favorites[0].cityName);
            }
          } catch (e) {
            console.error("Error fetching favorites:", e);
          }
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      }
    };
    fetchProfile();
  }, [token]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Por favor, selecciona una imagen válida.');
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('La imagen es demasiado grande (máximo 5MB).');
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await axios.post(`${API_URL}/api/upload-avatar`, {
          imageBase64: reader.result
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.profilePicture) {
          setProfilePicture(res.data.profilePicture);
          Cookies.set('userProfilePicture', res.data.profilePicture, { expires: 365 });
          setMessage('Foto de perfil actualizada con éxito.');
        }
      } catch (err) {
        setMessage('Error al subir la foto de perfil.');
      } finally {
        setUploadingAvatar(false);
        setTimeout(() => setMessage(''), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, { 
        name, 
        gender, 
        age, 
        estiloPersonal, 
        estiloDetalles, 
        usaGorras, 
        morningAlerts, 
        alertHour,
        alertCityName 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Cookies.set('userName', res.data.user.name, { expires: 365 });
      Cookies.set('userGender', res.data.user.gender, { expires: 365 });
      Cookies.set('userAge', res.data.user.age || '', { expires: 365 });
      setDailyCount(res.data.user.dailyCount || 0);
      setMessage('Perfil actualizado con éxito');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Error al actualizar el perfil');
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectCheckout = async (plan) => {
    setCheckoutLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/api/payments/create-checkout-session`, { plan }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setMessage('Error iniciando el pago.');
      setCheckoutLoading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleCancelSubscription = async () => {
    setCheckoutLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/api/payments/cancel-subscription`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        Cookies.set('isPremium', 'false', { expires: 365 });
        Cookies.remove('premiumPlan');
        setMessage('Suscripción cancelada correctamente.');
        setShowCancelModal(false);
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error al cancelar la suscripción.');
      setCheckoutLoading(false);
      setShowCancelModal(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportMessage.trim()) return;
    
    setReportStatus('loading');
    try {
      await axios.post(`${API_URL}/api/tickets`, { 
        asunto: 'Reporte desde la App (Ajustes)', 
        mensaje: reportMessage 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportStatus('success');
      setReportMessage('');
      setTimeout(() => setReportStatus('idle'), 3000);
    } catch (err) {
      setReportStatus('error');
      setTimeout(() => setReportStatus('idle'), 3000);
    }
  };

  const BentoCard = ({ title, icon: Icon, children, className = '' }) => (
    <div className={`rounded-3xl border p-5 md:p-7 transition-all flex flex-col ${darkMode ? 'bg-[#15151e]/80 backdrop-blur-xl border-white/10 shadow-2xl shadow-black/40' : 'bg-white/90 backdrop-blur-xl border-gray-200/80 shadow-xl shadow-indigo-900/5'} ${className}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-2xl shadow-inner ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
          <Icon size={24} />
        </div>
        <h3 className={`font-bold text-xl tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      </div>
      <div className="space-y-5 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );

  const inputClass = `w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder-gray-500 focus:bg-black/40' : 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'} border`;
  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className={`p-4 md:p-8 max-w-7xl mx-auto`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <button type="button" onClick={onBack} className={`p-3 rounded-2xl transition-all ${darkMode ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm'}`}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ajustes de Perfil</h2>
            <p className={`text-sm md:text-base mt-2 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestiona tu cuenta, estilo personal y suscripción</p>
          </div>
        </div>
        {message && (
          <div className={`px-5 py-3 rounded-2xl text-sm font-bold shadow-lg flex items-center gap-2 ${message.includes('Error') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
            {message.includes('Error') ? <AlertTriangle size={18} /> : <Save size={18} />}
            {message}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* COLUMNA IZQUIERDA (Info y Estilo) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <BentoCard title="Información Personal" icon={User}>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar Upload */}
              <div className="relative group cursor-pointer shrink-0">
                <div className={`w-28 h-28 rounded-full overflow-hidden border-4 transition-all duration-300 ${darkMode ? 'border-gray-800 bg-gray-900 group-hover:border-indigo-500/50 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'border-gray-100 bg-gray-50 group-hover:border-indigo-200 group-hover:shadow-lg'} flex items-center justify-center relative`}>
                  {profilePicture ? (
                    <img src={profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className={darkMode ? 'text-gray-600' : 'text-gray-300'} />
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 p-2.5 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 group-hover:scale-110 transition-transform">
                  <Camera size={16} />
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className={labelClass}>Nombre</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Género</label>
                    <select value={gender} onChange={e => setGender(e.target.value)} className={inputClass}>
                      <option value="Mujer">Mujer</option>
                      <option value="Hombre">Hombre</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Edad</label>
                    <input type="number" min="1" max="120" value={age} onChange={e => setAge(e.target.value)} className={inputClass} placeholder="Ej: 25" />
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>

          <BentoCard title="Tu Estilo de Moda" icon={Shirt} className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Estilo Principal</label>
                <select value={estiloPersonal} onChange={e => setEstiloPersonal(e.target.value)} className={inputClass}>
                  <option value="">No especificado</option>
                  <option value="Urbano / Streetwear">Urbano / Streetwear</option>
                  <option value="Casual">Casual</option>
                  <option value="Elegante / Formal">Elegante / Formal</option>
                  <option value="Minimalista">Minimalista</option>
                  <option value="Deportivo">Deportivo</option>
                  <option value="Vintage / Retro">Vintage / Retro</option>
                  <option value="Bohemio / Boho">Bohemio / Boho</option>
                  <option value="Gótico / Dark">Gótico / Dark</option>
                  <option value="Y2K">Y2K</option>
                  <option value="Preppy">Preppy</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Detalles específicos (Opcional)</label>
                <textarea 
                  value={estiloDetalles} onChange={e => setEstiloDetalles(e.target.value)} 
                  placeholder="Ej: Colores oscuros, ropa muy ancha..." rows={2} 
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
            
            <div className={`mt-4 p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} flex items-center justify-between`}>
              <div>
                <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Gorras y Sombreros</h4>
                <p className={`text-xs mt-0.5 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Incluir accesorios de cabeza en los outfits.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={usaGorras} onChange={(e) => setUsaGorras(e.target.checked)} />
                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </BentoCard>
          
        </div>

        {/* COLUMNA DERECHA (Plan, Alertas, Save) */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          <BentoCard title="Alertas Matutinas" icon={Settings}>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-100'} flex items-center justify-between`}>
              <div>
                <h4 className={`font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Sun size={18} className="text-yellow-500" /> Email diario
                </h4>
                <p className={`text-xs mt-0.5 font-medium ${darkMode ? 'text-indigo-200/70' : 'text-indigo-600/70'}`}>{morningAlerts ? 'Activado a las 09:00' : 'Actualmente desactivado'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={morningAlerts} onChange={(e) => setMorningAlerts(e.target.checked)} />
                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600 shadow-inner"></div>
              </label>
            </div>
            
            {morningAlerts && (
              <div className={`p-4 rounded-2xl border mt-2 space-y-4 ${darkMode ? 'bg-black/20 border-white/5' : 'bg-white border-gray-100'}`}>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hora de envío</p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>09:00 (Hora Peninsular)</p>
                  <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Tu reporte del clima y recomendaciones de outfits se preparan y envían a esta hora para que empieces el día de la mejor manera.
                  </p>
                </div>
                
                {favoriteCities.length > 0 ? (
                  <div>
                    <label className={labelClass}>Ciudad para el pronóstico</label>
                    <select value={alertCityName} onChange={e => setAlertCityName(e.target.value)} className={inputClass}>
                      {favoriteCities.map(c => <option key={c.id} value={c.cityName}>{c.cityName}</option>)}
                    </select>
                  </div>
                ) : (
                  <p className={`text-xs font-medium px-3 py-2 rounded-lg ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                    ⚠️ Necesitas guardar al menos una ciudad favorita en el mapa.
                  </p>
                )}
              </div>
            )}
          </BentoCard>

          <BentoCard title="Plan y Consumo" icon={CreditCard}>
            {/* Plan Actual */}
            <div className={`p-5 rounded-2xl border relative overflow-hidden ${darkMode ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <CreditCard size={80} />
              </div>
              <h4 className={`text-xs font-black uppercase tracking-wider mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>Plan Actual</h4>
              {isPremium ? (
                <div className="flex flex-col gap-2 relative z-10">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    {premiumPlan === 'lifetime' ? 'Premium de por vida' : 'Premium Mensual'}
                  </span>
                  <p className={`text-sm font-medium ${darkMode ? 'text-indigo-200' : 'text-indigo-800'}`}>Disfrutando de todas las funciones PRO.</p>
                  {premiumPlan !== 'lifetime' && (
                    <button type="button" onClick={() => setShowCancelModal(true)} disabled={checkoutLoading} className="mt-3 w-max px-4 py-2 border-2 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                      Cancelar Suscripción
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4 relative z-10">
                  <span className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Básico (Gratis)</span>
                  <div className="flex gap-3 mt-1">
                    <button type="button" disabled={checkoutLoading} onClick={() => handleDirectCheckout('monthly')} className="flex-1 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95">
                      1,99€ / mes
                    </button>
                    <button type="button" disabled={checkoutLoading} onClick={() => handleDirectCheckout('lifetime')} className="flex-1 px-3 py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-600/30 active:scale-95">
                      Único 20€
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5 mt-2">
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Outfits Hoy</span>
                  <span className={dailyCount >= (isPremium ? 999999 : 5) ? 'text-red-500' : (darkMode ? 'text-white' : 'text-gray-900')}>
                    {isPremium ? 'Ilimitado' : `${dailyCount} / 5`}
                  </span>
                </div>
                {!isPremium && (
                  <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${dailyCount >= 5 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : dailyCount >= 3 ? 'bg-orange-500' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`} style={{ width: `${Math.min((dailyCount / 5) * 100, 100)}%` }}></div>
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Historial</span>
                  <span className={historyCount >= (isPremium ? 50 : 15) ? 'text-red-500' : (darkMode ? 'text-white' : 'text-gray-900')}>
                    {historyCount} / {isPremium ? 50 : 15}
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${historyCount >= (isPremium ? 50 : 15) ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : historyCount >= (isPremium ? 40 : 10) ? 'bg-orange-500' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`} style={{ width: `${Math.min((historyCount / (isPremium ? 50 : 15)) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Botón Guardar - Destacado en la columna derecha */}
          <div className="mt-2 relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-fuchsia-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <button type="submit" disabled={loading} className={`relative w-full flex items-center justify-center gap-3 py-5 rounded-3xl font-black text-lg transition-all ${darkMode ? 'bg-gray-900 text-white border border-white/10 hover:bg-gray-800' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'}`}>
              {loading ? (
                <><div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Guardando...</>
              ) : (
                <><Save size={24} className="text-indigo-500" /> Guardar Cambios</>
              )}
            </button>
          </div>

          {/* Más Opciones */}
          <div className="flex gap-4 mt-2">
            {(() => {
              const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
              return isIos ? (
                <button type="button" onClick={() => window.dispatchEvent(new Event('show-ios-prompt'))} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-bold transition-all border ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <Smartphone size={16} /> Instalar iOS
                </button>
              ) : null;
            })()}
            {onLogout && (
              <button type="button" onClick={onLogout} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-bold transition-all border ${darkMode ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'}`}>
                <LogOut size={16} /> Cerrar Sesión
              </button>
            )}
          </div>

        </div>
      </form>

      {/* Modal Cancelar Suscripción */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-sm p-8 rounded-[2rem] shadow-2xl ${darkMode ? 'bg-[#15151e] border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className={`text-2xl font-black text-center mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Cancelar Suscripción</h3>
            <p className={`text-sm text-center mb-8 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              ¿Estás seguro de que quieres cancelar? Dejarás de disfrutar de generaciones ilimitadas y 50 espacios de historial.
            </p>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={handleCancelSubscription} disabled={checkoutLoading} className="w-full py-4 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95 disabled:opacity-50">
                {checkoutLoading ? 'Procesando...' : 'Sí, cancelar plan'}
              </button>
              <button type="button" onClick={() => setShowCancelModal(false)} disabled={checkoutLoading} className={`w-full py-4 rounded-xl font-bold transition-all ${darkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                No, mantener Premium
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
