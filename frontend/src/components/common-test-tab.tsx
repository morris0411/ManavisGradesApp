"use client"

import React, { useMemo, useState } from "react"
import { normalizeSubjectName, getFullScoreForCommonTest } from "../utils/subject-utils"
import { collectSubjectsWithCode, createSubjectCodeMap, getDefaultCheckedSubjects } from "../utils/exam-data-utils"
import { ExamChartWithTabs } from "./shared/exam-chart"
import { ExamTables } from "./shared/exam-tables"

type CommonTestTabProps = { exams?: Array<any> }

export function CommonTestTab(props: CommonTestTabProps) {
  const { exams = [] } = props
  const kyoteExams = useMemo(() => {
    return (exams || []).filter((ex: any) => (ex.exam_type || "").includes("共"))
  }, [exams])

  // その生徒が実際に受験した科目をすべて収集（科目コードでソート）
  const presentSubjectsWithCode = useMemo(() => {
    return collectSubjectsWithCode(kyoteExams)
  }, [kyoteExams])

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
    return kyoteExams.map((ex: any) => {
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
  }, [kyoteExams, visibleSubjects])

  // 得点推移用のデータ（得点率に変換）
  const scoreChartData = useMemo(() => {
    return kyoteExams.map((ex: any) => {
      const scores = Array.isArray(ex.scores) ? ex.scores : []
      const row: any = { name: ex.exam_name || "" }
      const scoreByCanon: Record<string, number | undefined> = {}
      const originalScoreByCanon: Record<string, number | undefined> = {}
      
      for (const sc of scores) {
        const canon = normalizeSubjectName(sc.subject_name)
        if (!canon) continue
        if (typeof sc.score !== "undefined" && sc.score !== null) {
          const v = Number(sc.score)
          if (!Number.isNaN(v)) {
            originalScoreByCanon[canon] = v
            // 得点率を計算
            const code = subjectCodeMapFromPresent.get(canon) ?? 999999
            const fullScore = getFullScoreForCommonTest(code, presentSubjects, subjectCodeMapFromPresent)
            if (fullScore > 0) {
              scoreByCanon[canon] = (v / fullScore) * 100
            }
          }
        }
      }
      // チェックされた科目のみを含める（得点率）
      visibleSubjects.forEach((subj) => { 
        row[subj] = scoreByCanon[subj]
        // 元の得点も保存（ツールチップ用）
        row[`${subj}_original`] = originalScoreByCanon[subj]
      })
      return row
    })
  }, [kyoteExams, visibleSubjects, subjectCodeMapFromPresent])

  const scoreRows = useMemo(() => {
    return kyoteExams.map((ex: any) => {
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
  }, [kyoteExams, presentSubjects])

  const [selectedExam, setSelectedExam] = useState<string>(() => (kyoteExams.at(-1)?.exam_name || kyoteExams[0]?.exam_name || ""))
  const selectedExamObj = kyoteExams.find((ex: any) => ex.exam_name === selectedExam) || kyoteExams[0]
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
        isScoreRate={true}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />

      <ExamTables
        scoreRows={scoreRows}
        presentSubjects={presentSubjects}
        checkedSubjects={checkedSubjects}
        subjectCodeMapFromPresent={subjectCodeMapFromPresent}
        exams={kyoteExams}
        selectedExam={selectedExam}
        onExamChange={setSelectedExam}
        currentJudgmentData={currentJudgmentData}
      />
    </div>
  )
}
