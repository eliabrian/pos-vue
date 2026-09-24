<script setup>
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import api from '@/utils/api'
import { computed, onMounted, ref } from 'vue'

const tenantName = localStorage.getItem('pos_tenant_name')
const authStore = useAuthStore()
const cartStore = useCartStore()

const categories = ref([])
const products = ref([])
const activeCategory = ref(null)
const searchQuery = ref('')
const isLoading = ref(true)
const isProcessing = ref(false)

const activeProduct = ref(null)
const selectedVariantsMap = ref({})
const itemNotes = ref('')

const fetchProducts = async () => {
  try {
    const response = await api.get('/api/products?include=category,variants')
    const rawProducts = response.data.data
    const includedData = response.data.included || []

    products.value = rawProducts.map((item) => {
      const categoryId = item.relationships?.category?.data?.id
      const categoryData = includedData.find(
        (inc) => inc.type === 'categories' && inc.id === categoryId,
      )

      const variantRefs = item.relationships?.variants?.data || []
      const parsedVariants = variantRefs
        .map((vRef) => {
          const variantData = includedData.find(
            (inc) => inc.type === 'variants' && inc.id === vRef.id,
          )
          const rawItems = variantData?.attributes?.variant_items || []

          return {
            id: variantData?.attributes?.id,
            name: variantData?.attributes?.name,
            is_required: variantData?.attributes?.is_required,
            allow_multiple: variantData?.attributes?.allow_multiple,
            items: rawItems.map((i) => ({ id: i.id, name: i.name, price: i.price || 0 })),
          }
        })
        .filter((v) => v.id)

      return {
        id: item.attributes.id,
        name: item.attributes.name,
        price: item.attributes.price,
        discount: item.attributes.discount,
        final_price: item.attributes.final_price,
        stock: item.attributes.stock,
        image: item.attributes.image,
        category: categoryData ? categoryData.attributes.name : 'Lainnya',
        variants: parsedVariants,
      }
    })

    const cats = new Set()
    products.value.forEach((p) => {
      if (p.category) cats.add(p.category)
    })
    categories.value = Array.from(cats)
  } catch (error) {
    console.error('Gagal mengambil data produk', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchProducts()
})

const filteredProducts = computed(() => {
  let result = products.value
  if (activeCategory.value) result = result.filter((p) => p.category === activeCategory.value)
  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((p) => p.name.toLowerCase().includes(query))
  }
  return result
})

const isVariantSelectionValid = computed(() => {
  if (!activeProduct.value) return false
  for (const group of activeProduct.value.variants) {
    if (group.is_required) {
      const selection = selectedVariantsMap.value[group.id]
      if (group.allow_multiple && (!selection || selection.length === 0)) return false
      if (!group.allow_multiple && !selection) return false
    }
  }
  return true
})

const handleProductClick = (product) => {
  if (product.stock === 0) return

  activeProduct.value = product
  itemNotes.value = ''
  selectedVariantsMap.value = {}

  if (product.variants && product.variants.length > 0) {
    product.variants.forEach((v) => {
      selectedVariantsMap.value[v.id] = v.allow_multiple ? [] : null
    })
  }
}

const confirmVariantSelection = () => {
  if (!isVariantSelectionValid.value) return

  let formattedVariants = []
  for (const key in selectedVariantsMap.value) {
    const selection = selectedVariantsMap.value[key]
    if (!selection) continue

    if (Array.isArray(selection)) {
      formattedVariants.push(...selection)
    } else {
      formattedVariants.push(selection)
    }
  }

  cartStore.addItem(activeProduct.value, formattedVariants, itemNotes.value)
  activeProduct.value = null
}

