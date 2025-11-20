import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000/api", // FlaskサーバーURL
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
        url: error.config?.url
      });
    } else {
      // リクエストの設定中にエラーが発生
      console.error("リクエストエラー:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
