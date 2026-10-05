import router from '@/router'
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://pos.test',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use((response) => {
  return response
}, (error) => {
  if (error.response && error.response.status === 402) {
    console.warn('Subscription Expired! Mengunci POS...')
    const currentRouteName = router.currentRoute.value.name
    if (currentRouteName && currentRouteName !== 'locked') {
        localStorage.setItem('intended_route', currentRouteName)
      }
    router.push({ name: 'locked' })
  }

  if (error.response && error.response.status === 401) {
    console.warn('Sesi habis, silakan login ulang.')
    localStorage.removeItem('pos_token')
    localStorage.removeItem('kds_station_id')
    localStorage.removeItem('kds_station_name')
    router.push({ name: 'login' })
  }

  if (error.response && error.response.status === 403) {
    console.warn('Feature locked! Upsell time.')
    router.push({ name: 'upgrade' })
  }

  return Promise.reject(error)
})

export default api
