// Use relative /api path so requests go through the Next.js rewrite proxy.
// This avoids CORS issues and works regardless of the backend port.
const API_URL = '/api';

class ApiError extends Error {
  public details?: Record<string, string[]>;
  constructor(
    public status: number,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const isFormData = options?.body instanceof FormData;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    let details: Record<string, string[]> | undefined;
    try {
      const data = await response.json();
      message = data.message || data.error || message;
      if (data.details) details = data.details;
    } catch {
      // ignore JSON parse error — use default message
    }
    throw new ApiError(response.status, message, details);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function buildQueryString(params: Record<string, unknown>): string {
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (filtered.length === 0) return '';
  return '?' + new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString();
}

export const api = {
  get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const qs = params ? buildQueryString(params) : '';
    return fetchApi<T>(`${endpoint}${qs}`);
  },

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return fetchApi<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return fetchApi<T>(endpoint, { method: 'DELETE' });
  },
};

// ── Admin API ────────────────────────────────────────────────────────────────
// Reads a JWT token from localStorage and attaches it as an Authorization header.

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

function handleAdminUnauthorized() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  }
}

function clearSettingsCache() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('jdm_site_settings');
    } catch {
      // ignore
    }
  }
}

async function fetchAdminApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const token = getAdminToken();
  try {
    return await fetchApi<T>(endpoint, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      handleAdminUnauthorized();
    }
    throw err;
  }
}

export const adminApi = {
  get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const qs = params ? buildQueryString(params) : '';
    return fetchAdminApi<T>(`${endpoint}${qs}`);
  },

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const res = await fetchAdminApi<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    clearSettingsCache();
    return res;
  },

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const res = await fetchAdminApi<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    clearSettingsCache();
    return res;
  },

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    const res = await fetchAdminApi<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    clearSettingsCache();
    return res;
  },

  async delete<T>(endpoint: string): Promise<T> {
    const res = await fetchAdminApi<T>(endpoint, { method: 'DELETE' });
    clearSettingsCache();
    return res;
  },

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = getAdminToken();
    try {
      const res = await fetchApi<T>(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      clearSettingsCache();
      return res;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleAdminUnauthorized();
      }
      throw err;
    }
  },
};

export { ApiError };
export default fetchApi;
