<script setup>
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const tenant_id = ref('')

const errorMsg = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMsg.value = ''
  isLoading.value = true

  try {
    await authStore.login(email.value, password.value, tenant_id.value)
    router.push('/')
  } catch (error) {
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors
      errorMsg.value = errors.tenant_id?.[0] || errors.email?.[0] || 'Login gagal.'
    } else {
      errorMsg.value = 'Koneksi ke server bermasalah.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-300 flex items-center justify-center p-6 md:p-12">
    <!-- Card -->
    <div
      class="card md:card-side bg-base-100 shadow-2xl w-full max-w-6xl h-full md:h-[80vh] min-h-162.5 overflow-hidden"
    >
      <div
        class="flex-1 bg-primary text-primary-content p-10 hidden md:flex flex-col justify-between"
      >
        <div class="">
          <div class="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h1 class="text-3xl font-bold tracking-widest uppercase">Artisan POS</h1>
          </div>

          <h2 class="text-5xl font-light mt-16 leading-tight">
            Siap untuk <br />
            <span class="font-bold">shift hari ini?</span>
          </h2>
        </div>

        <div class="">
          <p class="text-4xl font-semibold tracking-wider">Current Time</p>
          <p class="text-lg opacity-80 mt-1">Current Date</p>
        </div>
      </div>

      <div class="flex-1 p-8 md:p-12 flex flex-col justify-center bg-base-200">
        <div class="max-w-md mx-auto w-full">
          <h3 class="text-3xl font-bold mb-2">Login</h3>
          <p class="text-base-content/60 mb-6">
            Masukkan ID tenant dan kredensial Anda untuk mengakses terminal.
          </p>

          <div v-if="errorMsg" role="alert" class="alert alert-warning mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{{ errorMsg }}</span>
          </div>

          <form @submit.prevent="handleLogin">
            <div class="form-control w-full mb-4">
              <label for="tenant_id" class="label">
                <span class="label-text font-semibold text-lg">ID Tenant</span>
              </label>
              <input
                id="tenant_id"
                v-model="tenant_id"
                type="text"
                placeholder="artisanpos"
                class="input input-lg input-bordered w-full focus:input-primary text-lg"
              />
            </div>

            <div class="form-control w-full mb-4">
              <label for="email" class="label">
                <span class="label-text font-semibold text-lg">Alamat Email</span>
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="kasir@contoh.com"
                class="input input-lg input-bordered w-full focus:input-primary text-lg"
              />
            </div>

            <div class="form-control w-full mb-8">
              <label for="password" class="label">
                <span class="label-text font-semibold text-lg">Kata Sandi</span>
              </label>
              <input
                id="password"
                type="password"
                v-model="password"
                placeholder="••••••••"
                class="input input-lg input-bordered w-full focus:input-primary text-lg tracking-widest"
              />
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="btn btn-primary btn-lg w-full text-xl h-16"
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
