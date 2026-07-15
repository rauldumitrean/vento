import { motion } from 'framer-motion';
import { ArrowRight, CloudRain, Sun, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-100 to-transparent -z-10" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute top-40 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center transform rotate-3">
            <Sparkles className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">Ventoo</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors hidden sm:block"
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Entrar
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center z-10 max-w-5xl mx-auto w-full mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold mb-6 tracking-wide uppercase border border-indigo-200">
            Tu Estilista Personal Impulsado por IA
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 leading-tight tracking-tight">
            Vístete perfecto para <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
              cualquier clima.
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Ventoo analiza el tiempo de tu ciudad en tiempo real y utiliza inteligencia artificial para recomendarte el outfit ideal, crear imágenes de referencia y darte opciones de compra.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              Comenzar ahora
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Feature grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full text-left pb-10"
        >
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
              <CloudRain size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Clima en Tiempo Real</h3>
            <p className="text-gray-500 leading-relaxed">Conoce exactamente la temperatura, humedad y probabilidad de lluvia en tu ciudad para no llevarte sorpresas.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Estilo Generado por IA</h3>
            <p className="text-gray-500 leading-relaxed">Nuestra IA avanzada diseña conjuntos únicos basándose en el clima, tu estilo y las últimas tendencias.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
              <Sun size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Asistente Interactivo</h3>
            <p className="text-gray-500 leading-relaxed">Chatea con la IA para pedirle cambios en el outfit. ¿Prefieres falda en vez de pantalón? Solo pídelo.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
