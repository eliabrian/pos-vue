<script setup>
import { useAuthStore } from '@/stores/auth';
import api from '@/utils/api';
import { onMounted, onUnmounted, ref } from 'vue';

const authStore = useAuthStore()
const currentTime = ref('')
const stations = ref([])
const selectedStation = ref(null)
const showStationModal = ref(false)
const tickets = ref([])
const isLoadingTickets = ref(false)
const timeNow = ref(new Date())

onMounted(() => {
  updateClock()
  clockInterval = setInterval(updateClock, 1000)

  fetchStations()

  const savedId = localStorage.getItem('kds_station_id')
  const savedName = localStorage.getItem('kds_station_name')

  if (savedId && savedName) {
    selectedStation.value = { id: parseInt(savedId), name: savedName }
    fetchTickets()
  } else {
    showStationModal.value = true
  }
})

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval)
})

let clockInterval = null

const updateClock = () => {
  const now = new Date()
  timeNow.value = now
  currentTime.value = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + ' WIB'
}

const fetchStations = async () => {
  try {
    const response = await api.get('/api/stations')
    stations.value = response.data
  } catch (error) {
    console.log('Gagal memuat panel:', error)
  }
}

const getElapsedTime = (createdAtStr) => {
  const created = new Date(createdAtStr)
  const diffMs = timeNow.value - created
  if (diffMs < 0) return '00:00'

  const diffMins = Math.floor(diffMs / 60000)
  const diffSecs = Math.floor((diffMs % 60000) / 1000)

  return `${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`
}

const selectStation = (station) => {
  selectedStation.value = station
  showStationModal.value = false

  localStorage.setItem('kds_station_id', station.id)
  localStorage.setItem('kds_station_name', station.name)

  fetchTickets()
}

const changeStation = () => {
  showStationModal.value = true
}

const fetchTickets = async () => {
  if (!selectedStation.value) return

  isLoadingTickets.value = true

  try {
    const response = await api.get('/api/orders?include=products,products.station')
    const allOrders = response.data.data

    const stationTickets = allOrders.map(order => {
      const items = order.attributes.items || []

      const relevantItems = items.filter(item => {
        return item.station && item.station.id === selectedStation.value.id
      })
      .map(item => {
        let parsedVariants = []
        try {
          parsedVariants = typeof item.variant_selected === 'string'
            ? JSON.parse(item.variant_selected || '[]')
            : (item.variant_selected || [])
        } catch (e) {
          console.error('Gagal parse variant untuk item:', item.name)
        }

        return {
          ...item,
          variants_array: parsedVariants,
          _is_done: false
        }
      })

      return {
        id: order.attributes.id,
        receipt_number: order.attributes.receipt_number,
        created_at: order.attributes.created_at,
        notes: order.attributes.notes,
        items: relevantItems
      }
    })
    .filter(ticket => ticket.items.length > 0)

    tickets.value = stationTickets.reverse()

    console.log('Tiket KDS berhasil diformat:', tickets.value)
  } catch (error) {
    console.log('Gagal memuat tiket:', error)
  } finally {
    isLoadingTickets.value = false
  }
}

const getTicketHeaderColor = (createdAtStr) => {
  const created = new Date(createdAtStr)
  const diffMins = Math.floor((timeNow.value - created) / 60000)

  if (diffMins >= 15) return 'bg-error text-error-content'
  if (diffMins >= 10) return 'bg-warning text-warning-content'
  return 'bg-neutral text-neutral-content'
}
</script>

