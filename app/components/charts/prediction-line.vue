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
import { usePredictionLineChart } from '~/utils/charts/predictionLine'
import type { PredictionResponse } from '~/types/predictionMetrics'

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

const props = defineProps<{
  title: string
  predictionData: PredictionResponse
}>()

const chartConfig = usePredictionLineChart(props.predictionData)
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
        <p class="text-xl font-semibold">{{ props.title }}</p>
        <slot name="action" />
      </div>
    </template>

    <Line
      :data="chartConfig.data"
      :options="chartConfig.options"
      class="h-full max-h-130"
    />
  </UCard>
</template>
