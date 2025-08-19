import { useMemo } from 'react'
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'

interface ChartData {
  date: string
  entradas: number
  saidas: number
  saldo: number
  saldoAcumulado: number
}

interface HeatmapProps {
  data: ChartData[]
  showGrid?: boolean
  showAnimations?: boolean
}

interface CandlestickProps {
  data: ChartData[]
  showGrid?: boolean
  showAnimations?: boolean
}

// Componente Heatmap
export const HeatmapChart = ({ data, showGrid = true, showAnimations = true }: HeatmapProps) => {
  const heatmapData = useMemo(() => {
    return data.map((item, index) => {
      const date = new Date(item.date)
      const dayOfWeek = date.getDay()
      const weekOfYear = Math.floor(index / 7)
      
      // Normalizar valores para intensidade de cor
      const maxValue = Math.max(...data.map(d => Math.abs(d.saldo)))
      const intensity = maxValue > 0 ? Math.abs(item.saldo) / maxValue : 0
      
      return {
        x: dayOfWeek,
        y: weekOfYear,
        value: item.saldo,
        intensity: intensity,
        date: item.date,
        color: item.saldo >= 0 ? `rgba(16, 185, 129, ${intensity})` : `rgba(239, 68, 68, ${intensity})`
      }
    })
  }, [data])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart data={heatmapData}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis 
          type="number"
          dataKey="x"
          domain={[0, 6]}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => dayLabels[value] || ''}
          axisLine={false}
        />
        <YAxis 
          type="number"
          dataKey="y"
          tick={{ fontSize: 12 }}
          axisLine={false}
          label={{ value: 'Semanas', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value: any, name: string, props: any) => [
            formatCurrency(props.payload.value),
            'Saldo'
          ]}
          labelFormatter={(label, payload) => {
            if (payload && payload[0]) {
              return `Data: ${payload[0].payload.date}`
            }
            return ''
          }}
        />
        <Scatter dataKey="intensity" fill="#8884d8">
          {heatmapData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

// Componente Candlestick
export const CandlestickChart = ({ data, showGrid = true, showAnimations = true }: CandlestickProps) => {
  const candlestickData = useMemo(() => {
    return data.map((item, index) => {
      const prevSaldo = index > 0 ? data[index - 1].saldoAcumulado : 0
      const currentSaldo = item.saldoAcumulado
      
      // Simular dados OHLC baseados no fluxo de caixa
      const open = prevSaldo
      const close = currentSaldo
      const high = Math.max(open, close, item.entradas)
      const low = Math.min(open, close, -item.saidas)
      
      return {
        date: item.date,
        open,
        high,
        low,
        close,
        volume: item.entradas + item.saidas,
        color: close >= open ? '#10b981' : '#ef4444'
      }
    })
  }, [data])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart data={candlestickData}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis 
          dataKey="date"
          tick={{ fontSize: 12 }}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickFormatter={(value) => {
            if (Math.abs(value) >= 1000000) {
              return `R$ ${(value / 1000000).toFixed(1)}M`
            } else if (Math.abs(value) >= 1000) {
              return `R$ ${(value / 1000).toFixed(0)}k`
            } else {
              return `R$ ${value.toFixed(0)}`
            }
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value: any, name: string, props: any) => {
            const data = props.payload
            return [
              <div key="candlestick-tooltip" className="space-y-1">
                <div>Abertura: {formatCurrency(data.open)}</div>
                <div>Máxima: {formatCurrency(data.high)}</div>
                <div>Mínima: {formatCurrency(data.low)}</div>
                <div>Fechamento: {formatCurrency(data.close)}</div>
                <div>Volume: {formatCurrency(data.volume)}</div>
              </div>,
              'Dados'
            ]
          }}
          labelFormatter={(label) => `Período: ${label}`}
        />
        <Scatter dataKey="close" fill="#8884d8">
          {candlestickData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

// Componente customizado para renderizar candlesticks
export const CustomCandlestick = ({ payload, x, y, width, height }: any) => {
  if (!payload) return null

  const { open, high, low, close } = payload
  const isPositive = close >= open
  const color = isPositive ? '#10b981' : '#ef4444'
  
  const bodyHeight = Math.abs(close - open)
  const bodyY = Math.min(open, close)
  
  return (
    <g>
      {/* Linha superior (high) */}
      <line
        x1={x + width / 2}
        y1={y + (1 - (high - low) / (high - low)) * height}
        x2={x + width / 2}
        y2={y + (1 - (Math.max(open, close) - low) / (high - low)) * height}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* Linha inferior (low) */}
      <line
        x1={x + width / 2}
        y1={y + (1 - (Math.min(open, close) - low) / (high - low)) * height}
        x2={x + width / 2}
        y2={y + (1 - (low - low) / (high - low)) * height}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* Corpo do candlestick */}
      <rect
        x={x + width * 0.2}
        y={y + (1 - (bodyY + bodyHeight - low) / (high - low)) * height}
        width={width * 0.6}
        height={(bodyHeight / (high - low)) * height}
        fill={isPositive ? color : '#fff'}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

// Hook para calcular dados de tendência
export const useTrendAnalysis = (data: ChartData[]) => {
  return useMemo(() => {
    if (data.length < 2) return null

    const values = data.map(d => d.saldoAcumulado)
    const n = values.length
    
    // Regressão linear simples
    const sumX = data.reduce((sum, _, i) => sum + i, 0)
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = data.reduce((sum, _, i) => sum + i * values[i], 0)
    const sumXX = data.reduce((sum, _, i) => sum + i * i, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Calcular R²
    const yMean = sumY / n
    const ssRes = values.reduce((sum, val, i) => {
      const predicted = slope * i + intercept
      return sum + Math.pow(val - predicted, 2)
    }, 0)
    const ssTot = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0)
    const rSquared = 1 - (ssRes / ssTot)
    
    // Gerar linha de tendência
    const trendLine = data.map((_, i) => ({
      x: i,
      y: slope * i + intercept
    }))
    
    return {
      slope,
      intercept,
      rSquared,
      trendLine,
      direction: slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat',
      strength: Math.abs(rSquared)
    }
  }, [data])
}

export default { HeatmapChart, CandlestickChart, CustomCandlestick, useTrendAnalysis }
