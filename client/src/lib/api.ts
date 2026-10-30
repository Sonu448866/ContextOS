const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  public statusCode: number;
  public details?: any;
  public requestId?: string;

  constructor(message: string, statusCode: number, details?: any, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const requestId = response.headers.get('x-request-id') || undefined;

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = { error: response.statusText };
  }

  if (!response.ok) {
    const errorMsg = data?.error || `HTTP ${response.status}: Request failed`;
    throw new ApiError(errorMsg, response.status, data?.details, requestId);
  }

  return (data?.data !== undefined ? data.data : data) as T;
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) => {
    let url = endpoint;
    if (params) {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          search.append(key, String(val));
        }
      });
      const queryString = search.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return request<T>(url, { method: 'GET' });
  },

  post: <T>(endpoint: string, body?: any) => {
    return request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  patch: <T>(endpoint: string, body?: any) => {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  delete: <T>(endpoint: string) => {
    return request<T>(endpoint, { method: 'DELETE' });
  }
};
