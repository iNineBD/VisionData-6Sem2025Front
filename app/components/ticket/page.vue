<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useServer } from '~/services/use-server'
import type { TicketData } from '~/types/ticket'

const route = useRoute()
const { getTicket } = useServer()
const ticket = ref<TicketData | null>(null)

watchEffect(async () => {
  const id = route.query.id as string | undefined
  if (!id) {
    ticket.value = null
    return
  }
  try {
    const response = await getTicket(id) as TicketData
    ticket.value = response
  } catch (error) {
    ticket.value = null
    throw createError(error as Error)
  }
})
</script>

<template>
  <div class="p-4 flex flex-col gap-4 w-full">
    <UCard v-if="ticket">
      <template #header>
        <h1 class="text-xl font-semibold">
          #{{ ticket.ticket_id }}<span class="font-light text-muted"> - Detalhes do Ticket</span>
        </h1>
      </template>

      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-semibold text-primary">{{ ticket.title }}</h2>
          <p>{{ ticket.description }}</p>
        </div>

        <USeparator />
        <div class="flex flex-col gap-2 items-start">
          <UBadge
            :color="useColor(ticket.priority)"
            variant="soft"
            size="xl"
          >
            Prioridade: {{ ticket.priority }}
          </UBadge>
          <p><strong>Categoria:</strong> {{ ticket.category.name }}</p>
          <p><strong>Subcategoria:</strong> {{ ticket.subcategory.name }}</p>
          <p><strong>Produto:</strong> {{ ticket.product.name }}</p>
          <p><strong>Canal:</strong> {{ ticket.channel }}</p>
          <p><strong>Dispositivo:</strong> {{ ticket.device }}</p>
        </div>

        <USeparator />
        <div class="flex flex-col gap-2">
          <p class="text-lg text-muted uppercase">Responsável</p>
          <UUser
            :name="ticket.assigned_agent.full_name"
            :description="ticket.assigned_agent.email"
            :avatar="{ alt: ticket.assigned_agent.full_name }"
          />
          <p class="text-muted">Departamento: {{ ticket.assigned_agent.department }}</p>
        </div>

        <USeparator />

        <div class="flex flex-col gap-2">
          <p class="text-lg text-muted uppercase">Criado por</p>
          <UUser
            :name="ticket.created_by_user.full_name"
            :description="ticket.created_by_user.email"
            :avatar="{ alt: ticket.created_by_user.full_name }"
          />
          <p class="text-muted">
            VIP: {{ ticket.created_by_user.is_vip ? 'Sim' : 'Não' }}
          </p>
        </div>

        <USeparator />
        <div class="flex flex-col gap-2">
          <p class="text-lg text-muted uppercase">Empresa</p>
          <p><strong>Nome:</strong> {{ ticket.company.name }}</p>
          <p><strong>Segmento:</strong> {{ ticket.company.segment }}</p>
        </div>

        <USeparator />

        <div class="flex flex-col gap-1">
          <p class="text-lg text-muted uppercase">Datas</p>
          <p><strong>Criado em:</strong> {{ formatDate(ticket.dates.created_at) }}</p>
          <p><strong>Primeira resposta:</strong> {{ ticket.dates.first_response_at ? formatDate(ticket.dates.first_response_at) : 'Não registrada' }}</p>
          <p><strong>Fechado em:</strong> {{ ticket.dates.closed_at ? formatDate(ticket.dates.closed_at) : 'Ainda aberto' }}</p>
        </div>

        <USeparator />

        <div class="flex flex-col gap-1">
          <p class="text-lg text-muted uppercase">SLA</p>
          <p><strong>Primeira resposta SLA violada:</strong> {{ ticket.sla_metrics.first_response_sla_breached ? 'Sim' : 'Não' }}</p>
          <p><strong>Resolução SLA violada:</strong> {{ ticket.sla_metrics.resolution_sla_breached ? 'Sim' : 'Não' }}</p>
          <p><strong>Plano SLA:</strong> {{ ticket.sla_plan }}</p>
        </div>
      </div>
    </UCard>

  </div>
</template>
