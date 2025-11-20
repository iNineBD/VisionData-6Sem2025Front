import type { ChartConfiguration, ChartData } from 'chart.js'
import { universalColors } from './colors'
import { colorForIndex } from '../index'

export function useHorizontalBar (
  labels: string[],
  data: number[],
  yMax?: number
): ChartConfiguration<'bar'> {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Quantity',
          data,
          backgroundColor: universalColors,
          borderWidth: 0
        }
      ]
    } as ChartData<'bar', number[], unknown>,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        y: { beginAtZero: true },
        x: {
          beginAtZero: true,
          ...(yMax && { max: yMax })
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  }
}

export function useVerticalBar (
  labels: string[],
  data: number[],
  yMax?: number
): ChartConfiguration<'bar'> {
  // filtro de dados N/A
  const filteredIndexes = labels.map((label, index) => ({ label, index }))
    .filter(item => item.label !== 'N/A')
  const filteredLabels = filteredIndexes.map(item => item.label)
  const filteredData = filteredIndexes.map(item => data[item.index])

  return {
    type: 'bar',
    data: {
      labels: filteredLabels,
      datasets: [
        {
          label: '',
          data: filteredData,
          backgroundColor: filteredLabels.map((_, i) => colorForIndex(i)), // cores das barras
          borderWidth: 0
        }
      ]
    } as ChartData<'bar', number[], unknown>,
    options: {
      responsive: true,
      scales: {
        x: {
          beginAtZero: true,
          ticks: { display: false }
        },
        y: {
          beginAtZero: true,
          ...(yMax && { max: yMax })
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 12, weight: 'lighter' },
            generateLabels: (chart: any) => {
              const ds = chart.data.datasets[0]
              const bg = ds.backgroundColor as string[]
              return chart.data.labels.map((label: string, i: number) => ({
                text: label,
                fillStyle: bg[i],
                fontColor: '#5e5e5f',
                hidden: false,
                index: i
              }))
            },
            color: (ctx: any) => {
              const chart = ctx.chart
              const i = ctx.index ?? 0
              const ds = chart.data.datasets[0]
              const bg = ds.backgroundColor as string[]
              return bg[i] || '#fff'
            }
          },
          onClick: () => {
            // Desabilita o click na legenda para evitar erros
          }
        }
      }
    }
  }
}
