import axios from "axios";

// 環境変数からAPIのベースURLを取得
// 開発モード（npm run dev）の場合はローカルURL、本番モード（npm run build）の場合は本番URL
// 環境変数が設定されている場合はそれを優先
const getApiBaseUrl = () => {
  // 環境変数が設定されている場合はそれを優先
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 開発モードの場合はローカルURL（バックエンドはポート10000で動作）
  if (import.meta.env.MODE === "development") {
    return "http://localhost:10000/api";
  }
  
  // 本番モードの場合は本番URL
  return "https://manavisgradesapp.onrender.com/api";
};

const API_BASE_URL = getApiBaseUrl();

// デバッグ用: 使用しているAPIのベースURLをログ出力
console.log("API Base URL:", API_BASE_URL);

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// リクエストインターセプター: トークンをヘッダーに追加
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター: エラーハンドリング
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // エラーログを出力
    if (error.response) {
      // サーバーからのエラーレスポンス
      console.error("APIエラー:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
      
      // 401エラー: 認証エラー
      if (error.response.status === 401) {
        // /api/auth/meへのリクエストが401を返した場合は、リダイレクトしない
        // useAuthフックで適切に処理される
        const isAuthMeRequest = error.config?.url?.includes("/auth/me");
        
        if (!isAuthMeRequest) {
          try {
            // トークンを削除
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_id");
            localStorage.removeItem("login_id");
            // ログインページにリダイレクト（window.locationを使用）
            if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
              window.location.href = "/login";
            }
          } catch (storageError) {
            console.error("localStorageの削除に失敗しました:", storageError);
          }
        }
      }
      // 403エラー: 権限エラー
      else if (error.response.status === 403) {
        console.error("アクセス権限がありません");
      }
      // 404エラー: リソースが見つからない
      else if (error.response.status === 404) {
        console.error("リソースが見つかりません");
      }
      // 500エラー: サーバーエラー
      else if (error.response.status >= 500) {
        console.error("サーバーエラーが発生しました");
      }
    } else if (error.request) {
      // リクエストは送信されたが、レスポンスが受信されなかった
      console.error("ネットワークエラー: サーバーに接続できませんでした", {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
        message: error.message
      });
    } else {
      // リクエストの設定中にエラーが発生
      console.error("リクエストエラー:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
