// 各系統のパレット（高彩度→中彩度→低彩度の順）
const redPalette     = ["#ef4444", "#f87171", "#fecaca"] // 赤
const bluePalette    = ["#3b82f6", "#60a5fa", "#bfdbfe"] // 青
const yellowPalette  = ["#eab308", "#facc15", "#fef08a"] // 黄
const greenPalette   = ["#22c55e", "#4ade80", "#bbf7d0"] // 緑
const orangePalette  = ["#f97316", "#fb923c", "#fed7aa"] // オレンジ
const purplePalette  = ["#a855f7", "#c084fc", "#e9d5ff"] // 紫
const blackPalette   = ["#374151", "#6b7280", "#d1d5db"] // 黒（灰寄り）

const paletteMap: Record<number, string[]> = {
  1: redPalette,
  2: bluePalette,
  3: yellowPalette,
  4: greenPalette,
  5: orangePalette,
  6: purplePalette,
  7: blackPalette,
}

/**
 * 科目コードから色系統のパレットを取得
 */
function getPaletteForCode(code: number): string[] {
  const thousandsDigit = Math.floor(code / 1000)
  return paletteMap[thousandsDigit] || ["#9ca3af"] // グレー（系統外）
}

/**
 * 単一の科目コードに対して色を取得（後方互換性のため残す）
 * 注意: この関数は科目コードの順序を考慮しないため、推奨されません
 */
export function getSubjectColorByCode(code: number): string {
  const palette = getPaletteForCode(code)
  // デフォルトで高彩度を返す（後方互換性）
  return palette[0]
}

/**
 * 科目リスト全体を受け取り、同じ系統内で科目コードが低い順に
 * 彩度が高い色を割り当てる
 * @param subjectsWithCode 科目名と科目コードのペアの配列（科目コード順にソート済みであること）
 * @returns 科目名から色へのマップ
 */
export function assignSubjectColors(
  subjectsWithCode: Array<{ name: string; code: number }>
): Map<string, string> {
  const colorMap = new Map<string, string>()
  
  // 系統ごとにグループ化
  const bySystem = new Map<number, Array<{ name: string; code: number }>>()
  
  for (const subject of subjectsWithCode) {
    const thousandsDigit = Math.floor(subject.code / 1000)
    if (!bySystem.has(thousandsDigit)) {
      bySystem.set(thousandsDigit, [])
    }
    bySystem.get(thousandsDigit)!.push(subject)
  }
  
  // 各系統内で、科目コード順にソート済みのリストに対して
  // 彩度が高い順（パレットの前から）に色を割り当てる
  for (const [thousandsDigit, subjects] of bySystem.entries()) {
    const palette = paletteMap[thousandsDigit] || ["#9ca3af"]
    
    // 科目コード順にソート（念のため）
    const sorted = [...subjects].sort((a, b) => a.code - b.code)
    
    // 科目コードが低い順に、彩度が高い色から割り当て
    sorted.forEach((subject, index) => {
      const colorIndex = Math.min(index, palette.length - 1)
      colorMap.set(subject.name, palette[colorIndex])
    })
  }
  
  return colorMap
}

export function getJudgmentColor(judgment: string) {
  switch (judgment) {
    case "A":
      return "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100"
    case "B":
      return "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100"
    case "C":
      return "bg-lime-100 text-lime-900 dark:bg-lime-900 dark:text-lime-100"
    case "D":
      return "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
    case "E":
      return "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
    default:
      return "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
  }
}

export function normalizeSubjectName(raw?: string): string {
  if (!raw) return ""
  let s = String(raw).replace(/\s+/g, "")
  s = s.replace(/\+/g, "＋")
  s = s.replace(/^英語[＋+]?L$/i, "英語＋Ｌ")
  s = s.replace(/情報I$/i, "情報Ⅰ")
  s = s.replace(/数学III$/i, "数学③").replace(/数学Ⅲ$/, "数学③").replace(/数学3$/, "数学③")
  s = s.replace(/数学II$/i, "数学②").replace(/数学Ⅱ$/, "数学②").replace(/数学2$/, "数学②")
  s = s.replace(/数学I$/i, "数学①").replace(/数学Ⅰ$/, "数学①").replace(/数学1$/, "数学①")
  s = s.replace(/数学I[・\s]*II$/i, "数学①②")
    .replace(/数学Ⅰ[・\s]*Ⅱ$/, "数学①②")
    .replace(/数学1[・\s]*2$/, "数学①②")
    .replace(/数学①[・\s]*②$/, "数学①②")
  return s
}

/**
 * 科目コードから満点を取得（共テ用）
 * @param code 科目コード
 * @param presentSubjects 凡例や教科別得点に表示されている科目すべてのリスト（千の位が7の場合に使用）
 * @param subjectCodeMap 科目名から科目コードへのマップ（千の位が7の場合に使用）
 * @returns 満点
 */
export function getFullScoreForCommonTest(
  code: number,
  presentSubjects?: string[],
  subjectCodeMap?: Map<string, number>
): number {
  const thousandsDigit = Math.floor(code / 1000)
  
  switch (thousandsDigit) {
    case 1:
    case 2:
    case 4:
    case 5:
    case 6:
      return 100
    case 3:
      return 200
    case 7:
      // 表示されている科目すべて（7以外）の合計
      if (presentSubjects && subjectCodeMap) {
        let total = 0
        for (const subject of presentSubjects) {
          const subjectCode = subjectCodeMap.get(subject) ?? 999999
          const subjectThousandsDigit = Math.floor(subjectCode / 1000)
          // 7の科目は除外（7の科目の満点は他の科目の合計）
          if (subjectThousandsDigit === 7) {
            continue
          }
          total += getFullScoreForCommonTest(subjectCode, presentSubjects, subjectCodeMap)
        }
        return total
      }
      return 100 // フォールバック
    default:
      return 100 // デフォルト
  }
}

