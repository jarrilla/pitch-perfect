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
      const response = await api.get('/auth/check', {
        withCredentials: true
      })
      if (response.status !== 200) {
        return { name: 'home' }
      }
      // If auth check passes, allow navigation to continue
      return true
    } catch (error) {
      return { name: 'home' }
    }
  }
  return true
})

export default router 