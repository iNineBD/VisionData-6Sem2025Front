<script setup lang="ts">
import * as z from 'zod'
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { useServer } from '~/services/use-server'

definePageMeta({
  middleware: ['authenticated']
})

useSeoMeta({
  title: 'Vision Data | Profile'
})

const { postChangePassword, deleteUser } = useServer()
const toast = useToast()
const { user, logout } = useAuth()
const showDeleteModal = ref(false)
const deletingUser = ref(false)

const passwordSchema = z.object({
  current: z.string().min(8, 'Must be at least 8 characters'),
  new: z.string().min(8, 'Must be at least 8 characters')
})

type PasswordSchema = z.output<typeof passwordSchema>

const password = reactive<Partial<PasswordSchema>>({
  current: undefined,
  new: undefined
})

const isLoading = ref(false)

const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = []
  if (state.current && state.new && state.current === state.new) {
    errors.push({ name: 'new', message: 'Passwords must be different' })
  }
  return errors
}

async function onSubmit (event: FormSubmitEvent<PasswordSchema>) {
  try {
    isLoading.value = true

    const response = await postChangePassword(user.value?.id || '', {
      currentPassword: event.data.current,
      newPassword: event.data.new
    }) as {
      success?: boolean
      message?: string
    }

    if (response && response.success) {
      toast.add({
        title: 'Success',
        description: response.message || 'Password updated successfully',
        color: 'success'
      })

      // Reset form
      password.current = undefined
      password.new = undefined
    } else {
      toast.add({
        title: 'Error',
        description: response.message || 'Failed to update password',
        color: 'error'
      })
    }
  } catch (error: any) {
    console.error('Error changing password:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || error?.message || 'Failed to update password. Please check your current password.',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

const handleDeleteAccount = async () => {
  if (!user.value?.id) {
    toast.add({
      title: 'Erro',
      description: 'Usuário não identificado',
      color: 'error'
    })
    return
  }

  try {
    deletingUser.value = true
    const response = await deleteUser()

    if (response.success) {
      toast.add({
        title: 'Conta excluída',
        description: 'Sua conta foi excluída com sucesso',
        color: 'success'
      })

      // Aguarda 1 segundo antes de fazer logout
      setTimeout(async () => {
        await logout()
        await navigateTo('/login')
      }, 1000)
    } else {
      throw new Error(response.message || 'Erro ao excluir conta')
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    toast.add({
      title: 'Erro',
      description: error instanceof Error ? error.message : 'Erro ao excluir conta',
      color: 'error'
    })
  } finally {
    deletingUser.value = false
    showDeleteModal.value = false
  }
}
</script>

<template>
  <div class="container min-h-screen mx-auto px-4 py-8 max-w-4xl flex flex-col gap-6 justify-center">
    <UPageCard
      title="Password"
      description="Confirm your current password before setting a new one."
      variant="subtle"
    >
      <UForm
        :schema="passwordSchema"
        :state="password"
        :validate="validate"
        class="flex flex-col gap-4 max-w-xs"
        @submit="onSubmit"
      >
        <UFormField
          name="current"
          label="Current Password"
        >
          <UInput
            v-model="password.current"
            type="password"
            placeholder="Enter current password"
            class="w-full"
            :disabled="isLoading"
            icon="i-lucide-lock"
          />
        </UFormField>

        <UFormField
          name="new"
          label="New Password"
        >
          <UInput
            v-model="password.new"
            type="password"
            placeholder="Enter new password"
            class="w-full"
            :disabled="isLoading"
            icon="i-lucide-lock-keyhole"
          />
        </UFormField>

        <div class="flex items-center gap-2 text-sm text-muted">
          <UIcon
            name="i-lucide-info"
            class="flex-shrink-0"
          />
          <span>Password must be at least 8 characters long</span>
        </div>

        <UButton
          label="Update Password"
          class="w-fit"
          type="submit"
          :loading="isLoading"
          :disabled="isLoading"
          icon="i-lucide-check"
        />
      </UForm>
    </UPageCard>

    <UPageCard
      title="Account"
      description="No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently."
      class="bg-gradient-to-tl from-error/10 from-5% to-default"
    >
      <template #footer>
        <UButton
          label="Delete account"
          color="error"
          @click="showDeleteModal = true"
        />
      </template>
    </UPageCard>


    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showDeleteModal = false"
    >
      <UCard class="max-w-md mx-4 shadow-xl">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-lucide-alert-triangle"
              class="w-6 h-6 text-error"
            />
            <h3 class="text-lg font-semibold">
              Excluir Conta
            </h3>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Tem certeza que deseja excluir sua conta? Esta ação é <strong>irreversível</strong> e todos os seus dados serão permanentemente removidos.
          </p>

          <UAlert
            icon="i-lucide-info"
            color="warning"
            variant="soft"
            title="Atenção"
            description="Você será desconectado automaticamente após a exclusão."
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancelar"
              :disabled="deletingUser"
              @click="showDeleteModal = false"
            />
            <UButton
              color="error"
              :loading="deletingUser"
              label="Confirmar Exclusão"
              @click="handleDeleteAccount"
            />
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
