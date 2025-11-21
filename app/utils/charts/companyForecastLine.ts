import type { ChartConfiguration } from 'chart.js'
import type { CompanyForecast } from '~/types/predictionMetrics'
import { universalColors } from './colors'
import annotationPlugin from 'chartjs-plugin-annotation'
import { Chart as ChartJS } from 'chart.js'
import type { TimeSeriesData, CompanyForecast } from '~/types/predictions'

ChartJS.register(annotationPlugin)

export interface TimeSeriesData {
  date: string
  value: number
}

type RawSeriesLike = CompanyForecast['raw_series'] | Record<string, number> | undefined

function normalizeSeries (data: RawSeriesLike): TimeSeriesData[] {
  if (Array.isArray(data)) return data
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).map(([date, value]) => ({
      date,
      value: Number(value)
    }))
  }
  return []
}

export function useCompanyForecastLineChart (companyData: CompanyForecast): ChartConfiguration<'line'> {
  const historical = normalizeSeries(companyData.raw_series)
  const predicted = normalizeSeries(companyData.forecast)

  const labels = [...historical.map(d => d.date), ...predicted.map(d => d.date)]
  const transitionIndex = historical.length

  const historicalValues = historical.map(d => d.value)
  const forecastValues = [
    ...new Array(historical.length).fill(null),
    ...predicted.map(d => d.value)
  ]

  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Série Histórica',
          data: historicalValues,
          borderColor: universalColors[1],
          tension: 0.2,
          fill: false
        },
        {
          label: 'Previsão',
          data: forecastValues,
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
          display: true,
          text: `${companyData.company}`
        },
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
                color: '#fff',
                padding: { top: 4, bottom: 4, left: 6, right: 6 },
                borderRadius: 4
              }
            }
          ]
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Data' },
          ticks: { maxRotation: 45, minRotation: 45 }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Tickets' }
        }
      }
    }
  }
}
