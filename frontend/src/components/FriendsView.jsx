import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Users, UserPlus, User, Check, X, Search, MessageCircle, ArrowLeft, Send, Image as ImageIcon, QrCode, Flag, AlertTriangle, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function FriendsView({ token, darkMode, onNavigate }) {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'add', 'requests', 'chat'
  const [activeChatFriend, setActiveChatFriend] = useState(null);

  const [friendCode, setFriendCode] = useState('');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const [addCodeInput, setAddCodeInput] = useState('');
  const [addMessage, setAddMessage] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatScrollRef = useRef(null);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDescription, setReportDescription] = useState('');
  const [reportMessage, setReportMessage] = useState('');

  // Outfit Sharing State
  const [showOutfitPicker, setShowOutfitPicker] = useState(false);
  const [userOutfits, setUserOutfits] = useState([]);
  const [savingOutfitId, setSavingOutfitId] = useState(null);

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

  const handleScan = async (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      setShowScanner(false);
      const code = detectedCodes[0].rawValue;
      try {
        const res = await axios.post(`${API_URL}/api/friends/request`, { code: code }, { headers: { Authorization: `Bearer ${token}` } });
        setAddMessage(res.data.message);
        setTimeout(() => setAddMessage(''), 3000);
      } catch (err) {
        setAddMessage(err.response?.data?.error || 'Error al enviar solicitud');
        setTimeout(() => setAddMessage(''), 3000);
      }
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
      const res = await axios.post(`${API_URL}/api/friends/${activeChatFriend.id}/messages`, { content: newMessage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([...messages, res.data.message]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!activeChatFriend) return;
    try {
      await axios.post(`${API_URL}/api/friends/${activeChatFriend.id}/report`, {
        reason: reportReason,
        description: reportDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportMessage('Reporte enviado correctamente.');
      setTimeout(() => {
        setShowReportModal(false);
        setReportMessage('');
        setReportDescription('');
      }, 2000);
    } catch (err) {
      setReportMessage(err.response?.data?.error || 'Error enviando el reporte.');
    }
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

  const fetchOutfits = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/historial`, { headers: { Authorization: `Bearer ${token}` } });
      setUserOutfits(res.data);
    } catch (err) {
      console.error('Error fetching outfits:', err);
    }
  };

  const openOutfitPicker = () => {
    setShowOutfitPicker(true);
    fetchOutfits();
  };

  const handleShareOutfit = async (outfitId) => {
    if (!activeChatFriend) return;
    try {
      const res = await axios.post(`${API_URL}/api/friends/${activeChatFriend.id}/share`, 
        { consultaId: outfitId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages([...messages, res.data.message]);
      setShowOutfitPicker(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSharedOutfit = async (outfitId) => {
    try {
      setSavingOutfitId(outfitId);
      const res = await axios.post(`${API_URL}/api/historial/save-shared/${outfitId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message || 'Outfit guardado en tu historial exitosamente.');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar el outfit.');
    } finally {
      setSavingOutfitId(null);
    }
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
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all relative ${activeTab === 'requests' ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700') : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}
            >
              <UserPlus size={16} /> Solicitudes
              {requests.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {requests.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'add' ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700') : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}
            >
              <QrCode size={16} /> Añadir
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

            {/* Add Friend Input & Scanner */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white shadow-sm border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Añadir con Código</h3>
                <button 
                  onClick={() => setShowScanner(!showScanner)}
                  className={`p-2 rounded-xl transition-colors ${showScanner ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}
                >
                  <QrCode size={20} />
                </button>
              </div>
              
              {showScanner ? (
                <div className="mb-6 rounded-2xl overflow-hidden border-2 border-indigo-500 aspect-square max-w-sm mx-auto">
                  <Scanner onScan={handleScan} onError={(e) => console.log('QR Error', e)} />
                  <p className={`text-center py-2 text-sm font-medium bg-indigo-500 text-white`}>Escaneando código QR...</p>
                </div>
              ) : (
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
              )}
              
              {addMessage && (
                <p className={`mt-3 text-sm font-medium ${addMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                  {addMessage}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* REQUESTS LIST TAB */}
        {activeTab === 'requests' && (
          <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white shadow-sm border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 text-indigo-500">Solicitudes Recibidas</h3>
              {requests.length === 0 ? (
                <div className="text-center py-10">
                  <UserPlus size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No tienes solicitudes de amistad pendientes.</p>
                </div>
              ) : (
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
              )}
            </div>
          </motion.div>
        )}

        {/* FRIENDS LIST TAB */}
        {activeTab === 'friends' && (
          <motion.div key="friends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
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
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center">
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
              <button 
                onClick={() => setShowReportModal(true)}
                title="Reportar Usuario"
                className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-500'}`}
              >
                <AlertTriangle size={20} />
              </button>
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
                          <div className={`mt-3 p-3 rounded-xl border ${isMine ? 'bg-indigo-700/50 border-indigo-500/50' : (darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200')}`}>
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider opacity-80 cursor-pointer" onClick={() => onNavigate('/history')}>
                              <ImageIcon size={14} /> Outfit Compartido
                            </div>
                            <p className="text-sm line-clamp-2 cursor-pointer" onClick={() => onNavigate('/history')}>{msg.outfit.ubicacion}</p>
                            
                            {!isMine && (
                              <button 
                                onClick={() => handleSaveSharedOutfit(msg.outfit.id)}
                                disabled={savingOutfitId === msg.outfit.id}
                                className={`mt-3 w-full py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                              >
                                {savingOutfitId === msg.outfit.id ? (
                                  <span className="animate-pulse">Guardando...</span>
                                ) : (
                                  <>
                                    <Database size={14} /> Guardar en mi historial
                                  </>
                                )}
                              </button>
                            )}
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
                <button 
                  type="button" 
                  onClick={openOutfitPicker}
                  className={`p-3 rounded-xl transition-colors flex items-center justify-center ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-indigo-400' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}
                  title="Compartir Outfit"
                >
                  <ImageIcon size={20} />
                </button>
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md p-6 rounded-3xl ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-2xl'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Flag className="text-red-500" /> Reportar Usuario
              </h3>
              <button onClick={() => setShowReportModal(false)} className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X size={20} />
              </button>
            </div>

            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              ¿Por qué quieres reportar a <strong>{activeChatFriend?.name}</strong>? Los reportes son anónimos y son revisados por un administrador.
            </p>

            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Motivo</label>
                <select 
                  value={reportReason} 
                  onChange={(e) => setReportReason(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-red-500 outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                >
                  <option value="Spam">Spam</option>
                  <option value="Acoso o Insultos">Acoso o Insultos</option>
                  <option value="Contenido Inapropiado">Contenido Inapropiado</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Detalles (Opcional)</label>
                <textarea 
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Añade más información..."
                  className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] resize-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              {reportMessage && (
                <p className={`text-sm font-medium ${reportMessage.includes('Error') || reportMessage.includes('Ya has') ? 'text-red-500' : 'text-green-500'}`}>
                  {reportMessage}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowReportModal(false)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Enviar Reporte
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Outfit Picker Modal */}
      {showOutfitPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`w-full max-w-2xl p-6 rounded-3xl ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-2xl'} flex flex-col max-h-[80vh]`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <ImageIcon className="text-indigo-500" /> Compartir Outfit
              </h3>
              <button onClick={() => setShowOutfitPicker(false)} className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {userOutfits.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-8">
                  <Database size={48} className="mb-4 text-indigo-400" />
                  <p>No tienes outfits guardados en tu historial para compartir.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userOutfits.map(outfit => {
                    let recomendacion = {};
                    try {
                      recomendacion = JSON.parse(outfit.recomendacion_json);
                    } catch (e) {}

                    return (
                      <div 
                        key={outfit.id}
                        onClick={() => handleShareOutfit(outfit.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-indigo-500' : 'bg-gray-50 border-gray-200 hover:border-indigo-500 hover:shadow-md'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm truncate pr-2">{outfit.ubicacion}</h4>
                          <span className={`text-xs px-2 py-1 rounded-md font-bold ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                            {outfit.isFavorite ? '❤️' : '👕'}
                          </span>
                        </div>
                        <p className="text-xs opacity-70 line-clamp-2 mb-3">
                          {recomendacion?.resumen || 'Detalles del outfit...'}
                        </p>
                        <div className="flex items-center justify-between text-xs font-bold opacity-60">
                          <span>{new Date(outfit.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center text-indigo-500 group-hover:underline">
                            Compartir <Send size={12} className="ml-1" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
