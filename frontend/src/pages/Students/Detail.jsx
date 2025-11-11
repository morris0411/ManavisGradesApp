import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchStudentDetail } from "../../api/students";
import "./Detail.css";

const StudentDetail = () => {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetchStudentDetail(studentId);
        setData(res);
      } catch (e) {
        setError("読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [studentId]);

  if (loading) return <div className="search-container">読み込み中...</div>;
  if (error) return <div className="search-container">{error}</div>;
  if (!data) return <div className="search-container">データがありません</div>;

  return (
    <div className="search-container">
      <h2>生徒詳細</h2>
      <div className="detail-back">
        <Link to="/students/search">← 検索に戻る</Link>
      </div>

      <section className="detail-section">
        <div><strong>生徒ID:</strong> {data.student_id}</div>
        <div><strong>氏名:</strong> {data.name}</div>
        {data.name_kana && <div><strong>氏名カナ:</strong> {data.name_kana}</div>}
        <div><strong>学校名:</strong> {data.school_name}</div>
        <div><strong>学年:</strong> {data.grade}</div>
        <div><strong>ステータス:</strong> {data.status || '在籍'}</div>
      </section>

      <section>
        <h3>受験した模試</h3>
        {Array.isArray(data.exams) && data.exams.length > 0 ? (
          data.exams.map((ex, idx) => (
            <div key={idx} className="detail-card">
              <div className="detail-card-header">
                <strong>{ex.exam_year}</strong> 年 / {ex.exam_name} / 区分: {ex.exam_type}
              </div>

              <div className="detail-subtitle"><strong>志望校</strong></div>
              {ex.judgements && ex.judgements.length > 0 ? (
                <ul>
                  {ex.judgements.map((j, jdx) => (
                    <li key={jdx}>
                      {j.preference_order ? `第${j.preference_order}志望: ` : ""}
                      {j.university_name} {j.faculty_name} {j.department_name} {j.judgement ? `(${j.judgement})` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <div>志望データなし</div>
              )}

              <div className="detail-subtitle detail-subtitle--mt"><strong>科目スコア</strong></div>
              {ex.scores && ex.scores.length > 0 ? (
                <table className="detail-table">
                  <thead>
                    <tr>
                      <th>科目</th>
                      <th>得点</th>
                      <th>偏差値</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ex.scores.map((s, sdx) => (
                      <tr key={sdx}>
                        <td>{s.subject_name}</td>
                        <td>{s.score}</td>
                        <td>{s.deviation_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>スコアデータなし</div>
              )}
            </div>
          ))
        ) : (
          <div>模試データなし</div>
        )}
      </section>
    </div>
  );
};

export default StudentDetail;
