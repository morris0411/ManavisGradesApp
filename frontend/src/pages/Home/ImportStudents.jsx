import React, { useState } from "react";
import { uploadStudentsCsv } from "../../api/imports";
import { Breadcrumb } from "../../components/Breadcrumb";

export default function ImportStudents() {
  const [file, setFile] = useState(null);
  const [log, setLog] = useState("");
  const [busy, setBusy] = useState(false);

  const onImport = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadStudentsCsv(file);
      setLog(JSON.stringify(res, null, 2));
    } catch (e) {
      setLog(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafb" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#e5eef3", backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Breadcrumb
            items={[
              { label: "ホーム", path: "/" },
              { label: "生徒CSVインポート" }
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#006580" }}>
            生徒CSVインポート
          </h1>
          <p className="text-sm" style={{ color: "#666e7e" }}>
            統合の顧客情報CSVをインポートし、生徒情報を更新します
          </p>
        </div>

        {/* Upload Card */}
        <div
          className="rounded-lg p-6 mb-8"
          style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" }}
        >
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: "#006580" }}>
              CSVファイル
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2.5 rounded-md text-sm border transition"
              style={{
                borderColor: "#d0dce5",
                backgroundColor: "#ffffff",
                color: "#333"
              }}
            />
            <p className="text-xs mt-2" style={{ color: "#999" }}>
              ※ CSV形式（UTF-8推奨）で最新の顧客情報をアップロードしてください
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1 text-sm" style={{ color: "#666e7e" }}>
              {file ? `選択中: ${file.name}` : "ファイルを選択してください"}
            </div>
            <button
              onClick={onImport}
              disabled={!file || busy}
              className="px-6 py-2.5 rounded-md font-medium text-white text-sm transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#1BA4C3" }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#0086A9";
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#1BA4C3";
              }}
            >
              {busy ? "インポート中..." : "インポート"}
            </button>
          </div>
        </div>

        {/* Log Section */}
        <div
          className="rounded-lg p-6"
          style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" }}
        >
          <h2 className="text-lg font-semibold mb-3" style={{ color: "#006580" }}>
            実行ログ
          </h2>
          {log ? (
            <pre className="text-sm bg-[#f8fafb] p-4 rounded-md whitespace-pre-wrap" style={{ color: "#333" }}>
              {log}
            </pre>
          ) : (
            <p className="text-sm" style={{ color: "#666e7e" }}>
              インポート実行後に結果が表示されます。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
