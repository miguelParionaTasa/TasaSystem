import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api/",
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  const selectedPlantId = localStorage.getItem("selectedPlantId");
  if (selectedPlantId) config.headers["X-Planta-Id"] = selectedPlantId;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) window.dispatchEvent(new Event("tasa:session-expired"));
    return Promise.reject(error);
  }
);

export default axiosInstance;
