<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, ButtonProps, AuthFormField } from '@nuxt/ui'
import type { LoginRequest } from '~/types/auth'

definePageMeta({
  layout: 'login'
})

const { login, loggedIn } = useAuth()
const toast = useToast()

if (loggedIn.value) {
  await navigateTo('/')
}

const loading = ref(false)

const providers = ref<ButtonProps[]>([
  {
    label: 'Microsoft',
    icon: 'i-simple-icons-microsoft',
    color: 'neutral',
    variant: 'subtle',
    onClick: () => {
      window.open('http://localhost:8080/auth/microsoft/login', '_self')
    }
  }
])
const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Digite seu email',
    required: true
  },
  {
    name: 'password',
    label: 'Senha',
    type: 'password',
    placeholder: 'Digite sua senha',
    required: true
  }
]

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória')
})

type Schema = z.output<typeof schema>

async function onSubmit (event: FormSubmitEvent<Schema>) {
  const credentials: LoginRequest = {
    email: event.data.email,
    password: event.data.password,
    login_type: 'password'
  }

  loading.value = true

  try {
    await login(credentials)
    toast.add({ title: 'Sucesso', description: 'Login realizado com sucesso!', color: 'success' })
    await navigateTo('/')
  } catch (error: unknown) {
    console.error('Login error:', error)

    let message = 'Erro ao fazer login. Verifique suas credenciais.'

    if (error && typeof error === 'object' && 'data' in error) {
      const apiError = error as { data?: { message?: string }; statusMessage?: string }
      if (apiError.data?.message) message = apiError.data.message
      else if (apiError.statusMessage) message = apiError.statusMessage
    }

    toast.add({ title: 'Erro', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 min-h-screen">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        title="Login"
        description="Entre com suas credenciais para acessar sua conta."
        icon="i-lucide-user"
        :fields="fields"
        :schema="schema"
        :loading="loading"
        :providers="providers"
        submit-button-label="Entrar"
        @submit="onSubmit"
      />

      <template #footer>
        <div class="text-center text-sm text-gray-600 dark:text-gray-400">
          Não tem uma conta?
          <UButton
            variant="link"
            to="/register"
            class="text-primary"
          >
            Cadastre-se aqui
          </UButton>
        </div>
      </template>
    </UPageCard>
  </div>
</template>
