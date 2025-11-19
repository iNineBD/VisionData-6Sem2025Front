import type { ChartConfiguration } from 'chart.js'
import { universalColors } from './colors'
import annotationPlugin from 'chartjs-plugin-annotation'
import { Chart as ChartJS } from 'chart.js'
import type { PredictionResponse } from '~/types/predictions'

ChartJS.register(annotationPlugin)

export function usePredictionLineChart (response: PredictionResponse): ChartConfiguration<'line'> {
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
          data: [...Array(historicalValues.length).fill(null), ...predictionValues],
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
        title: { display: false, text: `Modelo usado: ${response.model_used}` },
        annotation: {
          annotations: [
            {
              type: 'line',
              scaleID: 'x',
              value: labels[transitionIndex],
              borderColor: universalColors[2],
              borderWidth: 2,
              borderDash: [3, 3],
              label: {
                display: true,
                content: 'Início das Predições',
                position: 'start',
                font: { size: 13 },
                backgroundColor: 'rgba(0,0,0,0.5)',
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
