<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { RealtimeClient } from '@openai/realtime-api-beta'
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools'
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js'

const instructions = `System settings:
Tool use: enabled.

Instructions:
- You are an artificial intelligence agent responsible for helping test realtime voice capabilities
- Please make sure to respond with a helpful voice via audio
- Be kind, helpful, and curteous
- It is okay to ask the user questions
- Use tools and functions you have available liberally, it is part of the training apparatus
- Be open to exploration and conversation
- Remember: this is just for fun and testing!

Personality:
- Be upbeat and genuine
- Try speaking quickly as if excited
`;

interface IRealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: { [key: string]: any };
}

enum EErrorFlag {
  UNKNOWN = 0,
  OPENAI_CLIENT_ERROR,
  MICROPHONE_ACCESS_DENIED,
  WAV_STREAM_PLAYER_ERROR,
}

const WAV_RECORDER = ref<WavRecorder | null>(
  new WavRecorder({ sampleRate: 24000 })
);
const WAV_STREAM_PLAYER = ref<WavStreamPlayer | null>(
  new WavStreamPlayer({ sampleRate: 24000 })
);
const OPENAI_CLIENT = ref<RealtimeClient | null>(
  new RealtimeClient({
    url: `${import.meta.env.VITE_API_BASE_URL}/stream`,
  })
);

const chatItems = ref<ItemType[]>([]);
const realtimeEvents = ref<IRealtimeEvent[]>([]);

const errorFlag = ref<EErrorFlag | null>(null);

const isMicEnabled = ref<boolean>(false);
const isMicButtonHovered = ref<boolean>(false);

const chatMessagesRef = ref<HTMLDivElement | null>(null)

watch(chatItems, () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}, { deep: true })

async function init() {
  const client = OPENAI_CLIENT.value!;
  const wavRecorder = WAV_RECORDER.value!;
  const wavStreamPlayer = WAV_STREAM_PLAYER.value!;

  try {
    await client.connect(); 
  }
  catch (error: any) {
    errorFlag.value = EErrorFlag.OPENAI_CLIENT_ERROR;
    return;
  }

  try {
    await wavRecorder.begin();
  }
  catch (error: any) {
    if (error.message === 'Permission denied') {
      errorFlag.value = EErrorFlag.MICROPHONE_ACCESS_DENIED;
      return;
    }
    else {
      errorFlag.value = EErrorFlag.UNKNOWN;
      return;
    }
  }

  try {
    await wavStreamPlayer.connect();  
  }
  catch (error: any) {
    errorFlag.value = EErrorFlag.WAV_STREAM_PLAYER_ERROR;
    return;
  }

  isMicEnabled.value = true;
  isMicButtonHovered.value = false;

  client.sendUserMessageContent([
    {
      type: 'input_text',
      text: 'Hello.'
    }
  ]);

  client.updateSession({
    instructions,
    input_audio_transcription: { model: 'whisper-1' },
    turn_detection: { type: 'server_vad', threshold: 0.5 },
  });

  client.on('realtime.event', (realtimeEvent: IRealtimeEvent) => {
    const lastEvent = realtimeEvents.value[realtimeEvents.value.length - 1];
    if (lastEvent?.event.type === realtimeEvent.event.type) {
      lastEvent.count = (lastEvent.count || 0) + 1;
      return realtimeEvents.value.slice(0, -1).concat(lastEvent);
    } else {
      realtimeEvents.value.push(realtimeEvent);
    }
  });

  client.on('error', (event: unknown) => console.error(event));
  client.on('conversation.interrupted', async () => {
    const trackSampleOffset = await wavStreamPlayer.interrupt();
    if (trackSampleOffset?.trackId) {
      const { trackId, offset } = trackSampleOffset;
      client.cancelResponse(trackId, offset);
    }
  });
  client.on('conversation.updated', async (event: any) => {
    const { item, delta } = event;
    const items = client.conversation.getItems();

    if (delta?.audio) {
      wavStreamPlayer.add16BitPCM(delta.audio, item.id);
    }
    if (item.status === 'completed' && item.formatted.audio?.length) {
      const wavFile = await WavRecorder.decode(
        item.formatted.audio,
        24000,
        24000
      );
      item.formatted.audio = wavFile;
    }
    chatItems.value = items || [];
  });

  chatItems.value = client.conversation.getItems();
  
  await wavRecorder.record((data: unknown) => client.appendInputAudio(data.mono));
}

