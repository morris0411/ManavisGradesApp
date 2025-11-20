import React from "react";
import { Link } from "react-router-dom";
import { Breadcrumb } from "../../components/Breadcrumb";

const SelectSearch = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafb" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#e5eef3", backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Breadcrumb items={[{ label: "ホーム" }]} />
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
            河合塾マナビス 全統模試管理システム
          </h1>
          <p className="text-sm" style={{ color: "#666e7e" }}>
            成績の検索、データのインポートを行います
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Search Cards */}
          <div 
            className="rounded-lg p-6"
            style={{ 
              backgroundColor: "#ffffff", 
              boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" 
            }}
          >
            <h3 
              className="text-xl font-bold mb-4"
              style={{ color: "#006580" }}
            >
              成績検索
            </h3>
            <div className="space-y-3">
              <Link 
                to="/students/search" 
                className="block w-full px-6 py-3 text-white no-underline rounded-md font-medium text-center transition hover:shadow-lg"
                style={{ 
                  backgroundColor: "#1BA4C3"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#0086A9"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#1BA4C3"}
              >
                生徒から検索
              </Link>
              <Link 
                to="/exams/search" 
                className="block w-full px-6 py-3 text-white no-underline rounded-md font-medium text-center transition hover:shadow-lg"
                style={{ 
                  backgroundColor: "#2faac9ff"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#006580"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#0086A9"}
              >
                模試から検索
              </Link>
            </div>
          </div>

          {/* Import Cards */}
          <div 
            className="rounded-lg p-6"
            style={{ 
              backgroundColor: "#ffffff", 
              boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" 
            }}
          >
            <h3 
              className="text-xl font-bold mb-4"
              style={{ color: "#006580" }}
            >
              データインポート
            </h3>
            <div className="space-y-3">
              <Link 
                to="/import/students" 
                className="block w-full px-6 py-3 text-white no-underline rounded-md font-medium text-center transition hover:shadow-lg"
                style={{ 
                  backgroundColor: "#1BA4C3"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#0086A9"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#1BA4C3"}
              >
                生徒CSVインポート
              </Link>
              <Link 
                to="/import/exams" 
                className="block w-full px-6 py-3 text-white no-underline rounded-md font-medium text-center transition hover:shadow-lg"
                style={{ 
                  backgroundColor: "#0086A9"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#006580"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#0086A9"}
              >
                模試Excelインポート
              </Link>
              <Link 
                to="/import/academic-year-update" 
                className="block w-full px-6 py-3 text-white no-underline rounded-md font-medium text-center transition hover:shadow-lg"
                style={{ 
                  backgroundColor: "#dc2626"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#b91c1c"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#dc2626"}
              >
                年度更新
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectSearch;


