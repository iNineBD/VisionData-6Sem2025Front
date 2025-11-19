// Tipos compartilhados para previsões e forecasts

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

export interface TimeSeriesData {
  date: string
  value: number
}

export interface CompanyForecast {
  company: string
  best_model: string
  total_next30: number
  forecast: TimeSeriesData[] | Record<string, number>
  raw_series: TimeSeriesData[] | Record<string, number>
}
