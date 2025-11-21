import type { LoginRequest, User } from '~/types/auth'

const token = ref<string | null>(null)

export const useAuth = () => {
  const { loggedIn, user, fetch: refreshSession, clear, session } = useUserSession()

  const getToken = async (): Promise<string | null> => {
    // Primeiro tenta obter da sessão do Nuxt diretamente
    const currentSession = session.value as { token?: string } | null
    if (currentSession?.token) {
      token.value = currentSession.token
      return currentSession.token
    }

    // Se não encontrou, tenta do cache
    if (token.value) {
      return token.value
    }

    // Última tentativa: busca do API e atualiza a sessão
    try {
      await refreshSession()
      const updatedSession = session.value as { token?: string } | null
      const extractedToken = updatedSession?.token || null
      token.value = extractedToken
      return token.value
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  }

  const login = async (credentials: LoginRequest) => {
    const response = await $fetch('/api/login', {
      method: 'POST',
      body: credentials
    })

    await refreshSession()

    const session = await $fetch('/api/user')
    token.value = session?.token || null
    return response
  }

  const logout = async () => {
    await $fetch('/api/logout', {
      method: 'POST'
    })

    token.value = null

    await clear()
    await navigateTo('/login')
  }

  return {
    loggedIn: readonly(loggedIn),
    user: readonly(user) as Readonly<Ref<User | null>>,
    login,
    logout,
    refreshSession,
    getToken
  }
}
