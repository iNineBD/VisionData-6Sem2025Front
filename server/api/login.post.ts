export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  const config = useRuntimeConfig()

  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        token: string
        user: {
          id: number
          name: string
          email: string
          userType: number
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
      }
      message?: string
      error?: string
      code?: number
    }>(`${config.public.apiServer}/auth/login`, {
      method: 'POST',
      body: {
        email,
        login_type: 'password',
        password
      }
    })

    if (!response.success || !response.data) {
      throw createError({
        statusCode: 401,
        statusMessage: response.message || 'Invalid credentials'
      })
    }

    await setUserSession(event, {
      user: {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        userType: response.data.user.userType,
        isActive: response.data.user.isActive
      },
      token: response.data.token
    })

    return {
      success: true,
      user: response.data.user
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'data' in error) {
      const apiError = error as { data: { code?: number; message?: string } }
      throw createError({
        statusCode: apiError.data.code || 401,
        statusMessage: apiError.data.message || 'Authentication failed'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
