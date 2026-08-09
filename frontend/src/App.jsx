import Cookies from 'js-cookie';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Component } from 'react';
import axios from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Mejorar UX evitando refetch en móviles al cambiar de tab
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos de caché por defecto
    },
  },
});
import LandingView from './components/LandingView';
import BanView from './components/BanView';

import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import { Suspense, lazy } from 'react';
const AdminView = lazy(() => import('./components/AdminView'));
const AdminLoginView = lazy(() => import('./components/AdminLoginView'));
import IosInstallPrompt from './components/IosInstallPrompt';
import TermsView from './components/TermsView';
import PrivacyView from './components/PrivacyView';
import SupportView from './components/SupportView';
import FaqView from './components/FaqView';
import CookieBanner from './components/CookieBanner';

// FIX C-5: React Error Boundary — prevents a single render error from crashing the entire app
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white gap-4 p-8">
          <div className="text-5xl">😵</div>
          <h1 className="text-2xl font-bold">Algo salió mal</h1>
          <p className="text-gray-400 text-center max-w-md">Se produjo un error inesperado. Por favor recarga la página.</p>
          <div className="bg-red-900/20 p-4 rounded-xl border border-red-900/50 my-4 max-w-2xl overflow-auto text-left">
            <p className="text-red-400 font-mono text-xs">{this.state.error?.toString()}</p>
            <p className="text-red-400/70 font-mono text-xs mt-2 whitespace-pre-wrap">{this.state.error?.stack}</p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-6 py-3 bg-indigo-600 rounded-xl font-semibold hover:bg-indigo-500 transition-colors"
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoginRedirect = () => {
  const location = useLocation();
  const returnTo = location.state?.from?.pathname || "/app";
  return <Navigate to={returnTo} replace />;
};

const GlobalBanOverlay = ({ token, bannedData, setBannedData, setToken }) => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  if (!bannedData || !token) return null;

  return (
    <BanView 
      banDetails={bannedData} 
      setBannedData={setBannedData} 
      onLogout={() => {
        setToken(null);
        setBannedData(null);
        Cookies.remove('bannedData');
      }} 
    />
  );
};

const SessionExpiredOverlay = ({ sessionExpired, setSessionExpired }) => {
  if (!sessionExpired) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(248,113,113,0.3)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sesión Cerrada</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">Alguien ha iniciado sesión en tu cuenta desde otro dispositivo. Por motivos de seguridad, esta sesión ha sido cerrada automáticamente.</p>
        <div className="flex flex-col gap-3 w-full">
          <button 
            onClick={() => { setSessionExpired(false); window.location.href = '/login'; }} 
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
          >
            Volver a iniciar sesión
          </button>
          <button 
            onClick={() => { setSessionExpired(false); window.location.href = '/'; }} 
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all border border-white/10"
          >
            Ir a la página principal
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [token, setToken] = useState(Cookies.get('token'));
  const [adminToken, setAdminToken] = useState(Cookies.get('adminToken'));
  const [bannedData, setBannedData] = useState(() => {
    const data = Cookies.get('bannedData');
    // FIX C-3: Wrap in try/catch — malformed cookie must not crash the whole app
    try { return data ? JSON.parse(data) : null; } catch { return null; }
  });
  const [sessionExpired, setSessionExpired] = useState(false);
  
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          if (error.response.status === 401) {
            // Check if it's the specific single-session error
            if (error.response.data?.error === 'Sesión expirada. Has iniciado sesión en otro dispositivo.') {
              setSessionExpired(true);
            }
            // If the token is invalid or the user was deleted, log them out
            setToken(null);
            setAdminToken(null);
            setBannedData(null);
            Cookies.remove('bannedData');
            Cookies.remove('adminToken');
          } else if (error.response.status === 403 && error.response.data?.error === 'BANNED') {
            // Real-time ban enforcement
            const banInfo = {
              bannedUntil: error.response.data.bannedUntil,
              banReason: error.response.data.banReason
            };
            // FIX C-4: Options must be 3rd arg of Cookies.set, NOT 2nd arg of JSON.stringify
            Cookies.set('bannedData', JSON.stringify(banInfo), { expires: 365 });
            setBannedData(banInfo);
            // Do NOT setToken(null) here so we can refresh the token status later
          }
          if (error.response.data && error.response.data.errorCode) {
            error.response.data.error = `${error.response.data.error} (Código: ${error.response.data.errorCode})`;
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    if (token) {
      Cookies.set('token', token, { expires: 365 });
    } else {
      Cookies.remove('token');
      Cookies.remove('userId');
      Cookies.remove('userRole');
      Cookies.remove('userName');
      Cookies.remove('userGender');
      Cookies.remove('userAge');         // FIX M-34: clear age on logout
      Cookies.remove('userProfilePicture'); // FIX M-34: clear profile picture on logout
      Cookies.remove('isPremium');
      Cookies.remove('premiumPlan');
      Cookies.remove('pendingCheckout');
      Cookies.remove('adShown');
      // Asegurarse de que si se borra el token, se limpie el banData
      if (bannedData) {
        setBannedData(null);
        Cookies.remove('bannedData');
      }
    }
  }, [token]);

  useEffect(() => {
    if (adminToken) {
      Cookies.set('adminToken', adminToken, { expires: 365 });
    } else {
      Cookies.remove('adminToken');
    }
  }, [adminToken]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <GlobalBanOverlay 
        token={token} 
        bannedData={bannedData} 
        setBannedData={setBannedData} 
        setToken={setToken} 
      />
      <SessionExpiredOverlay 
        sessionExpired={sessionExpired} 
        setSessionExpired={setSessionExpired} 
      />
      <div className="min-h-[100dvh] w-full flex flex-col overflow-x-hidden">
          <Routes>
            <Route 
              path="/" 
              element={<LandingView token={token} />} 
            />
            <Route 
              path="/login" 
              element={!token ? <AuthView setToken={setToken} /> : <LoginRedirect />} 
            />
            <Route 
              path="/app" 
              element={token 
                ? <ErrorBoundary><DashboardView token={token} defaultView="dashboard" onLogout={() => { setToken(null); window.location.href = '/'; }} /></ErrorBoundary> 
                : <Navigate to="/" />} 
            />
            <Route 
              path="/support" 
              element={token ? <SupportView token={token} /> : <Navigate to="/login" state={{ from: { pathname: '/support' } }} replace />} 
            />
            <Route 
              path="/admin" 
              element={
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                  {adminToken ? <AdminView token={adminToken} /> : <AdminLoginView setAdminToken={setAdminToken} />}
                </Suspense>
              } 
            />
            <Route path="/terms" element={<TermsView />} />
            <Route path="/privacy" element={<PrivacyView />} />
            <Route path="/faq" element={<FaqView />} />
          </Routes>
          {/* FIX L-9: Only show install prompt and cookie banner for authenticated users */}
          {token && <IosInstallPrompt />}
          <CookieBanner />
        </div>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
