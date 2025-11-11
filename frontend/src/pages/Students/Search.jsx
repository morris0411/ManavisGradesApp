import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchStudents } from "../../api/students";
import "./Search.css";

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

  return (
    <div className="search-container">
      <h2>生徒検索</h2>
      <div style={{ marginBottom: 8 }}>
        <label style={{ marginRight: 12 }}>
          <input
            type="checkbox"
            checked={statusChecks["在籍"]}
            onChange={(e) => setStatusChecks((s) => ({ ...s, 在籍: e.target.checked }))}
          /> 在籍
        </label>
        <label style={{ marginRight: 12 }}>
          <input
            type="checkbox"
            checked={statusChecks["既卒"]}
            onChange={(e) => setStatusChecks((s) => ({ ...s, 既卒: e.target.checked }))}
          /> 既卒
        </label>
        <label>
          <input
            type="checkbox"
            checked={statusChecks["退会"]}
            onChange={(e) => setStatusChecks((s) => ({ ...s, 退会: e.target.checked }))}
          /> 退会
        </label>
      </div>
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="氏名・高校名・マナビス生番号で検索"
      />
      <button onClick={handleSearch}>検索</button>

      <table>
        <thead>
          <tr>
            <th>マナビス生番号</th>
            <th>氏名</th>
            <th>高校名</th>
            <th>学年</th>
            <th>ステータス</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.student_id}>
              <td>{s.student_id}</td>
              <td>
                <Link to={`/students/${s.student_id}`}>{s.name}</Link>
              </td>
              <td>{s.school_name}</td>
              <td>{s.grade}</td>
              <td>{s.status || "在籍"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentSearch;
