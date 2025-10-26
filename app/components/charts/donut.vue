<script setup lang="ts">
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import { useDoughnut } from '~/utils/charts/doughnut'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  title: string;
  labels: string[];
  data: number[];
}>()

const chartConfig = useDoughnut(props.labels, props.data)
</script>

<template>
  <UCard
    :ui="{
      header: 'pb-0',
      root: 'divide-none',
      body: 'h-full flex flex-col justify-center',
    }"
    variant="outline"
    class="h-full pb-4"
  >
    <template #header>
      <div class="flex justify-between itens-center">
        <p class="text-xl font-semibold">{{ props.title }}</p>
        <slot name="action"/>
      </div>
    </template>
    <Doughnut
      :data="chartConfig.data"
      :options="chartConfig.options"
      class="h-full max-h-80"
    />
  </UCard>
</template>
