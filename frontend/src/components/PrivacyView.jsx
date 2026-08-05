import { useEffect } from 'react';
import { Cloud, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyView() {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-black text-gray-100 font-sans selection:bg-indigo-500/30">
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
            <p>Recopilamos la información que nos proporcionas directamente, como tu dirección de correo electrónico al registrarte, las preferencias de estilo, imágenes subidas al asistente, y la información generada por tu uso de las funciones de <strong>Comunidad</strong> (mensajes directos, lista de amigos y tu Código de Amigo único).</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Uso de la Información</h2>
            <p>Utilizamos tu información para proporcionar y mejorar Ventoo. Tus preferencias y ubicación generan recomendaciones de outfits por IA. Los datos de la <strong>Comunidad</strong> se usan exclusivamente para facilitar la mensajería privada, el envío de solicitudes mediante Código QR/Texto y el poder compartir tus outfits históricos con tus amigos.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Procesamiento de Visión y Generación por IA</h2>
            <p>Al utilizar las funciones de generación de IA o subir fotos a la sección de armario virtual mediante "Visión por IA", los datos son procesados por nuestros proveedores de IA de terceros bajo estrictos acuerdos de confidencialidad. No utilizamos tus fotos personales para entrenar modelos públicos y son eliminadas una vez analizadas o almacenadas temporalmente para tu historial.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Seguridad de los Datos</h2>
            <p>Implementamos medidas de seguridad de nivel industrial para proteger tu información personal contra accesos no autorizados, alteración o destrucción. Tus contraseñas están fuertemente encriptadas.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Compartir Información</h2>
            <p>No vendemos ni alquilamos tu información personal, mensajes de chat o lista de amigos a terceros. Solo compartimos la información estrictamente necesaria con proveedores de servicios (como Stripe para pagos o Neon para bases de datos) para operar la plataforma de forma segura.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Monitorización de Seguridad y Auto-Moderación</h2>
            <p className="mb-3">Como parte esencial para proporcionar un entorno seguro, empleamos sistemas automatizados de moderación en tiempo real. En relación a tu privacidad, debes saber que:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Análisis de contenido:</strong> Los textos de tu perfil y mensajes enviados en el chat de la aplicación son analizados automáticamente por nuestros proveedores de IA para detectar posibles infracciones a los Términos de Servicio.</li>
              <li><strong>Retención de pruebas:</strong> En caso de que el Auto-Moderador aplique un bloqueo sobre tu cuenta, el sistema registrará de forma temporal la justificación del bloqueo para que nuestro equipo técnico pueda consultarlo si decides interponer una reclamación o apelación a través del soporte técnico.</li>
              <li><strong>No entrenamiento:</strong> Estos análisis de moderación son privados. Ningún texto interceptado por los filtros de moderación se compartirá públicamente ni se venderá a terceros bajo ninguna circunstancia.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Almacenamiento en la Nube y Notificaciones</h2>
            <p className="mb-3">Con la introducción de nuevas funcionalidades premium, recopilamos y procesamos datos adicionales para mejorar tu experiencia:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Maleta en la Nube:</strong> El progreso de tus listas de equipaje (ítems marcados) se guarda en nuestra base de datos para garantizar la persistencia de tus datos en cualquier dispositivo. Esta información es estrictamente privada.</li>
              <li><strong>Alertas Mañaneras:</strong> Si activas esta función, almacenaremos la hora de tu preferencia y tus ciudades favoritas para procesar correos electrónicos automáticos diarios.</li>
              <li><strong>Mix & Match Studio:</strong> Las combinaciones de prendas que generes utilizando esta herramienta se guardan en tu cuenta personal y no se comparten con terceros ni con otros usuarios a menos que tú decidas hacerlas públicas en el Feed de la Comunidad.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
