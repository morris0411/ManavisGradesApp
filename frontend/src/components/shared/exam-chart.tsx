"use client"

import React, { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { assignSubjectColors } from "../../utils/subject-utils"

type ExamChartProps = {
  chartData: Array<any>
  presentSubjects: string[]
  visibleSubjects: string[]
  checkedSubjects: Set<string>
  subjectCodeMapFromPresent: Map<string, number>
  onCheckboxChange: (subject: string, checked: boolean) => void
}

export function ExamChart({
  chartData,
  presentSubjects,
  visibleSubjects,
  checkedSubjects,
  subjectCodeMapFromPresent,
  onCheckboxChange,
}: ExamChartProps) {
  // 科目コード順にソートされた科目リストを作成
  const subjectsWithCode = useMemo(() => {
    return presentSubjects
      .map((name) => ({
        name,
        code: subjectCodeMapFromPresent.get(name) ?? 999999,
      }))
      .sort((a, b) => a.code - b.code)
  }, [presentSubjects, subjectCodeMapFromPresent])

  // 同じ系統内で科目コードが低い順に彩度が高い色を割り当て
  const colorMap = useMemo(() => {
    return assignSubjectColors(subjectsWithCode)
  }, [subjectsWithCode])

  const colorBySubject: Record<string, string> = {}
  presentSubjects.forEach((s) => {
    colorBySubject[s] = colorMap.get(s) || "#9ca3af"
  })

  const renderLegend = () => (
    <div
      style={{
        position: "absolute",
        transform: "translate(40%, -60%)",
        pointerEvents: "auto",
      }}
    >
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          width: "max-content",
          whiteSpace: "nowrap",
        }}
      >
        {presentSubjects.map((subj) => {
          const isChecked = checkedSubjects.has(subj)
          const code = subjectCodeMapFromPresent.get(subj) ?? 999999
          return (
            <li
              key={subj}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onCheckboxChange(subj, e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  cursor: "pointer",
                  accentColor: "#1BA4C3",
                  borderColor: "#1BA4C3"
                }}
              />
              <span
                style={{
                  width: 14,
                  height: 4,
                  background: colorBySubject[subj],
                  display: "inline-block",
                  flex: "0 0 auto",
                  borderRadius: "2px"
                }}
              />
              <span 
                style={{ 
                  fontSize: 14, 
                  whiteSpace: "nowrap",
                  color: "#333"
                }}
              >
                {subj}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <Card 
      className="border"
      style={{ 
        backgroundColor: "#ffffff",
        borderColor: "#e5eef3",
        boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)"
      }}
    >
      <CardHeader 
        className="flex flex-row items-center justify-between space-y-0 pb-4"
        style={{ borderBottom: "1px solid #e5eef3" }}
      >
        <CardTitle 
          className="text-xl font-bold"
          style={{ 
            background: "linear-gradient(135deg, #1BA4C3 0%, #0086A9 50%, #006580 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}
        >
          教科別偏差値推移
        </CardTitle>
        <div />
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 10, right: 240, bottom: 30, left: 50 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5eef3"
            />
            <XAxis
              dataKey="name"
              interval={0}
              angle={0}
              tick={{ 
                textAnchor: "middle", 
                dy: 10,
                fill: "#666e7e",
                fontSize: 14
              }}
              stroke="#d0dce5"
            />
            <YAxis 
              domain={[35, 75]}
              tick={{ 
                fill: "#666e7e",
                fontSize: 12
              }}
              stroke="#d0dce5"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5eef3",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0, 101, 128, 0.1)"
              }}
              itemStyle={{
                color: "#333"
              }}
              labelStyle={{
                color: "#006580",
                fontWeight: "bold"
              }}
              itemSorter={(item: any) => {
                // 科目コードの昇順でソート
                const code = subjectCodeMapFromPresent.get(item.name) ?? 999999
                return code
              }}
            />
            <Legend verticalAlign="middle" align="right" layout="vertical" content={renderLegend as any} />
            {visibleSubjects.map((subj) => {
              const color = colorBySubject[subj] || "#9ca3af"
              return (
                <Line
                  key={subj}
                  type="linear"
                  dataKey={subj}
                  stroke={color}
                  strokeWidth={2.5}
                  connectNulls
                  dot={false}
                  animationDuration={300}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

