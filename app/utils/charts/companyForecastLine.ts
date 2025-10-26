import type { ChartConfiguration } from 'chart.js'
import { universalColors } from './colors'

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface CompanyForecast {
  company: string;
  best_model: string;
  total_next30: number;
  forecast: TimeSeriesData[];
  raw_series: TimeSeriesData[];
}

export function objectToTimeSeries (data: Record<string, number>): TimeSeriesData[] {
  return Object.entries(data).map(([date, value]) => ({ date, value }))
}

export function useCompanyForecastLineChart (companyData: CompanyForecast): ChartConfiguration<'line'> {
  const labels = companyData.forecast.map(d => d.date)

  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Série Histórica',
          data: companyData.raw_series.map(d => d.value),
          borderColor: universalColors[1],
          tension: 0.2,
          fill: false
        },
        {
          label: 'Forecast',
          data: companyData.forecast.map(d => d.value),
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
      plugins: { legend: { display: true } },
      scales: {
        x: { title: { display: true, text: 'Data' } },
        y: { beginAtZero: true, title: { display: true, text: 'Tickets' } }
      }
    }
  }
}
