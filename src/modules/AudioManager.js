/**
 * AudioManager
 * 
 * Synthesizes game audio dynamically using the browser's Web Audio API.
 * Eliminates external sound file loads and path issues.
 * Handles continuous tuning static mix, lock success beeps, and miss buzzers.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;

    // Node holders
    this.toneOsc = null;
    this.toneGain = null;
    this.noiseNode = null;
    this.noiseGain = null;
    
    // Master volume node
    this.masterGain = null;
  }

  /**
   * Initializes the AudioContext on first user interaction.
   * Required by browsers to bypass autoplay security policies.
   */
  start() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime); // Master volume at 70%
      this.masterGain.connect(this.ctx.destination);

      this.setupContinuousTuningSound();
      
      this.initialized = true;
      console.log('Audio Manager initialized successfully');
    } catch (e) {
      console.error('Failed to initialize Web Audio:', e);
    }
  }

  setupContinuousTuningSound() {
    // 1. Setup tuning tone oscillator (quiet background humming)
    this.toneOsc = this.ctx.createOscillator();
    this.toneGain = this.ctx.createGain();
    
    this.toneOsc.type = 'sine';
    this.toneOsc.frequency.setValueAtTime(440, this.ctx.currentTime);
    this.toneGain.gain.setValueAtTime(0, this.ctx.currentTime); // Mute initially

    this.toneOsc.connect(this.toneGain);
    this.toneGain.connect(this.masterGain);
    this.toneOsc.start();

    // 2. Setup radio static noise buffer
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Generate white noise values
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    // Apply bandpass filter to noise to make it sound like filtered RF static
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime); // Mute initially

    this.noiseNode.connect(filter);
    filter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    this.noiseNode.start();
  }

  /**
   * Adjusts static and tone volume mix based on proximity to target signal band
   * @param {number} dialValue 
   * @param {number} bandCenter 
   * @param {boolean} insideBand 
   */
  updateTuning(dialValue, bandCenter, insideBand) {
    if (!this.initialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') return;

    const dist = Math.abs(dialValue - bandCenter);
    const maxTuningDist = 25.0; // Distance where signal starts resolving

    if (dist < maxTuningDist) {
      // Linear proximity: 1.0 at center, 0.0 at edge of range
      const proximity = 1.0 - (dist / maxTuningDist);

      // Mix: tone gets louder, static gets quieter as proximity approaches 1.0
      const targetToneVol = proximity * 0.15;
      const targetStaticVol = (1.0 - proximity) * 0.15 + 0.02; // slight static always present

      this.toneGain.gain.setTargetAtTime(targetToneVol, this.ctx.currentTime, 0.05);
      this.noiseGain.gain.setTargetAtTime(targetStaticVol, this.ctx.currentTime, 0.05);

      // Pitch modulates slightly depending on offset from target center (feedback direction)
      // center is 440Hz (A4), detunes down left and up right
      const pitch = 440 + (dialValue - bandCenter) * 6;
      this.toneOsc.frequency.setTargetAtTime(pitch, this.ctx.currentTime, 0.03);
    } else {
      // Just full static noise outside resolving range
      this.toneGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.05);
      this.noiseGain.gain.setTargetAtTime(0.18, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Completely silences continuous tuning feedback (e.g. during menus or pauses)
   */
  stopTuning() {
    if (!this.initialized) return;
    this.toneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    this.noiseGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }

  /**
   * Plays a successful signal lock sound (clear, rising double-beep)
   */
  playLock() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(this.masterGain);

    // Rising scale beep (C5 to E5 to G5)
    osc.frequency.setValueAtTime(523.25, now); // C5
    gain.gain.setValueAtTime(0.15, now);
    
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
    
    gain.gain.setValueAtTime(0.15, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Plays a lock failure / strike sound (low pitch descending sawtooth buzz)
   */
  playMiss() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(this.masterGain);

    // Pitch slides down rapidly representing malfunction
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}
