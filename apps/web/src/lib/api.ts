import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Get the current Supabase session token for API authentication
 */
async function getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

/**
 * Build headers with Authorization token
 */
async function authHeaders(): Promise<HeadersInit> {
    const token = await getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

/**
 * Handle API response — throws on non-ok responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
        // Token expired or invalid — redirect to login
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(body.error || `API Error: ${response.status}`);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

/**
 * API client — typed helpers for GET, POST, PATCH, DELETE
 */
export const api = {
    async get<T = any>(path: string): Promise<T> {
        const headers = await authHeaders();
        const response = await fetch(`${API_URL}${path}`, { headers });
        return handleResponse<T>(response);
    },

    async post<T = any>(path: string, body?: any): Promise<T> {
        const headers = await authHeaders();
        const response = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        return handleResponse<T>(response);
    },

    async patch<T = any>(path: string, body?: any): Promise<T> {
        const headers = await authHeaders();
        const response = await fetch(`${API_URL}${path}`, {
            method: 'PATCH',
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        return handleResponse<T>(response);
    },

    async delete<T = any>(path: string): Promise<T> {
        const headers = await authHeaders();
        const response = await fetch(`${API_URL}${path}`, {
            method: 'DELETE',
            headers,
        });
        return handleResponse<T>(response);
    },
};
