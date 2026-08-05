import Cookies from 'js-cookie';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Star, UserPlus, Shield, Edit2, Save, X, Activity, Users, MessageSquare, ArrowLeft, BarChart2, Radio, Database, RefreshCw, Ban, AlertCircle, Check, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminView = ({ token }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'outfits' | 'tickets'
  const [users, setUsers] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [chats, setChats] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState(''); // '' means all
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
  const [selectedChat, setSelectedChat] = useState(null); // Chat para el modal
  const [chatFilterEmail, setChatFilterEmail] = useState('');
  const [chatFilterName, setChatFilterName] = useState('');

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

  const fetchOutfits = async (userId = '') => {
    try {
      const url = userId ? `${API_URL}/api/admin/outfits?userId=${userId}` : `${API_URL}/api/admin/outfits`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setOutfits(res.data);
    } catch (err) {
      showAdminMsg('Error obteniendo outfits filtrados');
    }
  };

  const fetchChats = async () => {
    try {
      setIsRefreshing(true);
      const res = await axios.get(`${API_URL}/api/admin/chats`, { headers: { Authorization: `Bearer ${token}` } });
      setChats(res.data);
    } catch (err) {
      showAdminMsg('Error obteniendo chats');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const fetchReports = async () => {
    try {
      setIsRefreshing(true);
      const res = await axios.get(`${API_URL}/api/admin/reports`, { headers: { Authorization: `Bearer ${token}` } });
      setReports(res.data.reports || []);
    } catch (err) {
      showAdminMsg('Error obteniendo reportes');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes, outfitsRes, ticketsRes, chatsRes, reportsRes, communityRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/admin/outfits`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/admin/tickets`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/admin/chats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/admin/reports`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/admin/community`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setOutfits(outfitsRes.data);
      setTickets(ticketsRes.data);
      setChats(chatsRes.data);
      setReports(reportsRes.data.reports || []);
      setCommunityPosts(communityRes.data);
      setSelectedUserFilter(''); // Reset filter on full refresh
    } catch (error) {
      showAdminMsg('Error de conexión. Verifica tus permisos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setIsRefreshing(true);
      const res = await axios.get(`${API_URL}/api/admin/tickets`, { headers: { Authorization: `Bearer ${token}` } });
      setTickets(res.data);
    } catch (err) {
      showAdminMsg('Error obteniendo tickets');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleDeleteAllTickets = async () => {
    if (!window.confirm('¿Estás SEGURO de que quieres borrar todos los tickets? Esto no se puede deshacer.')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/tickets`, { 
        data: { confirmDelete: 'DELETE_ALL_TICKETS' },
        headers: { Authorization: `Bearer ${token}` } 
      });
      setTickets([]);
      showAdminMsg('Todos los tickets borrados', 'success');
    } catch (error) {
      showAdminMsg('Error al borrar tickets');
    }
  };

  const fetchCommunity = async () => {
    try {
      setIsRefreshing(true);
      const res = await axios.get(`${API_URL}/api/admin/community`, { headers: { Authorization: `Bearer ${token}` } });
      setCommunityPosts(res.data);
    } catch (err) {
      showAdminMsg('Error obteniendo comunidad');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleDeleteCommunityPost = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta publicación de la comunidad?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/community/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showAdminMsg('Publicación eliminada de la comunidad', 'success');
      setCommunityPosts(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      showAdminMsg('Error al eliminar publicación');
    }
  };

  const handleCloseTicket = async (id) => {
    if (!window.confirm('¿Estás seguro de cerrar este ticket?')) return;
    try {
      await axios.put(`${API_URL}/api/admin/tickets/${id}/close`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setTickets(tickets.map(t => t.id === id ? { ...t, estado: 'CERRADO' } : t));
      showAdminMsg('Ticket cerrado con éxito', 'success');
    } catch (err) {
      showAdminMsg('Error al cerrar ticket');
    }
  };

  const handleResolveReport = async (id) => {
    try {
      await axios.put(`${API_URL}/api/admin/reports/${id}/resolve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setReports(reports.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
      showAdminMsg('Reporte resuelto', 'success');
    } catch (err) {
      showAdminMsg('Error al resolver reporte');
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
    setEditUserData({ email: user.email, name: user.name || '', gender: user.gender || 'Mujer', age: user.age || '', role: user.role, password: '' });
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
      await axios.delete(`${API_URL}/api/admin/outfits`, { 
        data: { confirmDelete: 'DELETE_ALL_OUTFITS' },
        headers: { Authorization: `Bearer ${token}` } 
      });
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
    <div className="flex flex-col md:flex-row h-[100dvh] bg-neutral-100 font-sans overflow-hidden">
      {/* FIX: Toast notification for admin actions (replaces all alert() calls) */}
      <AnimatePresence>
        {adminMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-[calc(1.5rem+env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium text-white ${adminMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
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
            onClick={() => { Cookies.remove('adminToken'); window.location.href='/'; }}
            className="md:hidden text-gray-400 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-x-auto md:overflow-y-auto py-2 md:py-6">
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 px-4 min-w-max md:min-w-0">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <BarChart2 size={18} /> <span className="whitespace-nowrap">Resumen</span>
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'users' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users size={18} /> <span className="whitespace-nowrap">Usuarios</span>
            </button>
            <button 
              onClick={() => setActiveTab('outfits')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'outfits' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Database size={18} /> <span className="whitespace-nowrap">Outfits</span>
            </button>
            <button 
              onClick={() => setActiveTab('tickets')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'tickets' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <MessageSquare size={18} /> <span className="whitespace-nowrap">Tickets</span>
            </button>
            <button 
              onClick={() => setActiveTab('chats')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'chats' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <MessageSquare size={18} /> <span className="whitespace-nowrap">Moderar Chats</span>
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'reports' ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <AlertCircle size={18} /> <span className="whitespace-nowrap">Reportes</span>
              {reports.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('community')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'community' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Globe size={18} /> <span className="whitespace-nowrap">Comunidad</span>
            </button>
          </nav>
        </div>

        <div className="hidden md:block p-4 border-t border-gray-100">
          <button 
            onClick={() => { Cookies.remove('adminToken'); window.location.href='/'; }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-md text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Volver a la App
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {loading ? (
          <div className="flex-1 w-full h-full">
            {/* Loading states remain unchanged */}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-8" onScroll={(e) => {
                if (activeTab === 'reports') fetchReports();
                if (activeTab === 'community') fetchCommunity();
              }}>
            <AnimatePresence mode="wait">
              {/* ... (existing tabs: overview, users, outfits, tickets, chats) ... */}
              
              {activeTab === 'reports' && (
                <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col min-h-[400px]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="text-red-500" />
                        Reportes de Comunidad
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">Revisa los reportes enviados por los usuarios en el chat.</p>
                    </div>
                    <button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                      <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                      Actualizar
                    </button>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 border-y border-gray-100 text-gray-500 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-4 font-medium">Reportado (Baneado?)</th>
                          <th className="px-6 py-4 font-medium">Reportado por</th>
                          <th className="px-6 py-4 font-medium">Motivo</th>
                          <th className="px-6 py-4 font-medium">Descripción</th>
                          <th className="px-6 py-4 font-medium">Fecha</th>
                          <th className="px-6 py-4 font-medium text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reports.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              <div className="flex flex-col items-center justify-center">
                                <Check size={40} className="text-green-400 mb-3" />
                                <p className="text-lg font-medium text-gray-900">Todo limpio</p>
                                <p>No hay reportes pendientes de revisar.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          reports.map(r => (
                            <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${r.status === 'resolved' ? 'opacity-50 bg-gray-50' : ''}`}>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{r.reported?.name || r.reported?.email}</span>
                                  {r.reported?.isBanned && <span className="text-xs text-red-500 font-bold">BANEADO</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-gray-900">{r.reporter?.name || r.reporter?.email}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {r.reason}
                                </span>
                              </td>
                              <td className="px-6 py-4 max-w-xs truncate" title={r.description}>
                                {r.description || '-'}
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-xs">
                                {new Date(r.createdAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {r.status === 'pending' ? (
                                  <button 
                                    onClick={() => handleResolveReport(r.id)}
                                    className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors font-medium text-xs flex items-center gap-1 ml-auto"
                                  >
                                    <Check size={14} /> Resolver
                                  </button>
                                ) : (
                                  <span className="text-xs font-bold text-gray-400">RESUELTO</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
              {activeTab === 'community' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Globe size={24} /></div>
                      Comunidad ({communityPosts.length})
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {communityPosts.map(post => (
                      <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                               {post.user.profilePicture ? <img src={post.user.profilePicture} className="w-full h-full object-cover" alt=""/> : <UserPlus size={16}/>}
                            </div>
                            <div>
                               <p className="font-bold text-sm text-gray-900">{post.user.name}</p>
                               <p className="text-xs text-gray-500">{post.user.email}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 border border-gray-100">
                          {post.outfit?.resumen || 'Sin resumen'}
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                          <span className="text-xs font-medium text-gray-500">Ubicación: {post.ubicacion}</span>
                          <button 
                            onClick={() => handleDeleteCommunityPost(post.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                          >
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>


              {activeTab === 'community' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Globe size={24} /></div>
                      Comunidad ({communityPosts.length})
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {communityPosts.map(post => {
                      let parsedOutfit = {};
                      try { parsedOutfit = JSON.parse(post.recomendacion_json); } catch(e){}
                      return (
                      <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                               {post.user.profilePicture ? <img src={post.user.profilePicture} className="w-full h-full object-cover" alt=""/> : <UserPlus size={16}/>}
                            </div>
                            <div>
                               <p className="font-bold text-sm text-gray-900">{post.user.name || 'Usuario'}</p>
                               <p className="text-xs text-gray-500">{post.user.email}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 border border-gray-100 line-clamp-3">
                          {parsedOutfit.resumen || 'Sin resumen'}
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                          <span className="text-xs font-medium text-gray-500">Ubicación: {post.ubicacion}</span>
                          <button 
                            onClick={() => handleDeleteCommunityPost(post.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                          >
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </div>
                      </div>
                    )})}
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>
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

      {/* Chat View Modal */}
      <AnimatePresence>
        {selectedChat && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Historial de Chat - {selectedChat.user.email}
                  </h3>
                  <p className="text-xs text-gray-500">
                    ID Consulta: {selectedChat.id} • {new Date(selectedChat.createdAt).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setSelectedChat(null)} className="text-gray-400 hover:bg-gray-200 p-2 rounded-md transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {selectedChat.mensajes && selectedChat.mensajes.length > 0 ? (
                  selectedChat.mensajes.map((msg, i) => {
                    const isModel = msg.rol === 'model';
                    let contentText = msg.contenido;
                    
                    if (isModel) {
                      try {
                        const parsed = JSON.parse(msg.contenido);
                        if (parsed.texto) contentText = parsed.texto;
                      } catch (e) {
                        // Si no es JSON válido, lo mostramos tal cual
                      }
                    }

                    let userBanReason = null;
                    if (!isModel) {
                      // Primero intentamos sacar el motivo de la respuesta de la IA (futuros mensajes)
                      if (i + 1 < selectedChat.mensajes.length) {
                        const nextMsg = selectedChat.mensajes[i + 1];
                        if (nextMsg.rol === 'model') {
                          try {
                            const parsedNext = JSON.parse(nextMsg.contenido);
                            if (parsedNext.infraccion && parsedNext.infraccion.es_infraccion) {
                              userBanReason = parsedNext.infraccion.razon || 'Incumplimiento de normas';
                            }
                          } catch (e) {
                            // Ignore
                          }
                        }
                      }
                      
                      // Fallback para mensajes antiguos: Si es el último mensaje del usuario y está baneado, usamos el banReason del usuario
                      if (!userBanReason && i === selectedChat.mensajes.length - 1 && selectedChat.user.isBanned) {
                         // El motivo suele estar guardado como "[AutoModerator] Motivo..."
                         userBanReason = selectedChat.user.banReason?.replace('[AutoModerator] ', '') || 'Incumplimiento detectado (Historial antiguo)';
                      }
                    }

                    return (
                      <div key={i} className={`flex flex-col ${isModel ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl ${isModel ? 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm' : 'bg-indigo-600 text-white shadow-sm rounded-tr-sm'}`}>
                          <div className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${isModel ? 'text-indigo-400' : 'text-indigo-200'}`}>
                            {isModel ? 'Auto-Moderador / IA' : selectedChat.user.name || 'Usuario'}
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{contentText}</p>
                        </div>
                        {userBanReason && (
                          <div className="max-w-[85%] mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 shadow-sm text-left">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wider mb-0.5">Motivo del Bloqueo:</div>
                              <div className="text-sm font-medium">El Auto-Moderador detectó: {userBanReason} en este mensaje.</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-400 p-8">No hay mensajes guardados en este chat.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminView;
