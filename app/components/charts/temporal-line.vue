<script setup lang="ts">
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { computed } from 'vue'
import { universalColors } from '~/utils/charts/colors'

import type { ChartDataset, ChartOptions } from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

const props = defineProps<{
  title?: string
  labels: string[]
  datasets: Array<{ label: string; data: number[]; borderColor?: string; backgroundColor?: string }>
  maxHeight?: string
}>()

const chartConfig = computed(() => {
  const ds: ChartDataset<'line'>[] = props.datasets.map((d, i) => ({
    label: d.label,
    data: d.data,
    borderColor: d.borderColor ?? universalColors[i % universalColors.length],
    backgroundColor: d.backgroundColor ?? 'transparent',
    tension: 0.2,
    pointRadius: 2,
    fill: false
  }))

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    }
  }

  return { data: { labels: props.labels, datasets: ds }, options }
})
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
      <div class="flex justify-between items-center">
        <p class="text-xl font-semibold">{{ props.title ?? 'Linha' }}</p>
        <slot name="action" />
      </div>
    </template>

    <Line
      :data="chartConfig.data"
      :options="chartConfig.options"
      :class="['h-full', props.maxHeight ?? 'max-h-130']"
    />
  </UCard>
</template>
