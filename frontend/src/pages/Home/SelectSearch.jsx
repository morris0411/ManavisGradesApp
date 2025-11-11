import React from "react";
import { Link } from "react-router-dom";
import "./SelectSearch.css";

const SelectSearch = () => {
  return (
    <div className="select-container">
      <h2>検索方法を選択</h2>
      <div className="select-actions">
        <Link to="/students/search" className="select-button">生徒から検索</Link>
        <Link to="/exams/search" className="select-button select-button--secondary">模試から検索</Link>
        <Link to="/import/students" className="select-button">生徒CSVインポート</Link>
        <Link to="/import/exams" className="select-button select-button--secondary">模試Excelインポート</Link>
      </div>
    </div>
  );
};

export default SelectSearch;


