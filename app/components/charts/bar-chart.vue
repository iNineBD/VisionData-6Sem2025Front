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
import { useHorizontalBar, useVerticalBar } from '~/utils/chartConfig'

ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale)

const props = defineProps<{
  title: string;
  labels: string[];
  data: number[];
  indexAxis: 'x' | 'y';
}>()

const chartConfig =
  props.indexAxis === 'x'
    ? useVerticalBar(props.labels, props.data)
    : useHorizontalBar(props.labels, props.data)
</script>

<template>
  <UCard class="h-full">
    <UText
      tag="h1"
      size="large"
      weight="medium"
      class="mt-0"
    >{{
      title
    }}</UText>
    <Bar
      :data="chartConfig.data"
      :options="chartConfig.options"
      class="h-full max-h-96"
    />
  </UCard>
</template>
