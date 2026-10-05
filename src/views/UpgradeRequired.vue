<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push({ name: 'pos' })
}

const contactSales = () => {
  const waNumber = '6281213389991'
  const message = 'Halo, saya ingin upgrade paket POS saya untuk membuka fitur Premium.'
  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank')
}
</script>

<template>
  <div class="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 text-center">
    <div
      class="max-w-md bg-base-100 p-8 rounded-3xl shadow-2xl border border-warning/20 relative overflow-hidden"
    >
      <div
        class="absolute -top-12 -right-12 w-32 h-32 bg-warning/10 rounded-full blur-3xl pointer-events-none"
      ></div>
      <div
        class="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"
      ></div>

      <div class="text-warning mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-24 w-24 mx-auto drop-shadow-sm"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>

      <h1 class="text-3xl font-black mb-4">Fitur Premium 🚀</h1>

      <p class="text-base-content/70 mb-8 font-medium">
        Menu yang Anda coba akses tidak tersedia di paket langganan saat ini. Tingkatkan paket Anda
        sekarang untuk membuka kunci fitur ini dan percepat operasional bisnis Anda!
      </p>

      <div class="flex flex-col gap-3">
        <button
          @click="contactSales"
          class="btn btn-warning w-full text-warning-content font-bold shadow-lg shadow-warning/30 hover:scale-[1.02] transition-transform"
        >
          Upgrade Sekarang
        </button>

        <button @click="goBack" class="btn btn-ghost w-full">Kembali ke Kasir</button>
      </div>
    </div>
  </div>
</template>
