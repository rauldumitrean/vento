import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Star, UserPlus, Shield, Edit2, Save, X, Activity, Users, MessageSquare, ArrowLeft, BarChart2, Radio, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminView = ({ token }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users'
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', gender: 'Mujer', role: 'USER', isPremium: false });
  const [showAdd, setShowAdd] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({ email: '', name: '', gender: '', role: '', password: '' });

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh stats (online users) every 15 seconds
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      alert("Error de conexión. Verifica tus permisos.");
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
      alert("Error creando usuario");
    }
  };

  const togglePremium = async (id, currentStatus) => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${id}/premium`, { isPremium: !currentStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(users.map(u => u.id === id ? { ...u, isPremium: !currentStatus } : u));
      fetchData(); // refresh stats
    } catch (error) {
      alert("Error actualizando estado premium");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres borrar este usuario y TODOS sus datos (incluyendo armarios y chats)?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(users.filter(u => u.id !== id));
      fetchData(); // refresh stats
    } catch (error) {
      alert("Error eliminando usuario");
    }
  };

  const startEdit = (user) => {
    setEditUserId(user.id);
    setEditUserData({ email: user.email, name: user.name || '', gender: user.gender || 'Mujer', role: user.role, password: '' });
  };

  const handleSaveEdit = async () => {
    try {
      const res = await axios.put(`${API_URL}/api/admin/users/${editUserId}`, editUserData, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(users.map(u => u.id === editUserId ? { ...u, ...res.data } : u));
      setEditUserId(null);
    } catch (error) {
      alert("Error editando usuario");
    }
  };

  // Avatar helper
  const getInitials = (email) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-gray-950 text-gray-400 flex flex-col flex-shrink-0 md:h-full z-10 shadow-lg">
        <div className="h-16 flex flex-shrink-0 items-center justify-between md:justify-start px-6 border-b border-gray-800">
          <div className="flex items-center">
            <Shield className="text-purple-500 mr-2" />
            <span className="text-white font-bold tracking-widest uppercase text-sm">Ventoo Admin</span>
          </div>
          <button 
            onClick={() => { sessionStorage.removeItem('adminToken'); window.location.href='/'; }}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-x-auto md:overflow-y-auto py-2 md:py-6">
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 px-3 min-w-max md:min-w-0">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-gray-800 text-white' : 'hover:bg-gray-900 hover:text-gray-200'}`}
            >
              <BarChart2 size={18} /> <span className="whitespace-nowrap">Resumen General</span>
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-gray-800 text-white' : 'hover:bg-gray-900 hover:text-gray-200'}`}
            >
              <Users size={18} /> <span className="whitespace-nowrap">Gestión de Usuarios</span>
            </button>
          </nav>
        </div>

        <div className="hidden md:block p-4 border-t border-gray-800">
          <button 
            onClick={() => { sessionStorage.removeItem('adminToken'); window.location.href='/'; }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Volver a la App
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && stats && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Ventoo Admin Panel</h2>
                  <p className="text-gray-400 text-sm mb-6">Resumen en tiempo real · Se actualiza cada 15s</p>
                  
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
                      <span className="text-4xl font-bold text-gray-900">{stats.onlineUsers}</span>
                      <p className="text-xs text-gray-400 mt-2">Activos últimos 5 min</p>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Usuarios Totales</h3>
                      </div>
                      <span className="text-4xl font-bold text-gray-900">{stats.totalUsers}</span>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><Star size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Cuentas Premium</h3>
                      </div>
                      <span className="text-4xl font-bold text-gray-900">{stats.premiumUsers}</span>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Activity size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Outfits Generados</h3>
                      </div>
                      <span className="text-4xl font-bold text-gray-900">{stats.totalOutfits}</span>
                    </div>

                    {/* Stat Card 5 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><MessageSquare size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Mensajes de IA</h3>
                      </div>
                      <span className="text-4xl font-bold text-gray-900">{stats.totalMessages}</span>
                    </div>
                    {/* Stat Card 6 - Basic Accounts */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gray-100 text-gray-600 rounded-xl"><Users size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Cuentas Básicas</h3>
                      </div>
                      <span className="text-4xl font-bold text-gray-900">{stats.totalUsers - stats.premiumUsers}</span>
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
                          strokeDashoffset={251.2 - (251.2 * (stats.totalUsers / stats.maxUsersCapacity))}
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">{((stats.totalUsers / stats.maxUsersCapacity) * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2"><Database size={20} className="text-purple-500"/> Capacidad de Base de Datos (Neon Free Tier)</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Actualmente Neon otorga 0.5 GB de almacenamiento gratuito. Calculando un promedio de 10 KB de datos relacionales generados por usuario activo (historial, ropa, chats, etc.), el límite seguro aproximado es de <strong className="text-gray-900">50,000 usuarios</strong>.
                      </p>
                      <div className="flex gap-4">
                        <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                          <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider mb-1">Usados</span>
                          <span className="text-lg font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</span>
                        </div>
                        <div className="bg-purple-50 px-4 py-2 rounded-lg border border-purple-100">
                          <span className="text-xs text-purple-400 block uppercase font-bold tracking-wider mb-1">Restantes</span>
                          <span className="text-lg font-bold text-purple-700">{(stats.maxUsersCapacity - stats.totalUsers).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
                    <button 
                      onClick={() => setShowAdd(!showAdd)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
                    >
                      <UserPlus size={16} /> Añadir Usuario
                    </button>
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
                          type="text" placeholder="Contraseña provisional" required
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
                          <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            
                            {editUserId === u.id ? (
                              <td className="px-6 py-4" colSpan="3">
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
                                    type="text" placeholder="Nueva contraseña" value={editUserData.password} onChange={e => setEditUserData({...editUserData, password: e.target.value})}
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
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                      {getInitials(u.email)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-900">{u.email}</span>
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
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
