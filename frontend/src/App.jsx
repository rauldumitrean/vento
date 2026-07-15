import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import LandingView from './components/LandingView';

const AuthView = lazy(() => import('./components/AuthView'));
const DashboardView = lazy(() => import('./components/DashboardView'));
const AdminView = lazy(() => import('./components/AdminView'));
const AdminLoginView = lazy(() => import('./components/AdminLoginView'));

function App() {
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [adminToken, setAdminToken] = useState(sessionStorage.getItem('adminToken'));
  
  useEffect(() => {
    if (token) {
      sessionStorage.setItem('token', token);
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userGender');
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
              element={!token ? <AuthView setToken={setToken} /> : <Navigate to="/app" />} 
            />
            <Route 
              path="/app" 
              element={token ? <DashboardView token={token} defaultView="dashboard" onLogout={() => setToken(null)} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/admin" 
              element={adminToken ? <AdminView token={adminToken} /> : <AdminLoginView setAdminToken={setAdminToken} />} 
            />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
