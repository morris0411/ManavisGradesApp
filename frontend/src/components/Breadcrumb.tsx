"use client"

import React from "react"
import { Link, useLocation, useParams, useNavigate } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import logoutIcon from "../assets/logout-icon.svg"
import homeIcon from "../assets/home-icon.svg"

type BreadcrumbItem = {
  label: string
  path?: string
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
}

export function Breadcrumb(props: BreadcrumbProps) {
  const { items } = props
  const navigate = useNavigate()
  const loginId = localStorage.getItem("login_id") || "ゲスト"

  const handleLogout = () => {
    try {
      // トークンとユーザー情報を削除
      localStorage.removeItem("access_token")
      localStorage.removeItem("user_id")
      localStorage.removeItem("login_id")
      // ログインページにリダイレクト
      navigate("/login")
    } catch (error) {
      console.error("ログアウト処理中にエラーが発生しました:", error)
      // エラーが発生してもログインページにリダイレクト
      navigate("/login")
    }
  }

  return (
    <div className="flex items-center justify-between mt-4 mb-4">
      {/* ナビゲーション全体にブランドカラー（ダークトーン）を指定 */}
      <nav className="flex items-center space-x-2 text-base text-[#006580]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isHome = item.label === "ホーム"
          
          return (
            <React.Fragment key={index}>
              {item.path && !isLast ? (
                // リンクはミディアムトーンの色で表示し、ホバー時にライトトーンへ変化させる
                <Link
                  to={item.path}
                  className="flex items-center text-[#0086A9] hover:text-[#1BA4C3] transition-colors"
                >
                  {isHome ? (
                    <img 
                      src={homeIcon as string} 
                      alt="ホーム" 
                      className="w-5 h-5]"
                      style={{ filter: "none", objectFit: "contain", display: "block" }}
                    />
                  ) : (
                    item.label
                  )}
                </Link>
              ) : (
                // 最後の要素はダークトーンで強調し、それ以外はミディアムトーンで統一
                <span className={`flex items-center ${isLast ? "text-[#006580] font-semibold" : "text-[#0086A9]"}`}>
                  {isHome ? (
                    <img 
                      src={homeIcon as string} 
                      alt="ホーム" 
                      className="w-5 h-5"
                      style={{ filter: "none", objectFit: "contain", display: "block" }}
                    />
                  ) : (
                    item.label
                  )}
                </span>
              )}
              {/* アイコンもミディアムトーンに統一 */}
              {!isLast && (
                <ChevronRight className="h-4 w-4 text-[#0086A9]" />
              )}
            </React.Fragment>
          )
        })}
      </nav>
      {/* ユーザー情報表示とログアウトボタン */}
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <span className="text-xl font-medium" style={{ color: "#006580" }}>
            {loginId}
          </span>
          <span className="ml-1">&nbsp;さんの管理画面</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-2 rounded-md transition-colors hover:bg-gray-100"
          style={{ color: "#006580" }}
          title="ログアウト"
        >
          <img 
            src={logoutIcon as string} 
            alt="ログアウト" 
            className="w-6 h-6"
            style={{ filter: "none" }}
          />
        </button>
      </div>
    </div>
  )
}

