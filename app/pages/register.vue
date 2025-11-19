<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Term, ItemConsentRequest } from '~/types/terms'
import type { RegisterRequest } from '~/types/auth'

definePageMeta({
  layout: 'login'
})

const { loggedIn } = useAuth()
const toast = useToast()
const { getActiveTerm } = useServer()

if (loggedIn.value) {
  await navigateTo('/')
}

const loading = ref(false)
const loadingTerms = ref(true)
const activeTerm = ref<Term | null>(null)
const itemConsents = ref<ItemConsentRequest[]>([])
const termsViewerRef = ref<{ allMandatoryAccepted: boolean } | null>(null)

// Estado do formulário
const formState = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  userType: 'SUPPORT' as 'ADMIN' | 'MANAGER' | 'SUPPORT'
})

// Schema de validação do formulário
const schema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(200, 'Nome muito longo'),
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(100, 'Senha muito longa'),
  confirmPassword: z.string(),
  userType: z.enum(['ADMIN', 'MANAGER', 'SUPPORT'])
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

// Carrega o termo ativo ao montar o componente
onMounted(async () => {
  try {
    const response = await getActiveTerm()
    if (response.success) {
      activeTerm.value = response.data
    } else {
      toast.add({
        title: 'Erro',
        description: 'Não foi possível carregar os termos de uso',
        color: 'error'
      })
    }
  } catch (error) {
    console.error('Error loading active term:', error)
    toast.add({
      title: 'Erro',
      description: 'Erro ao carregar os termos de uso',
      color: 'error'
    })
  } finally {
    loadingTerms.value = false
  }
})

// Atualiza os consentimentos quando o componente filho emite mudanças
const handleConsentsUpdate = (consents: ItemConsentRequest[]) => {
  itemConsents.value = consents
}

// Submit do formulário
async function onSubmit (event: FormSubmitEvent<Schema>) {
  // Valida se os termos obrigatórios foram aceitos
  if (!termsViewerRef.value?.allMandatoryAccepted) {
    toast.add({
      title: 'Atenção',
      description: 'Você deve aceitar todos os itens obrigatórios dos termos de uso',
      color: 'warning'
    })
    return
  }

  if (!activeTerm.value) {
    toast.add({
      title: 'Erro',
      description: 'Termos de uso não carregados',
      color: 'error'
    })
    return
  }

  const registerData: RegisterRequest = {
    name: event.data.name,
    email: event.data.email,
    password: event.data.password,
    userType: event.data.userType,
    termConsent: {
      termId: activeTerm.value.id,
      itemConsents: itemConsents.value
    }
  }

  loading.value = true

  try {
    const response = await $fetch('/api/register', {
      method: 'POST',
      body: registerData
    })

    if (response.success) {
      toast.add({
        title: 'Sucesso',
        description: 'Cadastro realizado com sucesso! Faça login para continuar.',
        color: 'success'
      })
      await navigateTo('/login')
    }
  } catch (error: unknown) {
    console.error('Register error:', error)

    let message = 'Erro ao realizar cadastro. Tente novamente.'

    if (error && typeof error === 'object' && 'data' in error) {
      const apiError = error as { data?: { message?: string }; statusMessage?: string }
      if (apiError.data?.message) message = apiError.data.message
      else if (apiError.statusMessage) message = apiError.statusMessage
    }

    toast.add({
      title: 'Erro',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 min-h-screen">
    <UPageCard class="w-full max-w-4xl">
      <template #header>
        <div>
          <h1 class="text-2xl font-bold">
            Criar Conta
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Preencha os dados abaixo para criar sua conta
          </p>
        </div>
      </template>

      <div class="space-y-6">
        <!-- Formulário de Cadastro -->
        <UForm
          :schema="schema"
          :state="formState"
          @submit="onSubmit"
        >
          <div class="space-y-4">
            <!-- Nome -->
            <UFormField
              name="name"
              label="Nome Completo"
            >
              <UInput
                v-model="formState.name"
                icon="i-lucide-user"
                placeholder="Digite seu nome completo"
                autocomplete="name"
                :disabled="loading"
              />
            </UFormField>

            <!-- Email -->
            <UFormField
              name="email"
              label="Email"
            >
              <UInput
                v-model="formState.email"
                type="email"
                icon="i-lucide-mail"
                placeholder="Digite seu email"
                autocomplete="email"
                :disabled="loading"
              />
            </UFormField>

            <!-- Senha -->
            <UFormField
              name="password"
              label="Senha"
            >
              <UInput
                v-model="formState.password"
                type="password"
                icon="i-lucide-lock"
                placeholder="Mínimo 8 caracteres"
                autocomplete="new-password"
                :disabled="loading"
              />
            </UFormField>

            <!-- Confirmar Senha -->
            <UFormField
              name="confirmPassword"
              label="Confirmar Senha"
            >
              <UInput
                v-model="formState.confirmPassword"
                type="password"
                icon="i-lucide-lock"
                placeholder="Digite a senha novamente"
                autocomplete="new-password"
                :disabled="loading"
              />
            </UFormField>

            <!-- Tipo de Usuário -->
            <UFormField
              name="userType"
              label="Tipo de Usuário"
            >
              <select
                v-model="formState.userType"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                :disabled="loading"
              >
                <option value="SUPPORT">
                  Suporte
                </option>
                <option value="MANAGER">
                  Gerente
                </option>
                <option value="ADMIN">
                  Administrador
                </option>
              </select>
            </UFormField>
          </div>

          <!-- Divider -->
          <hr class="my-6 border-gray-200 dark:border-gray-700" />

          <!-- Termos de Uso -->
          <div class="space-y-4">

            <TermsViewer
              ref="termsViewerRef"
              :term="activeTerm"
              :loading="loadingTerms"
              @update:consents="handleConsentsUpdate"
            />
          </div>

          <!-- Buttons -->
          <div class="flex justify-between items-center mt-6">
            <UButton
              icon="i-lucide-arrow-left"
              variant="ghost"
              color="neutral"
              to="/login"
              :disabled="loading"
            >
              Voltar ao Login
            </UButton>

            <UButton
              type="submit"
              icon="i-lucide-user-plus"
              size="lg"
              :loading="loading"
              :disabled="loadingTerms"
            >
              Criar Conta
            </UButton>
          </div>
        </UForm>
      </div>
    </UPageCard>
  </div>
</template>
