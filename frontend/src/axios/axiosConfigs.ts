import axios from 'axios';
import environment from '../environment';

const axiosClient = axios.create({
  baseURL: environment.apiUrl,
  timeout: 10000, 
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      const tokenString = JSON.parse(token);
      // config.headers.Authorization = `Bearer ${tokenString['accessToken']}`;
      config.headers.Authorization = `Bearer ${tokenString}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;
