import sys

file_path = r'c:\Users\raul\Desktop\AppClima\frontend\src\components\AdminView.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { Trash2, Star, UserPlus, Shield, Edit2, Save, X, Activity, Users, MessageSquare, ArrowLeft, BarChart2, Radio, Database, RefreshCw, Ban, AlertCircle, Check } from 'lucide-react';",
    "import { Trash2, Star, UserPlus, Shield, Edit2, Save, X, Activity, Users, MessageSquare, ArrowLeft, BarChart2, Radio, Database, RefreshCw, Ban, AlertCircle, Check, Globe } from 'lucide-react';"
)

# 2. State variables
content = content.replace(
    "  const [tickets, setTickets] = useState([]);",
    "  const [tickets, setTickets] = useState([]);\n  const [communityPosts, setCommunityPosts] = useState([]);"
)

# 3. fetchData
content = content.replace(
    """        axios.get(`${API_URL}/api/admin/reports`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);""",
    """        axios.get(`${API_URL}/api/admin/reports`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/admin/community`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);"""
)

content = content.replace(
    """      setReports(reportsRes.data.reports || []);
      setSelectedUserFilter(''); // Reset filter on full refresh""",
    """      setReports(reportsRes.data.reports || []);
      setCommunityPosts(communityRes.data);
      setSelectedUserFilter(''); // Reset filter on full refresh"""
)

# 4. Handlers
handlers = """
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

  const handleCloseTicket = async (id) => {"""

content = content.replace("  const handleCloseTicket = async (id) => {", handlers)


# 5. Sidebar Nav
sidebar = """            <button 
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
            </button>"""

content = content.replace("""            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex-1 flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'reports' ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <AlertCircle size={18} /> <span className="whitespace-nowrap">Reportes</span>
              {reports.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>""", sidebar)

# 6. onScroll fetch
content = content.replace(
    "if (activeTab === 'reports') fetchReports();\n              }}>",
    "if (activeTab === 'reports') fetchReports();\n                if (activeTab === 'community') fetchCommunity();\n              }}>"
)


# 7. Render Block
community_view = """
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
"""

content = content.replace("            </AnimatePresence>\n          </div>\n        )}\n      </div>\n\n      {/* Ban Modal */}", community_view + "            </AnimatePresence>\n          </div>\n        )}\n      </div>\n\n      {/* Ban Modal */}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
