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

export function useColor(str: string): string {
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
