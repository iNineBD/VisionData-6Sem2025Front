<script setup lang="ts">
import type { Term, TermListItem } from '~/types/terms'

definePageMeta({
  middleware: 'authenticated',
  layout: 'default',
  title: 'Gerenciamento de Termos'
})

useHead({
  title: 'Gerenciamento de Termos - VisionData'
})

const { user } = useAuth()
const { getActiveTerm, getAllTerms } = useServer()

// Verifica se o usuário é ADMIN (role 1 ou 'ADMIN')
const isAdmin = computed(() => {
  const userType = user.value?.userType
  return userType === 1 || userType === 'ADMIN'
})

const loading = ref(true)
const activeTerm = ref<Term | null>(null)
const allTerms = ref<TermListItem[]>([])
const showCreateModal = ref(false)
const dataLoaded = ref(false)

// Estatísticas
const stats = computed(() => {
  return {
    total: Array.isArray(allTerms.value) ? allTerms.value.length : 0,
    active: Array.isArray(allTerms.value) ? allTerms.value.filter(t => t.isActive).length : 0,
    inactive: Array.isArray(allTerms.value) ? allTerms.value.filter(t => !t.isActive).length : 0
  }
})

// Carrega todos os termos para estatísticas
async function loadAllTerms () {
  try {
    const response = await getAllTerms()
    if (response.success && response.data?.terms && Array.isArray(response.data.terms)) {
      allTerms.value = [...response.data.terms]
    } else {
      allTerms.value = []
    }
  } catch (error) {
    console.error('Error loading terms:', error)
    allTerms.value = []
  }
}

// Carrega termo ativo
async function loadActiveTerm () {
  try {
    loading.value = true
    const response = await getActiveTerm()
    if (response.success) {
      activeTerm.value = response.data
      dataLoaded.value = true
    }
  } catch (error: unknown) {
    // Se for 404, significa que não há termo ativo, o que é esperado
    const statusCode = (error as { statusCode?: number })?.statusCode
    if (statusCode !== 404) {
      console.error('Error loading active term:', error)
    }
    activeTerm.value = null
  } finally {
    loading.value = false
  }
}

// Carrega dados quando o user estiver disponível E tiver token
const { getToken } = useAuth()
watch(user, async (newUser) => {
  // Evita carregar múltiplas vezes
  if (dataLoaded.value) {
    return
  }

  if (newUser && isAdmin.value) {
    // Aguarda o token estar disponível antes de fazer requisições
    const token = await getToken()
    if (token) {
      await Promise.all([loadActiveTerm(), loadAllTerms()])
    }
  } else if (newUser && !isAdmin.value) {
    // Se o usuário não é admin, redireciona
    await navigateTo('/')
  }
}, { immediate: true })

// Handler para sucesso na criação
async function handleCreateSuccess () {
  showCreateModal.value = false
  dataLoaded.value = false // Permite recarregar
  await Promise.all([loadActiveTerm(), loadAllTerms()])
}
</script>

