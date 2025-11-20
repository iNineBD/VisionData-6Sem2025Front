// Types for prediction-related payloads (moved out of `use-server.ts`)
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

export interface CompanyForecast {
  company: string
  best_model: string
  total_next30: number
  raw_series: { date: string; value: number }[]
  forecast: { date: string; value: number }[]
}

// Structure returned by the ML endpoints summarizing best models per company/product
export interface BestModelSummaryItem {
  product?: string
  company?: string
  best_model?: string
  model_name?: string
  total_next30?: number
  raw_series?: Record<string, number>
  forecast?: Record<string, number>
}

export type { PredictionData as IPredictionData }
