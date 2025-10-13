<script setup lang="ts">
import { useServer } from '~/services/use-server'
import type { MetricsData } from '~/types/metrics'
import type { DropdownMenuItem } from '@nuxt/ui'

useSeoMeta({
  title: 'Vision Data | Home'
})

const { getMetricsTickets } = useServer()
const metrics = ref<MetricsData | null>(null)

try {
  const response = await getMetricsTickets() as { success: boolean; data: MetricsData }
  metrics.value = response.data
} catch (error) {
  throw createError(error as Error)
}

const chartConfigs = [
  { id: 'tickets-by-tag', label: 'Tickets por tag', icon: 'i-lucide-bar-chart', chartType: 'bar' },
  { id: 'tickets-by-department', label: 'Tickets por departamento', icon: 'i-lucide-bar-chart', chartType: 'bar' },
  { id: 'tickets-by-category', label: 'Tickets por categoria', icon: 'i-lucide-pie-chart', chartType: 'donut' },
  { id: 'tickets-by-channel', label: 'Tickets por canal', icon: 'i-lucide-pie-chart', chartType: 'donut' }
] as const

const selectedBarChart = ref('tickets-by-tag')
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
              {{ metrics?.totalTickets || 0 }}
            </span>
          </div>
        </UCard>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-[13fr_7fr] gap-6 mt-6">
        <div>
          <ChartsBar
            v-if="selectedBarChart === 'tickets-by-tag'"
            title="Tickets por tag"
            :labels="metrics?.metrics.find(m => m.name === 'TicketsByTag')?.values.map(v => v.name) || []"
            :data="metrics?.metrics.find(m => m.name === 'TicketsByTag')?.values.map(v => v.value) || []"
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

          <ChartsBar
            v-else-if="selectedBarChart === 'tickets-by-department'"
            title="Tickets por departamento"
            :labels="metrics?.metrics.find(m => m.name === 'TicketsByDepartment')?.values.map(v => v.name) || []"
            :data="metrics?.metrics.find(m => m.name === 'TicketsByDepartment')?.values.map(v => v.value) || []"
            index-axis="x"
            :y-max="Math.ceil(Math.max(...(metrics?.metrics.find(m => m.name === 'TicketsByDepartment')?.values.map(v => v.value) || [0])) * 1.1)"
          >
            <template #action>
              <DropdownMenu
                :dropdown-items="getMenuItems('bar')"
                :button-label="getChartLabel(selectedBarChart)"
                button-icon="i-lucide-menu"
              />
            </template>
          </ChartsBar>
        </div>

        <div>
          <ChartsDonut
            v-if="selectedDonutChart === 'tickets-by-category'"
            title="Tickets por categoria"
            :labels="metrics?.metrics.find(m => m.name === 'TicketsByCategory')?.values.map(v => v.name) || []"
            :data="metrics?.metrics.find(m => m.name === 'TicketsByCategory')?.values.map(v => v.value) || []"
          >
            <template #action>
              <DropdownMenu
                :dropdown-items="getMenuItems('donut')"
                :button-label="getChartLabel(selectedDonutChart)"
                button-icon="i-lucide-menu"
              />
            </template>
          </ChartsDonut>

          <ChartsDonut
            v-else-if="selectedDonutChart === 'tickets-by-channel'"
            title="Tickets por canal"
            :labels="metrics?.metrics.find(m => m.name === 'TicketsByChannel')?.values.map(v => v.name) || []"
            :data="metrics?.metrics.find(m => m.name === 'TicketsByChannel')?.values.map(v => v.value) || []"
          >
            <template #action>
              <DropdownMenu
                :dropdown-items="getMenuItems('donut')"
                :button-label="getChartLabel(selectedDonutChart)"
                button-icon="i-lucide-menu"
              />
            </template>
          </ChartsDonut>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
