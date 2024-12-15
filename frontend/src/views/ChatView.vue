<script setup lang="ts">
import { ref } from 'vue'
import InitialPrompt from '../components/InitialPrompt.vue'
import AIChat from '../components/AIChat.vue'

const sessionStarted = ref(false)
const sessionData = ref({
  sessionId: '',
  initialResponse: '',
  userInput: ''
})

const handleSessionStarted = (sessionId: string) => {
  sessionData.value = { 
    sessionId, 
    initialResponse: '', 
    userInput: '' 
  }
  sessionStarted.value = true
}
</script>

<template>
  <div id="chat-view">
    <InitialPrompt 
      v-if="!sessionStarted"
      @session-started="handleSessionStarted"
    />
    <AIChat 
      v-else
      :session-id="sessionData.sessionId"
    />
  </div>
</template>

<style scoped>
#chat-view {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
}
</style> 
