<script setup lang="ts">
import { ref } from 'vue'
import { chatApi } from '../services/chatApi'
import Spinner from './LoadingSpinner.vue'

const emit = defineEmits<{
  'session-started': [sessionId: string]
}>()

const isLoading = ref(false)
const sessionId = ref<string | null>(null)

type PitchType = 'sales' | 'investor' | 'coach'

const handleSelection = async (type: PitchType) => {
  try {
    isLoading.value = true
    const { sessionId: newSessionId } = await chatApi.startSession(type)
    sessionId.value = newSessionId
    emit('session-started', newSessionId)
  } catch (error) {
    console.error('Error starting session:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="initial-prompt-container">
    <div v-if="isLoading" class="spinner-wrapper">
      <Spinner />
    </div>
    
    <div v-else class="prompt-content">
      <h1>Choose Your Conversation Type</h1>
      
      <div class="button-grid">
        <button 
          class="conversation-btn sales"
          @click="handleSelection('sales')"
        >
          <span class="btn-title">Sales Pitch</span>
          <span class="btn-desc">Practice your product or service pitch</span>
        </button>
        
        <button 
          class="conversation-btn investor"
          @click="handleSelection('investor')"
        >
          <span class="btn-title">Investor Pitch</span>
          <span class="btn-desc">Refine your startup pitch</span>
        </button>
        
        <button 
          class="conversation-btn coach"
          @click="handleSelection('coach')"
        >
          <span class="btn-title">Idea Coach</span>
          <span class="btn-desc">Develop and validate your ideas</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.initial-prompt-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
}

.spinner-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.button-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 1rem;
}

.conversation-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: none;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-align: center;
  min-height: 120px;
}

.conversation-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.btn-desc {
  font-size: 0.9rem;
  color: #666;
}

.sales { background: linear-gradient(135deg, #e3f2fd, #bbdefb); }
.investor { background: linear-gradient(135deg, #f3e5f5, #e1bee7); }
.coach { background: linear-gradient(135deg, #e8f5e9, #c8e6c9); }

@media (min-width: 640px) {
  .button-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
