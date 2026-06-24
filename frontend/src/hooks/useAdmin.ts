'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    admin: AdminUser;
  };
}

interface UseAdminReturn {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

// Shared state for all instances of useAdmin hook to prevent redirect loops.
let globalAdmin: AdminUser | null = null;
let globalIsLoading = true;
let hasRehydrated = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function useAdmin(): UseAdminReturn {
  const [admin, setAdminState] = useState<AdminUser | null>(globalAdmin);
  const [isLoading, setIsLoadingState] = useState(globalIsLoading);

  useEffect(() => {
    const handleChange = () => {
      setAdminState(globalAdmin);
      setIsLoadingState(globalIsLoading);
    };
    listeners.add(handleChange);

    // Initial state setup if already rehydrated
    if (hasRehydrated) {
      setAdminState(globalAdmin);
      setIsLoadingState(globalIsLoading);
    } else {
      hasRehydrated = true;
      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem(TOKEN_KEY);
          const userStr = localStorage.getItem(USER_KEY);
          if (token && userStr) {
            globalAdmin = JSON.parse(userStr) as AdminUser;
          }
        }
      } catch {
        // ignore parse errors
      } finally {
        globalIsLoading = false;
        notifyListeners();
      }
    }

    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    globalIsLoading = true;
    notifyListeners();
    try {
      const res = await adminApi.post<LoginResponse>('/admin/auth/login', {
        email,
        password,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, res.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.admin));
      }
      globalAdmin = res.data.admin;
    } finally {
      globalIsLoading = false;
      notifyListeners();
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    globalAdmin = null;
    notifyListeners();
  }, []);

  return {
    admin,
    isAuthenticated: admin !== null,
    isLoading,
    login,
    logout,
  };
}
