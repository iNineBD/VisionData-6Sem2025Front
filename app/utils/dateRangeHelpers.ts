import { CalendarDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import type { CompanyForecast } from '~/utils/charts/companyForecastLine'
import type { PredictionResponse } from '~/utils/charts/predictionLine'

export function parseISOToCalendarDate (iso: string | null): CalendarDate | undefined {
  if (!iso) return undefined
  const [y, m, d] = iso.split('-').map(n => parseInt(n, 10))
  if (!y || !m || !d) return undefined
  return new CalendarDate(y, m, d)
}

export function toISOFromCalendarDate (cd?: CalendarDate | null): string | null {
  if (!cd) return null
  const y = cd.year
  const m = String(cd.month).padStart(2, '0')
  const d = String(cd.day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function dateValueToISO (date: DateValue): string {
  const { year, month, day } = date as unknown as { year: number, month: number, day: number }
  const y = year
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function extractAvailableDates (forecasts: CompanyForecast[]): string[] {
  const set = new Set<string>()
  forecasts.forEach(fc => {
    if (Array.isArray(fc.raw_series)) fc.raw_series.forEach(d => set.add(d.date))
    else Object.keys(fc.raw_series ?? {}).forEach(date => set.add(date))
    if (Array.isArray(fc.forecast)) fc.forecast.forEach(d => set.add(d.date))
    else Object.keys(fc.forecast ?? {}).forEach(date => set.add(date))
  })
  return Array.from(set).sort((a, b) => +new Date(a) - +new Date(b))
}

export function extractGeneralAvailableDates (data: PredictionResponse | null): string[] {
  if (!data) return []
  const set = new Set<string>()
  data.historical_data?.forEach(d => set.add(d.date))
  data.predictions?.forEach(d => set.add(d.date))
  return Array.from(set).sort((a, b) => +new Date(a) - +new Date(b))
}

export function findEarliestPredictionDate (forecasts: CompanyForecast[]): string | null {
  let min: string | null = null
  forecasts.forEach(fc => {
    const dates = Array.isArray(fc.forecast) ? fc.forecast.map(d => d.date) : Object.keys(fc.forecast ?? {})
    if (dates.length) {
      const localMin = dates.reduce((a, b) => (new Date(a) < new Date(b) ? a : b))
      if (min === null || new Date(localMin) < new Date(min)) min = localMin
    }
  })
  return min
}

export function findGeneralPredictionStart (data: PredictionResponse | null): string | null {
  if (!data || !data.predictions?.length) return null
  return data.predictions.reduce((a, b) => (new Date(a.date) < new Date(b.date) ? a : b)).date
}

export function createDateClassifiers (allowedSet: Set<string>, predictionStart: string | null) {
  return {
    isHistorical: (day: DateValue) => {
      const dateStr = dateValueToISO(day)
      if (!allowedSet.has(dateStr)) return false
      if (!predictionStart) return true
      return dateStr < predictionStart
    },
    isPrediction: (day: DateValue) => {
      const dateStr = dateValueToISO(day)
      if (!allowedSet.has(dateStr)) return false
      if (!predictionStart) return false
      return dateStr >= predictionStart
    },
    isHighlightable: (day: DateValue) => {
      if (!predictionStart) return false
      return dateValueToISO(day) === predictionStart
    }
  }
}

export function filterGeneralDataByRange (
  data: PredictionResponse | null,
  range: { start: string | null, end: string | null }
): PredictionResponse | null {
  if (!data) return null
  const { start, end } = range
  if (!start || !end) return data
  const within = (d: string) => d >= start && d <= end
  return {
    ...data,
    historical_data: data.historical_data.filter(d => within(d.date)),
    predictions: data.predictions.filter(d => within(d.date))
  }
}
