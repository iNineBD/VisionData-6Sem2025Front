<script setup lang="ts">
import type { ConsentStatusResponse } from '~/types/terms'

definePageMeta({
  middleware: 'authenticated'
})

const toast = useToast()
const { getMyConsent } = useServer()

const loading = ref(true)
const consentData = ref<ConsentStatusResponse | null>(null)

// Carrega os dados de consentimento ao montar o componente
onMounted(async () => {
  try {
    const response = await getMyConsent()
    if (response.success) {
      consentData.value = response
    } else {
      toast.add({
        title: 'Erro',
        description: 'Não foi possível carregar seus dados de consentimento',
        color: 'error'
      })
    }
  } catch (error) {
    console.error('Error loading consent:', error)
    toast.add({
      title: 'Erro',
      description: 'Erro ao carregar dados de consentimento',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Meus Consentimentos
      </h1>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
        Visualize o status dos seus consentimentos e termos de uso aceitos
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex justify-center items-center py-12"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-primary"
      />
      <span class="ml-2">Carregando...</span>
    </div>

    <!-- Consent Data -->
    <div
      v-else-if="consentData"
      class="space-y-6"
    >
      <!-- Status Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              Status do Consentimento
            </h2>
            <UBadge
              :color="consentData.data.hasActiveConsent ? 'success' : 'error'"
              variant="soft"
              size="lg"
            >
              {{ consentData.data.hasActiveConsent ? 'Ativo' : 'Inativo' }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Has Active Consent -->
          <div class="flex items-start gap-3">
            <UIcon
              :name="consentData.data.hasActiveConsent ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              :class="consentData.data.hasActiveConsent ? 'text-green-600' : 'text-red-600'"
              class="w-6 h-6 mt-0.5"
            />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {{ consentData.data.hasActiveConsent ? 'Consentimento Ativo' : 'Sem Consentimento Ativo' }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{
                  consentData.data.hasActiveConsent
                    ? 'Você possui um consentimento válido registrado'
                    : 'Não há registro de consentimento ativo'
                }}
              </p>
            </div>
          </div>

          <!-- Current Term Info (only if has active consent) -->
          <template v-if="consentData.data.hasActiveConsent">
            <UDivider />

            <!-- Term Title -->
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-file-text"
                class="w-6 h-6 text-blue-600 mt-0.5"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-gray-100">
                  {{ consentData.data.currentTermTitle }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Versão {{ consentData.data.currentTermVersion }}
                </p>
              </div>
            </div>

            <!-- Consent Date -->
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-calendar"
                class="w-6 h-6 text-purple-600 mt-0.5"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-gray-100">
                  Data do Consentimento
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(consentData.data.consentDate!) }}
                </p>
              </div>
            </div>
          </template>

          <!-- Needs New Consent Warning -->
          <template v-if="consentData.data.needsNewConsent">
            <UDivider />

            <UAlert
              icon="i-lucide-alert-triangle"
              color="warning"
              variant="soft"
              title="Novo Consentimento Necessário"
              description="Uma nova versão dos termos de uso está disponível. Entre em contato com o administrador para atualizar seu consentimento."
            />
          </template>
        </div>
      </UCard>

      <!-- Additional Information -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Informações Adicionais
          </h2>
        </template>

        <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-start gap-2">
            <UIcon
              name="i-lucide-info"
              class="w-4 h-4 mt-0.5"
            />
            <p>
              Seu consentimento é registrado de acordo com as regulamentações da LGPD (Lei Geral de Proteção de Dados).
            </p>
          </div>

          <div class="flex items-start gap-2">
            <UIcon
              name="i-lucide-shield"
              class="w-4 h-4 mt-0.5"
            />
            <p>
              Seus dados são armazenados com segurança e utilizados apenas para os fins especificados nos termos de uso.
            </p>
          </div>

          <div class="flex items-start gap-2">
            <UIcon
              name="i-lucide-mail"
              class="w-4 h-4 mt-0.5"
            />
            <p>
              Para solicitar a revogação do seu consentimento ou obter mais informações, entre em contato com o suporte.
            </p>
          </div>
        </div>
      </UCard>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <UButton
          icon="i-lucide-arrow-left"
          variant="outline"
          color="neutral"
          to="/"
        >
          Voltar
        </UButton>
      </div>
    </div>

    <!-- Error State -->
    <UAlert
      v-else
      icon="i-lucide-alert-circle"
      color="error"
      variant="soft"
      title="Erro ao Carregar"
      description="Não foi possível carregar os dados de consentimento. Tente novamente mais tarde."
    />
  </div>
</template>
