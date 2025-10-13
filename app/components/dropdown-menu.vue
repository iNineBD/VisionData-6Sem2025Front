<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { dropdownItems, buttonLabel, buttonIcon } = defineProps<{
  dropdownItems: DropdownMenuItem[]
  buttonLabel: string
  buttonIcon: string
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
      :ui="{
        leadingIcon: 'text-primary-500 dark:text-primary-400'
      }"
    />
  </UDropdownMenu>
</template>


