<script setup lang="ts">
import type { CalendarDate, DateValue } from '@internationalized/date'
import { parseISOToCalendarDate, toISOFromCalendarDate, dateValueToISO } from '~/utils/dateRangeHelpers'

interface Props {
  modelValue: { start: CalendarDate; end: CalendarDate }
  availableDates: string[]
  label?: string
  isHistoricalDate: (day: DateValue) => boolean
  isPredictionDate: (day: DateValue) => boolean
  numberOfMonths?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Escolher período',
  numberOfMonths: 1,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: { start: CalendarDate; end: CalendarDate }]
}>()

const allowedSet = computed(() => new Set(props.availableDates))
const isUnavailable = (date: DateValue) => !allowedSet.value.has(dateValueToISO(date))

const minValue = computed(() => parseISOToCalendarDate(props.availableDates[0] ?? null))
const maxValue = computed(() => parseISOToCalendarDate(props.availableDates[props.availableDates.length - 1] ?? null))

const rangeLabel = computed(() => {
  const start = toISOFromCalendarDate(props.modelValue.start)
  const end = toISOFromCalendarDate(props.modelValue.end)
  const fmtStart = formatISOToBR(start)
  const fmtEnd = formatISOToBR(end)
  if (fmtStart && fmtEnd) return `${fmtStart} — ${fmtEnd}`
  if (fmtStart) return fmtStart
  return props.label
})

const isDateInRange = (day: DateValue) => {
  const dayISO = dateValueToISO(day)
  const startISO = toISOFromCalendarDate(props.modelValue.start)
  const endISO = toISOFromCalendarDate(props.modelValue.end)
  if (!startISO || !endISO) return false
  return dayISO >= startISO && dayISO <= endISO
}

const isStartDate = (day: DateValue) => {
  const dayISO = dateValueToISO(day)
  const startISO = toISOFromCalendarDate(props.modelValue.start)
  return dayISO === startISO
}

const isEndDate = (day: DateValue) => {
  const dayISO = dateValueToISO(day)
  const endISO = toISOFromCalendarDate(props.modelValue.end)
  return dayISO === endISO
}

const isMiddleDate = (day: DateValue) => {
  return isDateInRange(day) && !isStartDate(day) && !isEndDate(day)
}

const localValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

function formatISOToBR (iso: string | null): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return null
  return `${d}/${m}/${y}`
}

const isAllowedDate = (date: DateValue) => !isUnavailable(date)

// Range picking state helpers
const startISO = computed(() => toISOFromCalendarDate(props.modelValue.start))
const endISO = computed(() => toISOFromCalendarDate(props.modelValue.end))
const isPickingSecond = computed(() => !!startISO.value && startISO.value === endISO.value)

const isSelectableHint = (day: DateValue) => {
  if (!isPickingSecond.value) return false
  if (!isAllowedDate(day)) return false
  const iso = dateValueToISO(day)
  return !!startISO.value && iso >= startISO.value
}
</script>

<template>
  <UPopover
    :popper="{ placement: 'bottom-start' }"
    :disabled="disabled"
  >
    <template #default="{ open }">
      <UButton
        :icon="'i-lucide-calendar'"
        :trailing-icon="!disabled ? (open ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid') : undefined"
        color="neutral"
        variant="subtle"
        size="xs"
        :disabled="disabled"
        class="!text-xs !px-2 !py-1 min-h-0 h-7"
      >
        <template v-if="disabled">
          <UIcon
            name="i-heroicons-arrow-path-20-solid"
            class="animate-spin h-4 w-4 text-gray-500 dark:text-gray-400"
          />
        </template>
        <template v-else>
          {{ rangeLabel }}
        </template>
      </UButton>
    </template>

    <template #content>
      <div
        class="p-2"
        :class="disabled ? 'opacity-50 pointer-events-none select-none' : ''"
      >
        <div class="flex gap-3 items-center mb-2 pb-2 border-b text-xs">
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800" />
            <span class="text-gray-600 dark:text-gray-400">Histórico</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900 border border-amber-200 dark:border-amber-800" />
            <span class="text-gray-600 dark:text-gray-400">Previsão</span>
          </div>
        </div>

        <UCalendar
          v-model="localValue"
          :number-of-months="numberOfMonths"
          locale="pt-BR"
          range
          size="xs"
          :is-date-unavailable="isUnavailable"
          :min-value="minValue"
          :max-value="maxValue"
        >
          <template #day="{ day }">
            <div
              class="relative w-full h-full flex items-center justify-center rounded transition-all cursor-pointer select-none"
              :class="{
                'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100': isHistoricalDate(day) && !isDateInRange(day),
                'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100': isPredictionDate(day) && !isDateInRange(day),

                // Start/End dates - stronger background with softer border
                'bg-blue-500 dark:bg-blue-600 text-white font-semibold shadow-md border-2 border-blue-500/90 dark:border-blue-400/90': (isStartDate(day) || isEndDate(day)) && isHistoricalDate(day),
                'bg-amber-500 dark:bg-amber-600 text-white font-semibold shadow-md border-2 border-amber-500/90 dark:border-amber-400/90': (isStartDate(day) || isEndDate(day)) && isPredictionDate(day),

                // Middle dates - slightly darker background with subtle border
                'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium border border-blue-300 dark:border-blue-600': isMiddleDate(day) && isHistoricalDate(day),
                'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-medium border border-amber-300 dark:border-amber-600': isMiddleDate(day) && isPredictionDate(day),

                // Hover effect for non-selected dates
                'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600 hover:scale-105': !isDateInRange(day),

                'border border-gray-300 dark:border-gray-700': isAllowedDate(day) && !isDateInRange(day),

                'border border-primary-200 dark:border-primary-700': isSelectableHint(day) && !isDateInRange(day)
              }"
              :title="formatISOToBR(dateValueToISO(day)) ?? ''"
            >
              {{ day.day }}
            </div>
          </template>
        </UCalendar>
      </div>
    </template>
  </UPopover>
</template>

