<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)
const { user } = useAuth()

const isAdmin = computed(() => {
  const userType = user.value?.userType
  return userType === 1 || userType === 'ADMIN'
})

const baseLinks = [
  {
    label: 'Home',
    icon: 'i-lucide-house',
    to: '/',
    onSelect: () => { open.value = false }
  },
  {
    label: 'Tickets',
    icon: 'i-lucide-ticket',
    to: '/tickets',
    onSelect: () => { open.value = false }
  },
  {
    label: 'Predictions',
    icon: 'i-lucide-activity',
    to: '/predictions',
    onSelect: () => { open.value = false }
  }
]

const links = computed(() => {
  const mainLinks = [...baseLinks]

  if (isAdmin.value) {
    mainLinks.push({
      label: 'Admin - Termos',
      icon: 'i-lucide-shield-check',
      to: '/admin/terms',
      onSelect: () => { open.value = false }
    })
  }

  return [mainLinks]
}) satisfies ComputedRef<NavigationMenuItem[][]>


const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.value.flat()
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <Logo
          :icon="collapsed"
          class="w-full hover:cursor-pointer mt-4"
          :class="collapsed ? 'px-0' : 'px-8'"
          @click="navigateTo('/')"
        />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
