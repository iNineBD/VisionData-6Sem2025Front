export default defineEventHandler(async (event) => {
  const { token, user } = await readBody(event)

  if (!token || !user) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token and user data are required'
    })
  }

  try {
    await setUserSession(event, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        microsoftId: user.microsoftId || '',
        isActive: true
      },
      token,
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })

    return {
      success: true,
      message: 'Microsoft login successful'
    }
  } catch (error: unknown) {
    console.error('Microsoft login session error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create user session'
    })
  }
})
