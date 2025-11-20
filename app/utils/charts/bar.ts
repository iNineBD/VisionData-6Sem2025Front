import type { ChartConfiguration, ChartData, Chart } from 'chart.js'
import { universalColors } from './colors'
import { colorForIndex } from '../index'

export function useHorizontalBar (
  labels: string[],
  data: number[],
  yMax?: number
): ChartConfiguration<'bar'> {
  const maxVal = data.length ? Math.max(...data) : 0
  const step = maxVal <= 10 ? 1 : Math.ceil(maxVal / 10)
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
          ...(yMax && { max: yMax }),
          ticks: {
            // dynamic step to avoid generating excessive ticks when values are large
            stepSize: step,
            maxTicksLimit: 10
          }
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
        y: (() => {
          const maxVal = filteredData.length ? Math.max(0, ...(filteredData as number[])) : 0
          const step = maxVal <= 10 ? 1 : Math.ceil(maxVal / 10)
          return {
            beginAtZero: true,
            ...(yMax && { max: yMax }),
            ticks: { stepSize: step, maxTicksLimit: 10 }
          }
        })()
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 12, weight: 'lighter' },
            generateLabels: (chart: Chart) => {
              const ds = chart.data.datasets?.[0]
              const bg = (ds?.backgroundColor ?? []) as string[]
              const labels = (chart.data.labels ?? []) as string[]
              return labels.map((label: string, i: number) => ({
                text: label,                      // nome da label
                fillStyle: bg[i],                 // cor do quadradinho
                fontColor: '#5e5e5f',
                hidden: false,
                index: i
              }))
            }
          }
        //      onClick: (e: any, legendItem: any, legend: any) => {
        //        const ci = legend.chart
        //        const idx = legendItem.index
        //        const meta = ci.getDatasetMeta(0)
        //        meta.data[idx].hidden = !meta.data[idx].hidden
        //        ci.update()
        //      }
        }
      }
    }
  }
}
