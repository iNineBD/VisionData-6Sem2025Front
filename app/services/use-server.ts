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

  async function getPredicts (days: string | number, historical_days: string | number) {
    return await $fetch(`${mlUrl}/predictAllTickets?days=${days}&historical_days=${historical_days}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  return {
    getTicketsQuery,
    getMetricsTickets,
    getTicket,
    getPredicts
  }
}
