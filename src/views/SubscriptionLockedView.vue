<script setup>
import { useAuthStore } from '@/stores/auth';
import api from '@/utils/api';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore()
const router = useRouter()
const isChecking = ref(false)

const checkPaymentStatus = async () => {
  isChecking.value = true

  try {
    await api.get('/api/stations')

    const intendedRoute = localStorage.getItem('intended_route') || 'pos'

    localStorage.removeItem('intended_route')

    router.push({ name: intendedRoute })
  } catch (error) {
    console.log('Pembayaran belum diterima.', error)
  } finally {
    isChecking.value = false
  }
}

onMounted(() => {
  checkPaymentStatus()
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 text-center">
    <div class="max-w-md bg-base-100 p-8 rounded-3xl shadow-2xl border border-error/20">
      <div class="text-error mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
      </div>
      <h1 class="text-3xl font-black mb-4">Sistem Terkunci</h1>
      <p class="text-base-content/70 mb-8 font-medium">
        Masa aktif langganan Anda telah berakhir atau pembayaran belum diselesaikan. Harap hubungi pemilik toko untuk memperbarui tagihan.
      </p>
      <button
        @click="checkPaymentStatus"
        :disabled="isChecking"
        class="btn btn-primary w-full mb-4"
      >
        <span v-if="isChecking" class="loading loading-spinner"></span>
        Cek Status Pembayaran
      </button>
      <button @click="handleLogout" class="btn btn-outline btn-error w-full">
        Kembali ke Login
      </button>
    </div>
  </div>
</template>
