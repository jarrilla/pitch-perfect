<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RealtimeClient } from '@openai/realtime-api-beta'
// @ts-ignore
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

const wavRecorder = ref<WavRecorder | null>(
  new WavRecorder({ sampleRate: 24000 })
);
const wavStreamPlayer = ref<WavStreamPlayer | null>(
  new WavStreamPlayer({ sampleRate: 24000 })
);
const realtimeClient = ref<RealtimeClient | null>(
  new RealtimeClient({
    url: `${import.meta.env.VITE_API_BASE_URL}/stream`,
  })
);


const chatItems = ref<ItemType[]>([]);
const realtimeEvents = ref<RealtimeEvent[]>([]);


onMounted(async () => {
  const client = realtimeClient.value!;

  await client.connect();
  await wavRecorder.value.begin();
  await wavStreamPlayer.value.connect();

  client.sendUserMessageContent([
    {
      type: 'input_text',
      text: 'Hello.'
    }
  ]);

  client.updateSession({ instructions });
  client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
  client.updateSession({ turn_detection: { type: 'server_vad', threshold: 0.5 } });

  client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
    const lastEvent = realtimeEvents.value[realtimeEvents.value.length - 1];
    if (lastEvent?.event.type === realtimeEvent.event.type) {
      lastEvent.count = (lastEvent.count || 0) + 1;
      return realtimeEvents.value.slice(0, -1).concat(lastEvent);
    } else {
      realtimeEvents.value.push(realtimeEvent);
    }
  });
  client.on('error', (event: any) => console.error(event));
  client.on('conversation.interrupted', async () => {
    const trackSampleOffset = await wavStreamPlayer.value.interrupt();
    if (trackSampleOffset?.trackId) {
      const { trackId, offset } = trackSampleOffset;
      client.cancelResponse(trackId, offset);
    }
  });
  client.on('conversation.updated', async ({ item, delta }: any) => {
    const items = client.conversation.getItems();

    if (delta?.audio) {
      wavStreamPlayer.value.add16BitPCM(delta.audio, item.id);
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

  
  await wavRecorder.value.record((data: any) => client.appendInputAudio(data.mono));
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
      >
        {{ message.formatted.text || message.formatted.transcript }}
      </div>
    </div>
  </div>
</template>

<style>

</style>