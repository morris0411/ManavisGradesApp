import React, { useState, useEffect } from "react";
import { getAcademicYearStatus, updateAcademicYear } from "../../api/imports";
import { Breadcrumb } from "../../components/Breadcrumb";

export default function AcademicYearUpdate() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [fetching, setFetching] = useState(true);

  // 年度更新の状態を取得
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await getAcademicYearStatus();
        setStatus(response);
      } catch (error) {
        console.error("年度更新状態の取得に失敗しました", error);
        setMessage("年度更新状態の取得に失敗しました");
      } finally {
        setFetching(false);
      }
    };
    fetchStatus();
  }, []);

  const handleUpdate = async () => {
    if (!status?.can_update) {
      alert(status?.error_message || "年度更新を実行できません");
      return;
    }

    if (
      !confirm(
        `年度更新を実行しますか？\n高3生は既卒になります。\n\n現在の年度: ${status.current_academic_year}年度`
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await updateAcademicYear();
      if (response.ok) {
        setMessage(`更新完了: ${response.message}`);
        alert(`年度更新が完了しました。\n${response.message}`);
        // 状態を再取得
        const statusResponse = await getAcademicYearStatus();
        setStatus(statusResponse);
      } else {
        setMessage("エラーが発生しました");
        alert("年度更新に失敗しました");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage("エラーが発生しました");
      alert(`年度更新に失敗しました: ${errorMsg}`);
      // エラー時も状態を再取得
      try {
        const statusResponse = await getAcademicYearStatus();
        setStatus(statusResponse);
      } catch (e) {
        // 無視
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f8fafb" }}>
        <div className="border-b" style={{ borderColor: "#e5eef3", backgroundColor: "#ffffff" }}>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Breadcrumb
              items={[
                { label: "ホーム", path: "/" },
                { label: "年度更新" },
              ]}
            />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-8">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafb" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#e5eef3", backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Breadcrumb
            items={[
              { label: "ホーム", path: "/" },
              { label: "年度更新" },
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#006580" }}>
            年度更新
          </h1>
          <p className="text-sm" style={{ color: "#666e7e" }}>
            全生徒の学年を1つ上げ、高3生を既卒に変更します
          </p>
        </div>

        {/* Update Card */}
        <div
          className="rounded-lg p-6 mb-8"
          style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" }}
        >
          <div className="mb-6 space-y-2">
            <p className="text-sm">
              <span className="font-semibold" style={{ color: "#006580" }}>
                現在の年度:
              </span>{" "}
              <span style={{ color: "#333" }}>{status?.current_academic_year}年度</span>
            </p>
            {status?.last_update_year && (
              <p className="text-sm">
                <span className="font-semibold" style={{ color: "#006580" }}>
                  前回更新:
                </span>{" "}
                <span style={{ color: "#333" }}>{status.last_update_year}年度</span>
                {status.last_update_datetime && (
                  <span className="text-xs ml-2" style={{ color: "#999" }}>
                    ({new Date(status.last_update_datetime).toLocaleString("ja-JP")})
                  </span>
                )}
              </p>
            )}
            {!status?.can_update && (
              <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>
                {status?.error_message}
              </p>
            )}
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading || !status?.can_update}
            className="px-6 py-2.5 rounded-md font-medium text-white text-sm transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: status?.can_update && !loading ? "#1BA4C3" : "#9ca3af",
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled && status?.can_update)
                e.currentTarget.style.backgroundColor = "#0086A9";
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled && status?.can_update)
                e.currentTarget.style.backgroundColor = "#1BA4C3";
            }}
          >
            {loading ? "更新中..." : "年度更新を実行"}
          </button>

          {message && (
            <p
              className={`mt-4 text-sm ${
                message.includes("完了") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>

        {/* Info Section */}
        <div
          className="rounded-lg p-6"
          style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" }}
        >
          <h2 className="text-lg font-semibold mb-3" style={{ color: "#006580" }}>
            更新内容
          </h2>
          <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: "#333" }}>
            <li>中3 → 高1</li>
            <li>高1 → 高2</li>
            <li>高2 → 高3</li>
            <li>高3（在籍） → 既卒（学年・ステータス）</li>
            <li>退会者は更新対象外</li>
            <li>既卒者はそのまま</li>
            <li>同じ年度内では1回のみ実行可能</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

