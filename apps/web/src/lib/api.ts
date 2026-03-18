import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

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

async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }
    if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(body.error || `API Error: ${response.status}`);
    }
    if (response.status === 204) return {} as T;
    return response.json();
}

export const api = {
    async get<T = any>(path: string): Promise<T> {
        const headers = await authHeaders();
        const response = await fetch(`${API_URL}${path}`, { headers });
        return handleResponse<T>(response);
    },
    async post<T = any>(path: string, body?: any): Promise<T> {
        const headers = await authHeaders();
        const response = await fetch(`${API_URL}${path}`, {
            method: 'POST', headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        return handleResponse<T>(response);
    },
    async patch<T = any>(path: string, body?: any): Promise<T> {
        const headers = await authHeaders();
        const response = await fetch(`${API_URL}${path}`, {
            method: 'PATCH', headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        return handleResponse<T>(response);
    },
    async delete<T = any>(path: string): Promise<T> {
        const headers = await authHeaders();
        const response = await fetch(`${API_URL}${path}`, {
            method: 'DELETE', headers,
        });
        return handleResponse<T>(response);
    },
    async download(path: string, body?: any): Promise<Blob> {
        const headers = await authHeaders();
        const response = await fetch(`${API_URL}${path}`, {
            method: 'POST', headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (response.status === 401) {
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            const errBody = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errBody.error || `API Error: ${response.status}`);
        }
        return response.blob();
    },
};