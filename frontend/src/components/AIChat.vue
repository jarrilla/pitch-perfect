<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RealtimeClient } from '@openai/realtime-api-beta'
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools'
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';

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

interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: { [key: string]: any };
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
const realtimeEvents = ref<RealtimeEvent[]>([]);


onMounted(async () => {
  const client = OPENAI_CLIENT.value!;
  const wavRecorder = WAV_RECORDER.value!;
  const wavStreamPlayer = WAV_STREAM_PLAYER.value!;

  await client.connect();
  await wavRecorder.begin();
  await wavStreamPlayer.connect();

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

  client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
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
});

onUnmounted(() => {

});
</script>

<template>
  <div id="chat-room">
    <div id="chat-messages">
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
</template>

<style>
#chat-room {
  box-sizing: border-box;
  height: calc(100% - 5rem);
  width: 50%;
  max-width: 40rem;
  
  border: 2px solid black;
  border-radius: 4px;
  background-color: whitesmoke;
  padding: 1rem;

  display: flex;
  flex-direction: column;
  justify-content: flex-end;
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
</style>
