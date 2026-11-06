import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ENDPOINTS ───────────────────────────────────
export const authApi = {
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role?: 'GUEST' | 'HOST';
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

// ─── PROPERTIES ENDPOINTS ─────────────────────────────
export const propertiesApi = {
  getAll: (params?: any) => api.get('/properties', { params }),
  getOne: (id: string) => api.get(`/properties/${id}`),
  create: (data: any) => api.post('/properties', data),
  update: (id: string, data: any) => api.put(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  getMyListings: () => api.get('/properties/host/listings'),
};

// ─── SEARCH ENDPOINTS ─────────────────────────────────
export const searchApi = {
  search: (params?: any) => api.get('/search', { params }),
  getFeatured: () => api.get('/search/featured'),
  getPopular: () => api.get('/search/popular'),
  getSuggestions: (keyword: string) =>
    api.get('/search/suggestions', { params: { keyword } }),
  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get('/search/nearby', { params: { lat, lng, radius } }),
};

// ─── BOOKINGS ENDPOINTS ───────────────────────────────
export const bookingsApi = {
  create: (data: any) => api.post('/bookings', data),
  getOne: (id: string) => api.get(`/bookings/${id}`),
  getMyBookings: () => api.get('/bookings/guest/my-bookings'),
  getHostBookings: () => api.get('/bookings/host/my-bookings'),
  cancel: (id: string, reason: string) =>
    api.put(`/bookings/${id}/cancel`, { cancellationReason: reason }),
};

// ─── REVIEWS ENDPOINTS ────────────────────────────────
export const reviewsApi = {
  create: (data: any) => api.post('/reviews', data),
  getPropertyReviews: (propertyId: string) =>
    api.get(`/reviews/property/${propertyId}`),
  getHostReviews: (hostId: string) => api.get(`/reviews/host/${hostId}`),
  getMyReviews: () => api.get('/reviews/my-reviews'),
};

// ─── SURPRISE/TALENTS ENDPOINTS ───────────────────────
export const surpriseApi = {
  getTalents: () => api.get('/surprise/talents'),
  getTalent: (id: string) => api.get(`/surprise/talents/${id}`),
  createVoucher: (data: any) => api.post('/surprise/vouchers', data),
  getVoucher: (code: string) => api.get(`/surprise/vouchers/${code}`),
  redeemVoucher: (code: string) =>
    api.post('/surprise/vouchers/redeem', { code }),
};

export default api;