<template>
  <div
    v-if="!user"
    class="flex items-center justify-center min-h-screen"
  >
    <UIcon
      name="i-lucide-loader-2"
      class="w-8 h-8 animate-spin"
    />
  </div>
  <div
    v-else
    class="w-full h-full overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6"
  >
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ showCreateModal ? 'Criar Novo Termo' : 'Gerenciamento de Termos' }}
        </h1>
        <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ showCreateModal ? 'Preencha as informações para criar um novo termo' : 'Visualize e gerencie o termo ativo do sistema' }}
        </p>
      </div>

      <UButton
        :icon="showCreateModal ? 'i-lucide-arrow-left' : 'i-lucide-plus'"
        size="lg"
        :color="showCreateModal ? 'neutral' : 'primary'"
        class="w-full sm:w-auto"
        @click="showCreateModal = !showCreateModal"
      >
        {{ showCreateModal ? 'Voltar' : 'Novo Termo' }}
      </UButton>
    </div>

    <!-- Formulário de Criação -->
    <div v-if="showCreateModal">
      <UCard>
        <AdminCreateTermForm
          @success="handleCreateSuccess"
          @cancel="showCreateModal = false"
        />
      </UCard>
    </div>

    <!-- Conteúdo Principal (Oculto quando está criando) -->
    <div
      v-else
      class="space-y-4 sm:space-y-6"
    >
      <!-- Estatísticas -->
      <div class="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Total de Termos
            </p>
            <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {{ stats.total }}
            </p>
          </div>
          <UIcon
            name="i-lucide-file-text"
            class="h-6 w-6 sm:h-8 sm:w-8 text-blue-500"
          />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Termos Ativos
            </p>
            <p class="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {{ stats.active }}
            </p>
          </div>
          <UIcon
            name="i-lucide-check-circle"
            class="h-6 w-6 sm:h-8 sm:w-8 text-green-500"
          />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Termos Inativos
            </p>
            <p class="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
              {{ stats.inactive }}
            </p>
          </div>
          <UIcon
            name="i-lucide-x-circle"
            class="h-6 w-6 sm:h-8 sm:w-8 text-gray-500"
          />
        </div>
      </UCard>
    </div>

    <!-- Termo Ativo -->
    <div class="space-y-3 sm:space-y-4">
      <h2 class="text-lg sm:text-xl font-bold">
        Termo Ativo
      </h2>
      <UCard v-if="activeTerm">
        <template #header>
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <h2 class="text-lg sm:text-xl font-semibold">
                {{ activeTerm.title }}
              </h2>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ activeTerm.description }}
              </p>
            </div>
            <UBadge
              color="success"
              variant="soft"
              size="lg"
            >
              Versão {{ activeTerm.version }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-4 sm:space-y-6">
          <!-- Informações -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Data de Vigência
              </p>
              <p class="text-sm font-semibold">
                {{ new Date(activeTerm.effectiveDate).toLocaleDateString('pt-BR') }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Criado em
              </p>
              <p class="text-sm font-semibold">
                {{ new Date(activeTerm.createdAt).toLocaleDateString('pt-BR') }}
              </p>
            </div>
          </div>

          <!-- Conteúdo -->
          <div>
            <h3 class="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
              Conteúdo do Termo
            </h3>
            <div class="prose prose-sm sm:prose dark:prose-invert max-w-none p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p class="whitespace-pre-wrap text-xs sm:text-sm">
                {{ activeTerm.content }}
              </p>
            </div>
          </div>

          <!-- Itens de Consentimento -->
          <div>
            <h3 class="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
              Itens de Consentimento ({{ activeTerm.items.length }})
            </h3>
            <div class="space-y-2 sm:space-y-3">
              <UCard
                v-for="item in activeTerm.items"
                :key="item.id"
              >
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <span class="text-xs sm:text-sm font-semibold">{{ item.title }}</span>
                      <UBadge
                        :color="item.isMandatory ? 'error' : 'neutral'"
                        variant="soft"
                        size="xs"
                      >
                        {{ item.isMandatory ? 'Obrigatório' : 'Opcional' }}
                      </UBadge>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      {{ item.content }}
                    </p>
                  </div>
                  <span class="text-xs text-gray-500 whitespace-nowrap">
                    Ordem: {{ item.itemOrder }}
                  </span>
                </div>
              </UCard>
            </div>
          </div>
        </div>
      </UCard>

      <UAlert
        v-else
        icon="i-lucide-alert-circle"
        color="warning"
        variant="soft"
        title="Nenhum termo ativo"
        description="Não há nenhum termo de uso ativo no momento."
        class="text-sm"
      />
    </div>

    <!-- Tabela de Todos os Termos -->
    <div class="space-y-3 sm:space-y-4">
      <h2 class="text-lg sm:text-xl font-bold">
        Todos os Termos ({{ allTerms.length }})
      </h2>
      <UCard>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                  ID
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                  Versão
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                  Título
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                  Descrição
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                  Ativo
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                  Criado em
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="term in allTerms"
                :key="term.id"
                class="hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors duration-150"
                :class="term.isActive ? 'bg-green-50/30 dark:bg-green-950/10' : ''"
              >
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ term.id }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <UBadge
                    color="primary"
                    variant="soft"
                    size="sm"
                  >
                    v{{ term.version }}
                  </UBadge>
                </td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ term.title }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  <span class="line-clamp-2">{{ term.description }}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <UBadge
                    :color="term.isActive ? 'success' : 'neutral'"
                    variant="soft"
                    size="sm"
                  >
                    <span class="flex items-center gap-1">
                      <UIcon
                        :name="term.isActive ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
                        class="w-3 h-3"
                      />
                      {{ term.isActive ? 'Ativo' : 'Inativo' }}
                    </span>
                  </UBadge>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {{ new Date(term.createdAt).toLocaleDateString('pt-BR') }}
                </td>
              </tr>
            </tbody>
          </table>
          <div
            v-if="allTerms.length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400"
          >
            Nenhum termo encontrado
          </div>
        </div>
      </UCard>
    </div>
    </div>
  </div>
</template>
