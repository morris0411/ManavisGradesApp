"use client"

import React, { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"

const commonTestJudgmentData = [
  { exam: "高2模試", judgment: 3 },
  { exam: "第1回", judgment: 3 },
  { exam: "第2回", judgment: 2 },
  { exam: "第3回", judgment: 2 },
]

const descriptiveJudgmentData = [
  { exam: "第1回", judgment: 3 },
  { exam: "第2回", judgment: 4 },
  { exam: "第3回", judgment: 4 },
]

const judgmentMapping: Record<number, string> = {
  1: "E",
  2: "D",
  3: "C",
  4: "B",
  5: "A",
}

function getJudgmentColor(judgment: string) {
  switch (judgment) {
    case "A":
      return "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
    case "B":
      return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100"
    case "C":
      return "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100"
    case "D":
      return "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100"
    case "E":
      return "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
    default:
      return "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
  }
}

export function UniversityJudgmentSection() {
  const [judgmentSource, setJudgmentSource] = useState<"common-test" | "descriptive">("descriptive")
  const chartData = judgmentSource === "common-test" ? commonTestJudgmentData : descriptiveJudgmentData

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">志望校判定</h2>

      {/* Primary University Judgment */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-blue-50 dark:bg-blue-950">
          <div className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">第一志望判定推移 - 早稲田大学 政治経済学部</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setJudgmentSource("common-test")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  judgmentSource === "common-test"
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                }`}
              >
                共通テスト模試
              </button>
              <button
                onClick={() => setJudgmentSource("descriptive")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  judgmentSource === "descriptive"
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                }`}
              >
                記述模試
              </button>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="exam" />
                <YAxis
                  domain={[0, 6]}
                  ticks={[1, 2, 3, 4, 5]}
                  tickFormatter={(val) => judgmentMapping[val as number] || ""}
                />
                <Tooltip formatter={(value) => judgmentMapping[value as number] || ""} />
                <Line type="monotone" dataKey="judgment" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground font-semibold mb-2">最新判定（{judgmentSource === "common-test" ? "共通テスト" : "記述"}模試）</p>
              <Badge className={`${getJudgmentColor(judgmentSource === "common-test" ? "C" : "B")} text-lg px-3 py-1`}>
                {judgmentSource === "common-test" ? "C" : "B"}判定
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
