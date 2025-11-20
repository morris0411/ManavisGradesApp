"use client"

import React, { useMemo, useState } from "react"
import { normalizeSubjectName } from "../utils/subject-utils"
import { collectSubjectsWithCode, createSubjectCodeMap, getDefaultCheckedSubjects } from "../utils/exam-data-utils"
import { ExamChartWithTabs } from "./shared/exam-chart"
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

  // 非表示にする科目コード
  const hiddenSubjectCodes = new Set([2580, 2920, 2930, 3120, 3220, 3320, 3210, 3110])

  const presentSubjects = useMemo(() => {
    return presentSubjectsWithCode
      .filter(s => !hiddenSubjectCodes.has(s.code))
      .map(s => s.name)
  }, [presentSubjectsWithCode])

  // 科目名から科目コードへのマップ（フィルタリング後の科目のみ）
  const subjectCodeMapFromPresent = useMemo(() => {
    const filtered = presentSubjectsWithCode.filter(s => !hiddenSubjectCodes.has(s.code))
    return createSubjectCodeMap(filtered)
  }, [presentSubjectsWithCode])

  // チェックボックスの状態管理（デフォルトで1000の位が7の科目のみチェック）
  const [checkedSubjects, setCheckedSubjects] = useState<Set<string>>(() => {
    const filtered = presentSubjectsWithCode.filter(s => !hiddenSubjectCodes.has(s.code))
    return getDefaultCheckedSubjects(filtered)
  })

  // チェックされた科目のみ
  const visibleSubjects = useMemo(() => {
    return presentSubjects.filter(subj => checkedSubjects.has(subj))
  }, [presentSubjects, checkedSubjects])

  // 偏差値推移用のデータ
  const deviationChartData = useMemo(() => {
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

  // 得点推移用のデータ
  const scoreChartData = useMemo(() => {
    return opExams.map((ex: any) => {
      const scores = Array.isArray(ex.scores) ? ex.scores : []
      const row: any = { name: ex.exam_name || "" }
      const scoreByCanon: Record<string, number | undefined> = {}
      for (const sc of scores) {
        const canon = normalizeSubjectName(sc.subject_name)
        if (!canon) continue
        if (typeof sc.score !== "undefined" && sc.score !== null) {
          const v = Number(sc.score)
          if (!Number.isNaN(v)) scoreByCanon[canon] = v
        }
      }
      // チェックされた科目のみを含める
      visibleSubjects.forEach((subj) => { row[subj] = scoreByCanon[subj] })
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

  const handleSelectAll = () => {
    const newChecked = new Set(presentSubjects)
    setCheckedSubjects(newChecked)
  }

  const handleDeselectAll = () => {
    setCheckedSubjects(new Set())
  }

  return (
    <div className="space-y-6">
      <ExamChartWithTabs
        deviationChartData={deviationChartData}
        scoreChartData={scoreChartData}
        presentSubjects={presentSubjects}
        visibleSubjects={visibleSubjects}
        checkedSubjects={checkedSubjects}
        subjectCodeMapFromPresent={subjectCodeMapFromPresent}
        onCheckboxChange={handleCheckboxChange}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
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
