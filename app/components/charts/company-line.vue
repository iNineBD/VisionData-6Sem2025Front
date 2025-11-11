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
import type { CompanyForecast } from '~/utils/charts/companyForecastLine'
import { ref, onMounted, computed } from 'vue'
import type { ChartOptions, ChartDataset } from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

const props = defineProps<{
  title: string
  companyForecast?: CompanyForecast | CompanyForecast[] | null
  dateRange?: { start: string | null, end: string | null }
}>()

const loading = ref(true)

const forecastsArray = computed<CompanyForecast[]>(() => {
  const val = props.companyForecast
  if (!val) return []
  return Array.isArray(val) ? val : [val]
})

onMounted(() => {
  loading.value = false
})

type TimeSeries = { date: string; value: number }

function normalizeSeries (data: CompanyForecast['raw_series'] | CompanyForecast['forecast']): TimeSeries[] {
  if (Array.isArray(data)) return data as TimeSeries[]
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data as Record<string, number>).map(([date, value]) => ({ date, value: Number(value) }))
  }
  return []
}

const palette = ['#3b82f6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6']

// compute available labels (union of dates) and range selection state
const availableLabels = computed(() => {
  if (!forecastsArray.value.length) return [] as string[]
  const dateSet = new Set<string>()
  forecastsArray.value.forEach(fc => {
    const hist = normalizeSeries(fc.raw_series)
    const pred = normalizeSeries(fc.forecast)
    hist.forEach(h => dateSet.add(h.date))
    pred.forEach(p => dateSet.add(p.date))
  })
  return Array.from(dateSet).sort((a, b) => +new Date(a) - +new Date(b))
})

const selectedStart = computed(() => props.dateRange?.start ?? null)
const selectedEnd = computed(() => props.dateRange?.end ?? null)

const chartConfig = computed(() => {
  if (!forecastsArray.value.length) {
    return { data: { labels: [], datasets: [] }, options: {} }
  }

  const allSeries = forecastsArray.value.map(fc => ({
    fc,
    hist: normalizeSeries(fc.raw_series),
    pred: normalizeSeries(fc.forecast)
  }))

  const labels = availableLabels.value.slice()

  let filteredLabels = labels
  if (selectedStart.value && selectedEnd.value) {
    const si = labels.indexOf(selectedStart.value)
    const ei = labels.indexOf(selectedEnd.value)
    if (si !== -1 && ei !== -1) filteredLabels = labels.slice(si, ei + 1)
  }

  const datasets: ChartDataset<'line'>[] = []
  let earliestPredDate: string | null = null

  allSeries.forEach(({ fc, hist, pred }, idx) => {
    const histMap = Object.fromEntries(hist.map(h => [h.date, h.value]))
    const predMap = Object.fromEntries(pred.map(p => [p.date, p.value]))

    function hexToRgba (hex: string, alpha = 1) {
      const h = hex.replace('#', '')
      const bigint = parseInt(h, 16)
      const r = (bigint >> 16) & 255
      const g = (bigint >> 8) & 255
      const b = bigint & 255
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    const baseColor = (palette[idx % palette.length] ?? '#3b82f6') as string
    const histColor = hexToRgba(baseColor, 1)
    const predColor = hexToRgba(baseColor, 0.45)

    // historical dataset (solid)
    const histData = filteredLabels.map(d => (histMap[d] ?? null))
    datasets.push({
      label: `${fc.company} — Histórico`,
      data: histData,
      borderColor: histColor,
      backgroundColor: 'transparent',
      tension: 0.2,
      pointRadius: 2
    })

    // forecast dataset (dashed, lighter)
    const predData = filteredLabels.map(d => (predMap[d] ?? null))
    datasets.push({
      label: `${fc.company} — Previsão`,
      data: predData,
      borderColor: predColor,
      borderDash: [6, 4],
      backgroundColor: 'transparent',
      tension: 0.2,
      pointRadius: 2
    })

    if (pred.length) {
      const predMin = pred.reduce((min, cur) => (new Date(cur.date) < new Date(min) ? cur.date : min), pred[0]!.date)
      if (earliestPredDate === null || new Date(predMin) < new Date(earliestPredDate)) {
        earliestPredDate = predMin
      }
    }
  })

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const }
    }
  }

  return { data: { labels: filteredLabels, datasets }, options }
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
