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
              <UniversityJudgmentSection exams={data.exams} />
            </div>
          </div>
        </div>

        {/* Exam List Section */}
        
    </div>
    </div>
  );
};

export default StudentDetail;
