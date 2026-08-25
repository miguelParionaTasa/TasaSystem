import axiosInstance from "../axios";

export const storeUserProfile = (user) => {
  localStorage.setItem("userId", String(user.id));
  localStorage.setItem("userName", user.username);
  localStorage.setItem("userRole", user.rol);
  localStorage.setItem("userPlantId", String(user.plantaId));
  localStorage.setItem("isAdmin", String(["SUPER_ADMIN", "ADMIN_PLANTA"].includes(user.rol)));
  if (!localStorage.getItem("selectedPlantId")) localStorage.setItem("selectedPlantId", String(user.plantaId));
};

export const clearUserProfile = () => {
  ["userId", "userName", "userRole", "userPlantId", "isAdmin", "selectedPlantId", "token"].forEach((key) => localStorage.removeItem(key));
};

export const loginUser = async (username, password) => {
  try {
    const { data } = await axiosInstance.post("/auth/login", { username, password });
    storeUserProfile(data.user);
    return data.user;
  } catch (error) {
    throw new Error(error.response?.data?.error || "No se pudo iniciar sesión.");
  }
};

export const logoutUser = async () => {
  try {
    await axiosInstance.post("/auth/logout");
  } finally {
    clearUserProfile();
  }
};

export const createOT = async (otData) => (await axiosInstance.post("/ots/", otData)).data;
export const createOTConsumible = async (data) => (await axiosInstance.post("/otc", data)).data;
export const createMovement = async (data) => (await axiosInstance.post("/movimiento", data, { headers: { "Content-Type": "multipart/form-data" } })).data;
export const getMovements = async (filters) => (await axiosInstance.get("/movimientos", { params: filters })).data;
export const deleteMovement = async (id) => (await axiosInstance.delete(`/movimiento/${id}`)).data;
export const updateMovementImage = async (id, data) => (await axiosInstance.put(`/movimiento/${id}/imagen`, data, { headers: { "Content-Type": "multipart/form-data" } })).data;
