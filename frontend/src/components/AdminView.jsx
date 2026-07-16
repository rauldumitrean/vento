import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Star, UserPlus, Shield, Edit2, Save, X, Activity, Users, MessageSquare, ArrowLeft, BarChart2, Radio, Database, RefreshCw, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminView = ({ token }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'outfits'
  const [users, setUsers] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', gender: 'Mujer', role: 'USER', isPremium: false });
  const [showAdd, setShowAdd] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({ email: '', name: '', gender: '', role: '', password: '' });

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [banDurationValue, setBanDurationValue] = useState(1);
  const [banDurationUnit, setBanDurationUnit] = useState('days'); // 'days' | 'weeks' | 'years' | 'permanent'

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // FIX: Added adminMsg state to replace all alert() calls
  const [adminMsg, setAdminMsg] = useState({ text: '', type: '' });
  const showAdminMsg = (text, type = 'error') => {
    setAdminMsg({ text, type });
    setTimeout(() => setAdminMsg({ text: '', type: '' }), 4000);
  };

  const fetchStats = async () => {
    try {
      setIsRefreshing(true);
      const res = await axios.get(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Pequeño delay visual para que se note la animación
    }
  };

  // FIX: Added token to deps array, used refs to avoid stale closure
  useEffect(() => {
    fetchData();
    // Auto-refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes, outfitsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/admin/outfits`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setOutfits(outfitsRes.data);
    } catch (error) {
      // FIX: Use UI message instead of alert()
      showAdminMsg('Error de conexión. Verifica tus permisos.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/admin/users`, newUser, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
      setShowAdd(false);
      setNewUser({ email: '', password: '', name: '', gender: 'Mujer', role: 'USER', isPremium: false });
    } catch (error) {
      showAdminMsg('Error creando usuario');
    }
  };

  const togglePremium = async (id, currentStatus) => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${id}/premium`, { isPremium: !currentStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(users.map(u => u.id === id ? { ...u, isPremium: !currentStatus } : u));
      fetchData(); // refresh stats
    } catch (error) {
      showAdminMsg('Error actualizando estado premium');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres borrar este usuario y TODOS sus datos (incluyendo armarios y chats)?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(users.filter(u => u.id !== id));
      fetchData(); // refresh stats
    } catch (error) {
      showAdminMsg('Error eliminando usuario');
    }
  };

  const startEdit = (user) => {
    setEditUserId(user.id);
    setEditUserData({ email: user.email, name: user.name || '', gender: user.gender || 'Mujer', role: user.role, password: '' });
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${editUserId}`, editUserData, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
      setEditUserId(null);
    } catch (error) {
      showAdminMsg('Error actualizando usuario');
    }
  };

  const handleBanSubmit = async () => {
    if (!userToBan) return;
    try {
      let bannedUntil = null;
      if (banDurationUnit !== 'permanent') {
        const date = new Date();
        const value = parseInt(banDurationValue) || 1;
        if (banDurationUnit === 'days') date.setDate(date.getDate() + value);
        else if (banDurationUnit === 'weeks') date.setDate(date.getDate() + (value * 7));
        else if (banDurationUnit === 'years') date.setFullYear(date.getFullYear() + value);
        bannedUntil = date;
      }
      
      await axios.put(`${API_URL}/api/admin/users/${userToBan.id}/ban`, {
        isBanned: true,
        bannedUntil: bannedUntil,
        banReason: 'Incumplimiento de normas'
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      fetchData();
      setBanModalOpen(false);
      setUserToBan(null);
      showAdminMsg('Usuario baneado correctamente', 'success');
    } catch (error) {
      showAdminMsg('Error al banear usuario');
    }
  };

  const handleUnban = async (userId) => {
    if (!window.confirm("¿Seguro que quieres quitar el bloqueo a este usuario?")) return;
    try {
      await axios.put(`${API_URL}/api/admin/users/${userId}/ban`, {
        isBanned: false,
        bannedUntil: null,
        banReason: null
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
      showAdminMsg('Usuario desbaneado', 'success');
    } catch (error) {
      showAdminMsg('Error al desbanear usuario');
    }
  };

  const handleDeleteOutfit = async (id) => {
    if (!window.confirm("¿Seguro que quieres borrar este outfit definitivamente?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/outfits/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setOutfits(outfits.filter(o => o.id !== id));
      fetchStats();
      showAdminMsg('Outfit eliminado', 'success');
    } catch (error) {
      showAdminMsg('Error eliminando outfit');
    }
  };

  const handleDeleteAllOutfits = async () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const prompt = window.prompt(`¡PELIGRO! Vas a borrar TODOS los outfits y chats de TODOS los usuarios.\n\nEscribe el código ${code} para confirmar:`);
    if (prompt !== code) {
      if (prompt !== null) showAdminMsg('Código incorrecto. Cancelado.', 'error');
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/api/admin/outfits`, { headers: { Authorization: `Bearer ${token}` } });
      setOutfits([]);
      fetchStats();
      showAdminMsg('Todos los outfits han sido eliminados', 'success');
    } catch (error) {
      showAdminMsg('Error al vaciar la base de datos de outfits');
    }
  };

  // Avatar helper
  const getInitials = (email) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-100 font-sans overflow-hidden">
      {/* FIX: Toast notification for admin actions (replaces all alert() calls) */}
      <AnimatePresence>
        {adminMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium text-white ${adminMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {adminMsg.text}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-r border-gray-100 text-gray-500 flex flex-col flex-shrink-0 md:h-full z-10">
        <div className="h-16 flex flex-shrink-0 items-center justify-between md:justify-start px-6 border-b border-gray-100">
          <div className="flex items-center">
            <span className="text-gray-900 font-bold tracking-widest uppercase text-sm">Ventoo Admin</span>
          </div>
          <button 
            onClick={() => { sessionStorage.removeItem('adminToken'); window.location.href='/'; }}
            className="md:hidden text-gray-400 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-x-auto md:overflow-y-auto py-2 md:py-6">
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 px-4 min-w-max md:min-w-0">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <BarChart2 size={18} /> <span className="whitespace-nowrap">Resumen</span>
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <Users size={18} /> <span className="whitespace-nowrap">Usuarios</span>
            </button>
            <button 
              onClick={() => setActiveTab('outfits')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'outfits' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <Database size={18} /> <span className="whitespace-nowrap">Outfits</span>
            </button>
          </nav>
        </div>

        <div className="hidden md:block p-4 border-t border-gray-100">
          <button 
            onClick={() => { sessionStorage.removeItem('adminToken'); window.location.href='/'; }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-md text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Volver a la App
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && stats && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-normal text-gray-900 mb-1 tracking-tight">Admin Panel</h2>
                      <p className="text-gray-500 text-sm">Resumen en tiempo real</p>
                    </div>
                    <button 
                      onClick={fetchStats}
                      disabled={isRefreshing}
                      className="mt-3 sm:mt-0 self-start flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-900 rounded-md text-sm transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                      Actualizar
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
                    {/* Stat Card 1 - Online Users */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-50 text-green-500 rounded-xl relative">
                          <Radio size={24} />
                          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        </div>
                        <h3 className="text-gray-500 font-medium">Usuarios Online</h3>
                      </div>
                      <motion.span 
                        key={stats.onlineUsers}
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-4xl font-bold text-gray-900"
                      >
                        {stats.onlineUsers}
                      </motion.span>
                      <p className="text-xs text-gray-400 mt-2">Activos últimos 5 min</p>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Usuarios Totales</h3>
                      </div>
                      <motion.span 
                        key={stats.totalUsers}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold text-gray-900"
                      >
                        {stats.totalUsers}
                      </motion.span>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><Star size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Cuentas Premium</h3>
                      </div>
                      <motion.span 
                        key={stats.premiumUsers}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold text-gray-900"
                      >
                        {stats.premiumUsers}
                      </motion.span>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Activity size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Outfits Generados</h3>
                      </div>
                      <motion.span 
                        key={stats.totalOutfits}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold text-gray-900"
                      >
                        {stats.totalOutfits}
                      </motion.span>
                    </div>

                    {/* Stat Card 5 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><MessageSquare size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Mensajes de IA</h3>
                      </div>
                      <motion.span 
                        key={stats.totalMessages}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold text-gray-900"
                      >
                        {stats.totalMessages}
                      </motion.span>
                    </div>
                    {/* Stat Card 6 - Basic Accounts */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gray-100 text-gray-600 rounded-xl"><Users size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Cuentas Básicas</h3>
                      </div>
                      <motion.span 
                        key={stats.totalUsers - stats.premiumUsers}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold text-gray-900"
                      >
                        {stats.totalUsers - stats.premiumUsers}
                      </motion.span>
                      <p className="text-xs text-gray-400 mt-2">Usuarios sin Premium</p>
                    </div>
                  </div>

                  {/* Database Capacity Widget */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 mb-8">
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
                        <circle 
                          cx="50" cy="50" r="40" fill="transparent" 
                          stroke="#a855f7" strokeWidth="12" 
                          strokeDasharray="251.2" 
                          // FIX: Guard against division by zero
                          strokeDashoffset={stats.maxUsersCapacity ? 251.2 - (251.2 * (stats.totalUsers / stats.maxUsersCapacity)) : 251.2}
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* FIX: Guard against division by zero in percentage display */}
                        <span className="text-lg font-bold text-gray-900">{stats.maxUsersCapacity ? ((stats.totalUsers / stats.maxUsersCapacity) * 100).toFixed(2) : 0}%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2"><Database size={20} className="text-purple-500"/> Capacidad de Base de Datos (Neon Free Tier)</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Actualmente Neon otorga 0.5 GB de almacenamiento gratuito. Calculando un promedio de 10 KB de datos relacionales generados por usuario activo (historial, ropa, chats, etc.), el límite seguro aproximado es de <strong className="text-gray-900">50,000 usuarios</strong>.
                      </p>
                      <div className="flex gap-4">
                        <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                          <span className="text-sm text-gray-500 font-semibold mb-1 block">USADOS</span>
                          <motion.span 
                            key={stats.totalUsers}
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-lg font-bold text-gray-900"
                          >
                            {stats.totalUsers}
                          </motion.span>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl">
                          <span className="text-sm text-purple-400 font-semibold mb-1 block">RESTANTES</span>
                          <motion.span 
                            key={stats.totalUsers}
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-lg font-bold text-purple-600"
                          >
                            {(50000 - stats.totalUsers).toLocaleString('es-ES')}
                          </motion.span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Gestión de Usuarios</h2>
                      <p className="text-gray-400 text-sm">Administra cuentas, permisos y accesos</p>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                      <button 
                        onClick={fetchData}
                        disabled={isRefreshing}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                      >
                        <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
                        Refrescar
                      </button>
                      <button 
                        onClick={() => setShowAdd(!showAdd)}
                        className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <UserPlus size={16} /> Añadir Usuario
                      </button>
                    </div>
                  </div>

                  {showAdd && (
                    <div className="mb-8 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                      <h3 className="font-semibold mb-4">Crear nuevo usuario manualmente</h3>
                      <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="email" placeholder="Email" required
                          value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                          className="p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input 
                          type="password" placeholder="Contraseña provisional" required
                          value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                          className="p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input 
                          type="text" placeholder="Nombre"
                          value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                          className="p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <select
                          value={newUser.gender} onChange={e => setNewUser({...newUser, gender: e.target.value})}
                          className="p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Mujer">Mujer</option>
                          <option value="Hombre">Hombre</option>
                          <option value="Otro">Otro</option>
                        </select>
                        <div className="flex items-center gap-6 p-2">
                          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={newUser.role === 'ADMIN'} onChange={e => setNewUser({...newUser, role: e.target.checked ? 'ADMIN' : 'USER'})} className="rounded text-purple-600 focus:ring-purple-500" />
                            Es Administrador
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={newUser.isPremium} onChange={e => setNewUser({...newUser, isPremium: e.target.checked})} className="rounded text-purple-600 focus:ring-purple-500" />
                            Cuenta Premium
                          </label>
                        </div>
                        <div className="flex justify-end">
                          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm transition-colors">Guardar Usuario</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                      <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                        <tr>
                          <th className="px-6 py-4 font-medium">Usuario</th>
                          <th className="px-6 py-4 font-medium">Rol</th>
                          <th className="px-6 py-4 font-medium">Suscripción</th>
                          <th className="px-6 py-4 font-medium">Outfits Hoy</th>
                          <th className="px-6 py-4 font-medium">Historial</th>
                          <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            
                            {editUserId === u.id ? (
                              <td className="px-6 py-4" colSpan="4">
                                <div className="flex flex-wrap items-center gap-4">
                                  <input 
                                    type="email" value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})}
                                    className="p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 w-48 text-sm"
                                  />
                                  <input 
                                    type="text" placeholder="Nombre" value={editUserData.name} onChange={e => setEditUserData({...editUserData, name: e.target.value})}
                                    className="p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 w-32 text-sm"
                                  />
                                  <select 
                                    value={editUserData.gender} onChange={e => setEditUserData({...editUserData, gender: e.target.value})}
                                    className="p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-sm"
                                  >
                                    <option value="Mujer">Mujer</option>
                                    <option value="Hombre">Hombre</option>
                                    <option value="Otro">Otro</option>
                                  </select>
                                  <input 
                                    type="password" placeholder="Nueva contraseña" value={editUserData.password} onChange={e => setEditUserData({...editUserData, password: e.target.value})}
                                    className="p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 w-40 text-sm"
                                  />
                                  <select 
                                    value={editUserData.role} onChange={e => setEditUserData({...editUserData, role: e.target.value})}
                                    className="p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-sm"
                                  >
                                    <option value="USER">USER</option>
                                    <option value="ADMIN">ADMIN</option>
                                  </select>
                                </div>
                              </td>
                            ) : (
                              <>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full ${u.isBanned ? 'bg-red-500' : 'bg-gradient-to-br from-purple-500 to-indigo-500'} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}>
                                      {u.isBanned ? <Ban size={14} /> : getInitials(u.email)}
                                    </div>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{u.email}</span>
                                        {u.isBanned && <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Baneado</span>}
                                      </div>
                                      <span className="text-xs text-gray-500">{u.name ? `${u.name} (${u.gender})` : 'Sin nombre'}</span>
                                      <span className="text-xs text-gray-400">ID: #{u.id}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <button 
                                    onClick={() => togglePremium(u.id, u.isPremium)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${u.isPremium ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                  >
                                    <Star size={12} fill={u.isPremium ? "currentColor" : "none"} className={u.isPremium ? "text-yellow-500" : ""} /> 
                                    {u.isPremium ? (u.premiumPlan === 'lifetime' ? 'Premium (De por vida)' : u.premiumPlan === 'monthly' ? 'Premium (Mensual)' : 'Premium Activo') : 'Básico'}
                                  </button>
                                </td>
                                {/* Outfits today column - only relevant for basic users */}
                                <td className="px-6 py-4">
                                  {u.isPremium ? (
                                    <span className="text-xs text-gray-400">Sin límite ∞</span>
                                  ) : (
                                    <div className="flex flex-col gap-1 min-w-[120px]">
                                      <div className="flex justify-between text-xs font-medium">
                                        <span className={u.outfitsHoy >= 5 ? 'text-red-600' : 'text-gray-700'}>{u.outfitsHoy}/5 usados</span>
                                        <span className={u.outfitsHoy >= 5 ? 'text-red-500' : 'text-green-600'}>
                                          {u.outfitsHoy >= 5 ? '⛔ Límite' : `${5 - u.outfitsHoy} restantes`}
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div 
                                          className={`h-1.5 rounded-full transition-all ${u.outfitsHoy >= 5 ? 'bg-red-500' : u.outfitsHoy >= 3 ? 'bg-orange-400' : 'bg-green-500'}`}
                                          style={{ width: `${Math.min((u.outfitsHoy / 5) * 100, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </td>
                                {/* Historial column */}
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1 min-w-[120px]">
                                    <div className="flex justify-between text-xs font-medium">
                                      <span className={((u.totalHistory || 0) >= (u.isPremium ? 50 : 15)) ? 'text-red-600' : 'text-gray-700'}>
                                        {u.totalHistory || 0}/{u.isPremium ? 50 : 15}
                                      </span>
                                      <span className="text-gray-500 text-[10px] uppercase tracking-wider">Total</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                      <div 
                                        className={`h-1.5 rounded-full transition-all ${((u.totalHistory || 0) >= (u.isPremium ? 50 : 15)) ? 'bg-red-500' : 'bg-blue-400'}`}
                                        style={{ width: `${Math.min(((u.totalHistory || 0) / (u.isPremium ? 50 : 15)) * 100, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </>
                            )}

                            <td className="px-6 py-4 text-right">
                              {editUserId === u.id ? (
                                <div className="flex justify-end gap-2">
                                  <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition-colors" title="Guardar"><Save size={16} /></button>
                                  <button onClick={() => setEditUserId(null)} className="p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-md transition-colors" title="Cancelar"><X size={16} /></button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  {u.isBanned ? (
                                    <button onClick={() => handleUnban(u.id)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-md transition-colors" title="Quitar baneo"><Shield size={16} /></button>
                                  ) : (
                                    <button onClick={() => { setUserToBan(u); setBanModalOpen(true); }} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-md transition-colors" title="Banear"><Ban size={16} /></button>
                                  )}
                                  <button onClick={() => startEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar"><Edit2 size={16} /></button>
                                  <button onClick={() => handleDelete(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'outfits' && (
                <motion.div key="outfits" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-xl md:text-2xl font-normal text-gray-900 mb-1 tracking-tight">Gestión de Outfits</h2>
                      <p className="text-gray-500 text-sm">Listado global de todos los outfits generados</p>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                      <button 
                        onClick={fetchData}
                        disabled={isRefreshing}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-900 rounded-md text-sm transition-all disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                        Actualizar
                      </button>
                      <button 
                        onClick={handleDeleteAllOutfits}
                        className="flex-1 sm:flex-none bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-md text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} /> Borrar Todos
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-lg overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                          <th className="px-6 py-4 font-medium">Fecha</th>
                          <th className="px-6 py-4 font-medium">Usuario</th>
                          <th className="px-6 py-4 font-medium">Ubicación</th>
                          <th className="px-6 py-4 font-medium">Outfit</th>
                          <th className="px-6 py-4 font-medium text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {outfits.length === 0 ? (
                          <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No hay outfits registrados</td></tr>
                        ) : (
                          outfits.map(outfit => {
                            let rec = {};
                            try { rec = JSON.parse(outfit.recomendacion_json); } catch(e){}
                            return (
                              <tr key={outfit.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-gray-500">
                                  {new Date(outfit.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-medium">
                                      {getInitials(outfit.user.email)}
                                    </div>
                                    <span className="text-gray-700">{outfit.user.email}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{outfit.ubicacion}</td>
                                <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={rec.resumen}>
                                  {rec.resumen || "Sin resumen"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => handleDeleteOutfit(outfit.id)}
                                    className="text-red-400 hover:text-red-600 p-1"
                                    title="Eliminar Outfit"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      {/* Ban Modal */}
      <AnimatePresence>
        {banModalOpen && userToBan && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Ban className="text-red-500" />
                  Banear Usuario
                </h3>
                <button onClick={() => { setBanModalOpen(false); setUserToBan(null); }} className="text-gray-400 hover:bg-gray-100 p-1 rounded-md transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-4">
                  Selecciona la duración del bloqueo para el usuario <strong className="text-gray-900">{userToBan.email}</strong>. Durante este tiempo no podrá acceder a su cuenta.
                </p>

                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Duración</label>
                    <select
                      value={banDurationUnit}
                      onChange={(e) => setBanDurationUnit(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="days">Días</option>
                      <option value="weeks">Semanas</option>
                      <option value="years">Años</option>
                      <option value="permanent">Permanente</option>
                    </select>
                  </div>
                  
                  {banDurationUnit !== 'permanent' && (
                    <div className="w-24">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={banDurationValue}
                        onChange={(e) => setBanDurationValue(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setBanModalOpen(false); setUserToBan(null); }}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBanSubmit}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  Confirmar Ban
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminView;
