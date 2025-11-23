<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { CalendarDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { useServer } from '~/services/use-server'
import type { PredictionResponse, CompanyForecast } from '~/types/predictionMetrics'
import ChartsPrediction from '~/components/charts/prediction-line.vue'
import ChartsCompanyLine from '~/components/charts/company-line.vue'
import {
  parseISOToCalendarDate,
  toISOFromCalendarDate,
  extractAvailableDates,
  extractGeneralAvailableDates,
  findEarliestPredictionDate,
  findGeneralPredictionStart,
  createDateClassifiers,
  filterGeneralDataByRange
} from '~/utils/dateRangeHelpers'

definePageMeta({
  middleware: ['authenticated']
})

useSeoMeta({
  title: 'Vision Data | Predictions'
})

const { getPredicts, getCompanyPredicts, getProductPredicts, exportForecastPdf } = useServer()

const loading = ref(true)

const generalData = ref<PredictionResponse | null>(null)
const companyData = ref<CompanyForecast[]>([])
const productData = ref<CompanyForecast[]>([])

const selectedPredictionType = ref<'Geral' | 'Por Companhia' | 'Por Produto'>('Geral')
const selectedCompanies = ref<string[]>([])
const selectedProducts = ref<string[]>([])

const companies = computed(() => companyData.value.map(c => c.company))
const products = computed(() => productData.value.map(p => p.company))

function setSelectedPredictionType (v: 'Geral' | 'Por Companhia' | 'Por Produto') {
  selectedPredictionType.value = v
}

function setSelectedCompany (v: string) {
  const idx = selectedCompanies.value.indexOf(v)
  if (idx === -1) {
    if (selectedCompanies.value.length >= 3) return
    selectedCompanies.value.push(v)
  } else {
    selectedCompanies.value.splice(idx, 1)
  }
}

function setSelectedProduct (v: string) {
  const idx = selectedProducts.value.indexOf(v)
  if (idx === -1) {
    if (selectedProducts.value.length >= 3) return
    selectedProducts.value.push(v)
  } else {
    selectedProducts.value.splice(idx, 1)
  }
}

const predictionTypeItems = [
  { label: 'Geral', icon: 'i-lucide-globe', onSelect: () => setSelectedPredictionType('Geral') },
  { label: 'Por Companhia', icon: 'i-lucide-building', onSelect: () => setSelectedPredictionType('Por Companhia') },
  { label: 'Por Produto', icon: 'i-lucide-package', onSelect: () => setSelectedPredictionType('Por Produto') }
]

const companyItems = computed(() => companies.value.map(c => {
  const selected = selectedCompanies.value.includes(c)
  const limitReached = selectedCompanies.value.length >= 3
  return {
    label: c,
    icon: selected ? 'i-heroicons-check-20-solid' : 'i-lucide-building',
    onSelect: () => setSelectedCompany(c),
    disabled: !selected && limitReached
  }
}))

const productItems = computed(() => products.value.map(p => {
  const selected = selectedProducts.value.includes(p)
  const limitReached = selectedProducts.value.length >= 3
  return {
    label: p,
    icon: selected ? 'i-heroicons-check-20-solid' : 'i-lucide-package',
    onSelect: () => setSelectedProduct(p),
    disabled: !selected && limitReached
  }
}))

const selectedCompanyForecasts = computed<CompanyForecast[]>(() => {
  if (companyData.value.length === 0) return []
  if (selectedCompanies.value.length === 0) return [companyData.value[0]!]
  return companyData.value.filter(c => selectedCompanies.value.includes(c.company)).filter(Boolean) as CompanyForecast[]
})

const selectedProductForecasts = computed<CompanyForecast[]>(() => {
  if (productData.value.length === 0) return []
  if (selectedProducts.value.length === 0) return [productData.value[0]!]
  return productData.value.filter(p => selectedProducts.value.includes(p.company)).filter(Boolean) as CompanyForecast[]
})

const companyAvailableDates = computed(() => extractAvailableDates(selectedCompanyForecasts.value))
const productAvailableDates = computed(() => extractAvailableDates(selectedProductForecasts.value))
const generalAvailableDates = computed(() => extractGeneralAvailableDates(generalData.value))

const companyDateRange = ref<{ start: string | null, end: string | null }>({ start: null, end: null })
const productDateRange = ref<{ start: string | null, end: string | null }>({ start: null, end: null })
const generalDateRange = ref<{ start: string | null, end: string | null }>({ start: null, end: null })

if (typeof window !== 'undefined') {
  watch(companyAvailableDates, (dates) => {
    if (!dates.length) {
      companyDateRange.value = { start: null, end: null }
      return
    }
    if (!companyDateRange.value.start) companyDateRange.value.start = dates[0]!
    if (!companyDateRange.value.end) companyDateRange.value.end = dates[dates.length - 1]!
  })
  watch(productAvailableDates, (dates) => {
    if (!dates.length) {
      productDateRange.value = { start: null, end: null }
      return
    }
    if (!productDateRange.value.start) productDateRange.value.start = dates[0]!
    if (!productDateRange.value.end) productDateRange.value.end = dates[dates.length - 1]!
  })
  watch(companyDateRange, (range) => {
    const dates = companyAvailableDates.value
    if (!dates.length || !range.start || !range.end) return
    const si = dates.indexOf(range.start)
    const ei = dates.indexOf(range.end)
    if (si > ei) {
      companyDateRange.value = { start: dates[ei]!, end: dates[si]! }
    }
  })
  watch(productDateRange, (range) => {
    const dates = productAvailableDates.value
    if (!dates.length || !range.start || !range.end) return
    const si = dates.indexOf(range.start)
    const ei = dates.indexOf(range.end)
    if (si > ei) {
      productDateRange.value = { start: dates[ei]!, end: dates[si]! }
    }
  })
  // general
  watch(() => generalAvailableDates.value, (dates) => {
    if (!dates.length) {
      generalDateRange.value = { start: null, end: null }
      return
    }
    if (!generalDateRange.value.start) generalDateRange.value.start = dates[0]!
    if (!generalDateRange.value.end) generalDateRange.value.end = dates[dates.length - 1]!
  })
  watch(generalDateRange, (range) => {
    const dates = generalAvailableDates.value
    if (!dates.length || !range.start || !range.end) return
    const si = dates.indexOf(range.start)
    const ei = dates.indexOf(range.end)
    if (si > ei) {
      generalDateRange.value = { start: dates[ei]!, end: dates[si]! }
    }
  })
}

// Allowed dates sets (still needed for classifiers)
const companyAllowedSet = computed(() => new Set(companyAvailableDates.value))
const productAllowedSet = computed(() => new Set(productAvailableDates.value))
const generalAllowedSet = computed(() => new Set(generalAvailableDates.value))

// Min/Max bounds for calendar bridges
const companyMinValue = computed(() => parseISOToCalendarDate(companyAvailableDates.value[0] ?? null))
const companyMaxValue = computed(() => parseISOToCalendarDate(companyAvailableDates.value[companyAvailableDates.value.length - 1] ?? null))
const productMinValue = computed(() => parseISOToCalendarDate(productAvailableDates.value[0] ?? null))
const productMaxValue = computed(() => parseISOToCalendarDate(productAvailableDates.value[productAvailableDates.value.length - 1] ?? null))
const generalMinValue = computed(() => parseISOToCalendarDate(generalAvailableDates.value[0] ?? null))
const generalMaxValue = computed(() => parseISOToCalendarDate(generalAvailableDates.value[generalAvailableDates.value.length - 1] ?? null))

// v-model bridges for UCalendar (range)
type DateRangeLike = { start: CalendarDate, end: CalendarDate }
const companyRangeCalendar = computed<DateRangeLike>({
  get () {
    const start = parseISOToCalendarDate(companyDateRange.value.start ?? null) || companyMinValue.value || new CalendarDate(2000, 1, 1)
    const end = parseISOToCalendarDate(companyDateRange.value.end ?? null) || companyMaxValue.value || start
    return { start, end }
  },
  set (v) {
    companyDateRange.value = {
      start: toISOFromCalendarDate(v?.start ?? null),
      end: toISOFromCalendarDate(v?.end ?? null)
    }
  }
})
const productRangeCalendar = computed<DateRangeLike>({
  get () {
    const start = parseISOToCalendarDate(productDateRange.value.start ?? null) || productMinValue.value || new CalendarDate(2000, 1, 1)
    const end = parseISOToCalendarDate(productDateRange.value.end ?? null) || productMaxValue.value || start
    return { start, end }
  },
  set (v) {
    productDateRange.value = {
      start: toISOFromCalendarDate(v?.start ?? null),
      end: toISOFromCalendarDate(v?.end ?? null)
    }
  }
})

const generalRangeCalendar = computed<DateRangeLike>({
  get () {
    const start = parseISOToCalendarDate(generalDateRange.value.start ?? null) || generalMinValue.value || new CalendarDate(2000, 1, 1)
    const end = parseISOToCalendarDate(generalDateRange.value.end ?? null) || generalMaxValue.value || start
    return { start, end }
  },
  set (v) {
    generalDateRange.value = {
      start: toISOFromCalendarDate(v?.start ?? null),
      end: toISOFromCalendarDate(v?.end ?? null)
    }
  }
})

// Filter general data by range for chart
const filteredGeneralData = computed(() => filterGeneralDataByRange(generalData.value, generalDateRange.value))

// Prediction start markers (earliest forecast date)
const earliestCompanyPredStart = computed(() => findEarliestPredictionDate(selectedCompanyForecasts.value))
const earliestProductPredStart = computed(() => findEarliestPredictionDate(selectedProductForecasts.value))
const earliestGeneralPredStart = computed(() => findGeneralPredictionStart(generalData.value))

const companyClassifiers = computed(() => createDateClassifiers(companyAllowedSet.value, earliestCompanyPredStart.value))
const productClassifiers = computed(() => createDateClassifiers(productAllowedSet.value, earliestProductPredStart.value))
const generalClassifiers = computed(() => createDateClassifiers(generalAllowedSet.value, earliestGeneralPredStart.value))

// Helper functions to determine if a date is historical or prediction
const isCompanyHistoricalDate = (day: DateValue) => companyClassifiers.value.isHistorical(day)
const isCompanyPredictionDate = (day: DateValue) => companyClassifiers.value.isPrediction(day)

const isProductHistoricalDate = (day: DateValue) => productClassifiers.value.isHistorical(day)
const isProductPredictionDate = (day: DateValue) => productClassifiers.value.isPrediction(day)

const isGeneralHistoricalDate = (day: DateValue) => generalClassifiers.value.isHistorical(day)
const isGeneralPredictionDate = (day: DateValue) => generalClassifiers.value.isPrediction(day)

async function fetchPredictions () {
  loading.value = true
  try {
    if (selectedPredictionType.value === 'Geral') {
      generalData.value = await getPredicts(30, 90)
    } else if (selectedPredictionType.value === 'Por Companhia') {
      companyData.value = await getCompanyPredicts() ?? []
    } else if (selectedPredictionType.value === 'Por Produto') {
      productData.value = await getProductPredicts() ?? []
    }
  } catch (error) {
    console.error('[Predictions] Erro ao buscar predições:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchPredictions)

watch(selectedPredictionType, async () => {
  selectedCompanies.value = []
  selectedProducts.value = []
  await fetchPredictions()
})

watch(companyData, (newCompanyData) => {
  if (newCompanyData.length && selectedCompanies.value.length === 0) {
    selectedCompanies.value = [newCompanyData[0]!.company]
  }
})

watch(productData, (newProductData) => {
  if (newProductData.length && selectedProducts.value.length === 0) {
    selectedProducts.value = [newProductData[0]!.company]
  }
})

const exportingPredictions = ref(false)

async function handleExportPredictions () {
  try {
    exportingPredictions.value = true

    const blob = await exportForecastPdf()

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_predicoes_${new Date()
      .toLocaleDateString('pt-BR')
      .replace(/\//g, '-')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Erro ao baixar PDF de predições:', err)
  } finally {
    exportingPredictions.value = false
  }
}
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

        <template #right>
          <UTooltip text="Exportar relatório de predições (PDF)">
            <UButton
              icon="i-lucide-file-down"
              color="primary"
              variant="soft"
              :loading="exportingPredictions"
              @click="handleExportPredictions"
            >
              Exportar PDF
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Tipo de Predição
          </h2>

          <div class="flex items-center gap-2">
            <UDropdownMenu :items="predictionTypeItems">
              <UButton
                color="primary"
                variant="outline"
                icon="i-lucide-layers"
                trailing-icon="i-lucide-chevron-down"
              >
                {{ selectedPredictionType }}
              </UButton>
            </UDropdownMenu>

            <!-- Top-level date range: show for all modes; disable while loading -->
            <template v-if="selectedPredictionType === 'Geral'">
              <DateRangePicker
                v-model="generalRangeCalendar"
                :available-dates="generalAvailableDates"
                :is-historical-date="isGeneralHistoricalDate"
                :is-prediction-date="isGeneralPredictionDate"
                :disabled="loading || !generalAvailableDates.length"
              />
            </template>
            <template v-else-if="selectedPredictionType === 'Por Companhia'">
              <DateRangePicker
                v-model="companyRangeCalendar"
                :available-dates="companyAvailableDates"
                :is-historical-date="isCompanyHistoricalDate"
                :is-prediction-date="isCompanyPredictionDate"
                :disabled="loading || !companyAvailableDates.length"
              />
            </template>
            <template v-else-if="selectedPredictionType === 'Por Produto'">
              <DateRangePicker
                v-model="productRangeCalendar"
                :available-dates="productAvailableDates"
                :is-historical-date="isProductHistoricalDate"
                :is-prediction-date="isProductPredictionDate"
                :disabled="loading || !productAvailableDates.length"
              />
            </template>
          </div>
        </div>

        <!-- Gráfico GERAL -->
        <template v-if="selectedPredictionType === 'Geral' && generalData && !loading">
          <ChartsPrediction
            :key="`${generalDateRange.start}-${generalDateRange.end}`"
            title="Predição Geral"
            :prediction-data="filteredGeneralData || generalData"
            class="w-full h-[34rem]"
          />
        </template>

        <!-- Gráfico POR COMPANHIA -->
        <template v-else-if="selectedPredictionType === 'Por Companhia' && selectedCompanyForecasts.length > 0 && !loading">
          <div class="flex flex-col gap-2 mb-2">
            <div class="flex justify-between items-center">
              <div class="flex flex-wrap gap-2 items-center">
                <UDropdownMenu
                  :items="companyItems"
                  class="!p-0"
                >
                  <UButton
                    color="primary"
                    variant="outline"
                    icon="i-lucide-building"
                    trailing-icon="i-lucide-chevron-down"
                    size="xs"
                    class="!text-xs !px-2 !py-1 min-h-0 h-7"
                  >
                    {{ selectedCompanies.length ? selectedCompanies.join(', ') : 'Selecionar Companhia' }}
                  </UButton>
                </UDropdownMenu>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
              <span
                v-for="c in selectedCompanyForecasts"
                :key="c.company"
                class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
              >
                <span class="font-semibold text-primary-600 dark:text-primary-400">{{ c.company }}</span>:
                <span class="font-mono">{{ (c.total_next30 ?? 0).toLocaleString() }}</span> tickets previstos
              </span>
              <span
                v-if="selectedCompanyForecasts.length > 1"
                class="text-xs font-semibold ml-2"
              >
                Total: {{ selectedCompanyForecasts.reduce((s, c) => s + (c.total_next30 ?? 0), 0).toLocaleString() }} tickets previstos
              </span>
            </div>
          </div>
          <ChartsCompanyLine
            :title="selectedCompanyForecasts.length === 1 ? `Predição — ${selectedCompanyForecasts[0]?.company ?? ''}` : 'Predição — Várias'"
            :company-forecast="selectedCompanyForecasts"
            :date-range="companyDateRange"
            class="w-full h-[28rem]"
          />
        </template>

        <!-- Gráfico POR PRODUTO -->
        <template v-else-if="selectedPredictionType === 'Por Produto' && selectedProductForecasts.length > 0 && !loading">
          <div class="flex flex-col gap-2 mb-2">
            <div class="flex justify-between items-center">
              <div class="flex flex-wrap gap-2 items-center">
                <UDropdownMenu
                  :items="productItems"
                  class="!p-0"
                >
                  <UButton
                    color="primary"
                    variant="outline"
                    icon="i-lucide-package"
                    trailing-icon="i-lucide-chevron-down"
                    size="xs"
                    class="!text-xs !px-2 !py-1 min-h-0 h-7"
                  >
                    {{ selectedProducts.length ? selectedProducts.join(', ') : 'Selecionar Produto' }}
                  </UButton>
                </UDropdownMenu>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
              <span
                v-for="c in selectedProductForecasts"
                :key="c.company"
                class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
              >
                <span class="font-semibold text-primary-600 dark:text-primary-400">{{ c.company }}</span>:
                <span class="font-mono">{{ (c.total_next30 ?? 0).toLocaleString() }}</span> tickets previstos
              </span>
              <span
                v-if="selectedProductForecasts.length > 1"
                class="text-xs font-semibold ml-2"
              >
                Total: {{ selectedProductForecasts.reduce((s, c) => s + (c.total_next30 ?? 0), 0).toLocaleString() }} tickets previstos
              </span>
            </div>
          </div>
          <ChartsCompanyLine
            :title="selectedProductForecasts.length === 1 ? `Predição — ${selectedProductForecasts[0]?.company ?? ''}` : 'Predição — Várias'"
            :company-forecast="selectedProductForecasts"
            :date-range="productDateRange"
            class="w-full h-[28rem]"
          />
        </template>

        <!-- Skeleton -->
        <template v-else>
          <UCard
            :ui="{ header: 'pb-0', root: 'divide-none', body: 'h-full flex flex-col justify-center' }"
            variant="outline"
            class="h-[34rem]"
          >
            <div class="flex justify-between items-center mb-4">
              <USkeleton class="h-6 w-40" />
              <USkeleton class="h-7 w-24 rounded-md" />
            </div>
            <USkeleton class="min-h-[30rem] w-full rounded-md" />
          </UCard>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
