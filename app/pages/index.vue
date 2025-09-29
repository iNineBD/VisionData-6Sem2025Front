<script setup lang="ts">
import { useServer } from '~/services/use-server'
import type { MetricsData } from '~/types/metrics'
import type { TicketsData } from '~/types/tickets'

useSeoMeta({
  title: 'Vision Data | Home'
})

const { getMetricsTickets, getTicketsQuery } = useServer()

const metrics = ref<MetricsData | null>(null)
const tickets = ref<TicketsData | null>(null)

try {
  const response = await getMetricsTickets() as { success: boolean; data: MetricsData }
  metrics.value = response.data
} catch (error) {
  throw createError(error as Error)
}

try {
  const response = await getTicketsQuery(1, 10) as { success: boolean; data: TicketsData }
  tickets.value = response.data
} catch (error) {
  throw createError(error as Error)
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
          :ui="{
            header: 'pb-0',
            root: 'divide-none',
            body: 'pt-2!',
          }"
          variant="outline"
        >
          <template #header>
            <p class="text-xl">
              Total de tickets
            </p>
          </template>
          <div class="flex items-center gap-2">
            <span class="text-6xl lg:text-6xl xl:text-8xl  2xl:text-9xl font-semibold text-primary-300 dark:text-primary-800">
              {{ metrics?.totalTickets || 0 }}
            </span>
          </div>
        </UCard>
        <ChartsBar
          title="Tickets por tag"
          :labels="metrics?.metrics.find(m => m.name === 'TicketsByTag')?.values.map(v => v.name) || []"
          :data="metrics?.metrics.find(m => m.name === 'TicketsByTag')?.values.map(v => v.value) || []"
          index-axis="x"
        />
        <ChartsDonut
          title="Tickets por categoria"
          :labels="metrics?.metrics.find(m => m.name === 'TicketsByCategory')?.values.map(v => v.name) || []"
          :data="metrics?.metrics.find(m => m.name === 'TicketsByCategory')?.values.map(v => v.value) || []"
        />

        <UCard
          :ui="{
            header: 'xl:pb-0',
            root: 'divide-none',
            body: 'pt-2',
          }"
          variant="outline"
          class="w-full"
        >
          <template #header>
            <div  class="flex flex-row w-full justify-between">
              <p class="text-xl">
                Tickets
              </p>
              <UButton
                trailing-icon="i-lucide-arrow-right"
                size="md"
                color="primary"
                variant="soft"
                to="/tickets"
              >
                Ver todos
              </UButton>
            </div>
          </template>
          <div class="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto w-full pr-2">
            <TicketCard
              v-for="ticket in (Array.isArray(tickets) ? tickets : [tickets]).filter(Boolean)"
              :id="ticket.ticket_id"
              :key="ticket.ticket_id"
              :assigned-agent="ticket.assigned_agent.full_name"
              :company="ticket.company.name"
              :created-at="ticket.dates.created_at"
              :created-by-user="ticket.created_by_user.full_name"
              :priority="ticket.priority"
              :title="ticket.title"
              :description="ticket.description"
            />
          </div>
        </UCard>
        <ChartsBar
          class="xl:col-span-2"
          title="Tickets por departamento"
          :labels="metrics?.metrics.find(m => m.name === 'TicketsByDepartment')?.values.map(v => v.name) || []"
          :data="metrics?.metrics.find(m => m.name === 'TicketsByDepartment')?.values.map(v => v.value) || []"
          index-axis="x"
          :y-max="Math.ceil((Math.max(...(metrics?.metrics.find(m => m.name === 'TicketsByDepartment')?.values.map(v => v.value) || [0])) * 1.1))"
        />
        <ChartsDonut
          title="Tickets por canal"
          :labels="metrics?.metrics.find(m => m.name === 'TicketsByChannel')?.values.map(v => v.name) || []"
          :data="metrics?.metrics.find(m => m.name === 'TicketsByChannel')?.values.map(v => v.value) || []"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
