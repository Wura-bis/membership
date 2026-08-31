import { createContext, useEffect, useState, useRef } from "react";
import { API_BASE_URL } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const sessionRefreshInterval = useRef(null);

  // Session refresh function
  const refreshSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/check-auth`, {
        credentials: "include",
      });
      const data = await response.json();
      
      if (data.authenticated) {
        setUser({ ...data, role: data.role.toLowerCase() });
      } else {
        setUser(null);
        clearSessionRefresh();
      }
    } catch (error) {
      console.log("Session refresh failed:", error);
      setUser(null);
      clearSessionRefresh();
    }
  };

  // Setup automatic session refresh
  const setupSessionRefresh = () => {
    // Clear any existing interval
    clearSessionRefresh();
    
    // Refresh session every 15 minutes (900,000 ms)
    sessionRefreshInterval.current = setInterval(refreshSession, 900000);
  };

  // Clear session refresh interval
  const clearSessionRefresh = () => {
    if (sessionRefreshInterval.current) {
      clearInterval(sessionRefreshInterval.current);
      sessionRefreshInterval.current = null;
    }
  };

  // Auto-fetch user if session exists
  useEffect(() => {
    refreshSession().then(() => {
      // Setup auto-refresh if user is authenticated
      if (user) {
        setupSessionRefresh();
      }
    });

    // Cleanup interval on unmount
    return () => clearSessionRefresh();
  }, []);

  // Setup refresh when user logs in
  useEffect(() => {
    if (user) {
      setupSessionRefresh();
    } else {
      clearSessionRefresh();
    }
  }, [user]);

  const login = (userData) => {
    setUser({ ...userData, role: userData.role.toLowerCase() });
    setupSessionRefresh();
  };

  const logout = () => {
    if (user) sessionStorage.setItem("redirectUserId", String(user.user_id ?? user.id ?? ""));
    setUser(null);
    clearSessionRefresh();
    fetch(`${API_BASE_URL}/api/logout`, { method: "POST", credentials: "include" });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
