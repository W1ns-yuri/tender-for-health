import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Автоматически добавляем JWT-токен во все запросы
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('tender_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;

// Глобальный перехватчик ответов (Response Interceptor)
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Если получаем 401 Unauthorized, значит токен протух или невалиден
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('tender_token');
      localStorage.removeItem('tender_user');
      // Принудительный редирект на логин, если мы не на странице логина
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);
