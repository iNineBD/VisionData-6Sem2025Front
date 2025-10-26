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
import { useCompanyForecastLineChart } from '~/utils/charts/companyForecastLine'
import type { CompanyForecast } from '~/utils/charts/companyForecastLine'
import { ref, onMounted, computed, watch } from 'vue'

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

const props = defineProps<{
  title: string
  companyForecast?: CompanyForecast | null
}>()

const loading = ref(true)
const forecast = ref<CompanyForecast | null>(null)

onMounted(() => {
  forecast.value = props.companyForecast ?? null
  loading.value = false
})

watch(
  () => props.companyForecast,
  (newVal) => {
    if (newVal) {
      forecast.value = newVal
    }
  },
  { immediate: true }
)

const chartConfig = computed(() => {
  if (!forecast.value) {
    return {
      data: { labels: [], datasets: [] },
      options: {}
    }
  }
  return useCompanyForecastLineChart(forecast.value)
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
        <p class="text-xl font-semibold">{{ props.title }}</p>
        <slot name="action" />
      </div>
    </template>

    <template v-if="loading">
      <USkeleton class="min-h-[19.5rem] w-full rounded-md" />
    </template>

    <template v-else>
      <Line
        :data="chartConfig.data"
        :options="chartConfig.options"
        class="h-full max-h-130"
      />
    </template>
  </UCard>
</template>
