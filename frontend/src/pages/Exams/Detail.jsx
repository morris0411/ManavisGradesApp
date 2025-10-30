import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchExamResults, filterExamResults } from "../../api/exams";
import "./Detail.css";

const ExamsDetail = () => {
  const { examId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [orderMin, setOrderMin] = useState("");
  const [orderMax, setOrderMax] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchExamResults(examId);
      // get_exam_results returns { exam_id, exam_year, exam_type, exam_name, num_students }? In current backend it returns formatted table.
      // We expect an array of rows; if it's an object, keep it as single row list.
      const list = Array.isArray(data) ? data : (data && data.rows ? data.rows : []);
      setRows(list.length ? list : (Array.isArray(data) ? data : []));
    } catch (e) {
      setError("読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const doFilter = async () => {
    setLoading(true);
    try {
      const data = await filterExamResults({
        exam_id: examId,
        name: name || undefined,
        university: university || undefined,
        faculty: faculty || undefined,
        order_min: orderMin || undefined,
        order_max: orderMax || undefined,
      });
      const list = Array.isArray(data) ? data : [];
      setRows(list);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <h2>模試詳細</h2>
      <div className="detail-back">
        <Link to="/exams/search">← 模試検索に戻る</Link>
      </div>

      <div className="detail-filters">
        <div>
          <label>氏名</label><br />
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label>大学</label><br />
          <input value={university} onChange={(e) => setUniversity(e.target.value)} />
        </div>
        <div>
          <label>学部</label><br />
          <input value={faculty} onChange={(e) => setFaculty(e.target.value)} />
        </div>
        <div>
          <label>第志望(最小)</label><br />
          <input type="number" value={orderMin} onChange={(e) => setOrderMin(e.target.value)} min="1" />
        </div>
        <div>
          <label>第志望(最大)</label><br />
          <input type="number" value={orderMax} onChange={(e) => setOrderMax(e.target.value)} min="1" />
        </div>
        <button onClick={doFilter}>フィルター</button>
        <button onClick={load}>リセット</button>
      </div>

      {loading ? (
        <div>読み込み中...</div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <table className="detail-table">
          <thead>
            <tr>
              <th>生徒ID</th>
              <th>氏名</th>
              <th>学校名</th>
              <th>第1志望</th>
              <th>第2志望</th>
              <th>第3志望</th>
              <th>第4志望</th>
              <th>第5志望</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student_id}>
                <td>{r.student_id}</td>
                <td>{r.name}</td>
                <td>{r.school_name}</td>
                <td>{r["第1志望"]}</td>
                <td>{r["第2志望"]}</td>
                <td>{r["第3志望"]}</td>
                <td>{r["第4志望"]}</td>
                <td>{r["第5志望"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExamsDetail;
