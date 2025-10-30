import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchYears, fetchTypes, fetchNames, searchExams } from "../../api/exams";
import "./Search.css";

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
    <div className="search-container">
      <h2>模試検索</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <label>年度</label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">すべて</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label>模試タイプ</label>
          <select value={examType} onChange={(e) => setExamType(e.target.value)}>
            <option value="">すべて</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label>模試名</label>
          <select value={name} onChange={(e) => setName(e.target.value)}>
            <option value="">すべて</option>
            {names.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button onClick={doSearch}>検索</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>年度</th>
            <th>模試名</th>
            <th>タイプ</th>
            <th>受験者数</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.exam_id}>
              <td>{r.exam_year}</td>
              <td>
                <Link to={`/exams/${r.exam_id}`}>{r.exam_name}</Link>
              </td>
              <td>{r.exam_type}</td>
              <td>{r.num_students}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExamsSearch;
