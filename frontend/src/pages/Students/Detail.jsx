import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchStudentDetail } from "../../api/students";
import { StudentPerformanceHeader } from "@/components/header";
import { PerformanceDashboard } from "@/components/dashboard";
import { UniversityJudgmentSection } from "@/components/university-judgment";
import { Breadcrumb } from "../../components/Breadcrumb";

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

  if (loading) return <div className="w-full max-w-none p-0 px-4 py-4">読み込み中...</div>;
  if (error) return <div className="w-full max-w-none p-0 px-4 py-4">{error}</div>;
  if (!data) return <div className="w-full max-w-none p-0 px-4 py-4">データがありません</div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafb" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#e5eef3", backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Breadcrumb items={[
            { label: "ホーム", path: "/" },
            { label: "生徒検索", path: "/students/search" },
            { label: data.name ? `${data.name} さんの成績情報` : "生徒詳細" }
          ]} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-bold" style={{ color: "#006580" }}>
              {data.name || "生徒詳細"}
            </h1>
            <p className="text-sm" style={{ color: "#666e7e" }}>
              さんの成績情報
            </p>
          </div>
        </div>

        {/* my-app UI block */}
        <div className="myapp-wrap">
        {(() => {
          const exams = Array.isArray(data.exams) ? data.exams : [];
          const latest = exams.length > 0 ? exams[exams.length - 1] : null;
          let latestUni = "-";
          let latestFac = "-";
          let latestDep = "-";
          let latestJudge = "-";
          let latestJudgeKyote = "-";
          let latestJudgeNiji = "-";
          let latestJudgeSougou = "-";
          let latestExamName = "-";
          let latestDeviation = "-";

          if (latest) {
            latestExamName = latest.exam_name || "-";
            // 判定は第1志望優先、なければ最初の要素
            const judgements = Array.isArray(latest.judgements) ? latest.judgements : [];
            let j0 = judgements.find(j => j && j.preference_order === 1) || judgements[0];
            if (j0) {
              latestUni = j0.university_name || "-";
              latestFac = j0.faculty_name || "-";
              latestDep = j0.department_name || "-";
              latestJudge = j0.judgement || "-";
              latestJudgeKyote = j0.judgement_kyote || "-";
              latestJudgeNiji = j0.judgement_niji || "-";
              latestJudgeSougou = j0.judgement_sougou || "-";
            }
            // 総合の偏差値（科目名に「総」が含まれるものを優先）
            const scores = Array.isArray(latest.scores) ? latest.scores : [];
            const total = scores.find(s => (s.subject_name || "").includes("総")) || null;
            if (total && typeof total.deviation_value !== "undefined" && total.deviation_value !== null) {
              latestDeviation = String(Number(total.deviation_value));
            }
          }

          return (
            <StudentPerformanceHeader
              studentId={data.student_id}
              name={data.name}
              nameKana={data.name_kana}
              grade={data.grade}
              schoolName={data.school_name}
              admissionDate={data.admission_date}
              status={data.status}
              latestUniversity={latestUni}
              latestFaculty={latestFac}
              latestDepartment={latestDep}
              latestJudgement={latestJudge}
              latestJudgementKyote={latestJudgeKyote}
              latestJudgementNiji={latestJudgeNiji}
              latestJudgementSougou={latestJudgeSougou}
              latestExamName={latestExamName}
              latestDeviation={latestDeviation}
            />
          );
        })()}
          <div className="w-full px-4 py-8">
            <PerformanceDashboard exams={data.exams} />
            <div className="mt-12">
              <UniversityJudgmentSection />
            </div>
          </div>
        </div>

        {/* Exam List Section */}
        <section className="mt-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2" style={{ color: "#006580" }}>受験した模試</h3>
            <p className="text-sm" style={{ color: "#666e7e" }}>
              これまでに受験した模試の詳細情報
            </p>
          </div>
          {Array.isArray(data.exams) && data.exams.length > 0 ? (
            <div className="grid gap-6">
              {data.exams.map((ex, idx) => (
                <div 
                  key={idx} 
                  className="rounded-lg overflow-hidden"
                  style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" }}
                >
                  {/* Exam Header */}
                  <div 
                    className="px-6 py-4"
                    style={{ backgroundColor: "#006580", borderBottom: "1px solid #e5eef3" }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-lg text-white">{ex.exam_name}</div>
                        <div className="text-sm text-white opacity-90 mt-1">{ex.exam_year}年 / 区分: {ex.exam_type}</div>
                      </div>
                    </div>
                  </div>

                  {/* Exam Content */}
                  <div className="p-6" style={{ backgroundColor: "#ffffff" }}>
                    {/* Universities Section */}
                    <div className="mb-8">
                      <h4 className="font-bold text-base mb-4 pb-2 border-b-2" style={{ color: "#006580", borderColor: "#1BA4C3" }}>志望校</h4>
                      {ex.judgements && ex.judgements.length > 0 ? (
                        <div className="space-y-3">
                          {ex.judgements.map((j, jdx) => (
                            <div 
                              key={jdx} 
                              className="flex justify-between items-start p-3 rounded-lg"
                              style={{ backgroundColor: "#f0f5f9" }}
                            >
                              <div className="flex-1">
                                <div className="font-semibold text-sm" style={{ color: "#006580" }}>
                                  {j.preference_order ? `第${j.preference_order}志望` : "その他"}
                                </div>
                                <div className="text-sm mt-1" style={{ color: "#666e7e" }}>
                                  {j.university_name} {j.faculty_name} {j.department_name}
                                </div>
                              </div>
                              {j.judgement && (
                                <div 
                                  className="ml-4 px-3 py-1 rounded-full text-xs font-medium text-white"
                                  style={{ 
                                    backgroundColor: j.judgement === "A判定" ? "#1BA4C3" : j.judgement === "B判定" ? "#0086A9" : "#006580" 
                                  }}
                                >
                                  {j.judgement}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm" style={{ color: "#666e7e" }}>志望データなし</div>
                      )}
                    </div>

                    {/* Scores Section */}
                    <div>
                      <h4 className="font-bold text-base mb-4 pb-2 border-b-2" style={{ color: "#006580", borderColor: "#1BA4C3" }}>科目スコア</h4>
                      {ex.scores && ex.scores.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr style={{ backgroundColor: "#f0f5f9", borderBottom: "2px solid #d0dce5" }}>
                                <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: "#006580" }}>科目</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: "#006580" }}>得点</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: "#006580" }}>偏差値</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ex.scores.map((s, sdx) => (
                                <tr 
                                  key={sdx} 
                                  style={{
                                    backgroundColor: sdx % 2 === 0 ? "#ffffff" : "#f8fafb",
                                    borderBottom: "1px solid #e5eef3"
                                  }}
                                  className="hover:bg-blue-50 transition"
                                >
                                  <td className="px-6 py-4 text-sm" style={{ color: "#333" }}>{s.subject_name}</td>
                                  <td className="px-6 py-4 text-sm" style={{ color: "#333" }}>{s.score}</td>
                                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#1BA4C3" }}>{s.deviation_value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm" style={{ color: "#666e7e" }}>スコアデータなし</div>
                      )}
                    </div>
                  </div>
                </div>
            ))}
          </div>
        ) : (
          <div 
            className="rounded-lg p-12 text-center"
            style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" }}
          >
            <p className="text-sm" style={{ color: "#666e7e" }}>模試データなし</p>
          </div>
        )}
      </section>
    </div>
    </div>
  );
};

export default StudentDetail;
