<script setup lang="ts">
const props = defineProps<{
  id: number | string;
  assignedAgent: string;
  company: string;
  createdByUser: string;
  priority: string;
  title: string;
  description: string;
  createdAt: string;
}>()
</script>
<template>
  <UPageCard
    :title="props.title"
    :description="description"
    :to="`/tickets?id=${props.id}`"
    variant="soft"
    class="relative"
    :ui="{
      title: 'line-clamp-1 text-ellipsis mr-10 text-primary',
      description: 'line-clamp-1 text-ellipsis',
    }"
  >
    <UBadge
      :color="useColor(props.priority)"
      variant="soft"
      class="absolute top-4 right-4"
    >
      {{ props.priority }}
    </UBadge>
    <div  class="flex flex-col gap-1">
      <p class="line-clamp-1 text-ellipsis text-sm font-semibold">
        {{ props.assignedAgent }}
      </p>
      <p class="line-clamp-1 text-ellipsis text-sm">
        {{ formatDate(props.createdAt) }}
      </p>
    </div>
  </UPageCard>
</template>
