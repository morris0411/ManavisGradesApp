import { useState, useEffect } from "react";
import { getCurrentUser } from "../api/auth";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        if (response?.data) {
          setUser(response.data);
          const adminStatus = response.data.is_admin === true || response.data.is_admin === "true";
          setIsAdmin(adminStatus);
          console.log("useAuth: ユーザー情報取得成功", {
            user_id: response.data.user_id,
            login_id: response.data.login_id,
            is_admin: response.data.is_admin,
            adminStatus: adminStatus
          });
        }
      } catch (error) {
        console.error("ユーザー情報の取得に失敗しました:", error);
        // エラーが発生してもトークンは削除しない（axiosClientのインターセプターで処理される）
        // 401エラーの場合はaxiosClientのインターセプターがトークンを削除してリダイレクトする
        if (error.response?.status !== 401) {
          // 401以外のエラーの場合は、ユーザー情報をクリアするだけ
          setUser(null);
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, isAdmin, loading };
}

