import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import axios from 'axios';
import LandingView from './components/LandingView';
import BanView from './components/BanView';

const AuthView = lazy(() => import('./components/AuthView'));
const DashboardView = lazy(() => import('./components/DashboardView'));
const AdminView = lazy(() => import('./components/AdminView'));
const AdminLoginView = lazy(() => import('./components/AdminLoginView'));
const IosInstallPrompt = lazy(() => import('./components/IosInstallPrompt'));
const TermsView = lazy(() => import('./components/TermsView'));
const PrivacyView = lazy(() => import('./components/PrivacyView'));
const SupportView = lazy(() => import('./components/SupportView'));

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
        localStorage.removeItem('bannedData');
      }} 
    />
  );
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const [bannedData, setBannedData] = useState(() => {
    const data = localStorage.getItem('bannedData');
    return data ? JSON.parse(data) : null;
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
            localStorage.removeItem('bannedData');
          } else if (error.response.status === 403 && error.response.data?.error === 'BANNED') {
            // Real-time ban enforcement
            const banInfo = {
              bannedUntil: error.response.data.bannedUntil,
              banReason: error.response.data.banReason
            };
            localStorage.setItem('bannedData', JSON.stringify(banInfo));
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
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userGender');
      localStorage.removeItem('isPremium');
      localStorage.removeItem('premiumPlan');
      localStorage.removeItem('pendingCheckout');
      localStorage.removeItem('adShown');
      // Asegurarse de que si se borra el token, se limpie el banData
      if (bannedData) {
        setBannedData(null);
        localStorage.removeItem('bannedData');
      }
    }
  }, [token]);

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken);
    } else {
      localStorage.removeItem('adminToken');
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
        <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center bg-black"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
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
              element={token ? <DashboardView token={token} defaultView="dashboard" onLogout={() => setToken(null)} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/support" 
              element={token ? <SupportView token={token} /> : <Navigate to="/login" state={{ from: { pathname: '/support' } }} replace />} 
            />
            <Route 
              path="/admin" 
              element={adminToken ? <AdminView token={adminToken} /> : <AdminLoginView setAdminToken={setAdminToken} />} 
            />
            <Route path="/terms" element={<TermsView />} />
            <Route path="/privacy" element={<PrivacyView />} />
          </Routes>
        </Suspense>
        <Suspense fallback={null}>
          <IosInstallPrompt />
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
