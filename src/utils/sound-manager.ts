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
    { freq: 392.00, type: 'sine' as OscillatorType, label: '藍露' },
    { freq: 440.00, type: 'sine' as OscillatorType, label: '橘光' },
    { freq: 493.88, type: 'sine' as OscillatorType, label: '星紫' },
    { freq: 523.25, type: 'sine' as OscillatorType, label: '青綠' },
    { freq: 587.33, type: 'sine' as OscillatorType, label: '嫩綠' },
    { freq: 659.25, type: 'sine' as OscillatorType, label: '粉桃' },
    { freq: 698.46, type: 'sine' as OscillatorType, label: '月白' },
    { freq: 783.99, type: 'sine' as OscillatorType, label: '海鹽' },
  ];

  /** 初始化 AudioContext (需在使用者互動後呼叫) */
  public init() {
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

    // 建立主輸出增益節點：低音量、短尾巴，接近影片中的水泡感
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.22, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    // 低通濾波器：去掉尖銳高頻，保留圓潤的「啵」
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 0.22);
    filter.Q.value = 2.2;

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // 主音：先上揚再滑落，模擬透明泡泡破裂的彈性
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = sound.type;
    osc1.frequency.setValueAtTime(sound.freq * 0.88, now);
    osc1.frequency.exponentialRampToValueAtTime(sound.freq * 1.65, now + 0.035);
    osc1.frequency.exponentialRampToValueAtTime(sound.freq * 0.72, now + 0.24);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.68, now + 0.012);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc1.connect(gain1);
    gain1.connect(filter);
    osc1.start(now);
    osc1.stop(now + 0.26);

    // 泛音：很短的亮點，像影片中點擊後的清脆水光
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(sound.freq * 2.15, now + 0.018);
    osc2.frequency.exponentialRampToValueAtTime(sound.freq * 1.45, now + 0.13);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(0.16, now + 0.025);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc2.connect(gain2);
    gain2.connect(filter);
    osc2.start(now + 0.018);
    osc2.stop(now + 0.15);

    // 噪音層：極短、極小聲，只留下泡泡破裂的氣泡邊緣
    const bufferSize = ctx.sampleRate * 0.035;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.16;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.035, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    // 噪音也通過高通濾波器，只保留高頻的「嘶」聲
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1450;
    noiseFilter.Q.value = 0.8;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(now);
    noise.stop(now + 0.04);

    // 低頻小水滴尾音，讓連續點擊比較像原型影片的柔軟泡泡
    const drop = ctx.createOscillator();
    const dropGain = ctx.createGain();
    drop.type = 'sine';
    drop.frequency.setValueAtTime(sound.freq * 0.55, now + 0.06);
    drop.frequency.exponentialRampToValueAtTime(sound.freq * 0.42, now + 0.28);
    dropGain.gain.setValueAtTime(0.001, now + 0.055);
    dropGain.gain.linearRampToValueAtTime(0.12, now + 0.08);
    dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    drop.connect(dropGain);
    dropGain.connect(filter);
    drop.start(now + 0.055);
    drop.stop(now + 0.31);
  }

  /** 切換靜音狀態 */
  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
