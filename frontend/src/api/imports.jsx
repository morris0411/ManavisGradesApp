import axiosClient from "./axiosClient";

export const uploadStudentsCsv = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await axiosClient.post("/imports/students", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const uploadExamsXlsx = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await axiosClient.post("/imports/exams_xlsx", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};


