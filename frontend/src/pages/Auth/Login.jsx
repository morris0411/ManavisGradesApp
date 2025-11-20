import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../api/auth";

export default function Login() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 入力値の検証
      if (!loginId.trim()) {
        setError("ログインIDを入力してください。");
        setLoading(false);
        return;
      }
      if (!password.trim()) {
        setError("パスワードを入力してください。");
        setLoading(false);
        return;
      }

      const response = await login(loginId, password);
      
      // レスポンスの検証
      if (!response?.data?.access_token) {
        setError("ログインに失敗しました。レスポンスが不正です。");
        setLoading(false);
        return;
      }

      // トークンをlocalStorageに保存
      try {
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("user_id", response.data.user_id || "");
        localStorage.setItem("login_id", response.data.login_id || loginId);
      } catch (storageError) {
        console.error("localStorageへの保存に失敗しました:", storageError);
        setError("データの保存に失敗しました。ブラウザの設定を確認してください。");
        setLoading(false);
        return;
      }
      
      // ホームページにリダイレクト
      navigate("/");
    } catch (err) {
      console.error("ログインエラー:", err);
      
      // エラーメッセージの設定
      if (err.response) {
        // サーバーからのエラーレスポンス
        const status = err.response.status;
        if (status === 401) {
          setError("ログインIDまたはパスワードが正しくありません。");
        } else if (status === 400) {
          setError(err.response.data?.error || "リクエストが不正です。");
        } else if (status >= 500) {
          setError("サーバーエラーが発生しました。しばらくしてから再度お試しください。");
        } else {
          setError(err.response.data?.error || "ログインに失敗しました。");
        }
      } else if (err.request) {
        // リクエストは送信されたが、レスポンスが受信されなかった
        setError("サーバーに接続できませんでした。ネットワーク接続を確認してください。");
      } else {
        // リクエストの設定中にエラーが発生
        setError("ログインに失敗しました。もう一度お試しください。");
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
            ログイン
          </h1>
          <p className="text-sm" style={{ color: "#666e7e" }}>
            成績管理システムにログインしてください
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

          <div className="mb-6">
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
              className="w-full px-4 py-2 rounded-md border"
              style={{
                borderColor: "#e5eef3",
                backgroundColor: "#ffffff",
                color: "#333"
              }}
              placeholder="パスワードを入力"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 text-white rounded-md font-medium transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: loading ? "#94a3b8" : "#1BA4C3"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#0086A9";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#1BA4C3";
              }
            }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: "#666e7e" }}>
            アカウントをお持ちでない方は{" "}
            <Link 
              to="/register"
              className="font-medium"
              style={{ color: "#1BA4C3" }}
            >
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

