<script setup lang="ts">
definePageMeta({
  layout: 'login',
  middleware: []
})

useSeoMeta({
  title: 'Vision Data | Login'
})

const route = useRoute()
const toast = useToast()
const { refreshSession } = useAuth()

const processing = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const token = route.query.token as string
    const id = route.query.id as string
    const email = route.query.email as string
    const name = route.query.name as string
    const role = route.query.role as string

    if (!token || !id || !email || !name || !role) {
      throw new Error('Parâmetros de autenticação incompletos')
    }

    await $fetch('/api/login/microsoft', {
      method: 'POST',
      body: {
        token,
        user: {
          id: parseInt(id),
          email,
          name: decodeURIComponent(name.replace(/\+/g, ' ')),
          userType: role
        }
      }
    })

    await refreshSession()

    toast.add({
      title: 'Sucesso',
      description: 'Login com Microsoft realizado com sucesso!',
      color: 'success'
    })

    await navigateTo('/', { replace: true })
  } catch (err: unknown) {
    console.error('Microsoft login error:', err)

    error.value = err instanceof Error ? err.message : 'Erro ao processar login com Microsoft'

    toast.add({
      title: 'Erro',
      description: error.value || 'Erro desconhecido',
      color: 'error'
    })

    setTimeout(() => {
      navigateTo('/login', { replace: true })
    }, 3000)
  } finally {
    processing.value = false
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 min-h-screen">
    <UPageCard class="w-full max-w-md">
      <div class="flex flex-col items-center justify-center gap-6 p-8">
        <div
          v-if="processing"
          class="flex flex-col items-center gap-4"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="w-12 h-12 animate-spin text-primary"
          />
          <div class="text-center">
            <h2 class="text-xl font-semibold mb-2">Processando login...</h2>
            <p class="text-gray-500 dark:text-gray-400">
              Aguarde enquanto validamos suas credenciais.
            </p>
          </div>
        </div>

        <div
          v-else-if="error"
          class="flex flex-col items-center gap-4"
        >
          <UIcon
            name="i-lucide-x-circle"
            class="w-12 h-12 text-red-500"
          />
          <div class="text-center">
            <h2 class="text-xl font-semibold mb-2 text-red-500">Erro no Login</h2>
            <p class="text-gray-600 dark:text-gray-400">{{ error }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-500 mt-4">
              Redirecionando para a página de login...
            </p>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col items-center gap-4"
        >
          <UIcon
            name="i-lucide-check-circle"
            class="w-12 h-12 text-green-500"
          />
          <div class="text-center">
            <h2 class="text-xl font-semibold mb-2 text-green-500">Login Realizado!</h2>
            <p class="text-gray-600 dark:text-gray-400">
              Redirecionando para o dashboard...
            </p>
          </div>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
