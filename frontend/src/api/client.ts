import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/api/v1/auth/refresh/', {
            refresh: refreshToken,
          });

          if (response.status === 200) {
            const { access } = response.data;
            localStorage.setItem('token', access);
            client.defaults.headers.common['Authorization'] = `Bearer ${access}`;
            originalRequest.headers['Authorization'] = `Bearer ${access}`;
            return client(originalRequest);
          }
        }
      } catch {
        // Refresh failed - logout
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  },
);

export default client;
