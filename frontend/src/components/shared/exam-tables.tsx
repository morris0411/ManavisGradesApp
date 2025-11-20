"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { assignSubjectColors, getJudgmentColor } from "../../utils/subject-utils"

type ScoreRow = {
  name: string
  exam_year: number | null
  [key: string]: any
}

type JudgmentData = {
  no: number
  preference_order: number | null
  uni: string
  dept: string
  recruit: string
  judgment: string
  judgement_kyote: string
  judgement_niji: string
  judgement_sougou: string
}

type ExamTablesProps = {
  scoreRows: ScoreRow[]
  presentSubjects: string[]
  checkedSubjects: Set<string>
  subjectCodeMapFromPresent: Map<string, number>
  exams: Array<any>
  selectedExam: string
  onExamChange: (examName: string) => void
  currentJudgmentData: JudgmentData[]
}

export function ExamTables({
  scoreRows,
  presentSubjects,
  checkedSubjects,
  subjectCodeMapFromPresent,
  exams,
  selectedExam,
  onExamChange,
  currentJudgmentData,
}: ExamTablesProps) {
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

  return (
    <>
      <Card
        className="border"
        style={{ 
          backgroundColor: "#ffffff",
          borderColor: "#e5eef3",
          boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)"
        }}
      >
        <CardHeader
          style={{ borderBottom: "1px solid #e5eef3" }}
        >
          <CardTitle 
            className="text-xl font-bold pb-2"
            style={{ 
              background: "linear-gradient(135deg, #1BA4C3 0%, #0086A9 50%, #006580 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            教科別得点
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ 
                  backgroundColor: "#f0f5f9",
                  borderBottom: "2px solid #d0dce5"
                }}>
                  <th 
                    className="text-center py-3 px-6 font-semibold text-xs"
                    style={{ 
                      color: "#006580",
                      writingMode: "horizontal-tb",
                      textOrientation: "mixed",
                      whiteSpace: "nowrap"
                    }}
                  >
                    年度
                  </th>
                  <th 
                    className="text-left py-3 px-6 font-semibold text-xs"
                    style={{ 
                      color: "#006580",
                      writingMode: "horizontal-tb",
                      textOrientation: "mixed",
                      whiteSpace: "nowrap"
                    }}
                  >
                    模試名
                  </th>
                  {presentSubjects.map((subj) => {
                    const isChecked = checkedSubjects.has(subj)
                    const bgColor = isChecked ? colorMap.get(subj) : undefined
                    return (
                      <th 
                        key={subj} 
                        className="text-center py-3 px-6 font-semibold text-xs"
                        style={{
                          backgroundColor: bgColor ? `${bgColor}40` : undefined,
                          color: "#006580",
                          writingMode: "horizontal-tb",
                          textOrientation: "mixed",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {subj}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {scoreRows.map((row, idx) => {
                  return (
                    <tr 
                      key={idx} 
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafb",
                        borderBottom: "1px solid #e5eef3"
                      }}
                      className="hover:bg-blue-50 transition"
                    >
                      <td 
                        className="text-center py-3 px-6 text-xs"
                        style={{ 
                          color: "#333",
                          writingMode: "horizontal-tb",
                          textOrientation: "mixed",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {row.exam_year || "-"}
                      </td>
                      <td 
                        className="py-3 px-6 text-xs"
                        style={{ 
                          color: "#333",
                          writingMode: "horizontal-tb",
                          textOrientation: "mixed",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {row.name}
                      </td>
                      {presentSubjects.map((subj) => {
                        const isChecked = checkedSubjects.has(subj)
                        const bgColor = isChecked ? colorMap.get(subj) : undefined
                        return (
                          <td 
                            key={subj} 
                            className="text-center py-3 px-6"
                            style={{
                              backgroundColor: bgColor ? `${bgColor}40` : undefined,
                              color: "#333",
                              fontWeight: isChecked ? "bold" : "normal",
                              writingMode: "horizontal-tb",
                              textOrientation: "mixed",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {row[subj] ?? ""}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card
        className="border mt-6"
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
            志望校判定一覧
          </CardTitle>
          <Select value={selectedExam} onValueChange={onExamChange}>
            <SelectTrigger 
              className="w-51"
              style={{
                borderColor: "#d0dce5"
              }}
            >
              <SelectValue placeholder="模試を選択" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((ex: any) => {
                const val = ex.exam_name || ""
                return (
                  <SelectItem key={val} value={val}>
                    {val}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ 
                  backgroundColor: "#f0f5f9",
                  borderBottom: "2px solid #d0dce5"
                }}>
                  <th 
                    className="text-center py-3 px-6 font-semibold text-xm"
                    style={{ 
                      color: "#006580",
                      writingMode: "horizontal-tb",
                      textOrientation: "mixed",
                      whiteSpace: "nowrap"
                    }}
                  >
                    志望順位
                  </th>
                  <th 
                    className="text-left py-3 px-6 font-semibold text-xm"
                    style={{ 
                      color: "#006580",
                      writingMode: "horizontal-tb",
                      textOrientation: "mixed",
                      whiteSpace: "nowrap"
                    }}
                  >
                    大学名
                  </th>
                  <th 
                    className="text-left py-3 px-6 font-semibold text-xm"
                    style={{ 
                      color: "#006580",
                      writingMode: "horizontal-tb",
                      textOrientation: "mixed",
                      whiteSpace: "nowrap"
                    }}
                  >
                    学部
                  </th>
                  <th 
                    className="text-left py-3 px-6 font-semibold text-xm"
                    style={{ 
                      color: "#006580",
                      writingMode: "horizontal-tb",
                      textOrientation: "mixed",
                      whiteSpace: "nowrap"
                    }}
                  >
                    募集区分
                  </th>
                  <th 
                    className="text-center py-3 px-6 font-semibold text-xm"
                    style={{ 
                      color: "#006580",
                      writingMode: "horizontal-tb",
                      textOrientation: "mixed",
                      whiteSpace: "nowrap"
                    }}
                  >
                    共テ判定
                  </th>
                  <th 
                    className="text-center py-3 px-6 font-semibold text-xm"
                    style={{ 
                      color: "#006580",
                      writingMode: "horizontal-tb",
                      textOrientation: "mixed",
                      whiteSpace: "nowrap"
                    }}
                  >
                    2次判定
                  </th>
                  <th 
                    className="text-center py-3 px-6 font-semibold text-xm"
                    style={{ 
                      color: "#006580",
                      writingMode: "horizontal-tb",
                      textOrientation: "mixed",
                      whiteSpace: "nowrap"
                    }}
                  >
                    総合判定
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentJudgmentData.map((item, idx) => (
                  <tr 
                    key={item.no}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafb",
                      borderBottom: "1px solid #e5eef3"
                    }}
                    className="hover:bg-blue-50 transition"
                  >
                    <td 
                      className="text-center py-3 px-6 text-xm"
                      style={{ 
                        color: "#333",
                        writingMode: "horizontal-tb",
                        textOrientation: "mixed",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.preference_order ? `${item.preference_order}` : "-"}
                    </td>
                    <td 
                      className="py-3 px-6 font-semibold text-xm"
                      style={{ 
                        color: "#333",
                        writingMode: "horizontal-tb",
                        textOrientation: "mixed",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.uni}
                    </td>
                    <td 
                      className="py-3 px-6 text-xm"
                      style={{ 
                        color: "#333",
                        writingMode: "horizontal-tb",
                        textOrientation: "mixed",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.dept}
                    </td>
                    <td 
                      className="py-3 px-6 text-xm"
                      style={{ 
                        color: "#333",
                        writingMode: "horizontal-tb",
                        textOrientation: "mixed",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.recruit}
                    </td>
                    <td 
                      className="text-center py-3 px-6"
                      style={{
                        writingMode: "horizontal-tb",
                        textOrientation: "mixed",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.judgement_kyote ? (
                        <Badge className={`${getJudgmentColor(item.judgement_kyote)} text-xm hover:!bg-opacity-100 hover:!bg-[inherit]`} style={{ pointerEvents: "none" }}>{item.judgement_kyote}</Badge>
                      ) : (
                        <span style={{ color: "#666e7e" }}>-</span>
                      )}
                    </td>
                    <td 
                      className="text-center py-3 px-6"
                      style={{
                        writingMode: "horizontal-tb",
                        textOrientation: "mixed",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.judgement_niji ? (
                        <Badge className={`${getJudgmentColor(item.judgement_niji)} text-xm hover:!bg-opacity-100 hover:!bg-[inherit]`} style={{ pointerEvents: "none" }}>{item.judgement_niji}</Badge>
                      ) : (
                        <span style={{ color: "#666e7e" }}>-</span>
                      )}
                    </td>
                    <td 
                      className="text-center py-3 px-6"
                      style={{
                        writingMode: "horizontal-tb",
                        textOrientation: "mixed",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.judgement_sougou ? (
                        <Badge className={`${getJudgmentColor(item.judgement_sougou)} text-xm hover:!bg-opacity-100 hover:!bg-[inherit]`} style={{ pointerEvents: "none" }}>{item.judgement_sougou}</Badge>
                      ) : (
                        <span style={{ color: "#666e7e" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

