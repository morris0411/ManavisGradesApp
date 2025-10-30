// src/api/students.js
import axiosClient from "./axiosClient";

export const fetchStudents = async (keyword) => {
  const res = await axiosClient.get("/students/search", {
    params: { q: keyword }, // ← Flask側のパラメータ名に合わせる！
  });
  return res.data;
};
