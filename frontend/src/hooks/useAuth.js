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
          setIsAdmin(response.data.is_admin || false);
        }
      } catch (error) {
        console.error("ユーザー情報の取得に失敗しました:", error);
        // トークンが無効な場合は削除
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("login_id");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, isAdmin, loading };
}

