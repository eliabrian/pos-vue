import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    paymentMethod: 'cash',
  }),

  getters: {
    totalItemsCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),

    subtotal: (state) => {
      return state.items.reduce((sum, item) => {
        const basePrice = item.final_price > 0 ? item.final_price : item.price
        const variantsSum = item.variant_items.reduce((vSum, v) => vSum + v.price, 0)
        return sum + (basePrice + variantsSum) * item.quantity
      }, 0)
    },
  },

  actions: {
    addItem(product, selectedVariants = [], notes = '') {
      const variantIds = selectedVariants.map((v) => v.id).sort()

      const existingIndex = this.items.findIndex((item) => {
        const itemVariantIds = item.variant_items.map((v) => v.id).sort()
        return (
          item.id === product.id &&
          item.notes === notes &&
          JSON.stringify(itemVariantIds) === JSON.stringify(variantIds)
        )
      })

      if (existingIndex > -1) {
        this.items[existingIndex].quantity++
      } else {
        this.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          final_price: product.final_price,
          quantity: 1,
          notes: notes,
          variant_items: selectedVariants,
        })
      }
    },

    updateQuantity(index, change) {
      const newQty = this.items[index].quantity + change
      if (newQty > 0) {
        this.items[index].quantity = newQty
      } else {
        this.removeItem(index)
      }
    },

    removeItem(index) {
      this.items.splice(index, 1)
    },

    clearCart() {
      this.items = []
    },
  },
})
