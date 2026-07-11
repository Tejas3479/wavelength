/**
 * AudioManager
 * 
 * Synthesizes game audio dynamically using the browser's Web Audio API.
 * Features:
 * - A procedural, real-time 8-step synthwave loop (bassline + kick + snare).
 * - Interactive low-pass filters mapped to the player's tuning alignment.
 * - Dynamic BPM and filter resonance scaled to active Jammer Phases.
 * - Real-time frequency analyzer (AnalyserNode) to feed dynamic spectrum bars in the UI.
 * - Instant retro-sound effects (locks, misses, glitches).
 */
import { EventBus } from './EventBus.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.activeCombo = 1;

    // Continuous tuning nodes
    this.toneOsc = null;
    this.toneGain = null;
    this.noiseNode = null;

    // Listen to global combo streams
    EventBus.on('COMBO_UPDATED', (combo) => {
      this.activeCombo = combo;
    });
    EventBus.on('LOCK_MISS', () => {
      this.activeCombo = 1;
    });
    EventBus.on('ROUND_RESET', () => {
      this.activeCombo = 1;
    });
    this.noiseGain = null;
    
    // Master routing nodes
    this.masterGain = null;
    this.analyser = null;

    // Procedural Sequencer State
    this.isPlayingSequencer = false;
    this.currentStep = 0;
    this.bpm = 90;
    this.nextStepTime = 0.0;
    this.schedulerTimer = null;
    
    // Low-pass filter for the bass sequencer
    this.bassFilter = null;

    // Musical progressions (A minor synthwave loop)
    // Notes: A (55Hz / 110Hz), C (65.4Hz / 130.8Hz), G (49.0Hz / 98.0Hz), F (43.7Hz / 87.3Hz)
    this.chords = [110.0, 130.81, 97.99, 87.31];
    this.currentChordIdx = 0;
    this.stepsInCurrentChord = 0;
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
      
      // Master Gain for volume scaling
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime); // Master volume at 50%

      // Real-time Visualizer Analyser
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64; // 32 frequency bins

      // Route: Generators -> MasterGain -> Analyser -> Speakers
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Setup continuous background elements
      this.setupContinuousTuningSound();
      
      this.initialized = true;
      console.log('Synthesizer Audio Engine booted successfully.');
    } catch (e) {
      console.error('Failed to initialize Web Audio:', e);
    }
  }

  setupContinuousTuningSound() {
    // 1. Tuning tone oscillator (quiet background humming)
    this.toneOsc = this.ctx.createOscillator();
    this.toneGain = this.ctx.createGain();
    
    this.toneOsc.type = 'sine';
    this.toneOsc.frequency.setValueAtTime(440, this.ctx.currentTime);
    this.toneGain.gain.setValueAtTime(0, this.ctx.currentTime); // Mute initially

    this.toneOsc.connect(this.toneGain);
    this.toneGain.connect(this.masterGain);
    this.toneOsc.start();

    // 2. Radio static noise buffer
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Populate buffer with random noise values
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    // Apply bandpass filter to noise to make it sound like filtered static
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

    // 3. Setup Bass Synth Filter
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.bassFilter.Q.setValueAtTime(4.0, this.ctx.currentTime); // resonant squelch
    this.bassFilter.connect(this.masterGain);

    // 4. Setup Retro Echo Delay Line (Tape Echo loop)
    try {
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.setValueAtTime(0.32, this.ctx.currentTime); // 320ms delay

      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.setValueAtTime(0.35, this.ctx.currentTime); // 35% feedback loop

      // Feedback routing
      this.bassFilter.connect(this.delayNode);
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);

      // Output wet signals
      this.delayNode.connect(this.masterGain);
    } catch (e) {
      console.warn('Echo delay routing error:', e);
    }
  }

  /**
   * Adjusts static and tone volume mix based on proximity to target signal band
   * Also controls the synthesizer's low-pass filter (resolves music from muffled -> bright).
   */
  updateTuning(dialValue, bandCenter, insideBand) {
    if (!this.initialized || !this.ctx || this.ctx.state === 'suspended') return;

    const dist = Math.abs(dialValue - bandCenter);
    const maxTuningDist = 25.0; // Distance where signal starts resolving

    if (dist < maxTuningDist) {
      // Linear proximity: 1.0 at center, 0.0 at edge of range
      const proximity = 1.0 - (dist / maxTuningDist);

      // Mix: tone gets louder, static gets quieter as proximity approaches 1.0
      const targetToneVol = proximity * 0.12;
      const targetStaticVol = (1.0 - proximity) * 0.12 + 0.01; // slight static always present

      this.toneGain.gain.setTargetAtTime(targetToneVol, this.ctx.currentTime, 0.05);
      this.noiseGain.gain.setTargetAtTime(targetStaticVol, this.ctx.currentTime, 0.05);

      // Pitch modulates slightly depending on offset from target center (feedback direction)
      const pitch = 440 + (dialValue - bandCenter) * 6;
      this.toneOsc.frequency.setTargetAtTime(pitch, this.ctx.currentTime, 0.03);

      // Open the bass sequencer filter (brighter sound)
      if (this.bassFilter) {
        const cutoff = 250 + (proximity * 950); // scales from 250Hz up to 1200Hz
        this.bassFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.06);
      }
    } else {
      // Just full static noise outside resolving range, bass muffled
      this.toneGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.05);
      this.noiseGain.gain.setTargetAtTime(0.15, this.ctx.currentTime, 0.05);
      if (this.bassFilter) {
        this.bassFilter.frequency.setTargetAtTime(250, this.ctx.currentTime, 0.08);
      }
    }
  }

  /**
   * Completely silences continuous tuning feedback (e.g. during menus)
   */
  stopTuning() {
    if (!this.initialized) return;
    this.toneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    this.noiseGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    if (this.bassFilter) {
      this.bassFilter.frequency.setTargetAtTime(220, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Control the background procedural synth sequencer loop
   */
  setGamePlaying(isPlaying) {
    if (!this.initialized || !this.ctx) return;

    if (isPlaying) {
      if (!this.isPlayingSequencer) {
        this.isPlayingSequencer = true;
        this.currentStep = 0;
        this.nextStepTime = this.ctx.currentTime + 0.05;
        this.schedulerTimer = setInterval(() => this.scheduleNextStep(), 25);
      }
    } else {
      if (this.isPlayingSequencer) {
        this.isPlayingSequencer = false;
        clearInterval(this.schedulerTimer);
        this.schedulerTimer = null;
      }
    }
  }

  /**
   * Adapt music tempo & filter resonance to active Jammer Phase
   */
  setJammerPhase(phase) {
    if (phase === 1) {
      this.bpm = 95;
      if (this.bassFilter) this.bassFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);
    } else if (phase === 2) {
      this.bpm = 115;
      if (this.bassFilter) this.bassFilter.Q.setValueAtTime(6.0, this.ctx.currentTime);
    } else if (phase === 3) {
      this.bpm = 135;
      if (this.bassFilter) this.bassFilter.Q.setValueAtTime(9.0, this.ctx.currentTime); // aggressive squelch
    }
  }

  scheduleNextStep() {
    // Check ahead time window: schedule notes that land in the next 100ms
    const stepDuration = 60 / this.bpm / 2; // eighth notes duration in seconds
    while (this.nextStepTime < this.ctx.currentTime + 0.1) {
      this.playStep(this.currentStep, this.nextStepTime);
      
      // Advance step counters
      this.currentStep = (this.currentStep + 1) % 8;
      this.nextStepTime += stepDuration;

      // Chord progression: shift notes every 16 steps (2 full bars)
      this.stepsInCurrentChord++;
      if (this.stepsInCurrentChord >= 16) {
        this.stepsInCurrentChord = 0;
        this.currentChordIdx = (this.currentChordIdx + 1) % this.chords.length;
      }
    }
  }

  playStep(step, time) {
    // 1. Synthesize Bass Synth (eighth notes driving pattern)
    // Root bass octave on steps 0, 2, 4, 6; syncopating octave up on 3, 7; rest on 1, 5
    let noteFreq = this.chords[this.currentChordIdx];
    let playNote = true;
    let volumeScale = 0.12;

    if (step === 1 || step === 5) {
      if (this.activeCombo >= 2) {
        // Combo level 2+: Play syncopated arpeggio notes on rest beats
        noteFreq *= 1.5; // Perfect 5th harmony
        playNote = true;
        volumeScale = 0.05; // quieter background layer
      } else {
        playNote = false; // standard rest steps
      }
    } else if (step === 3 || step === 7) {
      noteFreq *= 2; // play octave up for movement
    }

    if (playNote) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(noteFreq / 2, time); // drop bass octave

      osc.connect(gain);
      gain.connect(this.bassFilter);

      // Bass note envelope: punchy attack, fast decay
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volumeScale, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      osc.start(time);
      osc.stop(time + 0.18);
    }

    // 2. Synthesize Kick Drum (Four-on-the-floor beat on steps 0 and 4)
    // Combo level 4+: plays a kick syncopation on steps 2 and 6 as well!
    const isKickStep = (step === 0 || step === 4) || (this.activeCombo >= 4 && (step === 2 || step === 6));
    if (isKickStep) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const kickVol = (step === 0 || step === 4) ? 0.23 : 0.10;

      osc.type = 'sine';
      // Pitch sweep from 150Hz down to 40Hz rapidly
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      // Kick envelope
      gain.gain.setValueAtTime(kickVol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.start(time);
      osc.stop(time + 0.13);
    }

    // 3. Synthesize High-Hat (Snappy high clicks for Combo level 3+)
    if (this.activeCombo >= 3) {
      if (step === 1 || step === 3 || step === 5 || step === 7) {
        const hatOsc = this.ctx.createOscillator();
        const hatGain = this.ctx.createGain();
        hatOsc.type = 'triangle';
        hatOsc.frequency.setValueAtTime(8000, time);
        hatOsc.connect(hatGain);
        hatGain.connect(this.masterGain);
        hatGain.gain.setValueAtTime(0.012, time);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02);
        hatOsc.start(time);
        hatOsc.stop(time + 0.025);
      }
    }

    // 4. Synthesize Snare Drum (Backbeat noise burst on steps 2 and 6)
    if (step === 2 || step === 6) {
      const bufferSize = this.ctx.sampleRate * 0.1; // 100ms burst
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      // Filter to shape noise into a snare tone
      const snareFilter = this.ctx.createBiquadFilter();
      snareFilter.type = 'bandpass';
      snareFilter.frequency.setValueAtTime(1200, time);

      const gain = this.ctx.createGain();

      noise.connect(snareFilter);
      snareFilter.connect(gain);
      gain.connect(this.masterGain);

      // Snare envelope
      gain.gain.setValueAtTime(0.07, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      noise.start(time);
      noise.stop(time + 0.11);
    }
  }

  /**
   * Retrieves real-time spectral amplitudes for visualizer displays
   * @returns {Array<number>} Array of 16 floats normalized between 0.0 and 1.0
   */
  getSpectrumData() {
    if (!this.initialized || !this.analyser) {
      return new Array(16).fill(0);
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    const result = [];
    // Down-sample 32 frequency bins to 16 display columns
    for (let i = 0; i < 16; i++) {
      const val = (dataArray[i * 2] + dataArray[i * 2 + 1]) / 2;
      result.push(val / 255.0);
    }
    return result;
  }

  /**
   * Plays a successful standard signal lock sound (clear, rising double-beep)
   */
  playLock() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.frequency.setValueAtTime(523.25, now); // C5
    gain.gain.setValueAtTime(0.12, now);
    
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
    
    gain.gain.setValueAtTime(0.12, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Plays a super clean / perfect lock sound (high arpeggio chime)
   */
  playCleanLock() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.frequency.setValueAtTime(783.99, now); // G5
    gain.gain.setValueAtTime(0.15, now);
    
    osc.frequency.setValueAtTime(1046.50, now + 0.06); // C6
    osc.frequency.setValueAtTime(1318.51, now + 0.12); // E6
    osc.frequency.setValueAtTime(1567.98, now + 0.18); // G6
    
    gain.gain.setValueAtTime(0.15, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.start(now);
    osc.stop(now + 0.43);
  }

  /**
   * Plays a near-miss grace warning sound (vibrating frequency glitch tone)
   */
  playNearMiss() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.frequency.setValueAtTime(250, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.05);
    osc.frequency.linearRampToValueAtTime(260, now + 0.10);
    osc.frequency.linearRampToValueAtTime(230, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

    osc.start(now);
    osc.stop(now + 0.22);
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

    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Plays a quiet tactile click sound for CLI keyboard typing feedback
   */
  playKeyClick() {
    if (!this.initialized || !this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.02);

    osc.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.start(now);
    osc.stop(now + 0.025);
  }

  /**
   * Cleanup method to prevent memory leaks on scene restart
   */
  destroy() {
    // Stop sequencer interval
    if (this.isPlayingSequencer && this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
      this.isPlayingSequencer = false;
    }

    // Remove EventBus listeners
    EventBus.off('COMBO_UPDATED');
    EventBus.off('LOCK_MISS');
    EventBus.off('ROUND_RESET');

    // Close audio context
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}

