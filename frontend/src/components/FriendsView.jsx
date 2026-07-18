import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { Users, UserPlus, Check, X, Search, MessageCircle, ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function FriendsView({ token, darkMode, onNavigate }) {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'add', 'chat'
  const [activeChatFriend, setActiveChatFriend] = useState(null);

  const [friendCode, setFriendCode] = useState('');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const [addCodeInput, setAddCodeInput] = useState('');
  const [addMessage, setAddMessage] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatScrollRef = useRef(null);

  useEffect(() => {
    fetchFriendCode();
    fetchFriends();
    fetchRequests();
    
    // Simple polling para chat y solicitudes (MVP)
    const interval = setInterval(() => {
      fetchRequests(false);
      if (activeTab === 'friends') {
        fetchFriends(false);
      }
      if (activeTab === 'chat' && activeChatFriend) {
        fetchMessages(activeChatFriend.id, false);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeTab, activeChatFriend]);

  // Hacer scroll abajo cuando llegan mensajes nuevos
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchFriendCode = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/friends/code`, { headers: { Authorization: `Bearer ${token}` } });
      setFriendCode(res.data.friendCode);
    } catch (err) {}
  };

  const fetchFriends = async (showLoading = true) => {
    try {
      const res = await axios.get(`${API_URL}/api/friends`, { headers: { Authorization: `Bearer ${token}` } });
      setFriends(res.data.friends);
    } catch (err) {}
  };

  const fetchRequests = async (showLoading = true) => {
    try {
      const res = await axios.get(`${API_URL}/api/friends/requests`, { headers: { Authorization: `Bearer ${token}` } });
      setRequests(res.data.requests);
    } catch (err) {}
  };

  const fetchMessages = async (friendId, showLoading = true) => {
    try {
      const res = await axios.get(`${API_URL}/api/friends/${friendId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data.messages);
    } catch (err) {}
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!addCodeInput.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/api/friends/request`, { code: addCodeInput }, { headers: { Authorization: `Bearer ${token}` } });
      setAddMessage(res.data.message);
      setAddCodeInput('');
      setTimeout(() => setAddMessage(''), 3000);
    } catch (err) {
      setAddMessage(err.response?.data?.error || 'Error al enviar solicitud');
      setTimeout(() => setAddMessage(''), 3000);
    }
  };

  const handleAcceptRequest = async (friendshipId, accept) => {
    try {
      await axios.post(`${API_URL}/api/friends/accept`, { friendshipId, accept }, { headers: { Authorization: `Bearer ${token}` } });
      fetchRequests();
      fetchFriends();
    } catch (err) {}
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatFriend) return;
    try {
      const res = await axios.post(`${API_URL}/api/friends/${activeChatFriend.id}/messages`, { content: newMessage }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages([...messages, res.data.message]);
      setNewMessage('');
    } catch (err) {}
  };

  const openChat = (friend) => {
    setActiveChatFriend(friend);
    setActiveTab('chat');
    fetchMessages(friend.id);
  };

  const closeChat = () => {
    setActiveChatFriend(null);
    setActiveTab('friends');
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`p-4 md:p-8 max-w-4xl mx-auto rounded-3xl ${darkMode ? 'text-white' : 'text-gray-900'} min-h-[calc(100vh-100px)] flex flex-col`}>
      
      {/* HEADER */}
      {activeTab !== 'chat' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Comunidad</h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Conecta con amigos y comparte tus outfits</p>
          </div>
          <div className={`flex rounded-xl p-1 border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <button 
              onClick={() => setActiveTab('friends')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'friends' ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700') : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}
            >
              <Users size={16} /> Mis Amigos
            </button>
            <button 
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'add' ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700') : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}
            >
              <UserPlus size={16} /> Añadir Amigos
            </button>
          </div>
        </div>
      )}

      {/* TABS CONTENT */}
      <AnimatePresence mode="wait">
        
        {/* ADD FRIENDS TAB */}
        {activeTab === 'add' && (
          <motion.div key="add" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {/* My Code Section */}
            <div className={`p-8 rounded-3xl border flex flex-col items-center justify-center text-center ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white shadow-sm border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-2">Tu Código de Amigo</h3>
              <p className={`text-sm mb-6 max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Muestra este código QR o comparte tu código de texto para que tus amigos te añadan en Ventoo.
              </p>
              
              <div className="bg-white p-4 rounded-2xl shadow-inner mb-6">
                {friendCode && <QRCode value={friendCode} size={150} level="H" />}
              </div>
              
              <div className={`px-6 py-3 rounded-xl border text-xl font-mono tracking-widest font-bold ${darkMode ? 'bg-black border-gray-800 text-indigo-400' : 'bg-gray-50 border-gray-200 text-indigo-600'}`}>
                {friendCode || 'CARGANDO...'}
              </div>
            </div>

            {/* Add Friend Input */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white shadow-sm border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4">Añadir con Código</h3>
              <form onSubmit={handleSendRequest} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={addCodeInput}
                    onChange={(e) => setAddCodeInput(e.target.value.toUpperCase())}
                    placeholder="Ej. 8F3A2B1C"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border font-mono tracking-wider ${darkMode ? 'bg-black border-gray-800 focus:border-indigo-500 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 focus:border-indigo-400 text-black placeholder-gray-400'} focus:outline-none transition-colors uppercase`}
                  />
                </div>
                <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors">
                  Enviar
                </button>
              </form>
              {addMessage && (
                <p className={`mt-3 text-sm font-medium ${addMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                  {addMessage}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* FRIENDS LIST TAB */}
        {activeTab === 'friends' && (
          <motion.div key="friends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {/* Pending Requests */}
            {requests.length > 0 && (
              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white shadow-sm border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-4 text-indigo-500">Solicitudes Pendientes ({requests.length})</h3>
                <div className="space-y-3">
                  {requests.map(req => (
                    <div key={req.id} className={`flex items-center justify-between p-3 rounded-2xl ${darkMode ? 'bg-black/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        {req.user.profilePicture ? (
                          <img src={req.user.profilePicture} alt={req.user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                            <User size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{req.user.name || 'Usuario'}</p>
                          <p className={`text-xs font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>#{req.user.friendCode}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAcceptRequest(req.id, false)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-gray-800 text-gray-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-white text-gray-500 hover:bg-red-50 hover:text-red-500'}`}>
                          <X size={18} />
                        </button>
                        <button onClick={() => handleAcceptRequest(req.id, true)} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors">
                          <Check size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className={`p-6 rounded-3xl border flex-1 ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white shadow-sm border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4">Tus Amigos ({friends.length})</h3>
              
              {friends.length === 0 ? (
                <div className="text-center py-10">
                  <Users size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Aún no tienes amigos añadidos.</p>
                  <button onClick={() => setActiveTab('add')} className="mt-4 text-indigo-500 font-bold hover:underline">¡Añade a alguien!</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {friends.map(friend => (
                    <div 
                      key={friend.friendshipId} 
                      onClick={() => openChat(friend)}
                      className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${darkMode ? 'bg-black/50 border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800' : 'bg-gray-50 border-transparent hover:border-indigo-200 hover:bg-indigo-50/50'}`}
                    >
                      <div className="flex items-center gap-4">
                        {friend.profilePicture ? (
                          <img src={friend.profilePicture} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                            <User size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{friend.name || 'Usuario'}</p>
                          <p className={`text-xs font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>#{friend.friendCode}</p>
                        </div>
                      </div>
                      <MessageCircle size={20} className="text-indigo-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && activeChatFriend && (
          <motion.div key="chat" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className={`flex flex-col h-full flex-1 rounded-3xl border overflow-hidden ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white shadow-sm border-gray-200'}`}>
            
            {/* Chat Header */}
            <div className={`flex items-center p-4 border-b ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <button onClick={closeChat} className={`p-2 mr-3 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}>
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                {activeChatFriend.profilePicture ? (
                  <img src={activeChatFriend.profilePicture} alt={activeChatFriend.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <User size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                )}
                <div>
                  <h3 className="font-bold">{activeChatFriend.name || 'Usuario'}</h3>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <MessageCircle size={40} className="mb-3" />
                  <p>Envía el primer mensaje a {activeChatFriend.name || 'tu amigo'}</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId !== activeChatFriend.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMine ? 'bg-indigo-600 text-white rounded-tr-sm' : (darkMode ? 'bg-gray-800 text-white rounded-tl-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm')}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        
                        {/* Render Outfit Compartido */}
                        {msg.outfit && (
                          <div className={`mt-3 p-3 rounded-xl border ${isMine ? 'bg-indigo-700/50 border-indigo-500/50' : (darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200')} cursor-pointer`} onClick={() => onNavigate('/history')}>
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider opacity-80">
                              <ImageIcon size={14} /> Outfit Compartido
                            </div>
                            <p className="text-sm line-clamp-2">{msg.outfit.ubicacion}</p>
                            <p className="text-xs mt-1 opacity-70">Ver detalles en el historial de outfits recibidos...</p>
                          </div>
                        )}
                        
                        <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-indigo-200' : (darkMode ? 'text-gray-500' : 'text-gray-400')}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <div className={`p-4 border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className={`flex-1 px-4 py-3 rounded-xl border ${darkMode ? 'bg-black border-gray-800 focus:border-indigo-500 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 focus:border-indigo-400 text-black placeholder-gray-400'} focus:outline-none transition-colors`}
                />
                <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center">
                  <Send size={20} />
                </button>
              </form>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
