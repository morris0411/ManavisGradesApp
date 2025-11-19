"use client"

import React, { useMemo, useState } from "react"
import { normalizeSubjectName } from "../utils/subject-utils"
import { collectSubjectsWithCode, createSubjectCodeMap, getDefaultCheckedSubjects } from "../utils/exam-data-utils"
import { ExamChart } from "./shared/exam-chart"
import { ExamTables } from "./shared/exam-tables"

type High1High2TestTabProps = { exams?: Array<any> }

export function High1High2TestTab(props: High1High2TestTabProps) {
  const { exams = [] } = props
  const high1High2Exams = useMemo(() => {
    return (exams || []).filter((ex: any) => (ex.exam_type || "").includes("高1/高2"))
  }, [exams])

  // その生徒が実際に受験した科目をすべて収集（科目コードでソート）
  const presentSubjectsWithCode = useMemo(() => {
    return collectSubjectsWithCode(high1High2Exams)
  }, [high1High2Exams])

  const presentSubjects = useMemo(() => {
    return presentSubjectsWithCode.map(s => s.name)
  }, [presentSubjectsWithCode])

  // 科目名から科目コードへのマップ（presentSubjectsWithCodeから作成）
  const subjectCodeMapFromPresent = useMemo(() => {
    return createSubjectCodeMap(presentSubjectsWithCode)
  }, [presentSubjectsWithCode])

  // チェックボックスの状態管理（デフォルトで1000の位が7の科目のみチェック）
  const [checkedSubjects, setCheckedSubjects] = useState<Set<string>>(() => {
    return getDefaultCheckedSubjects(presentSubjectsWithCode)
  })

  // チェックされた科目のみ
  const visibleSubjects = useMemo(() => {
    return presentSubjects.filter(subj => checkedSubjects.has(subj))
  }, [presentSubjects, checkedSubjects])

  const chartData = useMemo(() => {
    return high1High2Exams.map((ex: any) => {
      const scores = Array.isArray(ex.scores) ? ex.scores : []
      const row: any = { name: ex.exam_name || "" }
      const devByCanon: Record<string, number | undefined> = {}
      for (const sc of scores) {
        const canon = normalizeSubjectName(sc.subject_name)
        if (!canon) continue
        if (typeof sc.deviation_value !== "undefined" && sc.deviation_value !== null) {
          const v = Number(sc.deviation_value)
          if (!Number.isNaN(v)) devByCanon[canon] = v
        }
      }
      // チェックされた科目のみを含める
      visibleSubjects.forEach((subj) => { row[subj] = devByCanon[subj] })
      return row
    })
  }, [high1High2Exams, visibleSubjects])

  const scoreRows = useMemo(() => {
    return high1High2Exams.map((ex: any) => {
      const row: any = {
        name: ex.exam_name || "",
        exam_year: ex.exam_year || null
      }
      const scoreByCanon: Record<string, string | number> = {}
      for (const sc of (ex.scores || [])) {
        const canon = normalizeSubjectName(sc.subject_name)
        if (!canon) continue
        if (typeof sc.score !== "undefined" && sc.score !== null) {
          scoreByCanon[canon] = sc.score
        }
      }
      presentSubjects.forEach((subj) => { row[subj] = scoreByCanon[subj] ?? "" })
      return row
    })
  }, [high1High2Exams, presentSubjects])

  const [selectedExam, setSelectedExam] = useState<string>(() => (high1High2Exams.at(-1)?.exam_name || high1High2Exams[0]?.exam_name || ""))
  const selectedExamObj = high1High2Exams.find((ex: any) => ex.exam_name === selectedExam) || high1High2Exams[0]
  const currentJudgmentData = useMemo(() => {
    const js = Array.isArray(selectedExamObj?.judgements) ? selectedExamObj.judgements : []
    const sorted = [...js].sort((a: any, b: any) => (a.preference_order || 999) - (b.preference_order || 999))
    return sorted.map((j: any, idx: number) => ({
      no: idx + 1,
      preference_order: j.preference_order || null,
      uni: j.university_name || "",
      dept: j.faculty_name || "",
      recruit: j.department_name || "",
      judgment: j.judgement || "",
      judgement_kyote: j.judgement_kyote || "",
      judgement_niji: j.judgement_niji || "",
      judgement_sougou: j.judgement_sougou || "",
    }))
  }, [selectedExamObj])

  const handleCheckboxChange = (subject: string, checked: boolean) => {
    const newChecked = new Set(checkedSubjects)
    if (checked) {
      newChecked.add(subject)
    } else {
      newChecked.delete(subject)
    }
    setCheckedSubjects(newChecked)
  }

  return (
    <div className="space-y-6">
      <ExamChart
        chartData={chartData}
        presentSubjects={presentSubjects}
        visibleSubjects={visibleSubjects}
        checkedSubjects={checkedSubjects}
        subjectCodeMapFromPresent={subjectCodeMapFromPresent}
        onCheckboxChange={handleCheckboxChange}
      />
      <ExamTables
        scoreRows={scoreRows}
        presentSubjects={presentSubjects}
        checkedSubjects={checkedSubjects}
        subjectCodeMapFromPresent={subjectCodeMapFromPresent}
        exams={high1High2Exams}
        selectedExam={selectedExam}
        onExamChange={setSelectedExam}
        currentJudgmentData={currentJudgmentData}
      />
    </div>
  )
}
