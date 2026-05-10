/**
 * 音效管理器
 * NOTE: 使用 Web Audio API 動態合成泡泡音效，無須外部音檔
 */

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private isMuted = false;

  // C大調音階頻率，對應 10 種顏色
  private readonly frequencies = [
    261.63, // C4 (薄荷)
    293.66, // D4 (蜜桃)
    329.63, // E4 (天空)
    349.23, // F4 (薰衣草)
    392.00, // G4 (玫瑰)
    440.00, // A4 (向日葵)
    493.88, // B4 (珊瑚)
    523.25, // C5 (湖水)
    587.33, // D5 (琥珀)
    659.25, // E5 (珍珠)
  ];

  /** 初始化 AudioContext (需在使用者互動後呼叫) */
  public init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    // 解除 iOS 等設備的靜音限制
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /** 播放點擊泡泡的音效 (啵啵聲) */
  public playBubblePop(colorIndex: number) {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 取得對應顏色的基本頻率
    const baseFreq = this.frequencies[colorIndex % this.frequencies.length];

    // 泡泡音效設計：正弦波，頻率快速下降，音量快速衰減
    osc.type = 'sine';
    
    // 頻率包絡線 (稍微有一點從高到低的感覺，像水滴)
    osc.frequency.setValueAtTime(baseFreq * 1.2, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, ctx.currentTime + 0.1);

    // 音量包絡線 (快速衰減的打擊感)
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  /** 切換靜音狀態 */
  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
