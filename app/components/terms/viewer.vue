<script setup lang="ts">
import type { Term, ItemConsentRequest } from '~/types/terms'

interface Props {
  term: Term | null
  loading?: boolean
  initialConsents?: ItemConsentRequest[]
}

interface Emits {
  (e: 'update:consents', consents: ItemConsentRequest[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Estado dos checkboxes
const itemConsents = ref<Record<number, boolean>>({})

// Inicializa os checkboxes quando o termo é carregado
watch(() => props.term, (newTerm) => {
  if (newTerm?.items) {
    const initialState: Record<number, boolean> = {}

    // Cria um mapa dos consentimentos iniciais (se houver)
    const savedConsentsMap = new Map(
      props.initialConsents?.map(c => [c.itemId, c.accepted]) || []
    )

    newTerm.items.forEach((item) => {
      // Restaura o valor salvo ou define como false
      initialState[item.id] = savedConsentsMap.get(item.id) ?? false
    })
    itemConsents.value = initialState
  }
}, { immediate: true })

// Emite as mudanças de consentimento para o componente pai
watch(itemConsents, (newConsents) => {
  const consentsArray: ItemConsentRequest[] = Object.entries(newConsents).map(([itemId, accepted]) => ({
    itemId: Number(itemId),
    accepted
  }))
  emit('update:consents', consentsArray)
}, { deep: true })

// Verifica se todos os itens obrigatórios foram aceitos
const allMandatoryAccepted = computed(() => {
  if (!props.term?.items) return false

  const mandatoryItems = props.term.items.filter(item => item.isMandatory)
  return mandatoryItems.every(item => itemConsents.value[item.id] === true)
})

// Expõe a validação para o componente pai
defineExpose({
  allMandatoryAccepted
})
</script>

<template>
  <div class="terms-viewer">
    <div
      v-if="loading"
      class="flex justify-center items-center py-8"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-primary"
      />
      <span class="ml-2">Carregando termos de uso...</span>
    </div>

    <UAlert
      v-else-if="!term"
      icon="i-lucide-alert-circle"
      color="warning"
      variant="soft"
      title="Termos não disponíveis"
      description="Não foi possível carregar os termos de uso. Por favor, tente novamente mais tarde."
    />

    <div
      v-else
      class="space-y-6"
    >
      <div class="border-b pb-4 border-gray-200 dark:border-gray-700">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ term.title }}
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ term.description }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Versão {{ term.version }} • Vigente desde {{ new Date(term.effectiveDate).toLocaleDateString('pt-BR') }}
        </p>
      </div>

      <div class="prose dark:prose-invert max-w-none">
        <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {{ term.content }}
        </div>
      </div>

      <div class="space-y-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Consentimentos Necessários
        </h3>

        <div
          v-for="item in term.items"
          :key="item.id"
          class="border rounded-lg p-4 transition-all duration-200"
          :class="{
            'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800': item.isMandatory && !itemConsents[item.id],
            'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800': itemConsents[item.id],
            'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800': !itemConsents[item.id] && !item.isMandatory
          }"
        >
          <div class="flex items-start gap-3">
            <UCheckbox
              v-model="itemConsents[item.id]"
              :name="`consent-${item.id}`"
              size="lg"
            />

            <div class="flex-1">
              <label
                :for="`consent-${item.id}`"
                class="block text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
              >
                {{ item.title }}
                <span
                  v-if="item.isMandatory"
                  class="text-red-500 ml-1"
                >*</span>
              </label>

              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {{ item.content }}
              </p>

              <div class="flex items-center gap-2 mt-2">
                <UBadge
                  v-if="item.isMandatory"
                  :color="itemConsents[item.id] ? 'success' : 'error'"
                  variant="soft"
                  size="xs"
                >
                  {{ itemConsents[item.id] ? 'Aceito' : 'Obrigatório' }}
                </UBadge>
                <UBadge
                  v-else
                  color="neutral"
                  variant="soft"
                  size="xs"
                >
                  Opcional
                </UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UAlert
        v-if="!allMandatoryAccepted"
        icon="i-lucide-alert-triangle"
        color="warning"
        variant="soft"
        title="Ação Necessária"
        description="Você deve aceitar todos os itens obrigatórios para criar sua conta."
      />
    </div>
  </div>
</template>

<style scoped>
.terms-viewer {
  @apply w-full;
}
</style>
