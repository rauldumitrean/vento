import { useEffect } from 'react';
import { Cloud, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyView() {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-indigo-500/30">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Cloud className="text-purple-500" size={32} />
            <span className="text-2xl font-black tracking-widest text-white">VENTOO</span>
          </div>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Volver
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl font-black mb-8">Política de Privacidad</h1>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Recopilación de Información</h2>
            <p>Recopilamos la información que nos proporcionas directamente, como tu dirección de correo electrónico al registrarte, las preferencias de estilo que configuras en tu perfil y las imágenes que subes voluntariamente al chat de nuestro asistente de moda.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Uso de la Información</h2>
            <p>Utilizamos tu información para proporcionar, mantener y mejorar Ventoo. Específicamente, tus preferencias y datos de ubicación se utilizan en tiempo real para generar recomendaciones de outfits a través de nuestros servicios de Inteligencia Artificial.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Procesamiento de IA</h2>
            <p>Al utilizar las funciones de generación de IA o análisis de imágenes, los datos son procesados por nuestros proveedores de IA de terceros bajo estrictos acuerdos de confidencialidad. No utilizamos tus fotos personales para entrenar modelos públicos.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Seguridad de los Datos</h2>
            <p>Implementamos medidas de seguridad de nivel industrial para proteger tu información personal contra accesos no autorizados, alteración o destrucción. Tus contraseñas están fuertemente encriptadas.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Compartir Información</h2>
            <p>No vendemos ni alquilamos tu información personal a terceros. Solo compartimos la información estrictamente necesaria con proveedores de servicios (como Stripe para pagos) para operar la plataforma.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
