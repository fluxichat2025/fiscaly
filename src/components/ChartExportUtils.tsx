import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Download, FileImage, FileText, Printer } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ChartExportUtilsProps {
  chartRef: React.RefObject<HTMLDivElement>
  filename?: string
  title?: string
}

export const ChartExportUtils = ({ chartRef, filename = 'grafico', title = 'Gráfico' }: ChartExportUtilsProps) => {
  const { toast } = useToast()

  const exportToPNG = async () => {
    if (!chartRef.current) return

    try {
      toast({
        title: 'Exportando...',
        description: 'Gerando imagem PNG do gráfico',
      })

      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Alta qualidade
        logging: false,
        useCORS: true
      })

      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      toast({
        title: 'Exportação concluída',
        description: 'Gráfico exportado como PNG',
      })
    } catch (error) {
      console.error('Erro ao exportar PNG:', error)
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar o gráfico',
        variant: 'destructive'
      })
    }
  }

  const exportToPDF = async () => {
    if (!chartRef.current) return

    try {
      toast({
        title: 'Exportando...',
        description: 'Gerando PDF do gráfico',
      })

      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('landscape', 'mm', 'a4')
      
      // Adicionar título
      pdf.setFontSize(16)
      pdf.text(title, 20, 20)
      
      // Adicionar data
      pdf.setFontSize(10)
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30)
      
      // Calcular dimensões para caber na página
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      
      const ratio = Math.min((pdfWidth - 40) / imgWidth, (pdfHeight - 60) / imgHeight)
      const finalWidth = imgWidth * ratio
      const finalHeight = imgHeight * ratio
      
      // Centralizar imagem
      const x = (pdfWidth - finalWidth) / 2
      const y = 40
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
      pdf.save(`${filename}.pdf`)

      toast({
        title: 'Exportação concluída',
        description: 'Gráfico exportado como PDF',
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar o gráfico',
        variant: 'destructive'
      })
    }
  }

  const exportToSVG = async () => {
    if (!chartRef.current) return

    try {
      toast({
        title: 'Exportando...',
        description: 'Gerando SVG do gráfico',
      })

      // Encontrar elementos SVG no gráfico
      const svgElements = chartRef.current.querySelectorAll('svg')
      
      if (svgElements.length === 0) {
        throw new Error('Nenhum elemento SVG encontrado')
      }

      // Pegar o primeiro SVG (principal)
      const svgElement = svgElements[0]
      const svgData = new XMLSerializer().serializeToString(svgElement)
      
      // Criar blob e download
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.download = `${filename}.svg`
      link.href = url
      link.click()
      
      URL.revokeObjectURL(url)

      toast({
        title: 'Exportação concluída',
        description: 'Gráfico exportado como SVG',
      })
    } catch (error) {
      console.error('Erro ao exportar SVG:', error)
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar o gráfico como SVG',
        variant: 'destructive'
      })
    }
  }

  const printChart = async () => {
    if (!chartRef.current) return

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      })

      const imgData = canvas.toDataURL('image/png')
      
      // Criar nova janela para impressão
      const printWindow = window.open('', '_blank')
      if (!printWindow) return

      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif; 
              }
              .header { 
                text-align: center; 
                margin-bottom: 20px; 
              }
              .chart { 
                text-align: center; 
              }
              img { 
                max-width: 100%; 
                height: auto; 
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${title}</h1>
              <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="chart">
              <img src="${imgData}" alt="${title}" />
            </div>
          </body>
        </html>
      `)

      printWindow.document.close()
      printWindow.focus()
      
      // Aguardar carregamento da imagem antes de imprimir
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)

      toast({
        title: 'Preparando impressão',
        description: 'Abrindo janela de impressão',
      })
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      toast({
        title: 'Erro na impressão',
        description: 'Não foi possível preparar o gráfico para impressão',
        variant: 'destructive'
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPNG}>
          <FileImage className="h-4 w-4 mr-2" />
          Exportar como PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar como PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToSVG}>
          <Download className="h-4 w-4 mr-2" />
          Exportar como SVG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={printChart}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Gráfico
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Hook para zoom e pan
export const useChartZoom = () => {
  const zoomIn = () => {
    // Implementar zoom in
    console.log('Zoom in')
  }

  const zoomOut = () => {
    // Implementar zoom out
    console.log('Zoom out')
  }

  const resetZoom = () => {
    // Implementar reset zoom
    console.log('Reset zoom')
  }

  const panLeft = () => {
    // Implementar pan left
    console.log('Pan left')
  }

  const panRight = () => {
    // Implementar pan right
    console.log('Pan right')
  }

  return {
    zoomIn,
    zoomOut,
    resetZoom,
    panLeft,
    panRight
  }
}

// Componente de controles de zoom
interface ChartZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
}

export const ChartZoomControls = ({ onZoomIn, onZoomOut, onResetZoom }: ChartZoomControlsProps) => {
  return (
    <div className="flex items-center gap-1 bg-white border rounded-lg p-1 shadow-sm">
      <Button variant="ghost" size="sm" onClick={onZoomIn}>
        +
      </Button>
      <Button variant="ghost" size="sm" onClick={onZoomOut}>
        -
      </Button>
      <Button variant="ghost" size="sm" onClick={onResetZoom}>
        Reset
      </Button>
    </div>
  )
}
