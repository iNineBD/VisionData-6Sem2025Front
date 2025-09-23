<script setup lang="ts">
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import { useDoughnut } from '~/utils/chartConfig'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  title: string;
  labels: string[];
  data: number[];
}>()

const chartConfig = useDoughnut(props.labels, props.data)
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
    <Doughnut
      :data="chartConfig.data"
      :options="chartConfig.options"
      class="h-full max-h-96"
    />
  </UCard>
</template>
