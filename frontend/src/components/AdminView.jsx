import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Star, UserPlus, Shield, Edit2, Save, X, Activity, Users, MessageSquare, ArrowLeft, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminView = ({ token }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users'
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'USER', isPremium: false });
  const [showAdd, setShowAdd] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({ email: '', role: '', password: '' });

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchData();
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
      setNewUser({ email: '', password: '', role: 'USER', isPremium: false });
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
    setEditUserData({ email: user.email, role: user.role, password: '' });
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
    <div className="flex h-screen bg-neutral-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-950 text-gray-400 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Shield className="text-purple-500 mr-2" />
          <span className="text-white font-bold tracking-widest uppercase text-sm">Ventoo Admin</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-gray-800 text-white' : 'hover:bg-gray-900 hover:text-gray-200'}`}
            >
              <BarChart2 size={18} /> Resumen General
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-gray-800 text-white' : 'hover:bg-gray-900 hover:text-gray-200'}`}
            >
              <Users size={18} /> Gestión de Usuarios
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => navigate('/')}
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
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && stats && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Analíticas del Negocio</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    {/* Stat Card 1 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Usuarios Totales</h3>
                      </div>
                      <span className="text-4xl font-bold text-gray-900">{stats.totalUsers}</span>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><Star size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Cuentas Premium</h3>
                      </div>
                      <span className="text-4xl font-bold text-gray-900">{stats.premiumUsers}</span>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Activity size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Outfits Generados</h3>
                      </div>
                      <span className="text-4xl font-bold text-gray-900">{stats.totalOutfits}</span>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><MessageSquare size={24} /></div>
                        <h3 className="text-gray-500 font-medium">Mensajes de IA</h3>
                      </div>
                      <span className="text-4xl font-bold text-gray-900">{stats.totalMessages}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
                    <button 
                      onClick={() => setShowAdd(!showAdd)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
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

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                        <tr>
                          <th className="px-6 py-4 font-medium">Usuario</th>
                          <th className="px-6 py-4 font-medium">Rol</th>
                          <th className="px-6 py-4 font-medium">Suscripción</th>
                          <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            
                            {editUserId === u.id ? (
                              <td className="px-6 py-4" colSpan="3">
                                <div className="flex items-center gap-4">
                                  <input 
                                    type="email" value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})}
                                    className="p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 w-64 text-sm"
                                  />
                                  <input 
                                    type="text" placeholder="Nueva contraseña (opcional)" value={editUserData.password} onChange={e => setEditUserData({...editUserData, password: e.target.value})}
                                    className="p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 w-48 text-sm"
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
                                    {u.isPremium ? 'Premium Activo' : 'Básico'}
                                  </button>
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
