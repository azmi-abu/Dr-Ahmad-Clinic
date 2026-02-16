import axios from "axios";

const api = axios.create({
  // ✅ Vercel will use REACT_APP_API_URL
  // ✅ Local dev fallback stays localhost
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Attach token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
