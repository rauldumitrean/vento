import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route 
            path="/login" 
            element={!token ? <AuthView setToken={setToken} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/" 
            element={token ? <DashboardView token={token} defaultView="dashboard" onLogout={() => setToken(null)} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={token && localStorage.getItem('userRole') === 'ADMIN' ? <DashboardView token={token} defaultView="admin" onLogout={() => setToken(null)} /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
