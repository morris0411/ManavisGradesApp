import axiosClient from "./axiosClient";

export const fetchYears = async () => {
  const res = await axiosClient.get("/exams/years");
  return res.data;
};

export const fetchTypes = async (year) => {
  const res = await axiosClient.get("/exams/types", { params: { year } });
  return res.data;
};

export const fetchNames = async ({ year, exam_type }) => {
  const res = await axiosClient.get("/exams/names", { params: { year, exam_type } });
  return res.data;
};

export const searchExams = async ({ year, exam_type, name }) => {
  const res = await axiosClient.get("/exams/search", {
    params: { year, exam_type, name },
  });
  return res.data;
};
