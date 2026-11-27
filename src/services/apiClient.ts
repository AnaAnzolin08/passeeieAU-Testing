import type {
  AuthResponse,
  ProductRecord,
  UserPublic,
  WalkHistoryTotals,
  WalkRecord,
  WeatherReport,
} from '../types.ts';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Resposta sem corpo JSON
  }

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Erro na requisição (${res.status}).`;
    throw new Error(message);
  }

  return data as T;
}

export const apiClient = {
  getProducts(): Promise<ProductRecord[]> {
    return requestJson<ProductRecord[]>('/api/produtos');
  },

  getUsers(): Promise<UserPublic[]> {
    return requestJson<UserPublic[]>('/api/usuarios');
  },

  getWeather(cep: string): Promise<WeatherReport> {
    const clean = encodeURIComponent(cep.trim());
    return requestJson<WeatherReport>(`/api/clima/${clean}`);
  },

  login(login: string, password: string): Promise<AuthResponse> {
    return requestJson<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    });
  },

  register(payload: {
    tutorName: string;
    login: string;
    password: string;
    dogName: string;
    cep: string;
    dogPhoto: string;
  }): Promise<{ user: UserPublic }> {
    return requestJson<{ user: UserPublic }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  startWalk(token: string): Promise<WalkRecord> {
    return requestJson<WalkRecord>('/api/passeio', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
  },

  finishWalk(
    token: string,
    walkId: string,
    durationSeconds: number,
  ): Promise<{ walk: WalkRecord; history: WalkRecord[]; totals: WalkHistoryTotals }> {
    return requestJson<{ walk: WalkRecord; history: WalkRecord[]; totals: WalkHistoryTotals }>(
      '/api/finalizacao',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ walkId, durationSeconds }),
      },
    );
  },

  getWalkHistory(
    token: string,
  ): Promise<{ walks: WalkRecord[]; totals: WalkHistoryTotals }> {
    return requestJson<{ walks: WalkRecord[]; totals: WalkHistoryTotals }>('/api/finalizacao', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
