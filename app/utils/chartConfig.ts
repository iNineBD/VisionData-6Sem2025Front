import { Ticks, type ChartConfiguration, type ChartData } from 'chart.js'

const universalColors = [
  '#4c00ff98',
  '#9d4dff98',
  '#d580ff98',
  '#ff4ded98',
  '#4dd2ff98',
  '#ff4de798',
  '#ff00b398'
]

function colorForIndex(i: number) {
  return universalColors[i % universalColors.length]
}

export function useDoughnut(
  labels: string[],
  data: number[]
): ChartConfiguration<'doughnut'> {
  return {
    type: 'doughnut',
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
    } as ChartData<'doughnut', number[], unknown>,
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  }
}

export function useHorizontalBar(
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
          ...(yMax && { max: yMax }),
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  }
}

export function useVerticalBar(
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
          ...(yMax && { max: yMax }),
          ticks: { stepSize: 1 }
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
                text: label,                      // nome da label
                fillStyle: bg[i],                 // cor do quadradinho
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
