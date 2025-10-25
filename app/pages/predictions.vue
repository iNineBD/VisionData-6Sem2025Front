<script setup lang="ts">
import { ref, /* computed,*/ onMounted } from 'vue'
import { useServer } from '~/services/use-server'
import ChartsLine from '~/components/charts/line.vue'
import type { PredictionResponse } from '~/utils/chartConfig'
// import type { DropdownMenuItem } from '@nuxt/ui'

useSeoMeta({
  title: 'Vision Data | Predictions'
})

const { getPredicts } = useServer()

const loading = ref(false)
const predictionData = ref<PredictionResponse | null>(null)
const days = ref(30)
const historicalDays = ref(90)

const selectedDataset = ref<'Histórico' | 'Predições'>('Histórico')

// const datasetMenu = computed<DropdownMenuItem[]>(() => [
//   {
//     label: 'Predições',
//     icon: 'i-lucide-arrow-up-right',
//     onSelect: () => selectedDataset.value = 'Predições',
//     suffix: selectedDataset.value === 'Predições' ? 'i-lucide-check' : '',
//     disabled: selectedDataset.value === 'Predições',
//     ui: {
//       itemLeadingIcon: selectedDataset.value === 'Predições'
//         ? 'text-primary-500 dark:text-primary-400'
//         : 'text-gray-400 dark:text-gray-600'
//     }
//   },
//   {
//     label: 'Histórico',
//     icon: 'i-lucide-clock',
//     onSelect: () => selectedDataset.value = 'Histórico',
//     suffix: selectedDataset.value === 'Histórico' ? 'i-lucide-check' : '',
//     disabled: selectedDataset.value === 'Histórico',
//     ui: {
//       itemLeadingIcon: selectedDataset.value === 'Histórico'
//         ? 'text-primary-500 dark:text-primary-400'
//         : 'text-gray-400 dark:text-gray-600'
//     }
//   }
// ])

async function fetchPredictions () {
  loading.value = true
  try {
    const response = await getPredicts(days.value, historicalDays.value) as PredictionResponse
    predictionData.value = response
  } catch (error) {
    predictionData.value = null
    throw createError(error as Error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPredictions()
})
</script>

<template>
  <UDashboardPanel id="predictions">
    <template #header>
      <UDashboardNavbar
        title="Predições"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div>
          <ChartsLine
            v-if="!loading && predictionData"
            title="Predição de Tickets (IA)"
            :prediction-data="predictionData"
            :selected-dataset="selectedDataset"
            class="w-full h-[42.5rem]"
          >
            <!-- <template #action>
              <DropdownMenu
                :dropdown-items="datasetMenu"
                :button-label="selectedDataset"
                button-icon="i-lucide-menu"
              />
            </template> -->
          </ChartsLine>

          <UCard
            v-else
            :ui="{ header: 'pb-0', root: 'divide-none', body: 'h-full flex flex-col justify-center' }"
            variant="outline"
            class="h-[42.5rem]"
          >
            <div class="flex justify-between items-center mb-4">
              <USkeleton class="h-6 w-40" />
              <USkeleton class="h-7 w-24 rounded-md" />
            </div>
            <USkeleton class="min-h-[30rem] w-full rounded-md" />
          </UCard>
        </div>

      </div>
    </template>
  </UDashboardPanel>
</template>
