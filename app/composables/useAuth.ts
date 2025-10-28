import type { LoginRequest, User } from '~/types/auth'

const token = ref<string | null>(null)

export const useAuth = () => {
  const { loggedIn, user, fetch: refreshSession, clear } = useUserSession()

  const getToken = async (): Promise<string | null> => {
    if (token.value) {
      return token.value
    }

    try {
      const session = await $fetch('/api/user')
      token.value = session?.token || null
      return token.value
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  }

  const login = async (credentials: LoginRequest) => {
    const response = await $fetch('/auth/login', {
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
