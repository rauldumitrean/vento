import { useEffect } from 'react';
import { Cloud, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsView() {
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
        <h1 className="text-4xl font-black mb-8">Términos de Servicio</h1>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar Ventoo, aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar nuestro servicio.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Descripción del Servicio</h2>
            <p>Ventoo es una plataforma impulsada por Inteligencia Artificial que proporciona recomendaciones de moda basadas en las condiciones meteorológicas y las preferencias del usuario. Nos reservamos el derecho de modificar o discontinuar el servicio en cualquier momento.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Cuentas de Usuario</h2>
            <p>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Ventoo no se hará responsable de ninguna pérdida o daño que resulte del incumplimiento de esta obligación de seguridad.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Suscripciones y Pagos</h2>
            <p>Las suscripciones Premium (Mensual y Lifetime) se procesan de forma segura. El acceso Lifetime es un pago único. Ventoo se reserva el derecho de ajustar los precios en el futuro, pero esto no afectará a las suscripciones Lifetime existentes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Propiedad Intelectual</h2>
            <p>Todo el contenido original, características y funcionalidad son propiedad exclusiva de Ventoo y están protegidos por las leyes internacionales de derechos de autor.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Sistema de Auto-Moderación y Conducta</h2>
            <p className="mb-3">Para garantizar una experiencia segura, Ventoo implementa un sistema de <strong>Auto-Moderación automatizado mediante Inteligencia Artificial</strong>, aplicable tanto en los perfiles como en los chats de recomendaciones:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Prohibiciones estrictas:</strong> Queda terminantemente prohibido usar los servicios para solicitar contenido ilegal, violencia, actos explícitos de naturaleza sexual, discurso de odio, o cualquier forma de abuso.</li>
              <li><strong>Bloqueo automático:</strong> El sistema evalúa los textos en tiempo real. En caso de detectar violaciones a estas normas o intentos de alterar las instrucciones del sistema ("jailbreaks"), la cuenta será suspendida de manera automática e instantánea.</li>
              <li><strong>Duración de sanciones:</strong> Las suspensiones varían según el grado de severidad dictaminado por la IA: Infracciones leves (1 día), infracciones medias (7 días) e infracciones graves (30 días). Casos extremos podrían conllevar bloqueos permanentes tras revisión manual.</li>
              <li><strong>Derecho a apelación:</strong> Si consideras que el sistema de seguridad te ha bloqueado por error, puedes utilizar el botón de apelación en la pantalla de bloqueo para que un administrador humano revise tu caso.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
