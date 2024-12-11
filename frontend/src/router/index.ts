import { createRouter, createWebHistory, RouteLocationNormalized } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChatView from '../views/ChatView.vue'
import { api } from '../services/axios'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/chat',
    name: 'chat',
    component: ChatView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to: RouteLocationNormalized) => {
  if (to.meta.requiresAuth) {
    try {
      await api.get('/auth/check', {
        withCredentials: true
      })
    } catch (error) {
      console.error('Auth check failed:', error)
      return { name: 'home' }
    }
  }
  return true
})

export default router 