import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Star, UserPlus, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminView = ({ token, darkMode }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'USER', isPremium: false });
  const [showAdd, setShowAdd] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (error) {
      alert("Error obteniendo usuarios. ¿Eres admin?");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/admin/users`, newUser, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
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
    } catch (error) {
      alert("Error actualizando estado premium");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres borrar este usuario y todos sus datos?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      alert("Error eliminando usuario");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto p-4 sm:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Shield className="text-purple-500" /> Panel de Administración
          </h2>
          <p className="text-gray-500 text-sm mt-1">Gestiona los usuarios de Ventoo</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          <UserPlus size={16} /> Añadir Usuario
        </button>
      </div>

      {showAdd && (
        <div className={`mb-8 p-6 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className="font-semibold mb-4">Crear nuevo usuario manualmente</h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="email" 
              placeholder="Email" 
              value={newUser.email}
              onChange={e => setNewUser({...newUser, email: e.target.value})}
              className={`p-2 rounded border focus:outline-none focus:ring-2 focus:ring-purple-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'}`}
              required
            />
            <input 
              type="text" 
              placeholder="Contraseña (Provisional)" 
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
              className={`p-2 rounded border focus:outline-none focus:ring-2 focus:ring-purple-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'}`}
              required
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={newUser.role === 'ADMIN'}
                  onChange={e => setNewUser({...newUser, role: e.target.checked ? 'ADMIN' : 'USER'})}
                />
                Es Administrador
              </label>
              <label className="flex items-center gap-2 text-sm text-yellow-500 font-semibold">
                <input 
                  type="checkbox" 
                  checked={newUser.isPremium}
                  onChange={e => setNewUser({...newUser, isPremium: e.target.checked})}
                />
                Cuenta Premium
              </label>
            </div>
            <div className="flex justify-end md:col-span-2">
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm">Guardar Usuario</button>
            </div>
          </form>
        </div>
      )}

      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`border-b ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              <tr>
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Rol</th>
                <th className="p-4 font-medium">Premium</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map(u => (
                <tr key={u.id} className={`${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                  <td className="p-4 text-gray-500">#{u.id}</td>
                  <td className="p-4 font-medium">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => togglePremium(u.id, u.isPremium)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${u.isPremium ? 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700/50' : 'bg-gray-100 text-gray-400 border border-transparent dark:bg-gray-800 hover:text-yellow-500'}`}
                    >
                      <Star size={14} fill={u.isPremium ? "currentColor" : "none"} /> 
                      {u.isPremium ? 'Premium' : 'Normal'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminView;
