import axiosClient from "./axiosClient";

export const login = (loginId, password) => {
  return axiosClient.post("/auth/login", {
    login_id: loginId,
    password: password,
  });
};

export const register = (loginId, password) => {
  return axiosClient.post("/auth/register", {
    login_id: loginId,
    password: password,
  });
};

export const getCurrentUser = () => {
  return axiosClient.get("/auth/me");
};

export const verifyToken = () => {
  return axiosClient.get("/auth/verify");
};

