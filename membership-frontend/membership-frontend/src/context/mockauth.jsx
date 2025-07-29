import { createContext, useState } from "react";

const MockAuthContext = createContext();

// Mock user data for development
const mockUsers = {
  admin: {
    id: 'USR001',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    role: 'admin'
  },
  private: {
    id: 'USR002', 
    username: 'private',
    firstName: 'Private',
    lastName: 'User',
    email: 'private@test.com',
    role: 'private'
  },
  public: {
    id: 'USR003',
    username: 'public',
    firstName: 'Public',
    lastName: 'User', 
    email: 'public@test.com',
    role: 'public'
  }
};

export function MockAuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (credentials) => {
    const { username, password } = credentials;
    
    // Check mock credentials
    const validCredentials = {
      'admin': 'admin123',
      'private': 'private123',
      'public': 'public123'
    };

    if (validCredentials[username] === password) {
      const mockUser = mockUsers[username];
      setUser(mockUser);
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      return { success: true, user: mockUser };
    }
    
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  // Check for stored user on init
  useState(() => {
    const stored = localStorage.getItem('mockUser');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('mockUser');
      }
    }
  }, []);

  return (
    <MockAuthContext.Provider value={{ user, login, logout }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export default MockAuthContext;
