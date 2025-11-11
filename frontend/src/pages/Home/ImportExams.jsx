import React, { useState } from "react";
import { uploadExamsXlsx } from "../../api/imports";
import "./SelectSearch.css";

export default function ImportExams() {
  const [file, setFile] = useState(null);
  const [log, setLog] = useState("");
  const [busy, setBusy] = useState(false);

  const onImport = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadExamsXlsx(file);
      setLog(JSON.stringify(res, null, 2));
    } catch (e) {
      setLog(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="select-container">
      <h2>模試Excelインポート</h2>
      <div className="select-actions" style={{ flexDirection: "column", gap: 16 }}>
        <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button onClick={onImport} disabled={!file || busy}>{busy ? "インポート中..." : "インポート"}</button>
      </div>
      {log && (
        <pre style={{ textAlign: "left", background: "#f8fafc", padding: 12, borderRadius: 6, marginTop: 16 }}>{log}</pre>
      )}
    </div>
  );
}


