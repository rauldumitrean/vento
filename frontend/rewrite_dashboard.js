const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'DashboardView.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const returnStart = content.indexOf('return (', content.lastIndexOf('return ('));
if (returnStart === -1) {
  console.error("Return not found");
  process.exit(1);
}

const newReturn = \
  return (
    <div className="flex h-[100dvh] font-sans overflow-hidden text-white bg-black">
      {/* Immersive Glassmorphism Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')]" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[60px]" />
        {/* Subtle glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full filter blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full filter blur-[150px]" />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium max-w-sm text-center bg-indigo-600/90 backdrop-blur-md text-white border border-white/10"
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex w-full h-full p-2 sm:p-4 gap-4">
        {/* Sidebar */}
        <Sidebar view={view} setView={setView} handleLogout={onLogout} userName={userName} isPremium={isPremium} />

        {/* Main Content */}
        <div className="flex-1 h-full rounded-[2rem] overflow-hidden flex flex-col relative shadow-2xl border border-white/10 bg-black/20 backdrop-blur-2xl">
          {/* Mobile Top Bar */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
             <span className="text-xl font-bold tracking-widest text-white">Ventoo</span>
             <div className="flex gap-2">
               <button onClick={() => setView('profile')} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10">
                 <User size={18} />
               </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col relative">
            <main className="flex-1 p-6 sm:p-10 flex flex-col w-full max-w-6xl mx-auto min-h-full">
              {view === 'armario' ? (
                <ArmarioHistorial token={token} darkMode={true} />
              ) : view === 'admin' && Cookies.get('userRole') === 'ADMIN' ? (
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>}><AdminView token={token} darkMode={true} /></Suspense>
              ) : view === 'profile' ? (
                <ProfileSettings token={token} darkMode={true} onLogout={onLogout} />
              ) : view === 'friends' ? (
                <FriendsView token={token} darkMode={true} onNavigate={setView} />
              ) : view === 'chat' ? (
                <div className="h-full flex flex-col pt-8 pb-[100px] lg:pb-0">{chatWidget}</div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
                  {/* Dashboard - Zyricon style centralized search */}
                  
                  {!weather && !loading ? (
                    <div className="flex flex-col items-center w-full max-w-3xl justify-center mt-[-10vh]">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-8 flex items-center justify-center shadow-lg shadow-indigo-500/50 animate-[pulse_3s_ease-in-out_infinite]">
                         <CloudSnow className="text-white w-12 h-12" />
                      </div>
                      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-10 text-center">
                        Ready to discover your style?
                      </h1>
                      
                      <div className="w-full relative z-50">
                        <form onSubmit={handleSearch} className="flex-1 flex items-center px-6 py-4 rounded-3xl relative transition-all duration-300 shadow-2xl border bg-black/40 border-white/20 focus-within:border-indigo-500/50 focus-within:bg-black/60 backdrop-blur-xl">
                          <Search className="w-6 h-6 mr-4 text-gray-400" />
                          <input 
                            type="text" 
                            placeholder="¿Dónde vas a ir hoy? (Ej: Madrid, Tokio...)" 
                            className="w-full py-2 bg-transparent focus:outline-none text-white placeholder-gray-500 text-lg"
                            value={location}
                            onChange={e => {
                              setLocation(e.target.value);
                              setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                          />
                          {location && (
                            <button 
                              type="button" 
                              onClick={() => {
                                setLocation('');
                                setSuggestions([]);
                              }}
                              className="ml-3 p-2 rounded-full transition-colors text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <X size={20} />
                            </button>
                          )}

                          <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-[110%] left-0 right-0 rounded-2xl shadow-2xl border overflow-hidden z-[100] bg-gray-900 border-gray-700 backdrop-blur-2xl"
                              >
                                {suggestions.map((city, idx) => (
                                  <div 
                                    key={\\-\\}
                                    onClick={() => {
                                      if (!city.latitude) return;
                                      handleSelectSuggestion(city);
                                    }}
                                    className={\px-5 py-4 cursor-pointer flex items-center gap-4 transition-colors hover:bg-gray-800 \\}
                                  >
                                    <MapPin size={18} className="text-indigo-400 opacity-70 flex-shrink-0" />
                                    <div className="flex flex-col">
                                      <span className="font-medium text-base text-gray-200">{city.name}</span>
                                      <span className="text-sm text-gray-500">
                                        {city.admin1 ? city.admin1 + ', ' : ''}{city.country}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </form>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-10">
                        <button onClick={handleGeolocation} className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left flex flex-col gap-3 group">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                            <MapPin size={20} />
                          </div>
                          <span className="font-bold text-sm">Mi Ubicación Actual</span>
                          <span className="text-xs text-gray-400">Descubre outfits para el clima de tu ciudad al instante.</span>
                        </button>
                        <button onClick={() => {setLocation('Madrid'); handleSearch({preventDefault:()=>{}});}} className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left flex flex-col gap-3 group">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <Sun size={20} />
                          </div>
                          <span className="font-bold text-sm">Escapada de Verano</span>
                          <span className="text-xs text-gray-400">Playa, sol y looks frescos para tus vacaciones.</span>
                        </button>
                        <button onClick={() => {setLocation('Londres'); handleSearch({preventDefault:()=>{}});}} className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left flex flex-col gap-3 group">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <CloudRain size={20} />
                          </div>
                          <span className="font-bold text-sm">City Break Lluvioso</span>
                          <span className="text-xs text-gray-400">Estilo urbano preparado para la lluvia y el viento.</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Result state
                    <div className="w-full flex flex-col lg:flex-row gap-8">
                       <div className="flex-1 flex flex-col space-y-8">
                          {/* Top pill for weather */}
                          <div className="flex justify-between items-center w-full">
                            <button onClick={() => {setWeather(null); setOutfit(null);}} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                               <ArrowLeft size={16} /> Volver
                            </button>
                          </div>
                          
                          {loading && (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                              <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
                              <p className="text-lg font-medium text-indigo-300">{loadingSteps[loadingStepIndex]}</p>
                            </div>
                          )}

                          {weather && !loading && (
                             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={() => setShowWeatherModal(true)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl cursor-pointer hover:bg-white/10 transition-colors flex justify-between items-center">
                               <div>
                                  <h2 className="text-sm tracking-widest uppercase opacity-50 mb-2 font-bold text-indigo-400">Clima Actual</h2>
                                  <div className="flex items-end gap-4">
                                     <span className="text-6xl font-light">{weather.current.temperature_2m}°</span>
                                     <div className="pb-1">
                                        <h3 className="text-xl font-bold">{weather.location}</h3>
                                        <p className="text-gray-400 text-sm">{weather.current.wind_speed_10m} km/h • {weather.current.relative_humidity_2m}% humedad</p>
                                     </div>
                                  </div>
                               </div>
                               <AnimatedWeatherIcon temperature={weather.current.temperature_2m} size={80} />
                             </motion.div>
                          )}

                          {outfit && !loading && (
                             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative">
                               <div className="flex justify-between items-start mb-6">
                                 <div>
                                   <h2 className="text-sm tracking-widest uppercase opacity-50 font-bold text-purple-400 mb-2">Generado por IA</h2>
                                   <p className="text-lg italic opacity-90 max-w-2xl">"{outfit.resumen}"</p>
                                 </div>
                                 <button onClick={handleToggleFavorite} className={\p-3 rounded-full transition-colors \\}>
                                   <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                                 </button>
                               </div>

                               <OutfitGrid prendas={outfit.prendas} darkMode={true} token={token} />

                               {outfit.consejo_extra && (
                                  <div className="mt-8 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm">
                                    <span className="font-bold block mb-1">Consejo:</span>
                                    {outfit.consejo_extra}
                                  </div>
                               )}
                             </motion.div>
                          )}
                       </div>
                       
                       {/* Chat Side Panel in Dashboard */}
                       {outfit && (
                         <div className="w-full lg:w-[400px] shrink-0 h-[600px] lg:h-[calc(100vh-6rem)] sticky top-6">
                           {chatWidget}
                         </div>
                       )}
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>

          {/* Mobile bottom nav */}
          <div className="lg:hidden">
            <MobileNavBar view={view} setView={setView} darkMode={true} setDarkMode={()=>{}} handleLogout={onLogout} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardView;
\

const contentBeforeReturn = content.substring(0, returnStart);

fs.writeFileSync(filePath, contentBeforeReturn + newReturn);
console.log("DashboardView rewritten successfully.");
