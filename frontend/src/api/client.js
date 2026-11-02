import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: `${API_URL}/api/v1` });

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// AuthContext registers a handler here so a 401 anywhere logs the user out
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/user/login') || url.includes('/user/signup');
    // 401 on login just means wrong credentials; anywhere else means the session is invalid/expired
    if (error.response?.status === 401 && !isAuthCall) onUnauthorized();
    return Promise.reject(error);
  }
);

// Turns any axios error into a message fit for the UI
export function errorMessage(error) {
  if (!error.response) return 'Cannot reach the server. Check your connection and try again.';
  const { status, data } = error.response;
  if (status === 429) {
    const secs = Number(error.response.headers['retry-after']);
    return `Too many requests. ${secs ? `Try again in ${Math.ceil(secs / 60)} min.` : 'Please wait and try again.'}`;
  }
  if (data?.errors?.length) return data.errors.map((e) => e.message).join('. ');
  return data?.message || 'Something went wrong';
}

export const pictureSrc = (employee) =>
  employee?.profile_picture_url ? `${API_URL}${employee.profile_picture_url}` : null;

export default api;
