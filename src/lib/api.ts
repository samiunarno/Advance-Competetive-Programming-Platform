const API_URL = '/api';

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    return await fetch(url, options);
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    throw error;
  }
};

export const api = {
  auth: {
    register: (data: any) => safeFetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    login: (data: any) => safeFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    logout: () => safeFetch(`${API_URL}/auth/logout`, { method: 'POST' }),
    me: () => safeFetch(`${API_URL}/auth/me`),
  },
  problems: {
    getAll: (params?: any) => {
      const query = new URLSearchParams(params).toString();
      return safeFetch(`${API_URL}/problems?${query}`);
    },
    getById: (id: string) => safeFetch(`${API_URL}/problems/${id}`),
    create: (data: any) => safeFetch(`${API_URL}/problems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => safeFetch(`${API_URL}/problems/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    delete: (id: string) => safeFetch(`${API_URL}/problems/${id}`, { method: 'DELETE' }),
  },
  submissions: {
    getAll: () => safeFetch(`${API_URL}/submissions`),
    create: (data: any) => safeFetch(`${API_URL}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  },
  users: {
    getAll: () => safeFetch(`${API_URL}/users`),
    getStats: () => safeFetch(`${API_URL}/users/stats`),
    getById: (id: string) => safeFetch(`${API_URL}/users/${id}`),
    create: (data: any) => safeFetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => safeFetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    ban: (id: string, reason: string) => safeFetch(`${API_URL}/users/${id}/ban`, { 
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),
    unban: (id: string) => safeFetch(`${API_URL}/users/${id}/unban`, { method: 'PUT' }),
    delete: (id: string) => safeFetch(`${API_URL}/users/${id}`, { method: 'DELETE' }),
  },
  messages: {
    getAll: () => safeFetch(`${API_URL}/messages`),
    send: (content: string) => safeFetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }),
    getAdminInbox: () => safeFetch(`${API_URL}/messages/admin/inbox`),
    getByUser: (userId: string) => safeFetch(`${API_URL}/messages/admin/user/${userId}`),
    reply: (userId: string, content: string) => safeFetch(`${API_URL}/messages/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content }),
    }),
  },
  contests: {
    getAll: () => safeFetch(`${API_URL}/contests`),
    getById: (id: string) => safeFetch(`${API_URL}/contests/${id}`),
    create: (data: any) => safeFetch(`${API_URL}/contests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => safeFetch(`${API_URL}/contests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    delete: (id: string) => safeFetch(`${API_URL}/contests/${id}`, { method: 'DELETE' }),
    register: (id: string) => safeFetch(`${API_URL}/contests/${id}/register`, { method: 'POST' }),
    getLeaderboard: (id: string) => safeFetch(`${API_URL}/contests/${id}/leaderboard`),
  },
};
