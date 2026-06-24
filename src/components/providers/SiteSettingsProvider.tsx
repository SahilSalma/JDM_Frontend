'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/api';

interface SiteSettingsContextValue {
  settings: Record<string, string>;
  get: (key: string, fallback?: string) => string;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const CACHE_KEY = 'jdm_site_settings';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(data: Record<string, string>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // ignore
  }
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: {},
  get: (_key: string, fallback = '') => fallback,
  isLoading: true,
  refreshSettings: async () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const res = await api.get<{ success: boolean; data: Record<string, string> }>('/admin/settings/public');
    setSettings(res.data);
    setCache(res.data);
    return res.data;
  }, []);

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setSettings(cached);
      setIsLoading(false);
      // Revalidate in background
      fetchSettings().catch(() => {});
      return;
    }

    let cancelled = false;
    fetchSettings()
      .then(() => { if (!cancelled) setIsLoading(false); })
      .catch(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [fetchSettings]);

  const get = useCallback(
    (key: string, fallback = '') => settings[key] || fallback,
    [settings],
  );

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchSettings();
    } finally {
      setIsLoading(false);
    }
  }, [fetchSettings]);

  return (
    <SiteSettingsContext.Provider value={{ settings, get, isLoading, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
