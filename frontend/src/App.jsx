import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentSearch from "./pages/Students/Search.jsx";
import StudentDetail from "./pages/Students/Detail.jsx";
import ExamsSearch from "./pages/Exams/Search.jsx";
import ExamsDetail from "./pages/Exams/Detail.jsx";
import SelectSearch from "./pages/Home/SelectSearch.jsx";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SelectSearch />} />
        <Route path="/students/search" element={<StudentSearch />} />
        <Route path="/students/:studentId" element={<StudentDetail />} />
        <Route path="/exams/search" element={<ExamsSearch />} />
        <Route path="/exams/:examId" element={<ExamsDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
