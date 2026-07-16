import { createContext, useContext, useState } from 'react';
import { apiFetch, storeSession, clearSession, storedUserMap } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userMap, setUserMap] = useState(storedUserMap());

  const login = async (email, password) => {
    const dataMap = await apiFetch('/api/auth/login', { method: 'POST', bodyMap: { email, password } });
    if (!['admin', 'finance'].includes(dataMap.userMap.role)) {
      throw new Error('This dashboard is for the Amplify team. Affiliates: use the mobile app.');
    }
    storeSession(dataMap.token, dataMap.userMap);
    setUserMap(dataMap.userMap);
  };

  const logout = () => {
    clearSession();
    setUserMap(null);
  };

  return <AuthContext.Provider value={{ userMap, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
