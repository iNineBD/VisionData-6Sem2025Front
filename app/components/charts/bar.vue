<script setup lang="ts">
import {
  Chart as ChartJS,
  BarElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { useHorizontalBar, useVerticalBar } from '~/utils/charts/bar'

ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale)

const props = defineProps<{
  title: string;
  labels: string[];
  data: number[];
  indexAxis: 'x' | 'y';
  yMax?: number;
}>()

const chartConfig = computed(() =>
  props.indexAxis === 'x'
    ? useVerticalBar(props.labels, props.data, props.yMax)
    : useHorizontalBar(props.labels, props.data, props.yMax)
)

const chartKey = computed(() => `${props.title}-${props.indexAxis}-${props.labels.join('-')}`)
</script>

<template>
  <UCard
    :ui="{
      header: 'pb-0',
      root: 'divide-none',
      body: 'flex flex-col justify-center',
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
    <Bar
      :key="chartKey"
      :data="chartConfig.data"
      :options="chartConfig.options"
      class="h-full max-h-80"
    />
  </UCard>
</template>
