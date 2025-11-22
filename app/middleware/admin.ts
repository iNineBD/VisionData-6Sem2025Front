export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()

  if (!user.value || (user.value.userType !== 'ADMIN' && user.value.userType !== 'MANAGER')) {
    return navigateTo('/')
  }
})
