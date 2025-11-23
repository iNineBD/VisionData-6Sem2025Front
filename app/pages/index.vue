<script setup lang="ts">
import { useServer } from '~/services/use-server'
import type { MetricsData } from '~/types/metrics'
import type { DropdownMenuItem } from '@nuxt/ui'
import ChartsDonut from '~/components/charts/donut.vue'
import TemporalLine from '~/components/charts/temporal-line.vue'
import type { TicketsPorAnoMesResponse, TicketsPorPrioridadeResponse, TicketsPorStatusResponse, MeanTimeByPriorityResponse } from '~/types/temporalMetrics'

definePageMeta({
  middleware: ['authenticated']
})

useSeoMeta({
  title: 'Vision Data | Home'
})

// Instancia a configuração para pegar as variáveis de ambiente
const config = useRuntimeConfig()

// CORREÇÃO: Todas as funções do useServer unificadas aqui para evitar declaração duplicada
const {
  getMetricsTickets,
  getMyConsent,
  getMetricsTicketsQtdTicketsByMonth,
  getMetricsTicketsQtdTicketsByPriorityYearMonth,
  getMetricsTicketsQtdTicketsByStatusYearMonth,
  getMetricsTicketsMeanTimeResolutionByPriority,
  exportMetricsPdf
} = useServer()

const { user } = useAuth()
const toast = useToast()
const metrics = ref<MetricsData | null>(null)
const loadingMetrics = ref(true)
const showTermModal = ref(false)
const loadingTerm = ref(false)
const consentData = ref<any>(null)

// Verifica se é admin para mostrar o botão de Logs
const isAdmin = computed(() => {
  const userType = user.value?.userType
  return userType === 1 || userType === 'ADMIN'
})

const qtdTicketsByMonth = ref<TicketsPorAnoMesResponse | null>(null)
const qtdTicketsByPriority = ref<TicketsPorPrioridadeResponse | null>(null)
const qtdTicketsByStatus = ref<TicketsPorStatusResponse | null>(null)
const meanTimeByPriority = ref<MeanTimeByPriorityResponse | null>(null)


