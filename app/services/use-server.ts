export const useServer = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiServer

  async function getMetricsTickets () {
    return await $fetch(`${baseUrl}/metrics/tickets`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async function getTicketsQuery (page: number, page_size: number, q?: string) {
    return await $fetch(`${baseUrl}/tickets/query?${q ? `q=${q}&` : ''}page=${page}&page_size=${page_size}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async function getTicket (id: string | number) {
    return await $fetch(`${baseUrl}/tickets/${id}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  return {
    getTicketsQuery,
    getMetricsTickets,
    getTicket
  }
}
