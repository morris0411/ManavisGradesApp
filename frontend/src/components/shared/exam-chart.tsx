"use client"

import React, { useMemo, useState, useRef } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { assignSubjectColors } from "../../utils/subject-utils"
import { printToPDF } from "../../utils/pdf-utils"

type ExamChartProps = {
  chartData: Array<any>
  presentSubjects: string[]
  visibleSubjects: string[]
  checkedSubjects: Set<string>
  subjectCodeMapFromPresent: Map<string, number>
  onCheckboxChange: (subject: string, checked: boolean) => void
  title?: string
  yAxisDomain?: [number, number]
  showCard?: boolean
  isScoreRate?: boolean
  onSelectAll?: () => void
  onDeselectAll?: () => void
}

export function ExamChart({
  chartData,
  presentSubjects,
  visibleSubjects,
  checkedSubjects,
  subjectCodeMapFromPresent,
  onCheckboxChange,
  title = "教科別偏差値推移",
  yAxisDomain = [30, 80],
  showCard = true,
  isScoreRate = false,
  onSelectAll,
  onDeselectAll,
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

  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll()
    } else {
      // フォールバック: 各科目を個別に更新
      presentSubjects.forEach((subj) => {
        if (!checkedSubjects.has(subj)) {
          onCheckboxChange(subj, true)
        }
      })
    }
  }

  const handleDeselectAll = () => {
    if (onDeselectAll) {
      onDeselectAll()
    } else {
      // フォールバック: 各科目を個別に更新
      presentSubjects.forEach((subj) => {
        if (checkedSubjects.has(subj)) {
          onCheckboxChange(subj, false)
        }
      })
    }
  }

  const renderLegend = () => (
    <div
      style={{
        position: "absolute",
        transform: "translate(28%, -62%)",
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
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 8,
        }}
      >
        <button
          onClick={handleSelectAll}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            backgroundColor: "#1BA4C3",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#0086A9"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#1BA4C3"
          }}
        >
          すべて選択
        </button>
        <button
          onClick={handleDeselectAll}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            backgroundColor: "#ffffff",
            color: "#1BA4C3",
            border: "1px solid #1BA4C3",
            borderRadius: "4px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0f5f9"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff"
          }}
        >
          選択を解除
        </button>
      </div>
    </div>
  )

  const chartContent = (
    <>
      {showCard && (
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
            {title}
          </CardTitle>
          <div />
        </CardHeader>
      )}
      <CardContent className={showCard ? "pt-6" : "pt-0"}>
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
              domain={isScoreRate ? [0, 100] : yAxisDomain}
              ticks={isScoreRate ? [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] : (yAxisDomain[0] === 30 ? [30, 40, 50, 60, 70] : [300, 400, 500, 600, 700, 800, 900])}
              tick={{ 
                fill: "#666e7e",
                fontSize: 12
              }}
              stroke="#d0dce5"
              tickFormatter={isScoreRate ? (value: number) => `${value}%` : undefined}
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
              formatter={(value: any, name: string, props: any) => {
                if (isScoreRate) {
                  // 得点率モードの場合、「得点率（得点）」の形式で表示
                  const payload = props.payload || {}
                  const originalValue = payload[`${name}_original`]
                  if (originalValue !== undefined && originalValue !== null) {
                    return [`${Number(value).toFixed(1)}% (${originalValue})`, name]
                  }
                  return [`${Number(value).toFixed(1)}%`, name]
                }
                return [value, name]
              }}
            />
            <Legend verticalAlign="middle" align="right" layout="vertical" content={renderLegend as any} />
            {visibleSubjects.map((subj) => {
              const color = colorBySubject[subj] || "#9ca3af"
              const isChecked = checkedSubjects.has(subj)
              return (
                <Line
                  key={subj}
                  type="linear"
                  dataKey={subj}
                  stroke={color}
                  strokeWidth={2.5}
                  connectNulls
                  dot={isChecked ? { fill: color, r: 4, strokeWidth: 0 } : false}
                  activeDot={isChecked ? { r: 6, stroke: "#ffffff", strokeWidth: 2, fill: color } : false}
                  animationDuration={300}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </>
  )

  if (!showCard) {
    return chartContent
  }

  return (
    <Card 
      className="border"
      style={{ 
        backgroundColor: "#ffffff",
        borderColor: "#e5eef3",
        boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)"
      }}
    >
      {chartContent}
    </Card>
  )
}

type ExamChartWithTabsProps = {
  deviationChartData: Array<any>
  scoreChartData: Array<any>
  presentSubjects: string[]
  visibleSubjects: string[]
  checkedSubjects: Set<string>
  subjectCodeMapFromPresent: Map<string, number>
  onCheckboxChange: (subject: string, checked: boolean) => void
  isScoreRate?: boolean
  onSelectAll?: () => void
  onDeselectAll?: () => void
}

export function ExamChartWithTabs({
  deviationChartData,
  scoreChartData,
  presentSubjects,
  visibleSubjects,
  checkedSubjects,
  subjectCodeMapFromPresent,
  onCheckboxChange,
  isScoreRate = false,
  onSelectAll,
  onDeselectAll,
}: ExamChartWithTabsProps) {
  const [chartTab, setChartTab] = useState("deviation")
  const cardRef = useRef<HTMLDivElement>(null)
  const cardId = "exam-chart-card"

  const handlePrint = async () => {
    if (!cardRef.current) {
      alert('カード要素が見つかりません')
      return
    }
    
    try {
      // 要素に一意のIDを設定（PDF生成用）
      const uniqueId = `${cardId}-${Date.now()}`
      cardRef.current.id = uniqueId
      
      // 少し待ってからPDF生成（チャートのレンダリング完了を待つ）
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await printToPDF(uniqueId, `成績推移_${new Date().toISOString().split('T')[0]}.pdf`)
      
      // IDを削除
      cardRef.current.removeAttribute('id')
    } catch (error) {
      console.error('PDF印刷エラー:', error)
      alert(`PDFの生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div ref={cardRef}>
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
          成績推移
        </CardTitle>
        <button
          onClick={handlePrint}
          className="px-3 py-1.5 text-sm font-medium rounded-md transition hover:shadow-md"
          style={{
            backgroundColor: "#1BA4C3",
            color: "#ffffff",
            border: "none",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#0086A9"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#1BA4C3"
          }}
        >
          PDF印刷
        </button>
      </CardHeader>
      <Tabs value={chartTab} onValueChange={setChartTab} className="w-full">
        <div style={{ padding: "0px 16px 16px 16px" }}>
          <TabsList 
            className="grid w-full max-w-md grid-cols-2"
            style={{ 
              backgroundColor: "#f0f5f9",
              border: "1px solid #e5eef3"
            }}
          >
            <TabsTrigger 
              value="deviation"
              style={{
                color: chartTab === "deviation" ? "#006580" : "#666e7e"
              }}
            >
              偏差値
            </TabsTrigger>
            <TabsTrigger 
              value="score"
              style={{
                color: chartTab === "score" ? "#006580" : "#666e7e"
              }}
            >
              {isScoreRate ? "得点率" : "得点"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="deviation" className="mt-0">
          <ExamChart
            chartData={deviationChartData}
            presentSubjects={presentSubjects}
            visibleSubjects={visibleSubjects}
            checkedSubjects={checkedSubjects}
            subjectCodeMapFromPresent={subjectCodeMapFromPresent}
            onCheckboxChange={onCheckboxChange}
            title="教科別偏差値推移"
            yAxisDomain={[30, 70]}
            showCard={false}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
          />
        </TabsContent>

        <TabsContent value="score" className="mt-0">
          <ExamChart
            chartData={scoreChartData}
            presentSubjects={presentSubjects}
            visibleSubjects={visibleSubjects}
            checkedSubjects={checkedSubjects}
            subjectCodeMapFromPresent={subjectCodeMapFromPresent}
            onCheckboxChange={onCheckboxChange}
            title={isScoreRate ? "教科別得点率推移" : "教科別得点推移"}
            yAxisDomain={isScoreRate ? [0, 100] : [300, 900]}
            showCard={false}
            isScoreRate={isScoreRate}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
          />
        </TabsContent>
      </Tabs>
    </Card>
    </div>
  )
}

