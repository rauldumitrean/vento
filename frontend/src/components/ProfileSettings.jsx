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
  const [profilePicture, setProfilePicture] = useState(Cookies.get('userProfilePicture') || '');
  const [historyCount, setHistoryCount] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportStatus, setReportStatus] = useState('idle'); // idle | loading | success | error
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
      const res = await axios.put(`${API_URL}/api/auth/profile`, { name, gender, age, estiloPersonal, estiloDetalles, usaGorras, morningAlerts, alertHour }, {
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

  // Helper para renderizar Widgets/Acordeones
  const WidgetSection = ({ id, title, icon: Icon, children }) => {
    const isOpen = activeAccordion === id;
    return (
      <div className={`rounded-2xl border overflow-hidden transition-all ${darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
        <button 
          type="button"
          onClick={() => setActiveAccordion(isOpen ? null : id)}
          className="w-full flex items-center justify-between p-4 md:pointer-events-none md:cursor-default"
        >
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
               <Icon className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
             </div>
             <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          </div>
          <div className="md:hidden">
            {isOpen ? <ChevronUp size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'}/> : <ChevronDown size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />}
          </div>
        </button>
        
        <div className={`${isOpen ? 'block' : 'hidden'} md:block p-4 pt-0 md:pt-0`}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className={`p-4 md:p-8 max-w-4xl mx-auto pb-24`}>
      {/* 1. PROFILE HEADER */}
      <div className={`relative rounded-[2rem] overflow-hidden mb-10 ${darkMode ? 'bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black/40 border border-white/10 shadow-2xl' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-xl border border-indigo-100'} p-8 md:p-10 flex flex-col md:flex-row items-center gap-8`}>
         <div className="relative group cursor-pointer shrink-0">
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 transition-all duration-300 ${darkMode ? 'border-indigo-500/30 bg-gray-900 group-hover:border-indigo-400' : 'border-white shadow-lg bg-gray-50 group-hover:border-indigo-200'} flex items-center justify-center relative`}>
               {profilePicture ? (
                 <img src={profilePicture} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <User size={48} className={darkMode ? 'text-gray-600' : 'text-gray-300'} />
               )}
               {uploadingAvatar && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                   <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                 </div>
               )}
            </div>
            <div className="absolute bottom-2 right-2 p-3 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 group-hover:scale-110 transition-transform">
               <Camera size={20} />
            </div>
            <input 
               type="file" 
               accept="image/*" 
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               onChange={handleAvatarUpload}
               disabled={uploadingAvatar}
            />
         </div>
         <div className="flex-1 text-center md:text-left">
            <h2 className={`text-4xl md:text-5xl font-black tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{name || 'Usuario'}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
               {isPremium ? (
                 <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                   <Settings size={14} /> PRO
                 </span>
               ) : (
                 <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                   Básico (Gratis)
                 </span>
               )}
               <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${darkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                 {dailyCount} Outfits Hoy
               </span>
            </div>
         </div>
         <div className="shrink-0 mt-4 md:mt-0">
           {onBack && (
             <button onClick={onBack} className={`px-6 py-3 rounded-2xl font-bold transition-all ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-gray-900 shadow-md hover:shadow-lg'}`}>
               Volver
             </button>
           )}
         </div>
      </div>

      {message && (
        <div className={`mb-8 px-6 py-4 rounded-2xl text-sm font-bold shadow-lg flex items-center gap-3 animate-fade-in ${message.includes('Error') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
          {message.includes('Error') ? <AlertTriangle size={20} /> : <Save size={20} />}
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* SECCIÓN 1: DATOS PERSONALES */}
        <div className={`p-6 md:p-8 rounded-[2rem] border ${darkMode ? 'bg-[#15151e]/80 border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'}`}>
           <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
             <User className="text-indigo-500" /> Datos Personales
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nombre</label>
                <input 
                  type="text" value={name} onChange={e => setName(e.target.value)} 
                  className={`w-full rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${darkMode ? 'bg-black/20 border-white/5 text-white focus:bg-black/40' : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:bg-white'} border`} required 
                />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Género</label>
                <select value={gender} onChange={e => setGender(e.target.value)} className={`w-full rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${darkMode ? 'bg-black/20 border-white/5 text-white focus:bg-black/40' : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:bg-white'} border`}>
                  <option value="Mujer">Mujer</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Edad</label>
                <input type="number" min="1" max="120" value={age} onChange={e => setAge(e.target.value)} className={`w-full rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${darkMode ? 'bg-black/20 border-white/5 text-white focus:bg-black/40' : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:bg-white'} border`} placeholder="Ej: 25" />
              </div>
           </div>
        </div>

        {/* SECCIÓN 2: ESTILO */}
        <div className={`p-6 md:p-8 rounded-[2rem] border ${darkMode ? 'bg-[#15151e]/80 border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'}`}>
           <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
             <Shirt className="text-indigo-500" /> Tu Estilo de Moda
           </h3>
           <div className="space-y-6">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estilo Principal</label>
                <select value={estiloPersonal} onChange={e => setEstiloPersonal(e.target.value)} className={`w-full rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${darkMode ? 'bg-black/20 border-white/5 text-white focus:bg-black/40' : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:bg-white'} border`}>
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
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Detalles Específicos (Opcional)</label>
                <textarea 
                  value={estiloDetalles} onChange={e => setEstiloDetalles(e.target.value)} 
                  placeholder="Ej: Prefiero ropa ancha, estilo oversize, colores pastel..." rows={3} 
                  className={`w-full rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${darkMode ? 'bg-black/20 border-white/5 text-white focus:bg-black/40 placeholder-gray-600' : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:bg-white placeholder-gray-400'} border resize-none`}
                />
              </div>
              <div className={`p-5 rounded-2xl flex items-center justify-between border ${darkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
                <div>
                  <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Gorras y Sombreros</h4>
                  <p className={`text-sm mt-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Incluir accesorios de cabeza en las recomendaciones</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={usaGorras} onChange={(e) => setUsaGorras(e.target.checked)} />
                  <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
           </div>
        </div>

        {/* SECCIÓN 3: PREFERENCIAS Y SUSCRIPCIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           
           <div className={`p-6 md:p-8 rounded-[2rem] border flex flex-col ${darkMode ? 'bg-[#15151e]/80 border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'}`}>
              <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Sun className="text-yellow-500" /> Alertas Matutinas
              </h3>
              <div className="flex-1 space-y-6">
                 <div className={`p-5 rounded-2xl flex items-center justify-between border ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                   <div>
                     <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Email Diario</h4>
                     <p className={`text-sm mt-1 font-medium ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{morningAlerts ? 'Activado a las 08:00' : 'Desactivado'}</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={morningAlerts} onChange={(e) => setMorningAlerts(e.target.checked)} />
                     <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                   </label>
                 </div>
                 {morningAlerts && (
                   <div className="animate-fade-in">
                     <p className={`text-sm leading-relaxed font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Recibirás un resumen del tiempo y consejos de ropa cada mañana a las 08:00. Necesitas tener al menos una ciudad favorita guardada en el mapa para que esto funcione.
                     </p>
                   </div>
                 )}
              </div>
           </div>

           <div className={`p-6 md:p-8 rounded-[2rem] border flex flex-col ${darkMode ? 'bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-white/5 shadow-2xl' : 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-100 shadow-xl'}`}>
              <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <CreditCard className="text-indigo-500" /> Tu Suscripción
              </h3>
              <div className="flex-1 space-y-6">
                 {isPremium ? (
                    <div className="space-y-4">
                       <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-black/30 border-indigo-500/30' : 'bg-white border-indigo-200'}`}>
                          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                            {premiumPlan === 'lifetime' ? 'Premium de por vida' : 'Premium Mensual'}
                          </span>
                          <p className={`text-sm font-medium mt-2 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>Disfrutando de funciones ilimitadas.</p>
                       </div>
                       {premiumPlan !== 'lifetime' && (
                         <button type="button" onClick={() => setShowCancelModal(true)} disabled={checkoutLoading} className="w-full py-4 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-2xl transition-all disabled:opacity-50">
                           Cancelar Suscripción
                         </button>
                       )}
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-black/30 border-white/5' : 'bg-white border-gray-100'}`}>
                          <span className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Plan Básico</span>
                          <p className={`text-sm font-medium mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Límite de 5 outfits diarios y 15 guardados.</p>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <button type="button" disabled={checkoutLoading} onClick={() => handleDirectCheckout('monthly')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95">
                           1,99€ / mes
                         </button>
                         <button type="button" disabled={checkoutLoading} onClick={() => handleDirectCheckout('lifetime')} className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-600/30 active:scale-95">
                           Único 20€
                         </button>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* ACCIONES FINALES */}
        <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
          <button type="submit" disabled={loading} className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg transition-all shadow-xl shadow-indigo-600/30 active:scale-95">
            {loading ? <><div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Guardando...</> : <><Save size={24} /> Guardar Cambios</>}
          </button>
          {onLogout && (
            <button type="button" onClick={onLogout} className={`w-full sm:w-auto px-8 py-5 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all border ${darkMode ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'}`}>
              <LogOut size={20} /> Salir
            </button>
          )}
        </div>

      </form>

      {/* Modal Cancelar Suscripción */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-sm p-8 rounded-[2rem] shadow-2xl ${darkMode ? 'bg-[#15151e] border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className={`text-3xl font-black text-center mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Cancelar Suscripción</h3>
            <p className={`text-base text-center mb-8 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              ¿Estás seguro de que quieres cancelar? Dejarás de disfrutar de generaciones ilimitadas al instante.
            </p>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={handleCancelSubscription} disabled={checkoutLoading} className="w-full py-4 rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95 disabled:opacity-50 text-lg">
                {checkoutLoading ? 'Procesando...' : 'Sí, cancelar plan'}
              </button>
              <button type="button" onClick={() => setShowCancelModal(false)} disabled={checkoutLoading} className={`w-full py-4 rounded-2xl font-bold transition-all text-lg ${darkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                No, mantener Premium
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
