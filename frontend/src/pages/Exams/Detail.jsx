import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchExamResults, filterExamResults, searchExams, fetchTopUniversities } from "../../api/exams";
import { Breadcrumb } from "../../components/Breadcrumb";
import { getJudgmentColor } from "../../utils/subject-utils";

const ExamsDetail = () => {
  const { examId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examName, setExamName] = useState("");
  const [examYear, setExamYear] = useState("");
  const [examType, setExamType] = useState("");

  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [faculty, setFaculty] = useState("");
  const [orderMin, setOrderMin] = useState("1");
  const [orderMax, setOrderMax] = useState("1");
  const [topUniversities, setTopUniversities] = useState([]);

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

  useEffect(() => {
    // 模試名と年度を取得
    const fetchExamInfo = async () => {
      try {
        const exams = await searchExams({});
        const exam = exams.find((e) => e.exam_id === Number(examId));
        if (exam) {
          setExamName(exam.exam_name);
          setExamYear(exam.exam_year || "");
          setExamType(exam.exam_type || "");
        }
      } catch (e) {
        console.error("模試情報の取得に失敗しました", e);
      }
    };
    fetchExamInfo();
  }, [examId]);

  useEffect(() => {
    // 難関10大学の一覧を取得
    const fetchUniversities = async () => {
      try {
        const universities = await fetchTopUniversities();
        setTopUniversities(universities || []);
      } catch (e) {
        console.error("大学一覧の取得に失敗しました", e);
      }
    };
    fetchUniversities();
  }, []);

  const doFilter = async () => {
    setLoading(true);
    try {
      const includeTopUniversities = universityId === "ALL";
      const normalizedUniversityId = includeTopUniversities ? "" : universityId;
      const data = await filterExamResults({
        exam_id: examId,
        name: name || undefined,
        university: (includeTopUniversities || normalizedUniversityId) ? undefined : (university || undefined), // �v���_�E���I�����̓e�L�X�g���͂𖳎�
        university_id: normalizedUniversityId || undefined,
        faculty: faculty || undefined,
        order_min: orderMin || undefined,
        order_max: orderMax || undefined,
        include_top_universities: includeTopUniversities || undefined,
      });
      const list = Array.isArray(data) ? data : [];
      setRows(list);
    } finally {
      setLoading(false);
    }
  };

  const handleUniversitySelectChange = (value) => {
    setUniversityId(value);
    // プルダウン選択時はテキスト入力をクリア
    if (value) {
      setUniversity("");
    }
  };

  const handleUniversityInputChange = (value) => {
    setUniversity(value);
    // テキスト入力時はプルダウン選択をクリア
    if (value) {
      setUniversityId("");
    }
  };

  const handleResetFilters = () => {
    setName("");
    setUniversity("");
    setUniversityId("");
    setFaculty("");
    setOrderMin("1");
    setOrderMax("1");
  };

  // 志望順位の列を動的に取得
  const preferenceColumns = useMemo(() => {
    const columns = new Set();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key.startsWith("第") && key.endsWith("志望")) {
          columns.add(key);
        }
      });
    });
    // 数値順にソート（第1志望、第2志望...の順）
    return Array.from(columns).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });
  }, [rows]);

  // 判定列の表示可否を判定
  const shouldShowJudgmentKyote = useMemo(() => {
    if (examType === "共テ") {
      // 共テの場合は、評テが存在するかチェック
      return rows.some((row) => {
        return preferenceColumns.some((col) => {
          const prefData = row[col];
          if (prefData && typeof prefData === "object") {
            return prefData.judgement_kyote && prefData.judgement_kyote.trim() !== "";
          }
          return false;
        });
      });
    }
    return false;
  }, [examType, rows, preferenceColumns]);

  const shouldShowJudgmentNiji = useMemo(() => {
    // 評二は常に表示（記述、高1/高2、OP、共テすべて）
    return rows.some((row) => {
      return preferenceColumns.some((col) => {
        const prefData = row[col];
        if (prefData && typeof prefData === "object") {
          return prefData.judgement_niji && prefData.judgement_niji.trim() !== "";
        }
        return false;
      });
    });
  }, [rows, preferenceColumns]);

  const examTitle = examYear ? `${examYear}年 ${examName || "模試詳細"}` : (examName || "模試詳細");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafb" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#e5eef3", backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Breadcrumb items={[
            { label: "ホーム", path: "/" },
            { label: "模試から検索", path: "/exams/search" },
            { label: examTitle }
          ]} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3">
            <h1 
              className="text-3xl font-bold"
              style={{ 
                background: "linear-gradient(135deg, #1BA4C3 0%, #0086A9 50%, #006580 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              {examTitle}
            </h1>
            <p className="text-sm" style={{ color: "#666e7e" }}>
              を受験した者の判定結果を表示します。
            </p>
          </div>
        </div>

        {/* Filter Card */}
        <div 
          className="rounded-lg p-6 mb-8" 
          style={{ 
            backgroundColor: "#ffffff", 
            boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" 
          }}
        >
          <div className="flex gap-4 items-start flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#006580" }}
              >
                氏名
              </label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="氏名を入力"
                className="w-full px-4 py-2.5 rounded-md text-sm border transition"
                style={{
                  borderColor: "#d0dce5",
                  backgroundColor: "#ffffff",
                  color: "#333"
                }}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#006580" }}
              >
                大学
              </label>
              <div className="flex flex-col gap-2">
                <input 
                  value={university} 
                  onChange={(e) => handleUniversityInputChange(e.target.value)}
                  placeholder="大学名を入力"
                  className="w-full px-4 py-2.5 rounded-md text-sm border transition"
                  style={{
                    borderColor: "#d0dce5",
                    backgroundColor: "#ffffff",
                    color: "#333"
                  }}
                />
                <select
                  value={universityId}
                  onChange={(e) => handleUniversitySelectChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md text-sm border transition"
                  style={{
                    borderColor: "#d0dce5",
                    backgroundColor: "#ffffff",
                    color: "#333"
                  }}
                >
                  <option value="" disabled hidden>難関10大学から選択</option>
                  <option value="ALL">すべて</option>
                  {topUniversities.map((uni) => (
                    <option key={uni.university_id} value={uni.university_id}>
                      {uni.university_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#006580" }}
              >
                学部
              </label>
              <input 
                value={faculty} 
                onChange={(e) => setFaculty(e.target.value)} 
                placeholder="学部名を入力"
                className="w-full px-4 py-2.5 rounded-md text-sm border transition"
                style={{
                  borderColor: "#d0dce5",
                  backgroundColor: "#ffffff",
                  color: "#333"
                }}
              />
            </div>
            <div className="min-w-[120px]">
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#006580" }}
              >
                志望順位(最小)
              </label>
              <select
                value={orderMin}
                onChange={(e) => setOrderMin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md text-sm border"
                style={{
                  borderColor: "#d0dce5",
                  backgroundColor: "#ffffff",
                  color: "#333"
                }}
              >
                {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[120px]">
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#006580" }}
              >
                志望順位(最大)
              </label>
              <select
                value={orderMax}
                onChange={(e) => setOrderMax(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md text-sm border"
                style={{
                  borderColor: "#d0dce5",
                  backgroundColor: "#ffffff",
                  color: "#333"
                }}
              >
                {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 self-end">
              <button 
                onClick={doFilter} 
                className="px-6 py-2.5 rounded-md font-medium text-white text-sm transition hover:shadow-lg"
                style={{
                  backgroundColor: "#1BA4C3"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#0086A9"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#1BA4C3"}
              >
                検索
              </button>
              <button 
                onClick={handleResetFilters} 
                className="px-5 py-2.5 rounded-md font-medium text-white text-sm transition hover:shadow-lg"
                style={{
                  backgroundColor: "#666e7e"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#555"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#666e7e"}
              >
                リセット
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {loading ? (
          <div 
            className="rounded-lg p-12 text-center"
            style={{ 
              backgroundColor: "#ffffff", 
              boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" 
            }}
          >
            <p className="text-sm" style={{ color: "#666e7e" }}>読み込み中...</p>
          </div>
        ) : error ? (
          <div 
            className="rounded-lg p-12 text-center"
            style={{ 
              backgroundColor: "#ffffff", 
              boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" 
            }}
          >
            <p className="text-sm" style={{ color: "#b85a5a" }}>{error}</p>
          </div>
        ) : rows.length > 0 ? (
          <div 
            className="rounded-lg overflow-hidden" 
            style={{ 
              backgroundColor: "#ffffff", 
              boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" 
            }}
          >
            <div 
              className="px-6 py-4" 
              style={{ 
                backgroundColor: "#006580", 
                borderBottom: "1px solid #e5eef3" 
              }}
            >
              <p className="text-sm font-medium text-white">
                検索結果 {rows.length}件
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ 
                    backgroundColor: "#f0f5f9", 
                    borderBottom: "2px solid #d0dce5" 
                  }}>
                    <th 
                      rowSpan={2}
                      className="px-1 py-3 text-center text-xs font-semibold"
                      style={{ 
                        color: "#006580",
                        writingMode: "horizontal-tb",
                        textOrientation: "mixed",
                        whiteSpace: "nowrap",
                        borderRight: "1px solid #d0dce5"
                      }}
                    >
                      マナビス生番号
                    </th>
                    <th 
                      rowSpan={2}
                      className="px-1 py-3 text-center text-xs font-semibold"
                      style={{ 
                        color: "#006580",
                        writingMode: "horizontal-tb",
                        textOrientation: "mixed",
                        whiteSpace: "nowrap",
                        borderRight: "1px solid #d0dce5"
                      }}
                    >
                      氏名
                    </th>
                    <th 
                      rowSpan={2}
                      className="px-1 py-3 text-center text-xs font-semibold"
                      style={{ 
                        color: "#006580",
                        writingMode: "horizontal-tb",
                        textOrientation: "mixed",
                        whiteSpace: "nowrap",
                        borderRight: "1px solid #d0dce5"
                      }}
                    >
                      高校名
                    </th>
                    {preferenceColumns.map((col) => (
                      <React.Fragment key={col}>
                        <th 
                          colSpan={3 + (shouldShowJudgmentKyote ? 1 : 0) + (shouldShowJudgmentNiji ? 1 : 0)}
                          className="px-1 py-3 text-center text-xs font-semibold"
                          style={{ 
                            color: "#006580",
                            borderRight: "1px solid #d0dce5"
                          }}
                        >
                          {col}
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                  <tr style={{ 
                    backgroundColor: "#f0f5f9", 
                    borderBottom: "2px solid #d0dce5" 
                  }}>
                    {preferenceColumns.map((col) => (
                      <React.Fragment key={col}>
                        <th 
                          className="px-1 py-3 text-center text-xs font-semibold"
                          style={{ 
                            color: "#006580",
                            whiteSpace: "nowrap"
                          }}
                        >
                          大学
                        </th>
                        <th 
                          className="px-1 py-3 text-center text-xs font-semibold"
                          style={{ 
                            color: "#006580",
                            whiteSpace: "nowrap"
                          }}
                        >
                          学部
                        </th>
                        <th 
                          className="px-1 py-3 text-center text-xs font-semibold"
                          style={{ 
                            color: "#006580",
                            whiteSpace: "nowrap",
                            borderRight: "1px solid #d0dce5"
                          }}
                        >
                          募集区分
                        </th>
                        {shouldShowJudgmentKyote && (
                          <th 
                            className="px-1 py-3 text-center text-xs font-semibold"
                            style={{ 
                              color: "#006580",
                              whiteSpace: "nowrap",
                              borderRight: shouldShowJudgmentNiji ? "none" : "1px solid #d0dce5"
                            }}
                          >
                            共テ
                          </th>
                        )}
                        {shouldShowJudgmentNiji && (
                          <th 
                            className="px-2 py-3 text-center text-xs font-semibold"
                            style={{ 
                              color: "#006580",
                              whiteSpace: "nowrap",
                              borderRight: "1px solid #d0dce5"
                            }}
                          >
                            2次
                          </th>
                        )}
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr
                      key={r.student_id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafb",
                        borderBottom: "1px solid #e5eef3"
                      }}
                      className="hover:bg-blue-50 transition"
                    >
                      <td 
                        className="px-1 py-4 text-sm text-center"
                        style={{ 
                          color: "#333",
                          whiteSpace: "nowrap",
                          borderRight: "1px solid #d0dce5"
                        }}
                      >
                        {r.student_id}
                      </td>
                      <td 
                        className="px-1 py-4 text-sm text-center"
                        style={{
                          whiteSpace: "nowrap",
                          borderRight: "1px solid #d0dce5"
                        }}
                      >
                        <Link
                          to={`/students/${r.student_id}`}
                          className="font-medium transition hover:underline"
                          style={{ color: "#1BA4C3" }}
                          onMouseEnter={(e) => e.target.style.color = "#0086A9"}
                          onMouseLeave={(e) => e.target.style.color = "#1BA4C3"}
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td 
                        className="px-1 py-4 text-sm text-center"
                        style={{ 
                          color: "#666e7e",
                          whiteSpace: "nowrap",
                          borderRight: "1px solid #d0dce5"
                        }}
                      >
                        {r.school_name}
                      </td>
                      {preferenceColumns.map((col) => {
                        const prefData = r[col];
                        const isObject = prefData && typeof prefData === "object";
                        const uni = isObject ? (prefData.university_name || "") : "";
                        const fac = isObject ? (prefData.faculty_name || "") : "";
                        const dep = isObject ? (prefData.department_name || "") : "";
                        const jk = isObject ? (prefData.judgement_kyote || "") : "";
                        const jn = isObject ? (prefData.judgement_niji || "") : "";
                        
                        return (
                          <React.Fragment key={col}>
                            <td 
                              className="px-1 py-4 text-sm text-center"
                              style={{ 
                                color: "#333",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {uni || "-"}
                            </td>
                            <td 
                              className="px-1 py-4 text-sm text-center"
                              style={{ 
                                color: "#333",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {fac || "-"}
                            </td>
                            <td 
                              className="px-1 py-4 text-sm text-center"
                              style={{ 
                                color: "#333",
                                whiteSpace: "nowrap",
                                borderRight: "1px solid #d0dce5"
                              }}
                            >
                              {dep || "-"}
                            </td>
                            {shouldShowJudgmentKyote && (
                              <td 
                                className="px-1 py-4 text-sm text-center"
                                style={{ 
                                  whiteSpace: "nowrap",
                                  borderRight: shouldShowJudgmentNiji ? "none" : "1px solid #d0dce5"
                                }}
                              >
                                {jk ? (
                                  <span 
                                    className={`inline-block w-full py-1 rounded ${getJudgmentColor(jk)}`}
                                  >
                                    {jk}
                                  </span>
                                ) : (
                                  <span style={{ color: "#666e7e" }}>-</span>
                                )}
                              </td>
                            )}
                            {shouldShowJudgmentNiji && (
                              <td 
                                className="px-1 py-4 text-sm text-center"
                                style={{ 
                                  whiteSpace: "nowrap",
                                  borderRight: "1px solid #d0dce5"
                                }}
                              >
                                {jn ? (
                                  <span 
                                    className={`inline-block w-full py-1 rounded ${getJudgmentColor(jn)}`}
                                  >
                                    {jn}
                                  </span>
                                ) : (
                                  <span style={{ color: "#666e7e" }}>-</span>
                                )}
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div 
            className="rounded-lg p-12 text-center"
            style={{ 
              backgroundColor: "#ffffff", 
              boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" 
            }}
          >
            <p className="text-sm" style={{ color: "#666e7e" }}>
              データがありません
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamsDetail;
