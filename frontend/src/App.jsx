import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import AdminView from './components/AdminView';
import AdminLoginView from './components/AdminLoginView';
import LandingView from './components/LandingView';

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
      <div className="min-h-screen">
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
      </div>
    </BrowserRouter>
  );
}

export default App;