onMounted(async () => {
  loadingMetrics.value = true
  try {
    const [
      metricsRes,
      qtdMonthRes,
      qtdPriorityRes,
      qtdStatusRes,
      meanTimeRes
    ] = await Promise.all([
      getMetricsTickets(),
      getMetricsTicketsQtdTicketsByMonth(),
      getMetricsTicketsQtdTicketsByPriorityYearMonth(),
      getMetricsTicketsQtdTicketsByStatusYearMonth(),
      getMetricsTicketsMeanTimeResolutionByPriority()
    ])

    metrics.value = (metricsRes as { data: MetricsData }).data
    qtdTicketsByMonth.value = qtdMonthRes as TicketsPorAnoMesResponse
    qtdTicketsByPriority.value = qtdPriorityRes as TicketsPorPrioridadeResponse
    qtdTicketsByStatus.value = qtdStatusRes as TicketsPorStatusResponse
    meanTimeByPriority.value = meanTimeRes as MeanTimeByPriorityResponse
  } catch (error) {
    console.error('Erro ao carregar métricas:', error)
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
  { id: 'tickets-by-channel', label: 'Canal', icon: 'i-lucide-pie-chart', chartType: 'donut' },

  { id: 'tickets-by-month-over-time', label: 'Tickets por Mês/Ano', icon: 'i-lucide-line-chart', chartType: 'line' },
  { id: 'tickets-by-priority-over-time', label: 'Tickets por Prioridade Mês/Ano', icon: 'i-lucide-line-chart', chartType: 'line' },
  { id: 'tickets-by-status-over-time', label: 'Tickets por Status Mês/Ano', icon: 'i-lucide-line-chart', chartType: 'line' }
] as const

const selectedBarChart = ref('tickets-by-department')
const selectedDonutChart = ref('tickets-by-category')
const selectedLineChart = ref('tickets-by-month-over-time')

const getMenuItems = (type: 'bar' | 'donut' | 'line'): DropdownMenuItem[] =>
  chartConfigs
    .filter(c => c.chartType === type)
    .map(c => {
      const isSelected =
        (type === 'bar' && selectedBarChart.value === c.id) ||
        (type === 'donut' && selectedDonutChart.value === c.id) ||
        (type === 'line' && selectedLineChart.value === c.id)

      return {
        label: c.label,
        icon: c.icon,
        onSelect: () => {
          if (type === 'bar') selectedBarChart.value = c.id
          else if (type === 'donut') selectedDonutChart.value = c.id
          else selectedLineChart.value = c.id
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

const priorityLevels = ['Baixa', 'Média', 'Alta', 'Crítica'] as const

const statusKeys = ['Aberto', 'Aguardando Cliente', 'Em Atendimento', 'Fechado', 'Resolvido'] as const

const getMonthsFromData = (data: Record<string, Record<string, Record<string, number>[]>>): string[] => {
  const yearsSet = new Set<string>()
  Object.values(data).forEach((groupByYear) => {
    Object.keys(groupByYear ?? {}).forEach((y) => yearsSet.add(y))
  })

  const years = Array.from(yearsSet).map(y => Number(y)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b).map(String)
  if (!years.length) return []

  const mesesOrder = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

  const labels: string[] = []
  years.forEach((year) => {
    mesesOrder.forEach((m) => labels.push(`${m.slice(0, 3)}/${year}`))
  })

  return labels
}

const monthShortToFull: Record<string, string> = {
  jan: 'janeiro',
  fev: 'fevereiro',
  mar: 'marco',
  abr: 'abril',
  mai: 'maio',
  jun: 'junho',
  jul: 'julho',
  ago: 'agosto',
  set: 'setembro',
  out: 'outubro',
  nov: 'novembro',
  dez: 'dezembro'
}

const getDatasetFromData = (data: Record<string, Record<string, Record<string, number>[]>>, keys: string[], labels: string[]) => {
  return keys.map((key) => ({
    label: key,
    data: labels.map((labelStr) => {
      const parts = labelStr.split('/')
      const monthShort = (parts[0] ?? '').toLowerCase()
      const year = parts[1] ?? ''
      const group = data[key] ?? {}
      const yearArray = group[year] ?? []
      const yearObj = (Array.isArray(yearArray) && yearArray.length) ? yearArray[0] : {}
      const fullMonth = monthShortToFull[monthShort] ?? monthShort
      return (yearObj as Record<string, number>)[fullMonth] ?? 0
    })
  }))
}

const lineChartData = computed(() => {
  if (!qtdTicketsByPriority.value || !qtdTicketsByStatus.value) {
    return { labels: [], datasets: [] }
  }

  if (selectedLineChart.value === 'tickets-by-priority-over-time') {
    const data = qtdTicketsByPriority.value.data
    const months = getMonthsFromData(data)
    const datasets = getDatasetFromData(data, Array.from(priorityLevels), months)
    return { labels: months, datasets }
  }

  if (selectedLineChart.value === 'tickets-by-status-over-time') {
    const data = qtdTicketsByStatus.value.data
    const months = getMonthsFromData(data)
    const datasets = getDatasetFromData(data, Array.from(statusKeys), months)
    return { labels: months, datasets }
  }

  if (selectedLineChart.value === 'tickets-by-month-over-time') {
    const labels = barMonths.value
    const datasets = [{ label: 'Tickets', data: barData.value }]
    return { labels, datasets }
  }

  return { labels: [], datasets: [] }


})

const formattedMeanTimeLabels = computed(() => {
  return meanTimeByPriority.value?.data?.map(p => p.priorityName) ?? []
})

const formattedMeanTimeData = computed(() => {
  return meanTimeByPriority.value?.data?.map(p => {
    const hours = typeof p.meanTimeHour === 'number' ? p.meanTimeHour : Number(p.meanTimeHour ?? 0)
    const days = Math.floor(hours / 24)
    return `${hours.toFixed(2)}h / ${days}d`
  }) ?? []
})

const barMonths = computed(() => {
  const data = qtdTicketsByMonth.value?.data
  if (!data) return []
  const years = Object.keys(data).map(y => Number(y)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b).map(String)
  if (!years.length) return []
  const mesesOrder = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  const labels: string[] = []
  years.forEach((year) => {
    mesesOrder.forEach((m) => labels.push(`${m.slice(0, 3)}/${year}`))
  })
  return labels
})

const barData = computed(() => {
  const data = qtdTicketsByMonth.value?.data
  if (!data) return []
  return barMonths.value.map((labelStr) => {
    const parts = labelStr.split('/')
    const monthShort = (parts[0] ?? '').toLowerCase()
    const year = parts[1] ?? ''
    const yearArray = data[year] ?? []
    const yearObj = (Array.isArray(yearArray) && yearArray.length) ? yearArray[0] : {}
    const fullMonth = monthShortToFull[monthShort] ?? monthShort
    return (yearObj as Record<string, number>)[fullMonth] ?? 0
  })
})

const exportingMetrics = ref(false)

const handleExportMetrics = async () => {
  try {
    exportingMetrics.value = true
    const blob = await exportMetricsPdf()

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_metrics_${new Date()
      .toLocaleDateString('pt-BR')
      .replace(/\//g, '-')}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Erro ao exportar métricas:', e)
  } finally {
    exportingMetrics.value = false
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
          <UTooltip text="Exportar relatório de métricas (PDF)">
            <UButton
              icon="i-lucide-file-down"
              color="primary"
              variant="soft"
              :loading="exportingMetrics"
              @click="handleExportMetrics"
            >
              Exportar PDF
            </UButton>
          </UTooltip>

          <div class="flex gap-2">
            <UButton
              v-if="isAdmin"
              color="neutral"
              variant="ghost"
              icon="i-lucide-scroll-text"
              label="Logs"
              size="sm"
              :to="config.public.kibanaLogsUrl"
              target="_blank"
            />

            <UButton
              color="primary"
              variant="ghost"
              icon="i-lucide-file-text"
              label="Meu Termo"
              size="sm"
              @click="viewMyTerm"
            />
          </div></template>
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

          <TemporalLine
            :key="selectedLineChart"
            class="xl:col-span-2"
            :title="getChartLabel(selectedLineChart)"
            :labels="lineChartData.labels"
            :datasets="lineChartData.datasets"
            :max-height="['tickets-by-month-over-time','tickets-by-priority-over-time','tickets-by-status-over-time'].includes(selectedLineChart) ? 'max-h-72' : undefined"
          >
            <template #action>
              <DropdownMenu
                :dropdown-items="getMenuItems('line')"
                :button-label="getChartLabel(selectedLineChart)"
                button-icon="i-lucide-menu"
              />
            </template>
          </TemporalLine>

          <ChartsNumbers
            class="xl:col-span-1"
            title="Tempo médio de resolução por prioridade"
            :labels="formattedMeanTimeLabels"
            :data="formattedMeanTimeData.map(s => s.replace(' / ', '||'))"
            :cols="1"
          />
        </template>
      </div>
    </template>
  </UDashboardPanel>

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
            <p
              v-if="!loadingTerm && consentData?.term"
              class="text-sm text-gray-600 dark:text-gray-400 mt-1"
            >
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

      <div
        v-if="loadingTerm"
        class="flex justify-center items-center py-12"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-8 h-8 animate-spin text-primary"
        />
      </div>

      <div
        v-else-if="consentData"
        class="overflow-y-auto space-y-6 px-1"
      >
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
