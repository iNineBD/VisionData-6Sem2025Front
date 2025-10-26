<script setup lang="ts">
import { useServer } from '~/services/use-server'
import type { TicketsResponse } from '~/types/tickets'

definePageMeta({
  middleware: ['authenticated']
})

useSeoMeta({ title: 'Vision Data | Home' })

const { getTicketsQuery } = useServer()
const route = useRoute()
const router = useRouter()
const id = computed(() => route.query.id as string | undefined)

const search = ref('')
const page = ref(1)
const pageSize = 10
const ticketsResponse = ref<TicketsResponse | null>(null)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function fetchTickets (q?: string) {
  try {
    const response = await getTicketsQuery(page.value, pageSize, q) as TicketsResponse
    ticketsResponse.value = response
  } catch (error) {
    ticketsResponse.value = null
    throw createError(error as Error)
  }
}

await fetchTickets()

function clear () {
  search.value = ''
}

function clearId () {
  router.replace({ query: { ...route.query, id: undefined } })
}

watch(search, (newValue) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  clearId()
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchTickets(newValue)
  }, 500)
})

watch(page, () => fetchTickets(search.value))

</script>
<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar
        title="Tickets"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UFormField
          label="Pesquisar"
          class="w-full md:max-w-sm py-4"
        >
          <div class="flex gap-2 w-full md:max-w-sm">
            <UInput
              v-model="search"
              class="flex-1"
              icon="i-lucide-search"
              placeholder="Ticket ID, título, descrição..."
              :ui="{ trailing: 'pe-1' }"
            >
              <template
                v-if="search?.length"
                #trailing
              >
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-lucide-circle-x"
                  aria-label="Clear input"
                  @click="clear()"
                />
              </template>
            </UInput>
          </div>
        </UFormField>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UCard
        v-if="ticketsResponse?.data?.length && !id"
        :ui="{
          header: 'pb-0',
          root: 'divide-none',
          body: 'pt-2 grid grid-cols-1 h-full',
        }"
        variant="outline"
        class="w-full h-full"
      >
        <div
          class="flex flex-col gap-4 overflow-y-auto items-center w-full"
        >
          <div class="flex flex-col gap-4 overflow-y-auto w-full">
            <TicketCard
              v-for="ticket in ticketsResponse.data"
              :id="ticket.ticket_id"
              :key="ticket.ticket_id"
              :assigned-agent="ticket.assigned_agent.full_name"
              :company="ticket.company.name"
              :created-at="ticket.dates.created_at"
              :created-by-user="ticket.created_by_user.full_name"
              :priority="ticket.priority"
              :title="ticket.title"
              :description="ticket.description"
              class="mr-2"
            />
          </div>

          <UPagination
            v-if="ticketsResponse?.pagination"
            v-model:page="page"
            :total="ticketsResponse.pagination.total_records"
            :page-count="ticketsResponse.pagination.per_page"
            :sibling-count="1"
          />
        </div>
      </UCard>

      <div
        v-if="id"
        class="flex flex-col gap-2 items-start w-full h-full"
      >
        <UButton
          icon="i-lucide-arrow-left"
          size="md"
          variant="link"
          class="hover:underline hover:cursor-pointer"
          @click="clearId()"
        >
          Voltar
        </UButton>
        <TicketPage/>
      </div>


      <UAlert
        v-if="!ticketsResponse?.data?.length && !id"
        class="w-full"
        title="Sem resultados"
        description="Nenhum ticket encontrado."
        icon="material-symbols:database-off-outline-rounded"
        color="neutral"
        variant="outline"
        :ui="{
          icon: 'size-11'
        }"
      />
    </template>
  </UDashboardPanel>
</template>
