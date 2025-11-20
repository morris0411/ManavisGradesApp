import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentSearch from "./pages/Students/Search.jsx";
import StudentDetail from "./pages/Students/Detail.jsx";
import ExamsSearch from "./pages/Exams/Search.jsx";
import ExamsDetail from "./pages/Exams/Detail.jsx";
import SelectSearch from "./pages/Home/SelectSearch.jsx";
import ImportStudents from "./pages/Home/ImportStudents.jsx";
import ImportExams from "./pages/Home/ImportExams.jsx";
import AcademicYearUpdate from "./pages/Home/AcademicYearUpdate.jsx";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import "./index.css";

// 認証が必要なルートを保護するコンポーネント
function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <SelectSearch />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/students/search" 
          element={
            <PrivateRoute>
              <StudentSearch />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/students/:studentId" 
          element={
            <PrivateRoute>
              <StudentDetail />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/exams/search" 
          element={
            <PrivateRoute>
              <ExamsSearch />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/import/students" 
          element={
            <PrivateRoute>
              <ImportStudents />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/import/exams" 
          element={
            <PrivateRoute>
              <ImportExams />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/import/academic-year-update" 
          element={
            <PrivateRoute>
              <AcademicYearUpdate />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/exams/:examId" 
          element={
            <PrivateRoute>
              <ExamsDetail />
            </PrivateRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
