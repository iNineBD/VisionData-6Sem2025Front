<script setup lang="ts">
import { z } from 'zod'
import type { CreateTermRequest } from '~/types/terms'
import type { DateValue } from '@internationalized/date'
import { CalendarDate } from '@internationalized/date'

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const toast = useToast()
const { createTerm } = useServer()
const loading = ref(false)

// Estado para o popover do calendário
const isCalendarOpen = ref(false)
const selectedDate = ref<DateValue>()

// Função para converter DateValue para string dd/MM/yyyy
function formatDateToString(date: DateValue): string {
  const day = String(date.day).padStart(2, '0')
  const month = String(date.month).padStart(2, '0')
  const year = String(date.year)
  return `${day}/${month}/${year}`
}

// Quando seleciona data no calendário
function onDateSelect(date: DateValue | any) {
  if (date && 'day' in date && 'month' in date && 'year' in date) {
    selectedDate.value = date as DateValue
    formState.effectiveDate = formatDateToString(date as DateValue)
    isCalendarOpen.value = false
  }
}

// Schema de validação
const termSchema = z.object({
  version: z.string().min(1, 'Versão é obrigatória'),
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  content: z.string().min(50, 'Conteúdo deve ter no mínimo 50 caracteres'),
  effectiveDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato dd/mm/aaaa')
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
    loading.value = true

    // Convert date from dd/MM/yyyy to ISO format
    let effectiveDate: string
    if (formState.effectiveDate) {
      const [day, month, year] = formState.effectiveDate.split('/')
      if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
        effectiveDate = new Date(`${year}-${month}-${day}`).toISOString()
      } else {
        effectiveDate = new Date().toISOString()
      }
    } else {
      effectiveDate = new Date().toISOString()
    }

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
        description: response.message || 'Termo criado com sucesso',
        color: 'success'
      })
      emit('success')
    } else {
      toast.add({
        title: 'Erro',
        description: response.message || 'Falha ao criar termo',
        color: 'error'
      })
    }
  } catch (error: any) {
    console.error('Error creating term:', error)
    
    const message = error?.data?.message || error?.message || 'Erro ao criar termo'
    
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
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
    <!-- Coluna Esquerda: Informações Básicas -->
    <div class="space-y-4 min-w-0">
      <h3 class="text-lg font-semibold">
        Informações Básicas
      </h3>

      <!-- Versão e Data em Grid -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Versão <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="formState.version"
            placeholder="Ex: 1.0.0"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data de Vigência <span class="text-red-500">*</span>
          </label>
          <UPopover
            v-model:open="isCalendarOpen"
            :popper="{ placement: 'bottom-start' }"
          >
            <UInput
              v-model="formState.effectiveDate"
              type="text"
              placeholder="dd/mm/aaaa"
              icon="i-lucide-calendar"
              readonly
              class="cursor-pointer"
              @click="isCalendarOpen = true"
            />
            <template #content>
              <UCalendar
                v-model="selectedDate"
                @update:model-value="onDateSelect"
              />
            </template>
          </UPopover>
        </div>
      </div>

      <!-- Título -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Título <span class="text-red-500">*</span>
        </label>
        <UInput
          v-model="formState.title"
          placeholder="Ex: Termos de Uso e Política de Privacidade"
        />
      </div>

      <!-- Descrição -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Descrição <span class="text-red-500">*</span>
        </label>
        <UTextarea
          v-model="formState.description"
          placeholder="Breve descrição sobre este termo..."
          :rows="3"
        />
      </div>

      <!-- Conteúdo Completo -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Conteúdo Completo <span class="text-red-500">*</span>
        </label>
        <UTextarea
          v-model="formState.content"
          placeholder="Conteúdo completo dos termos de uso..."
          :rows="8"
        />
      </div>
    </div>

    <!-- Coluna Direita: Itens de Consentimento -->
    <div class="space-y-4 min-w-0">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">
          Itens de Consentimento ({{ items.length }})
        </h3>
        <UButton
          icon="i-lucide-plus"
          size="sm"
          variant="soft"
          @click="addItem"
        >
          Adicionar
        </UButton>
      </div>

      <div class="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto px-1 py-1">
        <UCard
          v-for="(item, index) in items"
          :key="index"
          class="relative"
        >
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-semibold text-sm">Item {{ item.itemOrder }}</span>
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
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título do Item <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="item.title"
                placeholder="Ex: Coleta de Dados Pessoais"
                size="sm"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Conteúdo do Item <span class="text-red-500">*</span>
              </label>
              <UTextarea
                v-model="item.content"
                placeholder="Descrição detalhada..."
                :rows="3"
                size="sm"
              />
            </div>

            <UCheckbox
              v-model="item.isMandatory"
              label="Obrigatório"
              size="sm"
            />
          </div>
        </UCard>
      </div>
    </div>

    <!-- Ações (Full Width no final) -->
    <div class="xl:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
