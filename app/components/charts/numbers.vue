<script setup lang="ts">
const props = defineProps<{
  title: string;
  labels: string[];
  data: Array<number | string>;
  cols?: number;
}>()

const cols = props.cols ?? 4

</script>

<template>
  <UCard
    :ui="{
      header: 'pb-0',
      root: 'divide-none'
    }"
    variant="outline"
  >
    <template #header>
      <p class="text-xl">
        {{ props.title }}
      </p>
    </template>
    <UPageGrid :class="`lg:grid-cols-${cols} gap-4 lg:gap-6`">
      <UCard
        v-for="(value, index) in props.data"
        :key="index"
        :ui="{
          header: 'pb-0',
          root: 'divide-none',
          body: 'pt-2!',
        }"
        variant="outline"
        class="bg-gradient-to-tl from-primary/10 from-5% to-default"
      >
        <template #header>
          <p class="text-xl uppercase text-muted">
            {{ props.labels[index] }}
          </p>
        </template>
        <div class="flex items-center gap-2">
          <span class="text-2xl sm:text-xl xl:text-2xl font-semibold">
            <template v-if="typeof props.data[index] === 'string' && (props.data[index] as string).includes('||')">
              <div class="flex flex-col">
                <span>{{ (props.data[index] as string).split('||')[0] }}</span>
                <small class="text-sm text-muted">{{ (props.data[index] as string).split('||')[1] }}</small>
              </div>
            </template>
            <template v-else>
              {{ props.data[index] ?? 0 }}
            </template>
          </span>
        </div>
      </UCard>
    </UPageGrid>
  </UCard>
</template>
