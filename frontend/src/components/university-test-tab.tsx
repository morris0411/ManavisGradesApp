"use client"

import React, { useMemo, useState } from "react"
import { normalizeSubjectName } from "../utils/subject-utils"
import { collectSubjectsWithCode, createSubjectCodeMap, getDefaultCheckedSubjects } from "../utils/exam-data-utils"
import { ExamChart } from "./shared/exam-chart"
import { ExamTables } from "./shared/exam-tables"

type UniversityTestTabProps = { exams?: Array<any> }

export function UniversityTestTab(props: UniversityTestTabProps) {
  const { exams = [] } = props
  const opExams = useMemo(() => {
    return (exams || []).filter((ex: any) => (ex.exam_type || "").includes("OP"))
  }, [exams])

  // その生徒が実際に受験した科目をすべて収集（科目コードでソート）
  const presentSubjectsWithCode = useMemo(() => {
    return collectSubjectsWithCode(opExams)
  }, [opExams])

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
    return opExams.map((ex: any) => {
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
  }, [opExams, visibleSubjects])

  const scoreRows = useMemo(() => {
    return opExams.map((ex: any) => {
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
  }, [opExams, presentSubjects])

  const [selectedExam, setSelectedExam] = useState<string>(() => (opExams.at(-1)?.exam_name || opExams[0]?.exam_name || ""))
  const selectedExamObj = opExams.find((ex: any) => ex.exam_name === selectedExam) || opExams[0]
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
        exams={opExams}
        selectedExam={selectedExam}
        onExamChange={setSelectedExam}
        currentJudgmentData={currentJudgmentData}
      />
    </div>
  )
}