const handleCheckout = async () => {
  if (cartStore.items.length === 0) return
  isProcessing.value = true

  try {
    const payload = {
      payment_method: cartStore.paymentMethod || 'cash',
      status: 'completed',
      products: cartStore.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        notes: item.notes,
        variant_items: item.variant_items.map((v) => v.id),
      })),
    }

    const idempotencyKey = crypto.randomUUID()
    await api.post('/api/orders', payload, { headers: { 'Idempotency-Key': idempotencyKey } })

    alert('Transaksi Berhasil!')
    cartStore.clearCart()
  } catch (error) {
    alert(error.response?.data?.message || 'Gagal memproses transaksi.')
  } finally {
    isProcessing.value = false
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number)
}
</script>

<template>
  <div class="h-screen w-full bg-base-200 flex flex-col overflow-hidden">
    <header class="navbar bg-base-100 shadow-sm px-4 lg:px-6 flex-none relative z-50">
      <div class="navbar-start gap-3 lg:gap-6 w-auto flex-1">
        <div class="flex items-center gap-2 text-primary">
          <span class="text-lg lg:text-xl font-bold tracking-wide uppercase whitespace-nowrap"
            >Artisan POS</span
          >
        </div>
      </div>
      <div class="navbar-end flex items-center gap-2 lg:gap-4 w-auto">
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-outline">{{ tenantName }}</div>
          <ul
            tabindex="-1"
            class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
          >
            <li>
              <a @click="handleLogout">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Keluar
              </a>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <div class="flex w-full bg-base-100 flex-none z-10 border-t border-base-200 shadow-sm">
      <div class="flex-1 px-4 lg:px-6 py-3 min-w-10 flex items-center">
        <div class="flex gap-2 lg:gap-3 overflow-x-auto hide-scrollbar w-full">
          <button
            @click="activeCategory = null"
            :class="activeCategory === null ? 'btn-primary' : 'btn-outline border-base-300'"
            class="btn btn-sm lg:btn-md rounded-full px-4 lg:px-6"
          >
            Semua
          </button>
          <button
            v-for="cat in categories"
            :key="cat"
            @click="activeCategory = cat"
            :class="activeCategory === cat ? 'btn-primary' : 'btn-outline border-base-300'"
            class="btn btn-sm lg:btn-md rounded-full px-4 lg:px-6"
          >
            {{ cat }}
          </button>
        </div>
      </div>
      <div
        class="w-[320px] lg:w-95 xl:w-105 border-l border-base-200 px-4 py-3 flex items-center bg-base-100"
      >
        <label
          class="input input-sm lg:input-md input-bordered flex items-center gap-2 rounded-full w-full bg-base-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="w-4 h-4 opacity-50"
          >
            <path
              fill-rule="evenodd"
              d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
              clip-rule="evenodd"
            />
          </svg>
          <input type="text" class="grow" placeholder="Cari menu..." v-model="searchQuery" />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="btn btn-ghost btn-xs btn-circle"
          >
            ✕
          </button>
        </label>
      </div>
    </div>

    <main class="flex-1 flex overflow-hidden min-h-0">
      <section class="flex-1 overflow-y-auto p-4 lg:p-6 bg-base-200/50">
        <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-5">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            @click="handleProductClick(product)"
            class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden flex flex-col h-full transition-all"
            :class="
              product.stock === 0
                ? 'opacity-50 grayscale cursor-not-allowed'
                : 'hover:shadow-md active:scale-95 cursor-pointer'
            "
          >
            <figure class="h-28 lg:h-32 bg-base-200 relative shrink-0">
              <div
                class="absolute top-2 right-2 badge backdrop-blur-sm shadow-sm font-medium border-0"
                :class="product.stock === 0 ? 'badge-error' : 'bg-base-100'"
              >
                {{ product.stock === 0 ? 'Habis' : 'Tersedia' }}
              </div>
              <img
                v-if="product.image"
                :src="`http://pos.test/` + product.image"
                alt=""
                class="object-cover h-full w-full"
              />
            </figure>
            <div class="card-body p-3 lg:p-4 flex flex-col grow">
              <h3 class="card-title text-sm lg:text-base font-bold truncate block w-full">
                {{ product.name }}
              </h3>
              <div class="mt-auto pt-2">
                <div
                  v-if="product.final_price > 0 && product.final_price < product.price"
                  class="flex flex-col"
                >
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="text-xs text-base-content/50 line-through font-medium">
                      {{ formatRupiah(product.price) }}
                    </span>

                    <span
                      v-if="product.discount > 0"
                      class="badge badge-error badge-sm text-[10px] font-bold text-white border-0 h-4 px-1.5 rounded-sm"
                    >
                      {{ product.discount }}%
                    </span>
                  </div>

                  <span class="font-bold text-base lg:text-lg text-primary leading-none">
                    {{ formatRupiah(product.final_price) }}
                  </span>
                </div>

                <div v-else>
                  <p class="font-bold text-base lg:text-lg text-primary">
                    {{ formatRupiah(product.price) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside
        class="w-[320px] lg:w-95 xl:w-105 bg-base-100 shadow-xl border-l border-base-200 flex flex-col z-9 flex-none"
      >
        <div class="p-4 lg:p-5 border-b border-base-200 flex justify-between items-center">
          <h2 class="text-lg lg:text-xl font-bold flex items-center gap-2">
            Pesanan <span class="badge badge-primary">{{ cartStore.totalItemsCount }}</span>
          </h2>
          <button @click="cartStore.clearCart()" class="btn btn-ghost btn-sm text-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="size-5"
            >
              <path
                fill-rule="evenodd"
                d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-3 lg:p-4 min-h-0 space-y-4">
          <div
            v-if="cartStore.items.length === 0"
            class="h-full flex flex-col items-center justify-center text-base-content/40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-16 w-16 lg:h-20 lg:w-20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <p class="text-base lg:text-lg font-medium">Keranjang masih kosong</p>
          </div>

          <ul class="space-y-3">
            <li
              v-for="(item, index) in cartStore.items"
              :key="index"
              class="flex flex-row justify-between items-center gap-2 border-b border-base-200 pb-3 last:border-0"
            >
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-sm lg:text-base text-base-content leading-tight truncate">
                  {{ item.name }}
                </h4>
                <p class="text-primary font-semibold text-xs lg:text-sm mt-0.5">
                  {{
                    formatRupiah(
                      ((item.final_price > 0 ? item.final_price : item.price) +
                        item.variant_items.reduce((s, v) => s + v.price, 0)) *
                        item.quantity,
                    )
                  }}
                </p>
                <div v-if="item.variant_items.length > 0" class="text-xs text-base-content/60 mt-1">
                  <div v-for="v in item.variant_items" :key="v.id">
                    + {{ v.name }} ({{ formatRupiah(v.price) }})
                  </div>
                </div>
                <div v-if="item.notes" class="text-xs italic text-base-content/50 mt-1">
                  "{{ item.notes }}"
                </div>
              </div>

              <div class="flex items-center gap-1 bg-base-200 rounded-lg p-1 flex-none">
                <button
                  class="btn btn-xs lg:btn-sm btn-square text-base"
                  @click="cartStore.updateQuantity(index, -1)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3 lg:h-4 lg:w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <span class="w-4 lg:w-6 text-center font-bold text-xs lg:text-sm">
                  {{ item.quantity }}
                </span>
                <button
                  class="btn btn-xs lg:btn-sm btn-square text-base"
                  @click="cartStore.updateQuantity(index, 1)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3 lg:h-4 lg:w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div class="p-4 lg:p-5 border-t border-base-200 shadow-inner">
          <div class="flex justify-between items-end mb-4">
            <span class="font-semibold text-base lg:text-lg">Total</span>
            <span class="text-xl lg:text-2xl font-bold text-primary">{{
              formatRupiah(cartStore.subtotal)
            }}</span>
          </div>
          <button
            @click="handleCheckout"
            :disabled="cartStore.items.length === 0 || isProcessing"
            class="btn btn-primary btn-md lg:btn-lg w-full text-base lg:text-lg"
          >
            {{ isProcessing ? 'Memproses...' : 'Bayar Sekarang' }}
          </button>
        </div>
      </aside>
    </main>

    <dialog class="modal" :class="{ 'modal-open': activeProduct }">
      <div class="modal-box w-11/12 max-w-xl p-0 flex flex-col overflow-hidden bg-base-100">
        <div
          class="p-5 lg:p-6 border-b border-base-200 flex justify-between items-center bg-base-100 flex-none z-10"
        >
          <h3 class="font-bold text-xl lg:text-2xl truncate pr-4 text-base-content">
            {{ activeProduct?.name }}
          </h3>
          <button
            class="btn btn-sm btn-circle btn-ghost bg-base-200 hover:bg-base-300"
            @click="activeProduct = null"
          >
            ✕
          </button>
        </div>

        <div
          v-if="activeProduct"
          class="p-5 lg:p-6 overflow-y-auto max-h-[65vh] space-y-8 bg-base-200/30"
        >
          <div v-if="activeProduct.variants && activeProduct.variants.length > 0">
            <div v-for="group in activeProduct.variants" :key="group.id" class="space-y-3 mb-8">
              <div class="flex justify-between items-end mb-1">
                <span class="font-bold text-lg text-base-content">{{ group.name }}</span>
                <span
                  v-if="group.is_required"
                  class="text-xs text-error font-bold uppercase tracking-wider"
                  >Wajib</span
                >
                <span v-else class="text-xs font-bold text-base-content/40 uppercase tracking-wider"
                  >Opsional</span
                >
              </div>

              <div class="flex flex-col gap-3">
                <label
                  v-for="item in group.items"
                  :key="item.id"
                  class="flex items-center justify-start gap-4 p-4 rounded-xl border border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-200/50 cursor-pointer transition-colors"
                >
                  <input
                    v-if="group.allow_multiple"
                    type="checkbox"
                    :value="{
                      id: item.id,
                      variant_name: group.name,
                      name: item.name,
                      price: item.price,
                    }"
                    v-model="selectedVariantsMap[group.id]"
                    class="checkbox checkbox-primary checkbox-md"
                  />
                  <input
                    v-else
                    type="radio"
                    :name="'variant_' + group.id"
                    :value="{
                      id: item.id,
                      variant_name: group.name,
                      name: item.name,
                      price: item.price,
                    }"
                    v-model="selectedVariantsMap[group.id]"
                    class="radio radio-primary radio-md"
                  />

                  <span class="label-text flex-1 font-medium text-base">{{ item.name }}</span>
                  <span
                    class="label-text font-bold"
                    :class="item.price > 0 ? 'text-primary' : 'text-base-content/40'"
                  >
                    {{ item.price > 0 ? `+${formatRupiah(item.price)}` : 'Gratis' }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div
            class="space-y-2"
            :class="{
              'mt-4 pt-4 border-t border-base-200':
                activeProduct.variants && activeProduct.variants.length > 0,
            }"
          >
            <label class="font-bold text-lg text-base-content block">Catatan Tambahan</label>
            <textarea
              v-model="itemNotes"
              placeholder="Cth: Jangan pakai es, gulanya dikurangi..."
              class="textarea textarea-bordered w-full text-base bg-base-100 focus:textarea-primary"
              rows="2"
            ></textarea>
          </div>
        </div>

        <div
          class="p-4 lg:p-6 border-t border-base-200 bg-base-100 flex-none flex gap-3 lg:gap-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]"
        >
          <button class="btn btn-lg flex-1 text-base font-semibold" @click="activeProduct = null">
            Batal
          </button>
          <button
            class="btn btn-primary btn-lg flex-2 text-base font-semibold"
            :disabled="!isVariantSelectionValid"
            @click="confirmVariantSelection"
          >
            Tambah Pesanan
          </button>
        </div>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button @click="activeProduct = null">Tutup</button>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
