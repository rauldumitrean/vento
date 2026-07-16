import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import axios from 'axios';
import LandingView from './components/LandingView';

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

function App() {
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [adminToken, setAdminToken] = useState(sessionStorage.getItem('adminToken'));
  
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          // If the token is invalid or the user was deleted, log them out
          setToken(null);
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('token', token);
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userGender');
      sessionStorage.removeItem('isPremium');
      sessionStorage.removeItem('premiumPlan');
      sessionStorage.removeItem('pendingCheckout');
      sessionStorage.removeItem('adShown');
    }
  }, [token]);

  useEffect(() => {
    if (adminToken) {
      sessionStorage.setItem('adminToken', adminToken);
    } else {
      sessionStorage.removeItem('adminToken');
    }
  }, [adminToken]);

  return (
    <BrowserRouter>
      <div className="min-h-screen w-full flex flex-col overflow-x-hidden">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
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
              element={token ? <DashboardView token={token} defaultView="dashboard" onLogout={() => setToken(null)} /> : <Navigate to="/" />} 
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
