import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/api/auth/refresh');
        localStorage.setItem('accessToken', data.accessToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── Auth ───────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/api/auth/register', data),
  verifyEmail: (data: any) => api.post('/api/auth/verify-email', data),
  login: (data: any) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  forgotPassword: (data: any) => api.post('/api/auth/forgot-password', data),
  resetPassword: (data: any) => api.post('/api/auth/reset-password', data),
};

// ── Users ──────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => api.get('/api/users/me'),
  getAll: (params?: any) => api.get('/api/users', { params }),
  getOne: (id: string) => api.get(`/api/users/${id}`),
  update: (id: string, data: any) => api.patch(`/api/users/${id}`, data),
  approve: (id: string) => api.post(`/api/users/${id}/approve`),
  reject: (id: string) => api.post(`/api/users/${id}/reject`),
  block: (id: string) => api.post(`/api/users/${id}/block`),
  changeRole: (id: string, role: string) => api.patch(`/api/users/${id}/role`, { role }),
  changePassword: (data: any) => api.patch('/api/users/me/password', data),
};

// ── Clients ────────────────────────────────────────────────────
export const clientsApi = {
  getAll: (params?: any) => api.get('/api/clients', { params }),
  getOne: (id: string) => api.get(`/api/clients/${id}`),
};

// ── Projects ───────────────────────────────────────────────────
export const projectsApi = {
  getAll: (params?: any) => api.get('/api/projects', { params }),
  getOne: (id: string) => api.get(`/api/projects/${id}`),
  create: (data: any) => api.post('/api/projects', data),
  update: (id: string, data: any) => api.patch(`/api/projects/${id}`, data),
  updateStatus: (id: string, data: any) => api.patch(`/api/projects/${id}/status`, data),
  assignManager: (id: string, managerId: string) =>
    api.patch(`/api/projects/${id}/assign-manager`, { managerId }),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
};

// ── Documents ──────────────────────────────────────────────────
export const documentsApi = {
  getAll: (params?: any) => api.get('/api/documents', { params }),
  upload: (formData: FormData) =>
    api.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getDownloadUrl: (id: string) => api.get(`/api/documents/${id}/download`),
  delete: (id: string) => api.delete(`/api/documents/${id}`),
};

// ── Chat ───────────────────────────────────────────────────────
export const chatApi = {
  getDialogs: () => api.get('/api/chat/dialogs'),
  getMessages: (projectId: string, params?: any) =>
    api.get(`/api/chat/messages/${projectId}`, { params }),
  getUnreadCount: () => api.get('/api/chat/unread'),
  markProjectRead: (projectId: string) =>
    api.post(`/api/chat/messages/${projectId}/read`),
};

// ── Notifications ──────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: any) => api.get('/api/notifications', { params }),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch('/api/notifications/read-all'),
};

// ── Maintenance ────────────────────────────────────────────────
export const maintenanceApi = {
  getAll: (params?: any) => api.get('/api/maintenance', { params }),
  create: (data: any) => api.post('/api/maintenance', data),
  updateStatus: (id: string, data: any) => api.patch(`/api/maintenance/${id}/status`, data),
};

// ── Dashboard ──────────────────────────────────────────────────
export const dashboardApi = {
  getMetrics: () => api.get('/api/dashboard'),
};

// ── Monitoring ─────────────────────────────────────────────────
export const monitoringApi = {
  getSystem: () => api.get('/api/monitoring/system'),
  getServices: () => api.get('/api/monitoring/services'),
  getApp: () => api.get('/api/monitoring/app'),
  getLogs: (params?: any) => api.get('/api/monitoring/logs', { params }),
};

// ── Contacts ───────────────────────────────────────────────────
export const contactsApi = {
  getTeam: () => api.get('/api/contacts/team'),
  getCompany: () => api.get('/api/contacts/company'),
};

// ── Installation ───────────────────────────────────────────────
export const installationApi = {
  getAll: (projectId?: string) => api.get('/api/installation', { params: { projectId } }),
  getOne: (id: string) => api.get(`/api/installation/${id}`),
};
