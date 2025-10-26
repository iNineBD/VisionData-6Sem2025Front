import type { CompanyForecast } from '~/utils/charts/companyForecastLine'
import { objectToTimeSeries } from '~/utils/charts/companyForecastLine'

export const useServer = () => {
  const config = useRuntimeConfig()
  const serverUrl = config.public.apiServer
  const mlUrl = config.public.apiMl

  async function getMetricsTickets () {
    return await $fetch(`${serverUrl}/metrics/tickets`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async function getTicketsQuery (page: number, page_size: number, q?: string) {
    return await $fetch(`${serverUrl}/tickets/query?${q ? `q=${q}&` : ''}page=${page}&page_size=${page_size}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async function getTicket (id: string | number) {
    return await $fetch(`${serverUrl}/tickets/${id}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async function getPredicts (days: string | number, historical_days: string | number): Promise<PredictionResponse> {
    return await $fetch<PredictionResponse>(`${mlUrl}/predictAllTickets?days=${days}&historical_days=${historical_days}`, {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  async function getCompanyPredicts (): Promise<CompanyForecast[]> {
    try {
      const res = await $fetch<{ best_models_summary: any[] }>(`${mlUrl}/predict_company`)
      return (res.best_models_summary ?? []).map(item => ({
        company: item.company ?? item.product ?? 'Unknown',
        best_model: item.best_model,
        total_next30: item.total_next30,
        raw_series: objectToTimeSeries(item.raw_series),
        forecast: objectToTimeSeries(item.forecast)
      }))
    } catch (error) {
      console.error('Erro ao buscar previsões de empresas:', error)
      return []
    }
  }

  async function getProductPredicts (): Promise<CompanyForecast[]> {
    try {
      const res = await $fetch<{ best_models_summary: any[] }>(`${mlUrl}/predict_product`)
      return (res.best_models_summary ?? []).map(item => ({
        company: item.product ?? 'Unknown',
        best_model: item.best_model,
        total_next30: item.total_next30,
        raw_series: objectToTimeSeries(item.raw_series),
        forecast: objectToTimeSeries(item.forecast)
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
    getProductPredicts
  }
}
