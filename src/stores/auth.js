import api from '@/utils/api'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('pos_token') || null,
    tenant_id: localStorage.getItem('pos_tenant_id') || null,
    tenant_name: localStorage.getItem('pos_tenant_name') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(email, password, tenant_id) {
      const response = await api.post('/api/login', {
        email,
        password,
        tenant_id,
      })

      this.token = response.data.token
      this.user = response.data.user
      this.tenant_name = response.data.tenant.name
      this.tenant_id = tenant_id

      localStorage.setItem('pos_tenant_name', this.tenant_name)
      localStorage.setItem('pos_token', this.token)
      localStorage.setItem('pos_tenant_id', this.tenant_id)
    },

    async logout() {
      try {
        await api.post('api/logout')
      } catch (error) {
        console.error('Logout failed on server, clearing local data anyway.')
        console.log(error)
      } finally {
        this.token = null
        this.user = null
        this.tenant_id = null
        localStorage.removeItem('pos_tenant_name')
        localStorage.removeItem('pos_token')
        localStorage.removeItem('pos_tenant_id')
      }
    },
  },
})
