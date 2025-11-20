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
const showTermsModal = ref(false)
const activeTerm = ref<Term | null>(null)
const itemConsents = ref<ItemConsentRequest[]>([])

// Estado do formulário
const formState = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  userType: 'SUPPORT' as 'ADMIN' | 'MANAGER' | 'SUPPORT'
})

// Validação local dos termos
const areTermsAccepted = computed(() => {
  if (!activeTerm.value?.items) return false
  const mandatoryItems = activeTerm.value.items.filter(i => i.isMandatory)

  return mandatoryItems.every(termItem => {
    const consent = itemConsents.value.find(c => c.itemId === termItem.id)
    return consent?.accepted === true
  })
})

// Verifica se o formulário está preenchido para habilitar o botão
const isFormReady = computed(() => {
  const hasName = formState.name.trim().length > 0
  const hasEmail = formState.email.trim().length > 0
  const hasPassword = formState.password.length > 0
  const hasConfirm = formState.confirmPassword.length > 0

  // O botão só habilita se tudo estiver preenchido E os termos aceitos
  return hasName && hasEmail && hasPassword && hasConfirm && areTermsAccepted.value
})

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

onMounted(async () => {
  try {
    const response = await getActiveTerm()
    if (response.success) {
      activeTerm.value = response.data
    }
  } catch (error) {
    console.error('Error loading active term:', error)
    toast.add({ title: 'Erro', description: 'Erro ao carregar termos', color: 'error' })
  } finally {
    loadingTerms.value = false
  }
})

const handleConsentsUpdate = (consents: ItemConsentRequest[]) => {
  itemConsents.value = consents
}

async function onSubmit (event: FormSubmitEvent<Schema>) {
  if (!areTermsAccepted.value) {
    toast.add({
      title: 'Termos de Uso',
      description: 'Você precisa ler e aceitar os termos obrigatórios.',
      color: 'warning',
      icon: 'i-lucide-file-warning'
    })
    showTermsModal.value = true
    return
  }

  if (!activeTerm.value) return

  const registerData: RegisterRequest = {
    name: event.data.name,
    email: event.data.email,
    password: event.data.password,
    userType: formState.userType,
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
      toast.add({ title: 'Sucesso', description: 'Conta criada com sucesso!', color: 'success' })
      await navigateTo('/login')
    }
  } catch (error: any) {
    const message = error?.data?.message || 'Erro ao realizar cadastro.'
    toast.add({ title: 'Erro', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">

    <UPageCard
      class="w-full max-w-lg shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800 relative z-10"
      :ui="{ body: 'p-6 sm:p-8' }"
    >
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-500 mb-4">
          <UIcon
            name="i-lucide-user-plus"
            class="w-6 h-6"
          />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Criar Conta</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Junte-se à nossa plataforma de suporte</p>
      </div>

      <UForm
        :schema="schema"
        :state="formState"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField
          name="name"
          label="Nome Completo"
          required
          class="w-full"
        >
          <UInput
            v-model="formState.name"
            icon="i-lucide-user"
            placeholder="Ex: João Silva"
            size="lg"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="email"
          label="Email Corporativo"
          required
          class="w-full"
        >
          <UInput
            v-model="formState.email"
            type="email"
            icon="i-lucide-mail"
            placeholder="nome@empresa.com"
            size="lg"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="password"
          label="Senha"
          required
          class="w-full"
        >
          <UInput
            v-model="formState.password"
            type="password"
            icon="i-lucide-lock"
            placeholder="********"
            size="lg"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="confirmPassword"
          label="Confirmar Senha"
          required
          class="w-full"
        >
          <UInput
            v-model="formState.confirmPassword"
            type="password"
            icon="i-lucide-lock-keyhole"
            placeholder="********"
            size="lg"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <div class="pt-2">
          <div
            class="relative flex items-center justify-between p-4 border rounded-lg transition-all cursor-pointer group select-none"
            :class="areTermsAccepted
              ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800'
              : 'border-gray-200 hover:border-primary-300 bg-white dark:bg-gray-900 dark:border-gray-700'"
            @click="showTermsModal = true"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                :class="areTermsAccepted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 group-hover:text-primary-500'"
              >
                <UIcon
                  :name="areTermsAccepted ? 'i-lucide-check' : 'i-lucide-file-text'"
                  class="w-4 h-4"
                />
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Termos de Uso</span>
                <span
                  v-if="areTermsAccepted"
                  class="text-xs text-gray-500"
                >Termos aceitos</span>
                <span
                  v-else
                  class="text-xs text-primary-600 dark:text-primary-400 font-medium"
                >Clique para ler e aceitar</span>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors"
            />
          </div>
        </div>

        <UButton
          type="submit"
          size="xl"
          block
          :loading="loading"
          :disabled="!isFormReady || loading || loadingTerms"
          class="mt-6 w-full"
        >
          Criar Conta
        </UButton>

        <div class="text-center mt-4">
          <UButton
            to="/login"
            variant="link"
            color="neutral"
            size="sm"
          >
            Já tem uma conta? Faça login
          </UButton>
        </div>
      </UForm>
    </UPageCard>

    <Teleport to="body">
      <div
        v-if="showTermsModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          @click="showTermsModal = false"
        />

        <div
          class="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Termos de Uso e Privacidade
            </h3>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="showTermsModal = false"
            />
          </div>

          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <TermsViewer
              :term="activeTerm"
              :loading="loadingTerms"
              :initial-consents="itemConsents"
              @update:consents="handleConsentsUpdate"
            />
          </div>

          <div class="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancelar"
              @click="showTermsModal = false"
            />
            <UButton
              color="primary"
              label="Confirmar Aceite"
              :disabled="!areTermsAccepted"
              @click="showTermsModal = false"
            />
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
