<script setup lang="ts">
import { ref, onUnmounted, onMounted } from 'vue'
import Speaking from './AISpeaking.vue'
import { chatApi } from '../services/chatApi'

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionEvent {
  results: Array<SpeechRecognitionResult>;
  resultIndex: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

type SpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  onresult: (event: SpeechRecognitionEvent) => void
  onend: () => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  start: () => void
  stop: () => void
}

interface ChatMessage {
  type: 'user' | 'ai'
  content: string
}

const props = defineProps<{
  sessionId: string
}>()

const isListening = ref(false)
const transcript = ref('')
const chatMessages = ref<ChatMessage[]>([])
const recognition = ref<SpeechRecognition | null>(null)
const isLoading = ref(false)
const sessionId = ref(props.sessionId)
const isAudioPlaying = ref(false)
const lastSpeechTime = ref(Date.now())
const silenceTimer = ref<number | null>(null)
const SILENCE_DURATION = 750 // 750ms of silence

const startListening = () => {
  if (!recognition.value) {
    recognition.value = new (window.SpeechRecognition || window.webkitSpeechRecognition)() as SpeechRecognition
    recognition.value.continuous = true
    recognition.value.interimResults = true
    
    recognition.value.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        transcript.value = finalTranscript;
        lastSpeechTime.value = Date.now();
        
        // Reset silence timer
        if (silenceTimer.value) {
          clearTimeout(silenceTimer.value);
        }
        
        // Start new silence timer
        silenceTimer.value = setTimeout(async () => {
          if (transcript.value) {
            await sendMessage(transcript.value);
            transcript.value = '';
          }
        }, SILENCE_DURATION);
      }
    }

    recognition.value.onend = () => {
      // Restart if we're supposed to be listening
      if (isListening.value) {
        setTimeout(() => {
          recognition.value?.start();
        }, 10);
      }
    }
  }

  recognition.value.start()
  isListening.value = true
}

const sendMessage = async (text: string) => {
  try {
    // Stop and reset recognition
    if (recognition.value) {
      recognition.value.stop()
      recognition.value = null
    }

    const userMessage: ChatMessage = {
      type: 'user',
      content: text,
    }
    chatMessages.value.push(userMessage)

    // Create AI message placeholder
    const aiMessage: ChatMessage = {
      type: 'ai',
      content: '',
    }

    // Start streaming
    const eventSource = chatApi.streamMessage(text)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.done) {
        eventSource.close();
        chatMessages.value.push(aiMessage);
        transcript.value = '';
        // Restart recognition after response
        startListening();
        return;
      }

      aiMessage.content += data.content;
    }

    eventSource.onerror = () => {
      eventSource.close()
      startListening() // Ensure we restart on error too
    }

  } catch (error) {
    console.error('Error:', error)
    chatMessages.value.push({
      type: 'ai',
      content: 'Sorry, there was an error processing your request.'
    })
    startListening() // Ensure we restart on error
  }
}

// Start listening when component mounts
onMounted(() => {
  startListening()
})

// Clean up
onUnmounted(() => {
  if (silenceTimer.value) {
    clearTimeout(silenceTimer.value)
  }
  if (recognition.value) {
    recognition.value.stop()
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
    
    <div class="transcript" v-if="transcript">
      {{ transcript }}
    </div>
  </div>
</template>

<style scoped>
.speaking-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
}

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

.input-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

button {
  padding: 15px 30px;
  border-radius: 25px;
  border: none;
  background: #007AFF;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

button.active {
  background: #FF3B30;
  transform: scale(1.1);
}

.transcript {
  font-style: italic;
  color: #666;
}
</style> 