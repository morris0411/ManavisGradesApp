import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchYears, fetchTypes, fetchNames, searchExams } from "../../api/exams";
import { Breadcrumb } from "../../components/Breadcrumb";

const ExamsSearch = () => {
  const [years, setYears] = useState([]);
  const [types, setTypes] = useState([]);
  const [names, setNames] = useState([]);

  const [year, setYear] = useState("");
  const [examType, setExamType] = useState("");
  const [name, setName] = useState("");

  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const ys = await fetchYears();
      setYears(ys || []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const ts = await fetchTypes(year || undefined);
      setTypes(ts || []);
      setExamType("");
      setNames([]);
      setName("");
    })();
  }, [year]);

  useEffect(() => {
    (async () => {
      const ns = await fetchNames({ year: year || undefined, exam_type: examType || undefined });
      setNames(ns || []);
      setName("");
    })();
  }, [examType, year]);

  const doSearch = async () => {
    const data = await searchExams({ year: year || undefined, exam_type: examType || undefined, name: name || undefined });
    setRows(data || []);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafb" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#e5eef3", backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Breadcrumb items={[
            { label: "ホーム", path: "/" },
            { label: "模試から検索" }
          ]} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              background: "linear-gradient(135deg, #1BA4C3 0%, #0086A9 50%, #006580 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            模試から検索
          </h1>
          <p className="text-sm" style={{ color: "#666e7e" }}>
            模試情報から検索します
          </p>
        </div>

        {/* Search Card */}
        <div 
          className="rounded-lg p-6 mb-8" 
          style={{ 
            backgroundColor: "#ffffff", 
            boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" 
          }}
        >
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#006580" }}
              >
                年度
              </label>
              <select 
                value={year} 
                onChange={(e) => setYear(e.target.value)} 
                className="w-full px-4 py-2.5 rounded-md text-sm border transition"
                style={{
                  borderColor: "#d0dce5",
                  backgroundColor: "#ffffff",
                  color: "#333"
                }}
              >
                <option value="">すべて</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#006580" }}
              >
                模試タイプ
              </label>
              <select 
                value={examType} 
                onChange={(e) => setExamType(e.target.value)} 
                className="w-full px-4 py-2.5 rounded-md text-sm border transition"
                style={{
                  borderColor: "#d0dce5",
                  backgroundColor: "#ffffff",
                  color: "#333"
                }}
              >
                <option value="">すべて</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#006580" }}
              >
                模試名
              </label>
              <select 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full px-4 py-2.5 rounded-md text-sm border transition"
                style={{
                  borderColor: "#d0dce5",
                  backgroundColor: "#ffffff",
                  color: "#333"
                }}
              >
                <option value="">すべて</option>
                {names.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={doSearch} 
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
        {rows.length > 0 && (
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
                      className="px-6 py-3 text-left text-xs font-semibold"
                      style={{ color: "#006580" }}
                    >
                      年度
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold"
                      style={{ color: "#006580" }}
                    >
                      模試名
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold"
                      style={{ color: "#006580" }}
                    >
                      タイプ
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold"
                      style={{ color: "#006580" }}
                    >
                      受験者数
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr
                      key={r.exam_id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafb",
                        borderBottom: "1px solid #e5eef3"
                      }}
                      className="hover:bg-blue-50 transition"
                    >
                      <td 
                        className="px-6 py-4 text-sm"
                        style={{ color: "#333" }}
                      >
                        {r.exam_year}
                      </td>
                      <td 
                        className="px-6 py-4 text-sm"
                      >
                        <Link
                          to={`/exams/${r.exam_id}`}
                          className="font-medium transition hover:underline"
                          style={{ color: "#1BA4C3" }}
                          onMouseEnter={(e) => e.target.style.color = "#0086A9"}
                          onMouseLeave={(e) => e.target.style.color = "#1BA4C3"}
                        >
                          {r.exam_name}
                        </Link>
                      </td>
                      <td 
                        className="px-6 py-4 text-sm"
                        style={{ color: "#666e7e" }}
                      >
                        {r.exam_type}
                      </td>
                      <td 
                        className="px-6 py-4 text-sm"
                        style={{ color: "#333" }}
                      >
                        {r.num_students}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {rows.length === 0 && (
          <div
            className="rounded-lg p-12 text-center"
            style={{ 
              backgroundColor: "#ffffff", 
              boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" 
            }}
          >
            <p className="text-sm" style={{ color: "#666e7e" }}>
              模試を検索するには、上記のフォームから条件を選択して「検索」ボタンをクリックしてください
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamsSearch;
