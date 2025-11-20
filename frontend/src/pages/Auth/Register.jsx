import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../api/auth";

export default function Register() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // 入力値の検証
    if (!loginId.trim()) {
      setError("ログインIDを入力してください。");
      return;
    }

    if (!password.trim()) {
      setError("パスワードを入力してください。");
      return;
    }

    // パスワード確認
    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    // パスワードの最小長チェック
    if (password.length < 6) {
      setError("パスワードは6文字以上である必要があります");
      return;
    }

    // ログインIDの長さチェック
    if (loginId.trim().length < 3) {
      setError("ログインIDは3文字以上である必要があります");
      return;
    }

    setLoading(true);

    try {
      await register(loginId, password);
      setSuccess(true);
      // 3秒後にログインページにリダイレクト
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("ユーザー登録エラー:", err);
      
      // エラーメッセージの設定
      if (err.response) {
        // サーバーからのエラーレスポンス
        const status = err.response.status;
        if (status === 400) {
          setError(err.response.data?.error || "入力内容に誤りがあります。");
        } else if (status === 409) {
          setError("このログインIDは既に使用されています。");
        } else if (status >= 500) {
          setError("サーバーエラーが発生しました。しばらくしてから再度お試しください。");
        } else {
          setError(err.response.data?.error || "ユーザー登録に失敗しました。");
        }
      } else if (err.request) {
        // リクエストは送信されたが、レスポンスが受信されなかった
        setError("サーバーに接続できませんでした。ネットワーク接続を確認してください。");
      } else {
        // リクエストの設定中にエラーが発生
        setError("ユーザー登録に失敗しました。もう一度お試しください。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8fafb" }}>
      <div 
        className="w-full max-w-md p-8 rounded-lg"
        style={{ 
          backgroundColor: "#ffffff", 
          boxShadow: "0 4px 12px rgba(0, 101, 128, 0.15)" 
        }}
      >
        <div className="mb-8 text-center">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              background: "linear-gradient(135deg, #1BA4C3 0%, #0086A9 50%, #006580 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            新規ユーザー登録
          </h1>
          <p className="text-sm" style={{ color: "#666e7e" }}>
            新しいアカウントを作成してください
          </p>
        </div>

        {error && (
          <div 
            className="mb-4 p-3 rounded-md"
            style={{ 
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              border: "1px solid #fecaca"
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div 
            className="mb-4 p-3 rounded-md"
            style={{ 
              backgroundColor: "#d1fae5",
              color: "#065f46",
              border: "1px solid #a7f3d0"
            }}
          >
            ユーザー登録が完了しました。ログインページにリダイレクトします...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label 
              htmlFor="login_id"
              className="block text-sm font-medium mb-2"
              style={{ color: "#006580" }}
            >
              ログインID
            </label>
            <input
              type="text"
              id="login_id"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-md border"
              style={{
                borderColor: "#e5eef3",
                backgroundColor: "#ffffff",
                color: "#333"
              }}
              placeholder="ログインIDを入力"
            />
          </div>

          <div className="mb-4">
            <label 
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: "#006580" }}
            >
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-md border"
              style={{
                borderColor: "#e5eef3",
                backgroundColor: "#ffffff",
                color: "#333"
              }}
              placeholder="パスワードを入力（6文字以上）"
            />
          </div>

          <div className="mb-6">
            <label 
              htmlFor="confirm_password"
              className="block text-sm font-medium mb-2"
              style={{ color: "#006580" }}
            >
              パスワード（確認）
            </label>
            <input
              type="password"
              id="confirm_password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-md border"
              style={{
                borderColor: "#e5eef3",
                backgroundColor: "#ffffff",
                color: "#333"
              }}
              placeholder="パスワードを再入力"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full px-6 py-3 text-white rounded-md font-medium transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: (loading || success) ? "#94a3b8" : "#1BA4C3"
            }}
            onMouseEnter={(e) => {
              if (!loading && !success) {
                e.target.style.backgroundColor = "#0086A9";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !success) {
                e.target.style.backgroundColor = "#1BA4C3";
              }
            }}
          >
            {loading ? "登録中..." : success ? "登録完了" : "登録"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: "#666e7e" }}>
            既にアカウントをお持ちですか？{" "}
            <Link 
              to="/login"
              className="font-medium"
              style={{ color: "#1BA4C3" }}
            >
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

