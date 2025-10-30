import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentSearch from "./pages/Students/Search.jsx";
import ExamsSearch from "./pages/Exams/Search.jsx";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentSearch />} />
        <Route path="/students/search" element={<StudentSearch />} />
        <Route path="/exams/search" element={<ExamsSearch />} />
      </Routes>
    </BrowserRouter>
  );
}
