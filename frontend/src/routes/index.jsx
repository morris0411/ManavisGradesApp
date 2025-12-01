import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StudentSearch from "../pages/Students/Search.jsx";
import StudentDetail from "../pages/Students/Detail.jsx";
import ExamsSearch from "../pages/Exams/Search.jsx";
import ExamsDetail from "../pages/Exams/Detail.jsx";
import SelectSearch from "../pages/Home/SelectSearch.jsx";
import ImportStudents from "../pages/Home/ImportStudents.jsx";
import ImportExams from "../pages/Home/ImportExams.jsx";
import AcademicYearUpdate from "../pages/Home/AcademicYearUpdate.jsx";
import Login from "../pages/Auth/Login.jsx";
import RegisterUser from "../pages/Admin/RegisterUser.jsx";
import { useAuth } from "../hooks/useAuth";

// 認証が必要なルートを保護するコンポーネント
function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}

// 管理者のみアクセス可能なルートを保護するコンポーネント
function AdminRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const { isAdmin, loading } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>読み込み中...</div>;
  }
  
  // ユーザー情報が取得できていない場合は、トークンが無効な可能性がある
  // その場合はPrivateRouteに任せる（トークンが無効なら自動的にログインページにリダイレクト）
  if (isAdmin === false && !loading) {
    // 管理者でない場合はホームにリダイレクト
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
      <Route 
        path="/admin/register" 
        element={
          <AdminRoute>
            <RegisterUser />
          </AdminRoute>
        } 
      />
    </Routes>
  );
}

