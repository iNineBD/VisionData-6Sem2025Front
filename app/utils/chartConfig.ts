import type { ChartConfiguration, ChartData } from 'chart.js'

const universalColors = [
  '#5A4FCF',
  '#9A82E6',
  '#D0C7FF',
  '#3C6DF0',
  '#FF79C6',
  '#66D9EF',
  '#FFB86C',
  '#BD93F9',
  '#8A5BE3',
  '#4AB3FF'
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
      responsive: true
    }
  }
}

export function useHorizontalBar (
  labels: string[],
  data: number[]
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
      indexAxis: 'y',
      scales: {
        y: { beginAtZero: true },
        x: {
          beginAtZero: true,
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
  data: number[]
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
      scales: {
        x: { beginAtZero: true },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  }
}
