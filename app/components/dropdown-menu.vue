<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { content } from 'happy-dom/lib/PropertySymbol.js';

const props = defineProps<{
  dropdownItems: DropdownMenuItem[]
  buttonLabel: string
  buttonIcon: string
}>()

const emit = defineEmits<{
  (e: 'toggle-chart', id: string): void
}>()
</script>

<template>
    <UDropdownMenu
      size="lg"
      :items="dropdownItems"
      :content="{
        align: 'end',
        side: 'bottom',
        sideOffset: 8
      }"
      :ui="{ content: 'w-68' }"
    >
      <UButton
       size="lg"
       :label="buttonLabel" 
       :icon="buttonIcon" 
       color="neutral" 
       variant="outline" 
       />
    </UDropdownMenu>
</template>


