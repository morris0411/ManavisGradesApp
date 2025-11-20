"use client"

import React from "react"
import { Card, CardContent } from "./ui/card"

type HeaderProps = {
  studentId?: number | string
  name?: string
  nameKana?: string
  grade?: string
  schoolName?: string
  admissionDate?: string
  status?: string
  latestUniversity?: string
  latestFaculty?: string
  latestDepartment?: string
  latestJudgementKyote?: string
  latestJudgementNiji?: string
  latestJudgementSougou?: string
  latestExamName?: string
}

export function StudentPerformanceHeader(props: HeaderProps) {
  const {
    studentId,
    name,
    nameKana,
    grade,
    schoolName,
    admissionDate,
    status,
    latestUniversity,
    latestFaculty,
    latestDepartment,
    latestJudgementKyote,
    latestJudgementNiji,
    latestJudgementSougou,
    latestExamName,
  } = props

  const formatDateYmd = (val?: string) => {
    if (!val) return "-"
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}/${m}/${day}`
  }

  return (
    <header>
      <div className="w-full">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information Card */}
            <Card 
              className="lg:col-span-1 border"
              style={{ 
                backgroundColor: "#ffffff",
                borderColor: "#e5eef3",
                boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)"
              }}
            >
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div>
                    <p 
                      className="text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: "#0086A9" }}
                    >
                      学年
                    </p>
                    <p 
                      className="text-lg font-semibold"
                      style={{ color: "#333" }}
                    >
                      {grade ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p 
                      className="text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: "#0086A9" }}
                    >
                      高校名
                    </p>
                    <p 
                      className="text-lg font-semibold"
                      style={{ color: "#333" }}
                    >
                      {schoolName ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p 
                      className="text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: "#0086A9" }}
                    >
                      入会日
                    </p>
                    <p 
                      className="text-lg font-semibold"
                      style={{ color: "#333" }}
                    >
                      {formatDateYmd(admissionDate)}
                    </p>
                  </div>
                  <div>
                    <p 
                      className="text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: "#0086A9" }}
                    >
                      ステータス
                    </p>
                    <p 
                      className="text-lg font-semibold"
                      style={{ color: "#333" }}
                    >
                      {status ?? "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Latest Summary Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wish University Card */}
              <Card 
                className="border-none"
                style={{ 
                  background: "linear-gradient(135deg, #1BA4C3 0%, #0086A9 50%, #006580 100%)",
                  boxShadow: "0 4px 12px rgba(0, 101, 128, 0.2)"
                }}
              >
                <CardContent className="pt-2 pb-2">
                  <p 
                    className="text-lg font-semibold uppercase tracking-wider mb-4"
                    style={{ color: "rgba(255, 255, 255, 0.9)" }}
                  >
                    第一志望
                  </p>
                  <p 
                    className="text-4xl font-bold leading-tight mb-2"
                    style={{ color: "#ffffff" }}
                  >
                    {latestUniversity ?? "-"}
                  </p>
                  <p 
                    className="text-xl font-semibold opacity-90 mt-3"
                    style={{ color: "#ffffff" }}
                  >
                    {latestFaculty ?? "-"}
                  </p>
                  <p 
                    className="text-xl font-semibold opacity-90"
                    style={{ color: "#ffffff" }}
                  >
                    {latestDepartment ?? "-"}
                  </p>
                </CardContent>
              </Card>

              {/* Latest Judgment Card */}
              <Card 
                className="border"
                style={{ 
                  backgroundColor: "#ffffff",
                  borderColor: "#e5eef3",
                  boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)"
                }}
              >
                <CardContent className="pt-2 pb-2">
                  <p 
                    className="text-xm font-semibold uppercase tracking-wider mb-6"
                    style={{ 
                      background: "linear-gradient(135deg, #1BA4C3 0%, #0086A9 50%, #006580 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text"
                    }}
                  >
                    最新判定
                  </p>
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <p 
                        className="text-sm font-semibold mb-2"
                        style={{ color: "#666e7e" }}
                      >
                        共テ判定
                      </p>
                      <p 
                        className="text-4xl font-bold"
                        style={{ color: "#006580" }}
                      >
                        {latestJudgementKyote || "-"}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p 
                        className="text-sm font-semibold mb-2"
                        style={{ color: "#666e7e" }}
                      >
                        2次判定
                      </p>
                      <p 
                        className="text-4xl font-bold"
                        style={{ color: "#006580" }}
                      >
                        {latestJudgementNiji || "-"}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p 
                        className="text-sm font-semibold mb-2"
                        style={{ color: "#666e7e" }}
                      >
                        総合判定
                      </p>
                      <p 
                        className="text-4xl font-bold"
                        style={{ color: "#006580" }}
                      >
                        {latestJudgementSougou || "-"}
                      </p>
                    </div>
                  </div>
                  <p 
                    className="text-base font-medium mt-6 pt-4"
                    style={{ 
                      color: "#666e7e",
                      borderTop: "1px solid #e5eef3"
                    }}
                  >
                    {latestExamName ?? "-"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
