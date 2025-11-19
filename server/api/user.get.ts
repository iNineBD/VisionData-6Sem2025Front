export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  console.log('Session from getUserSession:', session)
  return session || null
})
