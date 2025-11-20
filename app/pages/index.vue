<script setup lang="ts">
import { useServer } from '~/services/use-server'
import type { MetricsData } from '~/types/metrics'
import type { DropdownMenuItem } from '@nuxt/ui'

definePageMeta({
  middleware: ['authenticated']
})

useSeoMeta({
  title: 'Vision Data | Home'
})

const { getMetricsTickets, deleteUser, getMyConsent } = useServer()
const { user, logout } = useAuth()
const toast = useToast()
const metrics = ref<MetricsData | null>(null)
const loadingMetrics = ref(true)
const showDeleteModal = ref(false)
const deletingUser = ref(false)
const showTermModal = ref(false)
const loadingTerm = ref(false)
const consentData = ref<any>(null)

onMounted(async () => {
  try {
    const response = await getMetricsTickets() as { success: boolean; data: MetricsData }
    metrics.value = response.data
  } catch (error) {
    console.error('Error loading metrics:', error)
    throw createError(error as Error)
  } finally {
    loadingMetrics.value = false
  }
})

const chartConfigs = [
  { id: 'tickets-by-tag', label: 'Tag', icon: 'i-lucide-bar-chart', chartType: 'bar' },
  { id: 'tickets-by-department', label: 'Departamento', icon: 'i-lucide-bar-chart', chartType: 'bar' },
  { id: 'tickets-by-category', label: 'Categoria', icon: 'i-lucide-pie-chart', chartType: 'donut' },
  { id: 'tickets-by-channel', label: 'Canal', icon: 'i-lucide-pie-chart', chartType: 'donut' }
] as const

const selectedBarChart = ref('tickets-by-department')
const selectedDonutChart = ref('tickets-by-category')

const getMenuItems = (type: 'bar' | 'donut'): DropdownMenuItem[] =>
  chartConfigs
    .filter(c => c.chartType === type)
    .map(c => {
      const isSelected =
        (type === 'bar' && selectedBarChart.value === c.id) ||
        (type === 'donut' && selectedDonutChart.value === c.id)

      return {
        label: c.label,
        icon: c.icon,
        onSelect: () => {
          if (type === 'bar') selectedBarChart.value = c.id
          else selectedDonutChart.value = c.id
        },
        suffix: isSelected ? 'i-lucide-check' : '',
        disabled: isSelected,
        ui: {
          itemLeadingIcon: isSelected
            ? 'text-primary-500 dark:text-primary-400'
            : 'text-gray-400 dark:text-gray-600'
        }
      }
    })

const getChartLabel = (id: string) => {
  const found = chartConfigs.find(c => c.id === id)
  return found?.label ?? 'Selecionar'
}

