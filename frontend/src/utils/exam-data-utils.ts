import { normalizeSubjectName } from "./subject-utils"

export type SubjectWithCode = {
  name: string
  code: number
}

// その生徒が実際に受験した科目をすべて収集（科目コードでソート）
// 1000の位が8と9の科目は除外
export function collectSubjectsWithCode(exams: Array<any>): SubjectWithCode[] {
  const subjectMap = new Map<string, { name: string; code: number }>()
  for (const ex of exams) {
    const scores = Array.isArray(ex.scores) ? ex.scores : []
    for (const sc of scores) {
      const canon = normalizeSubjectName(sc.subject_name)
      if (canon) {
        // subject_codeを確実に取得（バックエンドから返されるsubject_codeを使用）
        let code = 999999 // デフォルト値（科目コードがない場合）
        const rawCode = sc.subject_code
        if (rawCode != null && rawCode !== undefined && rawCode !== "") {
          const parsedCode = typeof rawCode === 'number' ? rawCode : Number(rawCode)
          if (!Number.isNaN(parsedCode) && parsedCode > 0) {
            code = parsedCode
          }
        }
        // 1000の位が8と9の科目は除外
        const thousandsDigit = Math.floor(code / 1000)
        if (thousandsDigit === 8 || thousandsDigit === 9) {
          continue
        }
        // 既に存在する場合は、科目コードが有効な場合（999999でない場合）のみ更新
        // これにより、正しい科目コードが優先される
        if (!subjectMap.has(canon)) {
          subjectMap.set(canon, { name: canon, code })
        } else {
          const existing = subjectMap.get(canon)!
          // 既存のコードがデフォルト値（999999）で、新しいコードが有効な場合は更新
          if (existing.code === 999999 && code !== 999999) {
            subjectMap.set(canon, { name: canon, code })
          }
          // 既存のコードも新しいコードも有効な場合は、小さい方を優先
          // これにより、正しい科目コード（小さい方）が確実に使用される
          else if (existing.code !== 999999 && code !== 999999) {
            if (existing.code > code) {
              subjectMap.set(canon, { name: canon, code })
            }
            // existing.code <= code の場合は既存のまま（既に正しいコードが設定されている）
          }
          // 既存のコードが有効で新しいコードが無効（999999）の場合は、既存のまま
        }
      }
    }
  }
  // 科目コードの昇順でソート（確実に数値として比較）
  const sorted = Array.from(subjectMap.values()).sort((a, b) => {
    const codeA = Number(a.code)
    const codeB = Number(b.code)
    if (Number.isNaN(codeA) || Number.isNaN(codeB)) {
      return 0
    }
    return codeA - codeB
  })
  return sorted
}

// 科目名から科目コードへのマップを作成
export function createSubjectCodeMap(subjectsWithCode: SubjectWithCode[]): Map<string, number> {
  const codeMap = new Map<string, number>()
  subjectsWithCode.forEach(({ name, code }) => {
    codeMap.set(name, code)
  })
  return codeMap
}

// デフォルトでチェックする科目（1000の位が7の科目）を取得
export function getDefaultCheckedSubjects(subjectsWithCode: SubjectWithCode[]): Set<string> {
  const initial = new Set<string>()
  subjectsWithCode.forEach(({ name, code }) => {
    const thousandsDigit = Math.floor(code / 1000)
    if (thousandsDigit === 7) {
      initial.add(name)
    }
  })
  return initial
}

