<script setup lang="ts">
import type { Term, ItemConsentRequest } from '~/types/terms'

interface Props {
  term: Term | null
  loading?: boolean
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
    const initialConsents: Record<number, boolean> = {}
    newTerm.items.forEach((item) => {
      initialConsents[item.id] = false
    })
    itemConsents.value = initialConsents
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
    <!-- Loading State -->
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

    <!-- No Term Available -->
    <UAlert
      v-else-if="!term"
      icon="i-lucide-alert-circle"
      color="warning"
      variant="soft"
      title="Termos não disponíveis"
      description="Não foi possível carregar os termos de uso. Por favor, tente novamente mais tarde."
    />

    <!-- Term Content -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Term Header -->
      <div class="border-b pb-4">
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

      <!-- Term Main Content -->
      <div class="prose dark:prose-invert max-w-none">
        <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {{ term.content }}
        </div>
      </div>

      <!-- Consent Items -->
      <div class="space-y-4 mt-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Consentimentos
        </h3>

        <div
          v-for="item in term.items"
          :key="item.id"
          class="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          :class="{
            'border-red-300 dark:border-red-700': item.isMandatory && !itemConsents[item.id],
            'border-green-300 dark:border-green-700': itemConsents[item.id]
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
                  class="text-red-600 dark:text-red-400 ml-1"
                >*</span>
              </label>

              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {{ item.content }}
              </p>

              <div class="flex items-center gap-2 mt-2">
                <UBadge
                  v-if="item.isMandatory"
                  color="error"
                  variant="soft"
                  size="xs"
                >
                  Obrigatório
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

      <!-- Validation Warning -->
      <UAlert
        v-if="!allMandatoryAccepted"
        icon="i-lucide-info"
        color="warning"
        variant="soft"
        title="Atenção"
        description="Você deve aceitar todos os itens obrigatórios para continuar."
      />
    </div>
  </div>
</template>

<style scoped>
.terms-viewer {
  @apply w-full;
}
</style>
