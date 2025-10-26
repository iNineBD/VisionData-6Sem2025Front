<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useServer } from '~/services/use-server'
import ChartsLine from '~/components/charts/line.vue'
import ChartsCompanyLine from '~/components/charts/company-line.vue'
import type { PredictionResponse } from '~/utils/charts/predictionLine'
import type { CompanyForecast } from '~/utils/charts/companyForecastLine'

useSeoMeta({
  title: 'Vision Data | Predictions'
})

const { getPredicts, getCompanyPredicts, getProductPredicts } = useServer()

const loading = ref(true)

const generalData = ref<PredictionResponse | null>(null)
const companyData = ref<CompanyForecast[]>([])
const productData = ref<CompanyForecast[]>([])

const selectedPredictionType = ref<'Geral' | 'Por Companhia' | 'Por Produto'>('Geral')
const selectedCompany = ref<string | null>(null)
const selectedProduct = ref<string | null>(null)

const companies = computed(() => companyData.value.map(c => c.company))
const products = computed(() => productData.value.map(p => p.company))

function setSelectedPredictionType(v: 'Geral' | 'Por Companhia' | 'Por Produto') {
  selectedPredictionType.value = v
}

function setSelectedCompany(v: string) {
  selectedCompany.value = v
}

function setSelectedProduct(v: string) {
  selectedProduct.value = v
}

const predictionTypeItems = [
  { label: 'Geral', icon: 'i-lucide-globe', onSelect: () => setSelectedPredictionType('Geral') },
  { label: 'Por Companhia', icon: 'i-lucide-building', onSelect: () => setSelectedPredictionType('Por Companhia') },
  { label: 'Por Produto', icon: 'i-lucide-package', onSelect: () => setSelectedPredictionType('Por Produto') }
]

const companyItems = computed(() => companies.value.map(c => ({
  label: c,
  icon: 'i-lucide-building',
  onSelect: () => setSelectedCompany(c)
})))

const productItems = computed(() => products.value.map(p => ({
  label: p,
  icon: 'i-lucide-package',
  onSelect: () => setSelectedProduct(p)
})))

const selectedCompanyForecast = computed<CompanyForecast | null>(() => {
  if (companyData.value.length === 0) return null
  const found = companyData.value.find(c => c.company === (selectedCompany.value ?? ''))
  return found ?? companyData.value[0] ?? null
})

const selectedProductForecast = computed<CompanyForecast | null>(() => {
  if (productData.value.length === 0) return null
  const found = productData.value.find(p => p.company === (selectedProduct.value ?? ''))
  return found ?? productData.value[0] ?? null
})

async function fetchPredictions() {
  loading.value = true
  try {
    console.log(`[Predictions] Carregando dados para: ${selectedPredictionType.value}`)
    if (selectedPredictionType.value === 'Geral') {
      generalData.value = await getPredicts(30, 90)
      console.log('[Predictions] Dados gerais:', generalData.value)
    } else if (selectedPredictionType.value === 'Por Companhia') {
      companyData.value = await getCompanyPredicts() ?? []
      console.log('[Predictions] Dados por Companhia:', companyData.value)
    } else if (selectedPredictionType.value === 'Por Produto') {
      productData.value = await getProductPredicts() ?? []
      console.log('[Predictions] Dados por Produto:', productData.value)
    }
  } catch (error) {
    console.error('[Predictions] Erro ao buscar predições:', error)
  } finally {
    loading.value = false
    console.log('[Predictions] Loading finalizado')
  }
}

onMounted(fetchPredictions)

watch(selectedPredictionType, async () => {
  selectedCompany.value = null
  selectedProduct.value = null
  await fetchPredictions()
})

watch(companyData, (newCompanyData) => {
  if (newCompanyData.length && !selectedCompany.value) {
    selectedCompany.value = newCompanyData[0].company
    console.log('[Predictions] Selecionando primeira companhia:', selectedCompany.value)
  }
})

watch(productData, (newProductData) => {
  if (newProductData.length && !selectedProduct.value) {
    selectedProduct.value = newProductData[0].company
    console.log('[Predictions] Selecionando primeiro produto:', selectedProduct.value)
  }
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
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Tipo de Predição
          </h2>

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
        </div>

        <!-- Gráfico GERAL -->
        <template v-if="selectedPredictionType === 'Geral' && generalData && !loading">
          <ChartsLine
            title="Predição Geral"
            :prediction-data="generalData"
            class="w-full h-[39.5rem]"
          />
        </template>

        <!-- Gráfico POR COMPANHIA -->
        <template v-else-if="selectedPredictionType === 'Por Companhia' && selectedCompanyForecast && !loading">
          <ChartsCompanyLine
            title="Predição por Companhia"
            :company-forecast="selectedCompanyForecast"
            class="w-full h-[39.5rem]"
          >
            <template #action>
              <UDropdownMenu :items="companyItems">
                <UButton
                  color="primary"
                  variant="outline"
                  icon="i-lucide-building"
                  trailing-icon="i-lucide-chevron-down"
                >
                  {{ selectedCompany || 'Selecionar Companhia' }}
                </UButton>
              </UDropdownMenu>
            </template>
          </ChartsCompanyLine>
        </template>

        <!-- Gráfico POR PRODUTO -->
        <template v-else-if="selectedPredictionType === 'Por Produto' && selectedProductForecast && !loading">
          <ChartsCompanyLine
            title="Predição por Produto"
            :company-forecast="selectedProductForecast"
            class="w-full h-[39.5rem]"
          >
            <template #action>
              <UDropdownMenu :items="productItems">
                <UButton
                  color="primary"
                  variant="outline"
                  icon="i-lucide-package"
                  trailing-icon="i-lucide-chevron-down"
                >
                  {{ selectedProduct || 'Selecionar Produto' }}
                </UButton>
              </UDropdownMenu>
            </template>
          </ChartsCompanyLine>
        </template>

        <!-- Skeleton de carregamento -->
        <template v-else>
          <UCard
            :ui="{ header: 'pb-0', root: 'divide-none', body: 'h-full flex flex-col justify-center' }"
            variant="outline"
            class="h-[39.5rem]"
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
