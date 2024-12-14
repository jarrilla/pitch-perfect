<script setup lang="ts">
import { ref, onUnmounted, onMounted } from 'vue'

interface ChatMessage {
  type: 'user' | 'ai'
  content: string
}

const chatMessages = ref<ChatMessage[]>([])
const mediaRecorder = ref<MediaRecorder | null>(null)
const ws = ref<WebSocket | null>(null)
const isRecording = ref(false)

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.value = new MediaRecorder(stream)
    
    ws.value = new WebSocket(`${import.meta.env.VITE_WS_URL}/audio-stream`)
    
    ws.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.content) {
        chatMessages.value.push({
          type: 'ai',
          content: data.content
        })
      }
    }

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0 && ws.value?.readyState === WebSocket.OPEN) {
        ws.value.send(event.data)
      }
    }

    mediaRecorder.value.start(100)
    isRecording.value = true

  } catch (error) {
    console.error('Error starting recording:', error)
  }
}

onMounted(() => {
  startRecording()
})

onUnmounted(() => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
  }
  if (ws.value) {
    ws.value.close()
  }
})
</script>

<template>
  <div class="chat-container">
    <div class="chat-messages">
      <div v-for="(message, index) in chatMessages" 
           :key="index" 
           :class="['message', message.type]">
        <div class="message-content">
          {{ message.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 10px;
}

.message {
  margin: 10px 0;
  padding: 10px 15px;
  border-radius: 15px;
  max-width: 70%;
}

.user {
  background: #007AFF;
  color: white;
  margin-left: auto;
  text-align: right;
}

.ai {
  background: #E5E5EA;
  color: black;
  margin-right: auto;
  text-align: left;
}
</style> 