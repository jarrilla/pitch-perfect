<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { chatApi } from '../services/chatApi'
import Spinner from './Spinner.vue'
const emit = defineEmits<{
  'session-started': [sessionId: string]
}>()

const isLoading = ref(false)
const isAiReady = ref(false)
const aiResponse = ref('')
const userInput = ref('')
const sessionId = ref<string | null>(null)

onMounted(async () => {
  try {
    isLoading.value = true
    const { message, sessionId: newSessionId } = await chatApi.startSession()
    sessionId.value = newSessionId
    aiResponse.value = message
    isAiReady.value = true
  } catch (error) {
    console.error('Error starting session:', error)
    aiResponse.value = 'Sorry, there was an error starting the chat session.'
    isAiReady.value = false
  } finally {
    isLoading.value = false
  }
})

const handleSubmit = async () => {
  if (userInput.value.trim() && sessionId.value) {
    try {
      isLoading.value = true
      await chatApi.setupProfile(userInput.value, sessionId.value)
      emit('session-started', sessionId.value)
    } catch (error) {
      console.error('Error setting up profile:', error)
      aiResponse.value = 'Sorry, there was an error processing your profile.'
      isAiReady.value = false
    } finally {
      isLoading.value = false
    }
  }
}
</script>

<template>
  <div class="initial-prompt-container">
    <div
      v-if="isLoading"
      class="spinner-wrapper"
    >
      <Spinner />
    </div>
    
    <div v-if="!isLoading && !isAiReady" class="error-message">
      {{ aiResponse }}
    </div>
    
    <div v-if="!isLoading && isAiReady" class="prompt-content">
      
      <div class="success-message">
        Before we begin, please use the field below to provide the links to the social media profiles you'd like to simulate a pitch with.
      </div>

      <div class="input-section">
        <textarea 
          v-model="userInput"
          rows="3"
        ></textarea>
        
        <button 
          @click="handleSubmit"
          :disabled="!userInput.trim()"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.initial-prompt-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
}

.spinner-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.error-message {
  border: 2px solid red;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  color: white;
  background-color: red;
  padding: 0.75rem;
  font-size: 20px;
}

.success-message {
  border: 2px solid #c5dbc4;
  border-radius: 4px;
  box-shadow: 5px 5px 15px gray;
  color: gray;
  background-color: #c5dbc4;
  padding: 0.75rem;
  font-size: 20px;
  user-select: none;
}

.loading {
  text-align: center;
  color: #666;
}

.prompt-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ai-message {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  line-height: 1.5;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

button {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
