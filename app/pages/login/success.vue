<script setup lang="ts">
import { useServer } from '~/services/use-server'
import type { Term, ItemConsentRequest } from '~/types/terms'
import TermsViewer from '~/components/terms/viewer.vue'

definePageMeta({
  layout: 'login',
  middleware: []
})

useSeoMeta({
  title: 'Vision Data | Login Success'
})

const route = useRoute()
const toast = useToast()
const { refreshSession, logout } = useAuth()
const { acceptTerm, getMyConsent, getActiveTerm } = useServer()

const processing = ref(true)
const error = ref<string | null>(null)

// Estados para o Modal de Termos
const showTermsModal = ref(false)
const loadingTerms = ref(false)
const activeTerm = ref<Term | null>(null)
const itemConsents = ref<ItemConsentRequest[]>([])

// Verifica se os termos obrigatórios foram aceitos (computada)
const areTermsAccepted = computed(() => {
  if (!activeTerm.value?.items) return false
  const mandatoryItems = activeTerm.value.items.filter(i => i.isMandatory)

  return mandatoryItems.every(termItem => {
    const consent = itemConsents.value.find(c => c.itemId === termItem.id)
    return consent?.accepted === true
  })
})

const handleConsentsUpdate = (consents: ItemConsentRequest[]) => {
  itemConsents.value = consents
}

// Ação de Confirmar Termos
async function handleConfirmTerms () {
  if (!activeTerm.value) return

  try {
    processing.value = true // Volta a mostrar processando enquanto salva
    showTermsModal.value = false

    await acceptTerm({
      termId: activeTerm.value.id,
      itemConsents: itemConsents.value
    })

    toast.add({ title: 'Sucesso', description: 'Termos aceitos e login concluído!', color: 'success' })
    await navigateTo('/', { replace: true })
  } catch (err) {
    console.error('Erro ao aceitar termos:', err)
    toast.add({ title: 'Erro', description: 'Falha ao salvar aceite dos termos.', color: 'error' })
    // Reabre o modal em caso de erro ou desloga? Vamos reabrir.
    processing.value = false
    showTermsModal.value = true
  }
}

// Ação de Cancelar Termos
async function handleCancelTerms () {
  showTermsModal.value = false
  await logout()
  toast.add({ title: 'Login cancelado', description: 'É necessário aceitar os termos para acessar.', color: 'info' })
  await navigateTo('/login')
}

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

    // 1. Efetiva o login na sessão
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

    // 2. Verifica se o usuário já tem consentimento ativo
    try {
      const consentResponse = await getMyConsent()

      if (consentResponse.success && consentResponse.data.hasActiveConsent) {
        // Usuário já aceitou os termos -> Redireciona direto
        toast.add({ title: 'Sucesso', description: 'Login realizado com sucesso!', color: 'success' })
        await navigateTo('/', { replace: true })
        return
      }

      // Se chegou aqui, precisa aceitar termos ou renovar
      loadingTerms.value = true
      // Carrega o termo ativo para exibir
      const termResponse = await getActiveTerm()
      if (termResponse.success) {
        activeTerm.value = termResponse.data
        showTermsModal.value = true // Exibe o modal
        processing.value = false // Para de mostrar o loading principal para mostrar o modal (ou mantém o fundo)
      } else {
        throw new Error('Não foi possível carregar os termos de uso.')
      }

    } catch (consentErr) {
      console.error('Erro na verificação de consentimento:', consentErr)
      // Se der erro ao checar consentimento, podemos decidir se barra ou deixa passar.
      // Por segurança, vamos tratar como erro se não conseguir validar.
      throw new Error('Falha ao verificar termos de uso.')
    }

  } catch (err: unknown) {
    console.error('Microsoft login error:', err)
    error.value = err instanceof Error ? err.message : 'Erro ao processar login com Microsoft'

    setTimeout(() => {
      navigateTo('/login', { replace: true })
    }, 4000)

    processing.value = false
  } finally {
    loadingTerms.value = false
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
            <h2 class="text-xl font-semibold mb-2">Verificando acesso...</h2>
            <p class="text-gray-500 dark:text-gray-400">
              Validando credenciais e termos de uso.
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
            name="i-lucide-file-text"
            class="w-12 h-12 text-primary"
          />
          <div class="text-center">
            <h2 class="text-xl font-semibold mb-2">Termos de Uso</h2>
            <p class="text-gray-600 dark:text-gray-400">
              Aguardando aceite dos termos...
            </p>
          </div>
        </div>

      </div>
    </UPageCard>

    <Teleport to="body">
      <div
        v-if="showTermsModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      >
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        />

        <div
          class="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-800"
        >
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Bem-vindo(a)!
              </h3>
              <p class="text-sm text-gray-500">Para continuar, aceite os termos abaixo.</p>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-gray-900">
            <div
              v-if="loadingTerms"
              class="flex justify-center py-8"
            >
              <UIcon
                name="i-lucide-loader-2"
                class="w-8 h-8 animate-spin"
              />
            </div>
            <TermsViewer
              v-else
              :term="activeTerm"
              :initial-consents="itemConsents"
              @update:consents="handleConsentsUpdate"
            />
          </div>

          <div class="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancelar e Sair"
              @click="handleCancelTerms"
            />
            <UButton
              color="primary"
              label="Concordar e Acessar"
              :disabled="!areTermsAccepted"
              @click="handleConfirmTerms"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