async function teardown() {

}

/**
 * Enable microphone.
 * Interrupts any current response if one is in progress.
 */
async function enableMic() {
  isMicEnabled.value = true;

  const client = OPENAI_CLIENT.value!;
  const wavRecorder = WAV_RECORDER.value!;
  const wavStreamPlayer = WAV_STREAM_PLAYER.value!;

  const trackSampleOffset = await wavStreamPlayer.interrupt();
  if (trackSampleOffset?.trackId) {
    const { trackId, offset } = trackSampleOffset;
    client.cancelResponse(trackId, offset);
  }

  await wavRecorder.record((data) => client.appendInputAudio(data.mono));
}

/**
 * Disable microphone and request response from current buffer
 */
async function disableMic() {
  isMicEnabled.value = false;

  const client = OPENAI_CLIENT.value!;
  const wavRecorder = WAV_RECORDER.value!;

  await wavRecorder.pause();
  client.createResponse();
}

onMounted(init);
onUnmounted(teardown);
</script>

<template>
  <div id="errors-container">
    <div v-if="errorFlag === EErrorFlag.MICROPHONE_ACCESS_DENIED">
      Microphone access denied.
    </div>
    <div v-else-if="errorFlag === EErrorFlag.OPENAI_CLIENT_ERROR">
      Server connection error.
    </div>
    <div v-else-if="errorFlag === EErrorFlag.WAV_STREAM_PLAYER_ERROR">
      Audio player error.
    </div>

    <i
      v-if="!!errorFlag"
      class="bi bi-exclamation-square-fill"
    ></i>
  </div>

  <div id="chat-room">
    <div id="chat-messages" ref="chatMessagesRef">
      <div
        v-for="message in chatItems"
        :key="message.id"
        class="message"
        :class="{ 'assistant': message.role === 'assistant', 'user': message.role === 'user' }"
      >
        {{ message.formatted.text || message.formatted.transcript }}
      </div>
    </div>
  </div>

  <div id="actions">
    <button
      class="microphone"
      @click="isMicEnabled ? disableMic() : enableMic()"
      :class="{ 'listening': isMicEnabled, 'muted': !isMicEnabled }"
      :disabled="errorFlag !== null"
      @mouseenter="isMicButtonHovered = true"
      @mouseleave="isMicButtonHovered = false"
    >
      <div v-if="isMicEnabled">
        <div v-if="!isMicButtonHovered">Listening</div>
        <div v-else>Mute</div>
      </div>

      <div v-else>
        <div v-if="!isMicButtonHovered">Muted</div>
        <div v-else>Unmute</div>
      </div>
    </button>
  </div>
</template>

<style>
#actions {
  height: 2rem;
}

.microphone {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  color: black;
  border: 3px solid black;
  border-radius: 10px;
  font-size: 1.5rem;
  height: 3rem;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
  padding: 0.25rem;
  width: 10rem;
  cursor: pointer;
  transition: all 0.5s;
}
.microphone * {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  height: 100%;
}
.microphone:disabled {
  border-color: gray;
  background-color: gray;
  color: white;
  cursor: not-allowed;
}
.microphone.listening:hover, .microphone.muted {
  background-color: red;
  color: white;
}
.microphone.muted:hover, .microphone.listening {
  background-color: green;
  color: white;
}

#chat-room {
  box-sizing: border-box;
  height: calc(100% - 8rem);
  width: 50%;
  max-width: 40rem;
  
  border: 2px solid black;
  border-radius: 4px;
  background-color: whitesmoke;

  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

#chat-messages {
  overflow-y: auto;
  height: 100%;
  padding: 1rem;
  box-sizing: border-box;
}

.message {
  margin: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.75rem;
  width: fit-content;
  font-size: 1.25rem;
}

.message.user {
  background-color: royalblue;
  color: white;
  margin-left: auto;
}

.message.assistant {
  background-color: gainsboro;
}

#errors-container {
  display: flex;
  flex-flow: row wrap;
  justify-content: right;
  align-items: center;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  color: red;
  font-size: 1.5rem;
  height: 2rem;
  margin-bottom: 0.25rem;
}

#errors-container i {
  display: flex;
  flex-flow: row nowrap;
}
</style>
