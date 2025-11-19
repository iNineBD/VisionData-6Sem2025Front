<script setup lang="ts">
import { z } from 'zod'
import type { CreateTermRequest } from '~/types/terms'

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const toast = useToast()
const { createTerm } = useServer()
const loading = ref(false)

// Schema de validação
const termSchema = z.object({
  version: z.string().min(1, 'Versão é obrigatória'),
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  content: z.string().min(50, 'Conteúdo deve ter no mínimo 50 caracteres'),
  effectiveDate: z.string().min(1, 'Data de vigência é obrigatória')
})

const itemSchema = z.object({
  itemOrder: z.number().min(1, 'Ordem deve ser no mínimo 1'),
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  content: z.string().min(10, 'Conteúdo deve ter no mínimo 10 caracteres'),
  isMandatory: z.boolean()
})

interface TermItem {
  itemOrder: number
  title: string
  content: string
  isMandatory: boolean
}

// Estado do formulário
const formState = reactive({
  version: '',
  title: '',
  description: '',
  content: '',
  effectiveDate: ''
})

const items = ref<TermItem[]>([
  {
    itemOrder: 1,
    title: '',
    content: '',
    isMandatory: true
  }
])

// Adiciona um novo item
function addItem () {
  items.value.push({
    itemOrder: items.value.length + 1,
    title: '',
    content: '',
    isMandatory: false
  })
}

// Remove um item
function removeItem (index: number) {
  items.value.splice(index, 1)
  // Reordena os itens
  items.value.forEach((item, idx) => {
    item.itemOrder = idx + 1
  })
}

// Submete o formulário
async function onSubmit () {
  try {
    // Valida dados básicos
    termSchema.parse(formState)

    // Valida itens
    if (items.value.length === 0) {
      toast.add({
        title: 'Erro',
        description: 'Adicione ao menos um item de consentimento',
        color: 'error'
      })
      return
    }

    for (const item of items.value) {
      itemSchema.parse(item)
    }

    loading.value = true

    // Convert date to ISO format if it exists
    const effectiveDate = formState.effectiveDate
      ? new Date(formState.effectiveDate).toISOString()
      : new Date().toISOString()

    const data: CreateTermRequest = {
      version: formState.version,
      title: formState.title,
      description: formState.description,
      content: formState.content,
      effectiveDate,
      items: items.value
    }

    const response = await createTerm(data)

    if (response.success) {
      toast.add({
        title: 'Sucesso',
        description: 'Termo criado com sucesso',
        color: 'success'
      })
      emit('success')
    } else {
      throw new Error('Falha ao criar termo')
    }
  } catch (error: unknown) {
    console.error('Error creating term:', error)
    
    // Captura mensagens específicas do backend
    let message = 'Erro ao criar termo'
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as { statusCode?: number }).statusCode
      
      if (statusCode === 409) {
        message = 'Conflito: Já existe um termo com esta versão ou há um termo ativo pendente'
      } else if ('message' in error && typeof (error as { message?: string }).message === 'string') {
        message = (error as { message: string }).message
      }
    } else if (error instanceof Error) {
      message = error.message
    }
    
    toast.add({
      title: 'Erro',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Informações Básicas -->
    <div>
      <h3 class="text-lg font-semibold mb-4">
        Informações Básicas
      </h3>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Versão <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="formState.version"
            placeholder="Ex: 1.0.0"
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Data de Vigência <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="formState.effectiveDate"
            type="date"
          />
        </div>
      </div>

      <div class="mt-4 space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Título <span class="text-red-500">*</span>
        </label>
        <UInput
          v-model="formState.title"
          placeholder="Ex: Termos de Uso e Política de Privacidade"
        />
      </div>

      <div class="mt-4 space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descrição <span class="text-red-500">*</span>
        </label>
        <UTextarea
          v-model="formState.description"
          placeholder="Breve descrição sobre este termo..."
          :rows="3"
        />
      </div>

      <div class="mt-4 space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Conteúdo Completo <span class="text-red-500">*</span>
        </label>
        <UTextarea
          v-model="formState.content"
          placeholder="Conteúdo completo dos termos de uso..."
          :rows="8"
        />
      </div>
    </div>

    <hr class="border-gray-200 dark:border-gray-700" />

    <!-- Itens de Consentimento -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">
          Itens de Consentimento ({{ items.length }})
        </h3>
        <UButton
          icon="i-lucide-plus"
          size="sm"
          variant="soft"
          @click="addItem"
        >
          Adicionar Item
        </UButton>
      </div>

      <div class="space-y-4">
        <UCard
          v-for="(item, index) in items"
          :key="index"
        >
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-semibold">Item {{ item.itemOrder }}</span>
              <UButton
                v-if="items.length > 1"
                icon="i-lucide-trash-2"
                size="xs"
                color="error"
                variant="ghost"
                @click="removeItem(index)"
              />
            </div>
          </template>

          <div class="space-y-3">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Título do Item <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="item.title"
                placeholder="Ex: Coleta de Dados Pessoais"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Conteúdo do Item <span class="text-red-500">*</span>
              </label>
              <UTextarea
                v-model="item.content"
                placeholder="Descrição detalhada do consentimento..."
                :rows="3"
              />
            </div>

            <UCheckbox
              v-model="item.isMandatory"
              label="Este item é obrigatório"
            />
          </div>
        </UCard>
      </div>
    </div>

    <!-- Ações -->
    <div class="flex justify-end gap-3 pt-4">
      <UButton
        color="neutral"
        variant="ghost"
        :disabled="loading"
        @click="emit('cancel')"
      >
        Cancelar
      </UButton>
      <UButton
        icon="i-lucide-check"
        :loading="loading"
        @click="onSubmit"
      >
        Criar Termo
      </UButton>
    </div>
  </div>
</template>
