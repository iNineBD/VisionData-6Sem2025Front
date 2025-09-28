import type { ChartConfiguration, ChartData } from 'chart.js'

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