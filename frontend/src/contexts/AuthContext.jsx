import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(Cookies.get('token'));
  const [adminToken, setAdminToken] = useState(Cookies.get('adminToken'));
  const [bannedData, setBannedData] = useState(() => {
    const data = Cookies.get('bannedData');
    try { return data ? JSON.parse(data) : null; } catch { return null; }
  });
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (token) {
      Cookies.set('token', token, { expires: 365 });
    } else {
      ['token', 'userId', 'userRole', 'userName', 'userGender', 'userAge', 'userProfilePicture', 'isPremium', 'premiumPlan', 'pendingCheckout', 'adShown'].forEach(key => Cookies.remove(key));
      if (bannedData) {
        setBannedData(null);
        Cookies.remove('bannedData');
      }
    }
  }, [token, bannedData]);

  useEffect(() => {
    if (adminToken) {
      Cookies.set('adminToken', adminToken, { expires: 365 });
    } else {
      Cookies.remove('adminToken');
    }
  }, [adminToken]);

  const logout = () => {
    setToken(null);
    setAdminToken(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      token, setToken,
      adminToken, setAdminToken,
      bannedData, setBannedData,
      sessionExpired, setSessionExpired,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