const handleDeleteAccount = async () => {
  if (!user.value?.id) {
    toast.add({
      title: 'Erro',
      description: 'Usuário não identificado',
      color: 'error'
    })
    return
  }

  try {
    deletingUser.value = true
    const response = await deleteUser(user.value.id)

    if (response.success) {
      toast.add({
        title: 'Conta excluída',
        description: 'Sua conta foi excluída com sucesso',
        color: 'success'
      })

      // Aguarda 1 segundo antes de fazer logout
      setTimeout(async () => {
        await logout()
        await navigateTo('/login')
      }, 1000)
    } else {
      throw new Error(response.message || 'Erro ao excluir conta')
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    toast.add({
      title: 'Erro',
      description: error instanceof Error ? error.message : 'Erro ao excluir conta',
      color: 'error'
    })
  } finally {
    deletingUser.value = false
    showDeleteModal.value = false
  }
}

// Função para visualizar o termo
async function viewMyTerm () {
  loadingTerm.value = true
  showTermModal.value = true
  try {
    const response = await getMyConsent()
    if (response.success) {
      consentData.value = response.data
    } else {
      toast.add({
        title: 'Erro',
        description: response.message || 'Não foi possível carregar o termo',
        color: 'error'
      })
      showTermModal.value = false
    }
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error?.data?.message || 'Erro ao carregar o termo',
      color: 'error'
    })
    showTermModal.value = false
  } finally {
    loadingTerm.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar
        title="Home"
        class="!max-w-none"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex gap-2">
            <UButton
              color="primary"
              variant="ghost"
              icon="i-lucide-file-text"
              label="Meu Termo"
              size="sm"
              @click="viewMyTerm"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-user-x"
              label="Excluir Usuário"
              size="sm"
              class="sm:inline-flex"
              @click="showDeleteModal = true"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>    <template #body>
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <template v-if="loadingMetrics">
          <div class="xl:col-span-2">
            <UCard
              :ui="{ header: 'pb-0', root: 'divide-none' }"
              variant="outline"
            >
              <template #header>
                <USkeleton class="h-6 w-40" />
              </template>
              <UPageGrid class="lg:grid-cols-4 gap-4 lg:gap-6 pt-2">
                <UCard
                  v-for="n in 4"
                  :key="'mini-card-' + n"
                  :ui="{ header: 'pb-0', root: 'divide-none', body: 'pt-2! h-full' }"
                  variant="outline"
                  class="bg-gradient-to-tl from-primary/10 from-5% to-default h-full"
                >
                  <template #header>
                    <USkeleton class="h-4.5 w-32" />
                  </template>
                  <div class="flex items-center gap-2 h-full">
                    <USkeleton class="h-10 w-28" />
                  </div>
                </UCard>
              </UPageGrid>
            </UCard>
          </div>

          <UCard
            :ui="{ header: 'pb-0', root: 'divide-none', body: 'pt-2!' }"
            variant="outline"
            class="flex flex-col justify-between mt-1 h-full"
          >
            <template #header>
              <USkeleton class="h-6 w-40" />
            </template>
            <div class="flex items-center gap-2">
              <USkeleton class="h-20 w-40" />
            </div>
          </UCard>

          <!-- Skeleton ChartsBar -->
          <UCard
            class="xl:col-span-2 h-full pb-4"
            :ui="{ header: 'pb-0', root: 'divide-none', body: 'h-full flex flex-col justify-center' }"
            variant="outline"
          >
            <div class="flex justify-between items-center mb-4">
              <USkeleton class="h-6 w-40" />
              <USkeleton class="h-7 w-24 rounded-md" />
            </div>
            <USkeleton class="min-h-[19.5rem] w-full rounded-md" />
          </UCard>

          <!-- Skeleton ChartsDonut -->
          <UCard
            class="h-full pb-4"
            :ui="{ header: 'pb-0', root: 'divide-none', body: 'h-full flex flex-col justify-center' }"
            variant="outline"
          >
            <div class="flex justify-between items-center mb-4">
              <USkeleton class="h-6 w-40" />
              <USkeleton class="h-7 w-24 rounded-md" />
            </div>
            <USkeleton class="min-h-[19.5rem] w-full rounded-md" />
          </UCard>
        </template>

        <template v-else>
          <!-- ChartsNumbers -->
          <ChartsNumbers
            class="xl:col-span-2"
            title="Tickets por prioridade"
            :labels="metrics?.metrics.find(m => m.name === 'TicketsByPriority')?.values.map(v => v.name) || []"
            :data="metrics?.metrics.find(m => m.name === 'TicketsByPriority')?.values.map(v => v.value) || []"
          />

          <UCard
            :ui="{ header: 'pb-0', root: 'divide-none', body: 'pt-2!' }"
            variant="outline"
          >
            <template #header>
              <p class="text-xl">Total de tickets</p>
            </template>
            <div class="flex items-center gap-2">
              <span class="text-6xl lg:text-6xl xl:text-8xl 2xl:text-9xl font-semibold text-primary-300 dark:text-primary-800">
                {{ (metrics?.totalTickets ?? 0).toLocaleString('pt-BR') }}
              </span>
            </div>
          </UCard>

          <!-- ChartsBar -->
          <ChartsBar
            :key="selectedBarChart"
            class="xl:col-span-2"
            title="Tickets"
            :labels="metrics?.metrics.find(m => m.name === (selectedBarChart === 'tickets-by-tag' ? 'TicketsByTag' : 'TicketsByDepartment'))?.values.map(v => v.name) || []"
            :data="metrics?.metrics.find(m => m.name === (selectedBarChart === 'tickets-by-tag' ? 'TicketsByTag' : 'TicketsByDepartment'))?.values.map(v => v.value) || []"
            index-axis="x"
          >
            <template #action>
              <DropdownMenu
                :dropdown-items="getMenuItems('bar')"
                :button-label="getChartLabel(selectedBarChart)"
                button-icon="i-lucide-menu"
              />
            </template>
          </ChartsBar>

          <!-- ChartsDonut -->
          <ChartsDonut
            :key="selectedDonutChart"
            title="Tickets"
            :labels="metrics?.metrics.find(m => m.name === (selectedDonutChart === 'tickets-by-category' ? 'TicketsByCategory' : 'TicketsByChannel'))?.values.map(v => v.name) || []"
            :data="metrics?.metrics.find(m => m.name === (selectedDonutChart === 'tickets-by-category' ? 'TicketsByCategory' : 'TicketsByChannel'))?.values.map(v => v.value) || []"
          >
            <template #action>
              <DropdownMenu
                :dropdown-items="getMenuItems('donut')"
                :button-label="getChartLabel(selectedDonutChart)"
                button-icon="i-lucide-menu"
              />
            </template>
          </ChartsDonut>
        </template>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Card Flutuante de Confirmação de Exclusão -->
  <div
    v-if="showDeleteModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="showDeleteModal = false"
  >
    <UCard class="max-w-md mx-4 shadow-xl">
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon
            name="i-lucide-alert-triangle"
            class="w-6 h-6 text-error"
          />
          <h3 class="text-lg font-semibold">
            Excluir Conta
          </h3>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Tem certeza que deseja excluir sua conta? Esta ação é <strong>irreversível</strong> e todos os seus dados serão permanentemente removidos.
        </p>
        
        <UAlert
          icon="i-lucide-info"
          color="warning"
          variant="soft"
          title="Atenção"
          description="Você será desconectado automaticamente após a exclusão."
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancelar"
            :disabled="deletingUser"
            @click="showDeleteModal = false"
          />
          <UButton
            color="error"
            :loading="deletingUser"
            label="Confirmar Exclusão"
            @click="handleDeleteAccount"
          />
        </div>
      </template>
    </UCard>
  </div>

  <!-- Modal de Visualização do Termo -->
  <div
    v-if="showTermModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="showTermModal = false"
  >
    <UCard class="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <template #header>
        <div class="flex justify-between items-start">
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
              {{ loadingTerm ? 'Carregando...' : consentData?.term?.title }}
            </h2>
            <p v-if="!loadingTerm && consentData?.term" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Versão {{ consentData.term.version }} • Aceito em {{ formatDate(consentData.consentDate) }}
            </p>
          </div>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="showTermModal = false"
          />
        </div>
      </template>

      <div v-if="loadingTerm" class="flex justify-center items-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <div v-else-if="consentData" class="overflow-y-auto space-y-6 px-1">
        <!-- Informações do Termo -->
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ consentData.term.description }}
            </p>
          </div>

          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Conteúdo do Termo
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {{ consentData.term.content }}
            </p>
          </div>
        </div>

        <!-- Itens de Consentimento -->
        <div v-if="consentData.term.items && consentData.term.items.length > 0">
          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Itens de Consentimento ({{ consentData.term.items.length }})
          </h3>
          <div class="space-y-3">
            <UCard
              v-for="item in consentData.term.items"
              :key="item.id"
              class="bg-gray-50 dark:bg-gray-800"
            >
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {{ item.itemOrder }}. {{ item.title }}
                  </h4>
                  <UBadge
                    :color="item.isMandatory ? 'error' : 'neutral'"
                    variant="soft"
                    size="xs"
                  >
                    {{ item.isMandatory ? 'Obrigatório' : 'Opcional' }}
                  </UBadge>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ item.content }}
                </p>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Informações Adicionais -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Data de Vigência</p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ formatDate(consentData.term.effectiveDate) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <UBadge
              :color="consentData.hasActiveConsent ? 'success' : 'neutral'"
              variant="soft"
            >
              {{ consentData.hasActiveConsent ? 'Ativo' : 'Inativo' }}
            </UBadge>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            label="Fechar"
            @click="showTermModal = false"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
