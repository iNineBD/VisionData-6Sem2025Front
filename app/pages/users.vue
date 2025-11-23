<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { Row } from '@tanstack/table-core'
import type { User } from '~/types/auth'
import { useServer } from '~/services/use-server'

definePageMeta({
  middleware: ['authenticated', 'admin']
})

useSeoMeta({
  title: 'Vision Data | Users'
})

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')
const { getUsers, putUser, deleteUserId, getConsents } = useServer()

const columnFilters = ref([{
  id: 'email',
  value: ''
}])
const columnVisibility = ref()
const rowSelection = ref({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const statusFilter = ref('all')
const users = ref<User[]>([])
const isLoading = ref(false)
const totalUsers = ref(0)

// Modal states
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const selectedUser = ref<User | null>(null)
const userConsents = ref<any>(null)
const isLoadingConsents = ref(false)

// Type for edited user with normalized userType
type EditedUser = {
  name?: string
  email?: string
  userType?: 'ADMIN' | 'MANAGER' | 'SUPPORT'
  isActive?: boolean
  password?: string
}
const editedUser = ref<EditedUser>({})
const showPasswordField = ref(false)

// Fetch users function
async function fetchUsers () {
  try {
    isLoading.value = true
    const onlyActive = statusFilter.value === 'active'

    const response = await getUsers(
      pagination.value.pageIndex + 1,
      pagination.value.pageSize,
      onlyActive
    ) as {
      success?: boolean
      data?: {
        users?: User[]
        totalCount?: number
      }
      users?: User[]
      totalCount?: number
    } | User[]

    // Tenta múltiplas estruturas possíveis de resposta
    if (response && typeof response === 'object' && 'data' in response && response.data && 'users' in response.data && Array.isArray(response.data.users)) {
      // Estrutura: { success, data: { users, totalCount } }
      users.value = response.data.users
      totalUsers.value = response.data.totalCount || 0
    } else if (response && typeof response === 'object' && 'users' in response && Array.isArray(response.users)) {
      // Estrutura: { users, totalCount }
      users.value = response.users
      totalUsers.value = response.totalCount || 0
    } else if (Array.isArray(response)) {
      // Estrutura: array direto
      users.value = response
      totalUsers.value = response.length
    } else {
      users.value = []
      totalUsers.value = 0
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    users.value = []
    totalUsers.value = 0
  } finally {
    isLoading.value = false
  }
}

// Initial fetch
await fetchUsers()

// Watch for status filter changes
watch(() => statusFilter.value, () => {
  pagination.value.pageIndex = 0 // Reset to first page
  fetchUsers()
})

// Watch for pagination changes
watch(() => [pagination.value.pageIndex, pagination.value.pageSize], () => {
  fetchUsers()
}, { deep: true })

// Normalize userType to string for form compatibility
function normalizeUserType (userType: User['userType']): 'ADMIN' | 'MANAGER' | 'SUPPORT' {
  if (typeof userType === 'string') return userType
  switch (userType) {
    case 1: return 'ADMIN'
    case 2: return 'MANAGER'
    case 3: return 'SUPPORT'
    default: return 'SUPPORT'
  }
}

// Handle user edit
async function handleEditUser (user: User) {
  selectedUser.value = user
  // Create a copy to avoid mutating the original and normalize userType to string
  editedUser.value = {
    ...user,
    userType: normalizeUserType(user.userType)
  }
  isEditModalOpen.value = true

  // Fetch user consents
  await fetchUserConsents(user.id)
}

// Fetch user consents
async function fetchUserConsents (userId: number) {
  try {
    isLoadingConsents.value = true
    const response = await getConsents(userId) as {
      success?: boolean
      data?: {
        consentDate?: string
        id?: number
        isActive?: boolean
        itemConsents?: Array<{
          accepted: boolean
          isMandatory: boolean
          itemId: number
          itemTitle: string
        }>
        termId?: number
        termVersion?: string
        userId?: number
      }
    }

    if (response && response.success && response.data) {
      userConsents.value = response.data
    } else {
      userConsents.value = null
    }
  } catch (error) {
    console.error('Error fetching user consents:', error)
    userConsents.value = null
  } finally {
    isLoadingConsents.value = false
  }
}

// Handle user delete
async function handleDeleteUser (user: User) {
  selectedUser.value = user
  isDeleteModalOpen.value = true
}

// Confirm user deletion
async function confirmDeleteUser () {
  if (!selectedUser.value) return

  try {
    await deleteUserId(selectedUser.value.id)
    toast.add({
      title: 'User deleted',
      description: `User ${selectedUser.value.name} has been deleted successfully`
    })
    await fetchUsers()
    isDeleteModalOpen.value = false
    selectedUser.value = null
  } catch (error) {
    console.error('Error deleting user:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete user',
      color: 'error'
    })
  }
}

// Save edited user
async function saveEditedUser () {
  if (!selectedUser.value || !editedUser.value) return

  try {
    // Create payload without password if it's empty
    const payload = { ...editedUser.value }
    if (!payload.password || payload.password.trim() === '') {
      delete payload.password
    }

    await putUser(selectedUser.value.id, payload)
    toast.add({
      title: 'User updated',
      description: `User ${editedUser.value.name} has been updated successfully`
    })
    await fetchUsers()
    isEditModalOpen.value = false
    selectedUser.value = null
    editedUser.value = {}
    showPasswordField.value = false
  } catch (error) {
    console.error('Error updating user:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to update user',
      color: 'error'
    })
  }
}

// Close edit modal and reset
function closeEditModal () {
  isEditModalOpen.value = false
  selectedUser.value = null
  editedUser.value = {}
  userConsents.value = null
  showPasswordField.value = false
}

function getRowItems (row: Row<User>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      type: 'separator'
    },
    {
      label: 'Edit user',
      icon: 'i-lucide-edit',
      onSelect () {
        handleEditUser(row.original)
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete user',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect () {
        handleDeleteUser(row.original)
      }
    }
  ]
}

