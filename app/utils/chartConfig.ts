import { Ticks, type ChartConfiguration, type ChartData } from 'chart.js'
import { Chart as ChartJS } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
ChartJS.register(annotationPlugin)

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

export interface PredictionData {
  date: string
  ticket_count: number
  is_prediction: boolean
}

export interface PredictionResponse {
  historical_data: PredictionData[]
  predictions: PredictionData[]
  model_used: string
  forecast_period_days: number
  metadata: Record<string, unknown>
}

export function usePredictionLineChart (
  response: PredictionResponse
): ChartConfiguration<'line'> {
  const historicalLabels = response.historical_data.map(d => d.date)
  const historicalValues = response.historical_data.map(d => d.ticket_count)
  const predictionLabels = response.predictions.map(d => d.date)
  const predictionValues = response.predictions.map(d => d.ticket_count)

  const labels = [...historicalLabels, ...predictionLabels]

  const transitionIndex = historicalLabels.length

  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Dados Reais',
          data: [...historicalValues, ...Array(predictionValues.length).fill(null)],
          borderColor: universalColors[1],
          tension: 0.2,
          fill: false
        },
        {
          label: 'Predição',
          data: [
            ...Array(historicalValues.length).fill(null),
            ...predictionValues
          ],
          borderColor: universalColors[3],
          borderDash: [5, 5],
          tension: 0.2,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: {
          display: false,
          text: `Modelo usado: ${response.model_used}`
        },
        annotation: {
          annotations: [
            {
              type: 'line',
              scaleID: 'x',
              value: labels[transitionIndex],
              borderColor: universalColors[2],
              borderWidth: 2,
              label: {
                display: true,
                content: 'Início das Predições',
                position: 'start',
                font: {
                  size: 13
                },
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: { top: 4, bottom: 4, left: 6, right: 6 },
                borderRadius: 4
              }
            }
          ]

        }
      },
      scales: {
        x: { title: { display: true, text: 'Data' } },
        y: { beginAtZero: true, title: { display: true, text: 'Tickets' } }
      }
    }
  }
}

