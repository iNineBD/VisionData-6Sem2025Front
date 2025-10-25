import type { ChartConfiguration, ChartData } from 'chart.js'
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

export function useDoughnut (
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
          ...(yMax && { max: yMax }),
          ticks: {
            stepSize: 1
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
      scales: {
        x: { beginAtZero: true },
        y: {
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

