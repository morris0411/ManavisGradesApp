// src/api/students.js
import axiosClient from "./axiosClient";

export const fetchStudents = async (keyword, statuses) => {
  const params = { q: keyword };
  if (Array.isArray(statuses) && statuses.length > 0) {
    // axios は配列を status=...&status=... として送る
    params.status = statuses;
  }
  const res = await axiosClient.get("/students/search", { params });
  return res.data;
};

export const fetchStudentDetail = async (studentId) => {
  const res = await axiosClient.get(`/students/${studentId}`);
  return res.data;
};