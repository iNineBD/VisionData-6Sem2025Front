export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        id: number
        name: string
        email: string
        userType: number
        isActive: boolean
        createdAt: string
        updatedAt: string
      }
      message?: string
      error?: string
      code?: number
    }>(`${config.public.apiServer}/auth/register`, {
      method: 'POST',
      body
    })

    if (!response.success || !response.data) {
      throw createError({
        statusCode: 400,
        statusMessage: response.message || 'Registration failed'
      })
    }

    return {
      success: true,
      data: response.data,
      message: response.message
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'data' in error) {
      const apiError = error as { data: { code?: number; message?: string } }
      throw createError({
        statusCode: apiError.data.code || 400,
        statusMessage: apiError.data.message || 'Registration failed'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
