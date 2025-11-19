"use client"

import React from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ChevronRight } from "lucide-react"

type BreadcrumbItem = {
  label: string
  path?: string
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
}

export function Breadcrumb(props: BreadcrumbProps) {
  const { items } = props

  return (
    // ナビゲーション全体にブランドカラー（ダークトーン）を指定
    <nav className="flex items-center space-x-2 text-base mt-4 mb-4 text-[#006580]">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <React.Fragment key={index}>
            {item.path && !isLast ? (
              // リンクはミディアムトーンの色で表示し、ホバー時にライトトーンへ変化させる
              <Link
                to={item.path}
                className="text-[#0086A9] hover:text-[#1BA4C3] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              // 最後の要素はダークトーンで強調し、それ以外はミディアムトーンで統一
              <span className={isLast ? "text-[#006580] font-semibold" : "text-[#0086A9]"}>
                {item.label}
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
  )
}

