import React, { useState, useEffect } from "react";
import { fetchStudents } from "../../api/students";
import "./Search.css";

const StudentSearch = () => {
  const [keyword, setKeyword] = useState("");
  const [students, setStudents] = useState([]);

  const handleSearch = async () => {
    const res = await fetchStudents(keyword);
    setStudents(res);
  };

  useEffect(() => {
    handleSearch(); // 初期表示で全員表示（空文字で検索）
  }, []);

  return (
    <div className="search-container">
      <h2>生徒検索</h2>
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
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.student_id}>
              <td>{s.student_id}</td>
              <td>{s.name}</td>
              <td>{s.school_name}</td>
              <td>{s.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentSearch;
