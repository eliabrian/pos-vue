import { useAuthStore } from '@/stores/auth'
import KdsView from '@/views/KdsView.vue'
import LoginView from '@/views/LoginView.vue'
import PosView from '@/views/PosView.vue'
import SubscriptionLockedView from '@/views/SubscriptionLockedView.vue'
import UpgradeRequired from '@/views/UpgradeRequired.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },

    {
      path: '/',
      name: 'pos',
      component: PosView,
      meta: { requiresAuth: true },
    },
    {
      path: '/kds',
      name: 'kds',
      component: KdsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/locked',
      name: 'locked',
      component: SubscriptionLockedView,
      meta: { requiresAuth: true },
    },
    {
      path: '/upgrade',
      name: 'upgrade',
      component: UpgradeRequired,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'pos' }
  }
})

export default router
