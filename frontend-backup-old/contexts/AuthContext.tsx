'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  tenantId: string | null;
  apiKey: string | null;
  tenantName: string | null;
  plan: string | null;
  setAuth: (tenantId: string, apiKey: string, tenantName?: string, plan?: string) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedTenantId = localStorage.getItem('28hub_tenant_id');
    const storedApiKey = localStorage.getItem('28hub_api_key');
    const storedTenantName = localStorage.getItem('28hub_tenant_name');
    const storedPlan = localStorage.getItem('28hub_plan');
    
    if (storedTenantId && storedApiKey) {
      setTenantId(storedTenantId);
      setApiKey(storedApiKey);
      setTenantName(storedTenantName);
      setPlan(storedPlan);
      setIsAuthenticated(true);
    }
  }, []);

  const setAuth = (id: string, key: string, name?: string, planValue?: string) => {
    localStorage.setItem('28hub_tenant_id', id);
    localStorage.setItem('28hub_api_key', key);
    if (name) localStorage.setItem('28hub_tenant_name', name);
    if (planValue) localStorage.setItem('28hub_plan', planValue);
    
    setTenantId(id);
    setApiKey(key);
    setTenantName(name || null);
    setPlan(planValue || null);
    setIsAuthenticated(true);
  };

  const clearAuth = () => {
    localStorage.removeItem('28hub_tenant_id');
    localStorage.removeItem('28hub_api_key');
    localStorage.removeItem('28hub_tenant_name');
    localStorage.removeItem('28hub_plan');
    
    setTenantId(null);
    setApiKey(null);
    setTenantName(null);
    setPlan(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        tenantId,
        apiKey,
        tenantName,
        plan,
        setAuth,
        clearAuth,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
