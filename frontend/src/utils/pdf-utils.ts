import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas-pro'

/**
 * DOM要素をPDFとして出力
 * @param elementId 印刷対象の要素のID
 * @param filename PDFファイル名
 * @param options オプション
 */
export async function printToPDF(
  elementId: string,
  filename: string = 'document.pdf',
  options: {
    width?: number
    height?: number
    scale?: number
  } = {}
): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with id "${elementId}" not found`)
    alert(`要素が見つかりません: ${elementId}`)
    return
  }

  // 要素のサイズを確認
  const rect = element.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    console.error('Element has zero size:', rect)
    alert('要素のサイズが0です。表示を確認してください。')
    return
  }

  const { scale = 2 } = options

  try {
    // チャートのレンダリング完了を待つ
    await new Promise(resolve => setTimeout(resolve, 500))

    // html2canvas-proで要素をキャプチャ
    // html2canvas-proはoklch色関数をサポートしている
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // クローンされたドキュメント内の要素を処理
        const clonedElement = clonedDoc.getElementById(elementId)
        const originalElement = document.getElementById(elementId)
        
        if (clonedElement && originalElement) {
          // グラデーションテキストを通常の色に変換
          const processGradientText = (clonedEl: Element, originalEl: Element) => {
            const clonedHtmlEl = clonedEl as HTMLElement
            const originalHtmlEl = originalEl as HTMLElement
            
            try {
              const computed = window.getComputedStyle(originalHtmlEl)
              
              // グラデーションテキストの検出（WebkitBackgroundClip: text または backgroundClip: text）
              const bgClip = computed.getPropertyValue('-webkit-background-clip') || 
                            computed.getPropertyValue('background-clip')
              const bgImage = computed.getPropertyValue('background-image')
              const textFillColor = computed.getPropertyValue('-webkit-text-fill-color') ||
                                   computed.getPropertyValue('color')
              
              // グラデーションテキストの場合
              if ((bgClip === 'text' || bgClip.includes('text')) && 
                  bgImage && bgImage.includes('gradient') &&
                  (textFillColor === 'transparent' || textFillColor === 'rgba(0, 0, 0, 0)')) {
                
                // グラデーションの中間色を計算（#1BA4C3 → #0086A9 → #006580）
                // 中間色として #0086A9 を使用
                const gradientColor = '#0086A9'
                
                // グラデーション背景を削除し、通常の色を適用
                clonedHtmlEl.style.background = 'none'
                clonedHtmlEl.style.backgroundImage = 'none'
                clonedHtmlEl.style.webkitBackgroundClip = 'unset'
                clonedHtmlEl.style.backgroundClip = 'unset'
                clonedHtmlEl.style.webkitTextFillColor = 'unset'
                clonedHtmlEl.style.color = gradientColor
              }
            } catch (e) {
              console.warn('Gradient text processing error:', e)
            }
          }
          
          // すべての要素を再帰的に処理
          const processAllElements = (cloned: Element, original: Element) => {
            processGradientText(cloned, original)
            
            // 子要素も処理
            const clonedChildren = Array.from(cloned.children)
            const originalChildren = Array.from(original.children)
            
            clonedChildren.forEach((clonedChild, index) => {
              const originalChild = originalChildren[index]
              if (originalChild) {
                processAllElements(clonedChild, originalChild)
              }
            })
          }
          
          // ルート要素から処理開始
          processAllElements(clonedElement, originalElement)
          
          // SVG要素のスタイルを確認
          const svgs = clonedElement.querySelectorAll('svg')
          svgs.forEach((svg) => {
            // SVGのスタイルを確実に適用
            if (!svg.style.width || !svg.style.height) {
              const rect = svg.getBoundingClientRect()
              if (rect.width > 0 && rect.height > 0) {
                svg.style.width = `${rect.width}px`
                svg.style.height = `${rect.height}px`
              }
            }
          })
        }
      },
    })

    if (!canvas) {
      throw new Error('Canvas生成に失敗しました')
    }

    const imgData = canvas.toDataURL('image/png', 1.0)
    if (!imgData || imgData === 'data:,') {
      throw new Error('画像データの生成に失敗しました')
    }

    const imgWidth = canvas.width
    const imgHeight = canvas.height

    if (imgWidth === 0 || imgHeight === 0) {
      throw new Error('画像サイズが0です')
    }

    // A4サイズのPDFを作成（縦向き）
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // 画像のアスペクト比を維持しながらPDFに収まるようにリサイズ
    const imgWidthMM = imgWidth / scale * 0.264583 // px to mm
    const imgHeightMM = imgHeight / scale * 0.264583 // px to mm
    
    const ratio = Math.min(pdfWidth / imgWidthMM, pdfHeight / imgHeightMM)
    const finalWidth = imgWidthMM * ratio
    const finalHeight = imgHeightMM * ratio

    // 中央配置
    const xOffset = (pdfWidth - finalWidth) / 2
    const yOffset = (pdfHeight - finalHeight) / 2

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight)
    pdf.save(filename)
  } catch (error) {
    console.error('PDF生成エラー:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    alert(`PDFの生成に失敗しました: ${errorMessage}`)
  }
}