const columns: TableColumn<User>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          alt: row.original.name,
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: 'text-sm text-muted' }, row.original.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Email',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  {
    accessorKey: 'userType',
    header: 'Role',
    cell: ({ row }) => {
      const color = {
        ADMIN: 'error' as const,
        1: 'error' as const,
        MANAGER: 'warning' as const,
        2: 'warning' as const,
        SUPPORT: 'primary' as const,
        3: 'primary' as const
      }[row.original.userType]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        row.original.userType
      )
    }
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    filterFn: 'equals',
    cell: ({ row }) => {
      const color = row.original.isActive ? 'success' as const : 'error' as const
      const label = row.original.isActive ? 'Active' : 'Inactive'

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => label)
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]
</script>

<template>
  <UDashboardPanel id="users">
    <template #header>
      <UDashboardNavbar title="Users">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          :model-value="(table?.tableApi?.getColumn('email')?.getFilterValue() as string)"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter emails..."
          @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)"
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' }
            ]"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            placeholder="Filter status"
            class="min-w-28"
          />
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Display"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        class="shrink-0"
        :data="users"
        :columns="columns"
        :loading="isLoading"
        :manual-pagination="true"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        }"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="totalUsers"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>

      <!-- Edit User Modal -->
      <UModal
        v-model:open="isEditModalOpen"
        title="Edit User"
        description="Update user information"
        :ui="{ width: 'sm:max-w-2xl' }"
      >
        <template #body>
          <div
            v-if="editedUser"
            class="space-y-6"
          >
            <!-- User Information Section -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold">
                User Information
              </h3>
              <UFormField label="Name">
                <UInput
                  v-model="editedUser.name"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Email">
                <UInput
                  v-model="editedUser.email"
                  type="email"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Role">
                <USelect
                  v-model="editedUser.userType"
                  :items="[
                    { label: 'Admin', value: 'ADMIN' },
                    { label: 'Manager', value: 'MANAGER' },
                    { label: 'Support', value: 'SUPPORT' }
                  ]"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Status">
                <USwitch
                  v-model="editedUser.isActive"
                  :label="editedUser.isActive ? 'Active' : 'Inactive'"
                />
              </UFormField>

              <!-- Password Change Section -->
              <div class="space-y-3 pt-3 border-t border-default">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium">Change Password</label>
                  <UButton
                    :label="showPasswordField ? 'Cancel' : 'Change Password'"
                    :color="showPasswordField ? 'neutral' : 'primary'"
                    variant="ghost"
                    size="xs"
                    @click="showPasswordField = !showPasswordField; if (!showPasswordField) editedUser.password = ''"
                  />
                </div>
                <UFormField
                  v-if="showPasswordField"
                  label="Nova Senha"
                  hint="Deixe em branco para manter a senha atual"
                >
                  <UInput
                    v-model="editedUser.password"
                    type="password"
                    placeholder="Digite a nova senha"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

            <!-- Consents Section -->
            <div class="space-y-4 border-t border-default pt-4">
              <h3 class="text-lg font-semibold">
                Consentimentos do usuário
              </h3>

              <div
                v-if="isLoadingConsents"
                class="flex items-center justify-center py-8"
              >
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>

              <div
                v-else-if="userConsents"
                class="space-y-3"
              >
                <div class="text-sm space-y-1">
                  <p class="text-muted">
                    <span class="font-medium">Data do Consentimento:</span> {{ new Date(userConsents.consentDate).toLocaleString() }}
                  </p>
                  <p class="text-muted">
                    <span class="font-medium">Versão do Termo:</span> {{ userConsents.termVersion }}
                  </p>
                  <p class="text-muted">
                    <span class="font-medium">Status:</span>
                    <UBadge
                      :color="userConsents.isActive ? 'success' : 'error'"
                      variant="subtle"
                      class="ml-1"
                    >
                      {{ userConsents.isActive ? 'Active' : 'Inactive' }}
                    </UBadge>
                  </p>
                </div>

                <div
                  v-if="userConsents.itemConsents && userConsents.itemConsents.length > 0"
                  class="space-y-2"
                >
                  <p class="font-medium text-sm">Itens de Consentimento:</p>
                  <div class="space-y-2 max-h-48 overflow-y-auto">
                    <div
                      v-for="item in userConsents.itemConsents"
                      :key="item.itemId"
                      class="flex items-start gap-2 p-3 rounded-lg bg-elevated border border-default"
                    >
                      <UIcon
                        :name="item.accepted ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                        :class="item.accepted ? 'text-success' : 'text-error'"
                        class="mt-0.5 flex-shrink-0"
                      />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium">{{ item.itemTitle }}</p>
                        <div class="flex items-center gap-2 mt-1">
                          <UBadge
                            :color="item.accepted ? 'success' : 'error'"
                            variant="subtle"
                            size="xs"
                          >
                            {{ item.accepted ? 'Accepted' : 'Declined' }}
                          </UBadge>
                          <UBadge
                            v-if="item.isMandatory"
                            color="warning"
                            variant="subtle"
                            size="xs"
                          >
                            Mandatory
                          </UBadge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="text-center py-8 text-muted"
              >
                <UIcon
                  name="i-lucide-file-warning"
                  class="w-12 h-12 mx-auto mb-2 opacity-50"
                />
                <p>Nenhum consentimento encontrado para este usuário</p>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-4 border-t border-default">
              <UButton
                label="Cancel"
                color="neutral"
                variant="subtle"
                @click="closeEditModal"
              />
              <UButton
                label="Save Changes"
                color="primary"
                variant="solid"
                @click="saveEditedUser"
              />
            </div>
          </div>
        </template>
      </UModal>

      <!-- Delete User Modal -->
      <UModal
        v-model:open="isDeleteModalOpen"
        :title="`Delete ${selectedUser?.name || 'User'}`"
        description="Are you sure? This action cannot be undone."
      >
        <template #body>
          <div class="flex justify-end gap-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="subtle"
              @click="isDeleteModalOpen = false"
            />
            <UButton
              label="Delete"
              color="error"
              variant="solid"
              @click="confirmDeleteUser"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
