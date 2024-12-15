export class WavRecorder {
  constructor(options: { sampleRate: number });
  begin(): Promise<void>;
  record(callback: (data: { mono: ArrayBuffer }) => void): Promise<void>;
  static decode(audio: ArrayBuffer, sampleRate: number, targetSampleRate: number): Promise<ArrayBuffer>;
}

export class WavStreamPlayer {
  constructor(options: { sampleRate: number });
  connect(): Promise<void>;
  add16BitPCM(data: ArrayBuffer, trackId: string): void;
  interrupt(): Promise<{ trackId: string; offset: number } | null>;
} 