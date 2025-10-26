export * from '../utils/charts/colors'
export * from '../utils/charts/doughnut'
export * from '../utils/charts/bar'
export * from '../utils/charts/predictionLine'
export * from '../utils/charts/companyForecastLine'


export function colorForIndex (i: number) {
  return universalColors[i % universalColors.length]
}

export function randomInt (min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFrom<T> (array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
}
export function formatDate (dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('pt-BR')
}

type BadgeColor = 'success' | 'info' | 'warning' | 'error' | 'neutral' | 'primary' | 'secondary'

export function useColor (str: string): BadgeColor {
  switch (str) {
    case 'Baixa':
      return 'success'
    case 'Média':
      return 'info'
    case 'Alta':
      return 'warning'
    case 'Crítica':
      return 'error'
    default:
      return 'neutral'
  }
}