<template>
  <div class="min-h-screen bg-base-300 text-base-content flex flex-col">
    <header class="bg-base-200 border-b border-base-100 px-6 py-4 flex justify-between items-center shadow-sm">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold tracking-wider text-primary">Kitchen Display</h1>
        <button @click="changeStation" class="badge badge-lg hover:badge-primary transition-colors cursor-pointer" :class="selectedStation ? 'badge-primary' : 'badge-neutral'">
          {{ selectedStation ? '📍 ' + selectedStation.name : 'Pilih Panel...' }}
        </button>
      </div>

      <div class="flex flex-center gap-4 items-center">
        <div class="font-mono font-bold text-lg bg-base-100 px-4 py-2 rounded-lg shadow-inner">
          {{ currentTime }}
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-x-auto p-6 bg-base-300">

      <div class="flex gap-6 items-start h-full pb-4">

        <div v-if="!selectedStation" class="w-full h-full flex items-center justify-center text-base-content/40">
          <p class="text-xl font-semibold">Silakan pilih Station terlebih dahulu...</p>
        </div>

        <div v-else-if="tickets.length === 0 && !isLoadingTickets" class="w-full h-full flex items-center justify-center text-base-content/40">
          <p class="text-xl font-semibold">🎉 Dapur Bersih! Belum ada antrean pesanan.</p>
        </div>

        <div
          v-for="ticket in tickets"
          :key="ticket.id"
          class="card bg-base-100 shadow-xl w-80 shrink-0 border border-base-200 flex flex-col max-h-full"
        >
          <div class="p-4 rounded-t-2xl flex justify-between items-center transition-colors" :class="getTicketHeaderColor(ticket.created_at)">
             <span class="font-bold text-xl tracking-wider">#{{ ticket.receipt_number.slice(-5) }}</span>
             <div class="flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <span class="font-mono font-bold text-lg">{{ getElapsedTime(ticket.created_at) }}</span>
             </div>
          </div>

          <div v-if="ticket.notes" class="bg-warning/20 text-warning px-4 py-2 text-sm font-bold border-b border-base-200">
            Catatan Order: {{ ticket.notes }}
          </div>

          <div class="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
             <div
                v-for="item in ticket.items"
                :key="item.id"
                @click="item._is_done = !item._is_done"
                class="p-3 rounded-xl border-2 cursor-pointer select-none transition-all duration-200"
                :class="item._is_done ? 'border-base-200 bg-base-200 opacity-50 grayscale' : 'border-base-300 bg-base-100 hover:border-primary shadow-sm'"
             >
                <div class="flex gap-4">
                  <div class="font-black text-xl" :class="{ 'line-through text-base-content/50': item._is_done }">
                    {{ item.quantity }}x
                  </div>

                  <div class="flex-1">
                    <div class="font-bold text-xl leading-tight" :class="{ 'line-through text-base-content/50': item._is_done }">
                      {{ item.name }}
                    </div>

                    <ul v-if="item.variants_array && item.variants_array.length" class="mt-2 space-y-1">
                      <li v-for="v in item.variants_array" :key="v.name" class="text-sm font-semibold text-info flex items-start gap-1">
                        <span class="opacity-70 mt-0.5">↳</span> {{ v.item_name }}
                      </li>
                    </ul>

                    <div v-if="item.notes" class="mt-2 text-error text-sm font-bold bg-error/10 px-2 py-1 rounded">
                      * {{ item.notes }}
                    </div>
                  </div>
                </div>
             </div>
          </div>

          <div class="p-4 bg-base-200 rounded-b-2xl border-t border-base-300">
            <button class="btn btn-primary btn-lg w-full text-xl font-bold tracking-widest">
              BUMP
            </button>
          </div>
        </div>

      </div>
    </main>

    <dialog class="modal" :class="{ 'modal-open': showStationModal }">
      <div class="modal-box bg-base-200">
        <h3 class="font-bold text-2xl mb-6 text-center">Pilih Panel Anda</h3>

        <div class="grid grid-cols-1 gap-4">
          <button
            v-for="station in stations"
            :key="station.id"
            @click="selectStation(station)"
            class="btn btn-lg btn-outline hover:btn-primary h-20 text-xl"
          >
            {{ station.name }}
          </button>
        </div>

        <div v-if="stations.length === 0" class="text-center py-6 opacity-60">
          Memuat daftar panel...
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-base-300/80">
        <button v-if="selectedStation" @click="showStationModal = false">Tutup</button>
      </form>
    </dialog>

  </div>
</template>
