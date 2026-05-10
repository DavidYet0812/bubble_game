/**
 * 音效管理器
 * NOTE: 使用 Web Audio API 動態合成多層次泡泡音效，無須外部音檔
 *       每種顏色有獨特的音色與音高，搭配泛音與濾波器產生豐富的「啵」感
 */

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private isMuted = false;

  /**
   * 8 種顏色對應的音效設計
   * NOTE: 使用五聲音階（C, D, E, G, A）加高八度，避免不和諧的音程
   */
  private readonly colorSounds = [
    { freq: 523.25, type: 'sine' as OscillatorType, label: '草莓' },     // C5
    { freq: 587.33, type: 'triangle' as OscillatorType, label: '柑橘' }, // D5
    { freq: 659.25, type: 'sine' as OscillatorType, label: '檸檬' },     // E5
    { freq: 783.99, type: 'sine' as OscillatorType, label: '薄荷' },     // G5
    { freq: 880.00, type: 'triangle' as OscillatorType, label: '天空' }, // A5
    { freq: 987.77, type: 'sine' as OscillatorType, label: '葡萄' },     // B5
    { freq: 1046.5, type: 'sine' as OscillatorType, label: '蜜桃' },     // C6
    { freq: 698.46, type: 'triangle' as OscillatorType, label: '雲朵' }, // F5
  ];

  /** 初始化 AudioContext (需在使用者互動後呼叫) */
  public init() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    // 解除 iOS 等設備的靜音限制
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * 播放點擊泡泡的音效（多層次合成啵啵聲）
   * NOTE: 使用主音 + 泛音 + 低通濾波器，產生更自然飽滿的泡泡音效
   */
  public playBubblePop(colorIndex: number) {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const sound = this.colorSounds[colorIndex % this.colorSounds.length];

    // 建立主輸出增益節點
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    // 低通濾波器：讓聲音更柔和不刺耳
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    filter.Q.value = 1.5;

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // 主音：頻率從高處快速滑落，產生「啵」的水滴感
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = sound.type;
    osc1.frequency.setValueAtTime(sound.freq * 1.5, now);
    osc1.frequency.exponentialRampToValueAtTime(sound.freq * 0.8, now + 0.12);
    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(filter);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // 泛音：高八度的柔和點綴，增加空靈感
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(sound.freq * 2.5, now);
    osc2.frequency.exponentialRampToValueAtTime(sound.freq * 1.8, now + 0.08);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc2.connect(gain2);
    gain2.connect(filter);
    osc2.start(now);
    osc2.stop(now + 0.12);

    // 噪音層：短促的白噪音模擬泡泡破裂的「噗」聲
    const bufferSize = ctx.sampleRate * 0.05;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    // 噪音也通過高通濾波器，只保留高頻的「嘶」聲
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(now);
    noise.stop(now + 0.05);
  }

  /** 切換靜音狀態 */
  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
