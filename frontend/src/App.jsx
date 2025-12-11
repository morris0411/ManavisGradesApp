import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentSearch from "./pages/Home/Search/SearchStudents.jsx";
import StudentDetail from "./pages/Students/Detail.jsx";
import ExamsSearch from "./pages/Home/Search/SearchExams.jsx";
import ExamsDetail from "./pages/Exams/Detail.jsx";
import Home from "./pages/Home/index.jsx";
import ImportStudents from "./pages/Home/Import/ImportStudents.jsx";
import ImportExams from "./pages/Home/Import/ImportExams.jsx";
import AcademicYearUpdate from "./pages/Home/Import/AcademicYearUpdate.jsx";
import Login from "./pages/Auth/Login.jsx";
import RegisterUser from "./pages/Admin/RegisterUser.jsx";
import { useAuth } from "./hooks/useAuth";
import "./index.css";

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
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
    </BrowserRouter>
  );
}
