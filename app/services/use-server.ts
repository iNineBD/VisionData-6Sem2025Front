import { useAuth } from '~/composables/useAuth'

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
  raw_series: { date: string, value: number }[]
  forecast: { date: string, value: number }[]
}

interface BestModelSummaryItem {
  product?: string
  company?: string
  best_model?: string
  model_name?: string
  total_next30?: number
  raw_series?: Record<string, number>
  forecast?: Record<string, number>
}

export const useServer = () => {
  const config = useRuntimeConfig()
  const serverUrl = config.public.apiServer
  const mlUrl = config.public.apiMl
  const { logout, getToken } = useAuth()

  const getAuthHeaders = async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    const userToken = await getToken()
    if (userToken) {
      headers.Authorization = `Bearer ${userToken}`
      console.log('Token added to headers:', userToken.substring(0, 20) + '...')
    } else {
      console.warn('No token found')
    }

    return headers
  }

  const authenticatedFetch = async <T>(url: string, options?: Record<string, unknown>): Promise<T> => {
    try {
      const authHeaders = await getAuthHeaders()
      const headers = {
        ...authHeaders,
        ...(options?.headers && typeof options.headers === 'object' ? options.headers : {})
      }

      const result = await $fetch(url, {
        ...options,
        headers
      })

      return result as T
    } catch (error: unknown) {
      if (error && typeof error === 'object' && ('status' in error || 'statusCode' in error)) {
        const httpError = error as { status?: number; statusCode?: number }
        if (httpError.status === 401 || httpError.statusCode === 401) {
          await logout()
          throw error
        }
      }
      throw error
    }
  }

  async function getMetricsTickets () {
    return await authenticatedFetch(`${serverUrl}/metrics/tickets`)
  }

  async function getTicketsQuery (page: number, page_size: number, q?: string) {
    return await authenticatedFetch(`${serverUrl}/tickets/query?${q ? `q=${q}&` : ''}page=${page}&page_size=${page_size}`)
  }

  async function getTicket (id: string | number) {
    return await authenticatedFetch(`${serverUrl}/tickets/${id}`)
  }

  async function createTicket (data: Record<string, unknown>) {
    return await authenticatedFetch(`${serverUrl}/tickets`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async function updateTicket (id: string | number, data: Record<string, unknown>) {
    return await authenticatedFetch(`${serverUrl}/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async function deleteTicket (id: string | number) {
    return await authenticatedFetch(`${serverUrl}/tickets/${id}`, {
      method: 'DELETE'
    })
  }

  async function getPredicts (days: string | number, historical_days: string | number): Promise<PredictionResponse> {
    return await $fetch<PredictionResponse>(`${mlUrl}/predictAllTickets?days=${days}&historical_days=${historical_days}`, {
      headers: { 'Content-Type': 'application/json' }
    })
  }


  async function getCompanyPredicts (): Promise<CompanyForecast[]> {
    try {
      const res = await $fetch<{ best_models_summary: BestModelSummaryItem[] }>(`${mlUrl}/predict_company`)
      return (res.best_models_summary ?? []).map(item => ({
        company: item.company ?? item.product ?? 'Unknown',
        best_model: item.best_model ?? item.model_name ?? 'Desconhecido',
        total_next30: typeof item.total_next30 === 'number'
          ? item.total_next30
          : (item.forecast ? Number(Object.values(item.forecast as Record<string, number>).reduce((a: number, b: number) => a + Number(b), 0)) : 0),
        raw_series: item.raw_series
          ? Object.entries(item.raw_series).map(([date, value]) => ({ date, value: Number(value as number) }))
          : [],
        forecast: item.forecast
          ? Object.entries(item.forecast).map(([date, value]) => ({ date, value: Number(value as number) }))
          : []
      }))
    } catch (error) {
      console.error('Erro ao buscar previsões de empresas:', error)
      return []
    }
  }


  async function getProductPredicts (): Promise<CompanyForecast[]> {
    try {
      const res = await $fetch<{ best_models_summary: BestModelSummaryItem[] }>(`${mlUrl}/predict_product`)
      return (res.best_models_summary ?? []).map(item => ({
        company: item.product ?? 'Unknown',
        best_model: item.best_model ?? item.model_name ?? 'Desconhecido',
        total_next30: typeof item.total_next30 === 'number'
          ? item.total_next30
          : (item.forecast ? Number(Object.values(item.forecast as Record<string, number>).reduce((a: number, b: number) => a + Number(b), 0)) : 0),
        raw_series: item.raw_series
          ? Object.entries(item.raw_series).map(([date, value]) => ({ date, value: Number(value as number) }))
          : [],
        forecast: item.forecast
          ? Object.entries(item.forecast).map(([date, value]) => ({ date, value: Number(value as number) }))
          : []
      }))
    } catch (error) {
      console.error('Erro ao buscar previsões de produtos:', error)
      return []
    }
  }

  return {
    getTicketsQuery,
    getMetricsTickets,
    getTicket,
    getPredicts,
    getCompanyPredicts,
    getProductPredicts,
    createTicket,
    updateTicket,
    deleteTicket
  }
}
