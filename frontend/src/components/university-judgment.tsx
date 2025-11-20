"use client"

import React, { useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { getJudgmentColor } from "../utils/subject-utils"
import { printToPDF } from "../utils/pdf-utils"

type UniversityJudgmentSectionProps = {
  exams?: Array<any>
}

// 模試名を短縮する関数
function shortenExamName(examName: string): string {
  if (!examName) return ""
  
  // "第1回全統記述模試" => "第1回"
  const match1 = examName.match(/第(\d+)回/)
  if (match1) {
    return `第${match1[1]}回`
  }
  
  // "全統記述高2模試" => "高2"
  const match2 = examName.match(/高([12])/)
  if (match2) {
    return `高${match2[1]}`
  }
  
  // その他のパターンは元の名前を返す
  return examName
}

export function UniversityJudgmentSection({ exams = [] }: UniversityJudgmentSectionProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  // 最新の模試で第1志望とした大学、学部、募集区分名を取得
  const firstPreferenceInfo = useMemo(() => {
    if (exams.length === 0) return null
    
    const latestExam = exams[exams.length - 1]
    const judgements = Array.isArray(latestExam?.judgements) ? latestExam.judgements : []
    const firstPreference = judgements.find((j: any) => j && j.preference_order === 1) || judgements[0]
    
    if (!firstPreference) return null
    
    return {
      university_name: firstPreference.university_name || "",
      faculty_name: firstPreference.faculty_name || "",
      department_name: firstPreference.department_name || "",
    }
  }, [exams])

  // 同じ大学、学部、募集区分名を第1志望とした模試のみを抽出
  const filteredExams = useMemo(() => {
    if (!firstPreferenceInfo) return []
    
    return exams.filter((exam: any) => {
      const judgements = Array.isArray(exam?.judgements) ? exam.judgements : []
      const firstPref = judgements.find((j: any) => j && j.preference_order === 1)
      
      if (!firstPref) return false
      
      return (
        firstPref.university_name === firstPreferenceInfo.university_name &&
        firstPref.faculty_name === firstPreferenceInfo.faculty_name &&
        firstPref.department_name === firstPreferenceInfo.department_name
      )
    })
  }, [exams, firstPreferenceInfo])

  // 模試タイプごとにグループ化
  const examsByType = useMemo(() => {
    const grouped: Record<string, Array<any>> = {
      "共テ": [],
      "記述": [],
      "高1/高2": [],
      "オープン": [],
    }
    
    filteredExams.forEach((exam: any) => {
      const examType = exam.exam_type || ""
      
      if (examType.includes("共")) {
        grouped["共テ"].push(exam)
      } else if (examType.includes("記述")) {
        grouped["記述"].push(exam)
      } else if (examType.includes("高1/高2") || examType.includes("高1") || examType.includes("高2")) {
        grouped["高1/高2"].push(exam)
      } else if (examType.includes("OP") || examType.includes("オープン")) {
        grouped["オープン"].push(exam)
      }
    })
    
    return grouped
  }, [filteredExams])

  // タイトル用の文字列
  const titleText = useMemo(() => {
    if (!firstPreferenceInfo) return ""
    const parts = [
      firstPreferenceInfo.university_name,
      firstPreferenceInfo.faculty_name,
      firstPreferenceInfo.department_name,
    ].filter(Boolean)
    return parts.join(" ")
  }, [firstPreferenceInfo])

  if (!firstPreferenceInfo || filteredExams.length === 0) {
    return (
      <div className="space-y-6">
        <h2 
          className="text-3xl font-bold"
          style={{
            background: "linear-gradient(135deg, #1BA4C3 0%, #0086A9 50%, #006580 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}
        >
          第一志望大学判定推移
        </h2>
        <Card 
          className="border"
          style={{ 
            backgroundColor: "#ffffff",
            borderColor: "#e5eef3",
            boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)"
          }}
        >
          <CardContent className="pt-6">
            <p style={{ color: "#666e7e" }}>データがありません</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 
        className="text-3xl font-bold"
        style={{
          background: "linear-gradient(135deg, #1BA4C3 0%, #0086A9 50%, #006580 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}
      >
        第１志望判定推移
      </h2>

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
            第１志望：{titleText}
          </CardTitle>
          <button
            onClick={async () => {
              if (!cardRef.current) {
                alert('カード要素が見つかりません')
                return
              }
              
              try {
                const baseCardId = "university-judgment-card"
                const uniqueId = `${baseCardId}-${Date.now()}`
                cardRef.current.id = uniqueId
                
                // 少し待ってからPDF生成
                await new Promise(resolve => setTimeout(resolve, 500))
                
                await printToPDF(uniqueId, `第一志望判定推移_${new Date().toISOString().split('T')[0]}.pdf`)
                
                cardRef.current.removeAttribute('id')
              } catch (error) {
                console.error('PDF印刷エラー:', error)
                alert(`PDFの生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
              }
            }}
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
        <CardContent className="px-6">
          <div className="space-y-8">
            {(["共テ", "記述", "高1/高2", "オープン"] as const).map((type) => {
              const typeExams = examsByType[type]
              if (typeExams.length === 0) return null

              // 各模試の第1志望判定を取得
              const examData = typeExams.map((exam: any) => {
                const judgements = Array.isArray(exam?.judgements) ? exam.judgements : []
                const firstPref = judgements.find((j: any) => j && j.preference_order === 1)
                return {
                  examName: shortenExamName(exam.exam_name || ""),
                  judgement_kyote: firstPref?.judgement_kyote || "",
                  judgement_niji: firstPref?.judgement_niji || "",
                }
              })

              return (
                <div key={type} className="space-y-4 px-6">
                  <h3 
                    className="text-lg font-semibold px-0"
                    style={{ color: "#006580" }}
                  >
                    {type}
                  </h3>
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
                              whiteSpace: "nowrap",
                              borderRight: "1px solid #d0dce5"
                            }}
                          >
                            判定種別
                          </th>
                          {examData.map((exam, idx) => (
                            <th 
                              key={idx}
                              className="text-center py-3 px-6 font-semibold text-xm"
                              style={{ 
                                color: "#006580",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {exam.examName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {type === "共テ" && (
                          <tr style={{
                            backgroundColor: "#ffffff",
                            borderBottom: "1px solid #e5eef3"
                          }}>
                            <td 
                              className="text-center py-3 px-6 text-xm font-semibold"
                              style={{ 
                                color: "#333",
                                borderRight: "1px solid #d0dce5",
                                backgroundColor: "#f0f5f9"
                              }}
                            >
                              共テ
                            </td>
                            {examData.map((exam, idx) => {
                              const colorClass = exam.judgement_kyote ? getJudgmentColor(exam.judgement_kyote) : ""
                              return (
                                <td 
                                  key={idx}
                                  className={`text-center py-3 px-6 text-xm font-semibold ${colorClass}`}
                                  style={{
                                    color: exam.judgement_kyote ? "#333" : "#666e7e"
                                  }}
                                >
                                  {exam.judgement_kyote || "-"}
                                </td>
                              )
                            })}
                          </tr>
                        )}
                        <tr style={{
                          backgroundColor: type === "共テ" ? "#f8fafb" : "#ffffff",
                          borderBottom: "1px solid #e5eef3"
                        }}>
                          <td 
                            className="text-center py-3 px-6 text-xm font-semibold"
                            style={{ 
                              color: "#333",
                              borderRight: "1px solid #d0dce5",
                              backgroundColor: "#f0f5f9"
                            }}
                          >
                            2次
                          </td>
                          {examData.map((exam, idx) => {
                            const colorClass = exam.judgement_niji ? getJudgmentColor(exam.judgement_niji) : ""
                            return (
                              <td 
                                key={idx}
                                className={`text-center py-3 px-6 text-xm font-semibold ${colorClass}`}
                                style={{
                                  color: exam.judgement_niji ? "#333" : "#666e7e"
                                }}
                              >
                                {exam.judgement_niji || "-"}
                              </td>
                            )
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
