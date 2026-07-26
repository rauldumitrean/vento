import Cookies from 'js-cookie';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Component } from 'react';
import axios from 'axios';
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

function App() {
  const [token, setToken] = useState(Cookies.get('token'));
  const [adminToken, setAdminToken] = useState(Cookies.get('adminToken'));
  const [bannedData, setBannedData] = useState(() => {
    const data = Cookies.get('bannedData');
    // FIX C-3: Wrap in try/catch — malformed cookie must not crash the whole app
    try { return data ? JSON.parse(data) : null; } catch { return null; }
  });
  
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          if (error.response.status === 401) {
            // If the token is invalid or the user was deleted, log them out
            setToken(null);
            setBannedData(null);
            Cookies.remove('bannedData');
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
    <BrowserRouter>
      <GlobalBanOverlay 
        token={token} 
        bannedData={bannedData} 
        setBannedData={setBannedData} 
        setToken={setToken} 
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
                ? <ErrorBoundary><DashboardView token={token} defaultView="dashboard" onLogout={() => setToken(null)} /></ErrorBoundary> 
                : <Navigate to="/login" />} 
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
          </Routes>
        {/* FIX L-9: Only show install prompt and cookie banner for authenticated users */}
        {token && <IosInstallPrompt />}
        <CookieBanner />
      </div>
    </BrowserRouter>
  );
}

export default App;
