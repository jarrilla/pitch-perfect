<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/axios'

const router = useRouter()
const isLoading = ref(true)

const handleGoogleLogin = () => {
  window.location.replace(`${import.meta.env.VITE_API_BASE_URL}/auth/google`)
}

onMounted(async () => {
  try {
    const response = await api.get('/auth/check');
    if (response.status === 200) {
      router.push('/chat')
    }
  } catch (error) {
    console.error('Auth check failed:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="login-container">
    <div v-if="isLoading" class="loading">
      Loading...
    </div>
    <div v-else class="login-card">
      <h1>Welcome</h1>
      <button @click="handleGoogleLogin" class="google-btn">
        <img src="/google-icon.svg" alt="Google Icon" />
        Sign in with Google
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.google-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: background 0.3s ease;
}

.google-btn:hover {
  background: #f5f5f5;
}

.google-btn img {
  width: 20px;
  height: 20px;
}
</style> 