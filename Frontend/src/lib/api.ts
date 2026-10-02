import type { ApiEnvelope, ApiFieldError } from './types';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'teenwork.token';

/** Erro padronizado a partir do envelope { success, message, errors } da API. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: ApiFieldError[];

  constructor(status: number, message: string, errors: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  /** Converte a lista de erros em { campo: mensagem } para os formulários. */
  fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const e of this.errors) {
      const key = e.field || '_';
      if (!map[key]) map[key] = e.message;
    }
    return map;
  }
}

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

/** Evento disparado quando o token expira ou é recusado (401). */
export const AUTH_EXPIRED_EVENT = 'teenwork:auth-expired';

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  query?: Record<string, QueryValue>;
  body?: unknown;
  form?: FormData;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), { method, headers, body, signal: options.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua internet ou se a API está no ar.');
  }

  if (response.status === 204) return undefined as T;

  let envelope: ApiEnvelope<T> | null = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  }

  if (!response.ok) {
    if (response.status === 401 && token && !path.startsWith('/api/auth/login')) {
      tokenStore.clear();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    const fallback =
      response.status === 403
        ? 'Você não tem permissão para esta ação.'
        : response.status === 404
          ? 'Não encontramos o que você procurava.'
          : response.status >= 500
            ? 'O servidor encontrou um erro. Tente novamente em instantes.'
            : 'Não foi possível concluir a ação.';
    throw new ApiError(response.status, envelope?.message || fallback, envelope?.errors ?? []);
  }

  return (envelope?.data ?? undefined) as T;
}

export const api = {
  get: <T>(path: string, query?: Record<string, QueryValue>, signal?: AbortSignal) =>
    request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {} }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body: body ?? {} }),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<T>('POST', path, { form });
  },
};

/** URL absoluta para imagens enviadas (/uploads/...). */
export function assetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL}${path}`;
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError(0, (err as Error)?.message || 'Erro inesperado.');
}
