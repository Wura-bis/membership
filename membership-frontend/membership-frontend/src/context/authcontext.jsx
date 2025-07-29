import { createContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Auto-fetch user if session exists
  useEffect(() => {
    // Only use real authentication
    fetch("http://localhost:5000/api/check-auth", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setUser(data.authenticated ? { ...data.user, role: data.user.role.toLowerCase() } : null))
      .catch(() => setUser(null));
  }, []);

  const login = (userData) => setUser({ ...userData, role: userData.role.toLowerCase() });
  const logout = () => {
    setUser(null);
    fetch("http://localhost:5000/api/logout", { method: "POST", credentials: "include" });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
