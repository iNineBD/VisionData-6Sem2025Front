<script setup lang="ts">
import { useServer } from '~/services/use-server'
import type { MetricsData } from '~/types/metrics'
import type { DropdownMenuItem } from '@nuxt/ui'

useSeoMeta({
  title: 'Vision Data | Home'
})

const { getMetricsTickets } = useServer()
const metrics = ref<MetricsData | null>(null)
const loadingMetrics = ref(true)

onMounted(async () => {
  try {
    const response = await getMetricsTickets() as { success: boolean; data: MetricsData }
    metrics.value = response.data
  } catch (error) {
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
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar
        title="Home"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
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
              <USkeleton class="h- w-40" />
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
            :data="metrics?.metrics.find(m => m.name === 'TicketsByPriority')?.values.map(v => new Intl.NumberFormat('pt-BR').format(v.value)) || []"
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
</template>
