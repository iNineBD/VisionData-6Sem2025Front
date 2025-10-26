export const useServer = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiServer
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
    return await authenticatedFetch(`${baseUrl}/metrics/tickets`)
  }

  async function getTicketsQuery (page: number, page_size: number, q?: string) {
    return await authenticatedFetch(`${baseUrl}/tickets/query?${q ? `q=${q}&` : ''}page=${page}&page_size=${page_size}`)
  }

  async function getTicket (id: string | number) {
    return await authenticatedFetch(`${baseUrl}/tickets/${id}`)
  }

  // Métodos adicionais para operações CRUD
  async function createTicket (data: Record<string, unknown>) {
    return await authenticatedFetch(`${baseUrl}/tickets`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async function updateTicket (id: string | number, data: Record<string, unknown>) {
    return await authenticatedFetch(`${baseUrl}/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async function deleteTicket (id: string | number) {
    return await authenticatedFetch(`${baseUrl}/tickets/${id}`, {
      method: 'DELETE'
    })
  }

  return {
    getTicketsQuery,
    getMetricsTickets,
    getTicket,
    createTicket,
    updateTicket,
    deleteTicket
  }
}
