import React, { useState } from "react";
import { Link } from "react-router-dom";
import { fetchStudents } from "../../api/students";
import { Breadcrumb } from "../../components/Breadcrumb";
import { Search, Filter } from 'lucide-react';

const StudentSearch = () => {
  const [keyword, setKeyword] = useState("");
  const [students, setStudents] = useState([]);
  const [statusChecks, setStatusChecks] = useState({ 在籍: true, 既卒: false, 退会: false });

  const handleSearch = async () => {
    const selected = Object.entries(statusChecks)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    if (selected.length === 0) {
      setStudents([]);
      return;
    }
    const res = await fetchStudents(keyword, selected);
    setStudents(res);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafb" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#e5eef3", backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Breadcrumb items={[
            { label: "ホーム", path: "/" },
            { label: "生徒から検索" }
          ]} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#006580" }}>
            生徒から検索
          </h1>
          <p className="text-sm" style={{ color: "#666e7e" }}>
            生徒情報から検索します
          </p>
        </div>

        {/* Search Card */}
        <div className="rounded-lg p-6 mb-8" style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" }}>
          {/* Status Filters */}
          <div className="mb-6 pb-6" style={{ borderBottom: "1px solid #e5eef3" }}>
            <label className="text-sm font-medium block mb-3" style={{ color: "#006580" }}>
              <Filter className="inline mr-2" size={16} />
              ステータス
            </label>
            <div className="flex gap-6">
              {["在籍", "既卒", "退会"].map((status) => (
                <label key={status} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusChecks[status]}
                    onChange={(e) => setStatusChecks((s) => ({ ...s, [status]: e.target.checked }))}
                    className="mr-2 w-4 h-4 rounded"
                    style={{
                      accentColor: "#1BA4C3",
                      borderColor: "#1BA4C3"
                    }}
                  />
                  <span className="text-sm" style={{ color: "#333" }}>{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5" size={18} style={{ color: "#1BA4C3" }} />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="氏名・高校名・マナビス生番号で検索"
                className="w-full pl-10 pr-4 py-2.5 rounded-md text-sm border transition"
                style={{
                  borderColor: "#d0dce5",
                  backgroundColor: "#ffffff",
                  color: "#333"
                }}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 rounded-md font-medium text-white text-sm transition hover:shadow-lg"
              style={{
                backgroundColor: "#1BA4C3"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#0086A9"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#1BA4C3"}
            >
              検索
            </button>
          </div>
        </div>

        {/* Results Section */}
        {students.length > 0 && (
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" }}>
            <div className="px-6 py-4" style={{ backgroundColor: "#006580", borderBottom: "1px solid #e5eef3" }}>
              <p className="text-sm font-medium text-white">
                検索結果 {students.length}件
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "#f0f5f9", borderBottom: "2px solid #d0dce5" }}>
                    <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: "#006580" }}>
                      マナビス生番号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: "#006580" }}>
                      氏名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: "#006580" }}>
                      高校名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: "#006580" }}>
                      学年
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: "#006580" }}>
                      ステータス
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr
                      key={s.student_id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafb",
                        borderBottom: "1px solid #e5eef3"
                      }}
                      className="hover:bg-blue-50 transition"
                    >
                      <td className="px-6 py-4 text-sm" style={{ color: "#333" }}>
                        {s.student_id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          to={`/students/${s.student_id}`}
                          className="font-medium transition hover:underline"
                          style={{ color: "#1BA4C3" }}
                          onMouseEnter={(e) => e.target.style.color = "#0086A9"}
                          onMouseLeave={(e) => e.target.style.color = "#1BA4C3"}
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "#666e7e" }}>
                        {s.school_name}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "#333" }}>
                        {s.grade}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: s.status === "在籍" ? "#c4e7f3" : s.status === "既卒" ? "#e0e7f1" : "#f5d5d5",
                            color: s.status === "在籍" ? "#006580" : s.status === "既卒" ? "#666e7e" : "#b85a5a"
                          }}
                        >
                          {s.status || "在籍"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {students.length === 0 && (
          <div
            className="rounded-lg p-12 text-center"
            style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" }}
          >
            <Search className="mx-auto mb-3" size={32} style={{ color: "#1BA4C3" }} />
            <p className="text-sm" style={{ color: "#666e7e" }}>
              生徒を検索するには、上記のフォームに入力して「検索」ボタンをクリックしてください
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSearch;
