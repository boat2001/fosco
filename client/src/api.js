// Thin fetch wrapper around the Express API.

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'same-origin',
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const err = new Error(payload?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return payload;
}

export const api = {
  page: (slug) => request(`/pages/${slug}`),
  pages: () => request('/pages'),

  news: ({ limit = 50, offset = 0 } = {}) => request(`/news?limit=${limit}&offset=${offset}`),
  article: (slug) => request(`/news/${slug}`),

  events: () => request('/events'),
  gallery: () => request('/gallery'),

  contact: (data) => request('/contact', { method: 'POST', body: JSON.stringify(data) }),

  admin: {
    me: () => request('/admin/me'),
    login: (username, password) =>
      request('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    logout: () => request('/admin/logout', { method: 'POST' }),

    news: () => request('/admin/news'),
    createNews: (data) => request('/admin/news', { method: 'POST', body: JSON.stringify(data) }),
    updateNews: (id, data) => request(`/admin/news/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteNews: (id) => request(`/admin/news/${id}`, { method: 'DELETE' }),

    events: () => request('/admin/events'),
    createEvent: (data) => request('/admin/events', { method: 'POST', body: JSON.stringify(data) }),
    updateEvent: (id, data) => request(`/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEvent: (id) => request(`/admin/events/${id}`, { method: 'DELETE' }),

    messages: () => request('/admin/messages'),
    markMessage: (id, handled) =>
      request(`/admin/messages/${id}`, { method: 'PUT', body: JSON.stringify({ handled }) }),

    upload: (file) => {
      const fd = new FormData();
      fd.append('image', file);
      return request('/admin/upload', { method: 'POST', body: fd });
    },
  },
};
