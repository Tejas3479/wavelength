import Phaser from 'phaser';
import { DialController } from '../modules/DialController.js';
import { SignalBand } from '../modules/SignalBand.js';
import { ScoreTimer } from '../modules/ScoreTimer.js';
import { Jammer } from '../modules/Jammer.js';
import { AudioManager } from '../modules/AudioManager.js';
import { JammerPresence } from '../modules/JammerPresence.js';
import { RunSummary } from '../modules/RunSummary.js';
import { TerminalCLI } from '../modules/TerminalCLI.js';
import { UpgradeSystem } from '../modules/UpgradeSystem.js';
import { EventBus } from '../modules/EventBus.js';

const STATES = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  UPGRADE: 'UPGRADE',
  ANALYSIS: 'ANALYSIS',
  GAMEOVER: 'GAMEOVER',
  VICTORY: 'VICTORY'
};

/**
 * MainScene — the primary gameplay scene.
 * Coordinates visual styling grids, CLI execution pipelines,
 * interactive upgrade menus, real-time telemetry counters,
 * and adaptive AI opponent calibration sweeps.
 */
export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.gameState = STATES.TITLE;

    // Initialize Web Audio API manager
    this.audioManager = new AudioManager();

    // Typewriter log queue variables
    this.logQueue = [];
    this.isLoggingTypewriter = false;

    // Create particle spark texture dynamically
    try {
      if (!this.textures.exists('spark')) {
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 4;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 4, 4);
        this.textures.addCanvas('spark', canvas);
      }
    } catch (e) {
      console.warn('Canvas particle texture creation error:', e);
    }

    // 1. Initialize core game modules (placed centrally)
    this.dialController = new DialController(this, 400, 240, 600);
    this.scoreTimer = new ScoreTimer(this);
    this.jammer = new Jammer(this, 240);
    this.signalBand = new SignalBand(this, 400, 240, 600);
    
    // Glowing vector AI Jammer Eye
    this.jammerPresence = new JammerPresence(this, 400, 100);

    // Setup Phaser Particle Emitter trail
    try {
      this.sparkEmitter = this.add.particles(0, 0, 'spark', {
        speed: { min: 25, max: 70 },
        scale: { start: 1.3, end: 0 },
        blendMode: 'SCREEN',
        lifespan: 300,
        frequency: -1 // Manual emit or very slow
      });
    } catch (e) {
      console.warn('Particle emitter setup failed:', e);
    }

    // 2. Initialize Command Console and Shop Upgrades
    this.terminalCLI = new TerminalCLI(this);
    this.upgradeSystem = new UpgradeSystem(this);

    // Dynamic radar sweeps graphics background
    this.radarSweepGraphics = this.add.graphics().setDepth(-10);

    // Falling Hexadecimal matrix code rain gutters
    this.hexRainTexts = [];
    const gutterCols = [25, 55, 85, 115, 685, 715, 745, 775];
    gutterCols.forEach(colX => {
      const textNode = this.add.text(colX, 0, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#00ffaa',
        align: 'center',
        lineSpacing: 2
      }).setAlpha(0.18).setDepth(-5);

      const chars = [];
      for (let i = 0; i < 15; i++) {
        chars.push(this.getRandomHexValue());
      }

      this.hexRainTexts.push({
        textObj: textNode,
        x: colX,
        y: Math.random() * -400 - 100,
        speed: 75.0 + Math.random() * 110.0,
        chars: chars,
        charTimer: 0.0
      });
    });

    // Upgrade state variables
    this.shields = 0;
    this.upgradeCount = 0; // Track upgrades separately from score
    this.hasOverclock = false;
    this.isOverclockActive = false;
    this.overclockTimer = 0.0;

    // Password Bypass Decryption sub-game variables
    this.isDecryptionActive = false;
    this.decryptionKeys = [];
    this.decryptionCorrectKey = '';
    this.decryptionAttempts = 0;
    
    this.hasEMP = false;
    this.isEMPActive = false;
    this.empActiveTimer = 0.0;
    this.empCooldown = 0.0;
    this.savedBandSpeed = 1.5;

    this.isEndlessMode = false;

    // Combo streak and multiplier values
    this.comboMultiplier = 1;
    this.consecutiveLocks = 0;

    // Jammer boss overload phases variables
    this.isBossGravityActive = false;

    // Sub-carrier coordinates scan variables
    this.isScanActive = false;
    this.scannedTargetNode = null;
    this.scanGraphics = this.add.graphics();

    // Telemetry trackers for the current round
    this.roundDialValues = [];
    this.roundBandCenters = [];
    this.totalDialMovement = 0.0;
    this.roundTimeElapsed = 0.0;
    this.lastDialValue = 50.0;

    // Overshoot calculations
    this.overshootCount = 0;

    // Granular run stats across attempts
    this.runCleanLocks = 0;
    this.runStandardLocks = 0;
    this.runNearMisses = 0;
    this.runTotalMisses = 0;
    this.runTimeouts = 0;
    this.speedSamples = [];

    // Setup visual components
    this.setupHUDComponents();
    this.setupScreenOverlays();
    this.setupInputEvents();

    // Start at Title Screen
    this.transitionToState(STATES.TITLE);
  }

  setupHUDComponents() {
    // Large overlay feedback text
    this.feedbackText = this.add.text(400, 175, '', {
      fontFamily: 'Orbitron',
      fontSize: '26px',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setVisible(false);

    // Scrolling CLI log output area (left-bottom panel)
    this.terminalLogs = [];
    this.add.text(30, 350, '--- CONSOLE LOG ---', {
      fontFamily: 'Space Mono',
      fontSize: '11px',
      color: '#536271'
    });
    this.terminalLogText = this.add.text(30, 370, '', {
      fontFamily: 'Space Mono',
      fontSize: '11px',
      color: '#00f0ff',
      lineSpacing: 4,
      wordWrap: { width: 230 }
    });

    // Real-time bouncing frequency spectrum EQ (right-bottom panel)
    this.add.text(530, 350, '--- SIGNAL SPECTRUM ---', {
      fontFamily: 'Space Mono',
      fontSize: '11px',
      color: '#536271'
    });
    this.eqGraphics = this.add.graphics();

    // AI Threat Radar Map (Left-Top HUD)
    this.radarGraphics = this.add.graphics();
    this.add.text(150, 42, 'COGNITIVE MAP', { fontFamily: 'Space Mono', fontSize: '9px', color: '#536271' }).setOrigin(0.5);
    this.add.text(150, 52, 'SPD', { fontFamily: 'Space Mono', fontSize: '8px', color: '#8f9aa6' }).setOrigin(0.5);
    this.add.text(198, 126, 'OVR', { fontFamily: 'Space Mono', fontSize: '8px', color: '#8f9aa6' }).setOrigin(0.5);
    this.add.text(102, 126, 'DEL', { fontFamily: 'Space Mono', fontSize: '8px', color: '#8f9aa6' }).setOrigin(0.5);

    // Hardware Fuses & Cooldowns Gauge (Right-Top HUD)
    this.gaugeGraphics = this.add.graphics();
    this.add.text(650, 42, 'HARDWARE FUSES', { fontFamily: 'Space Mono', fontSize: '9px', color: '#536271' }).setOrigin(0.5);
    this.add.text(650, 118, 'SHIELD GRID', { fontFamily: 'Space Mono', fontSize: '8px', color: '#8f9aa6' }).setOrigin(0.5);

    // Endless mode HUD status indicator
    this.endlessBadgeText = this.add.text(400, 30, '[ ENDLESS MODE ACTIVE ]', {
      fontFamily: 'Space Mono',
      fontSize: '11px',
      color: '#ffaa00',
      align: 'center'
    }).setOrigin(0.5).setVisible(false);
  }

  setupScreenOverlays() {
    // Title Overlay
    this.titleContainer = this.add.container(400, 300);
    const titleText = this.add.text(0, -90, 'WAVELENGTH', {
      fontFamily: 'Orbitron',
      fontSize: '54px',
      color: '#00f0ff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    
    const subTitleText = this.add.text(0, -25, '— ADAPTIVE-AI SIGNAL TUNER TERMINAL —', {
      fontFamily: 'Space Mono',
      fontSize: '14px',
      color: '#8f9aa6'
    }).setOrigin(0.5);

    const instructText = this.add.text(0, 70, 'OPERATOR MANUAL:\n← / → or A / D to rotate needle dial\nPress `~` or `/` to unlock keyboard Command CLI\n\nPRESS SPACE TO ACCESS SYSTEM INTERFACES\n(Enables Procedural Audio Synthesis)', {
      fontFamily: 'Space Mono',
      fontSize: '13px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    this.titleContainer.add([titleText, subTitleText, instructText]);

    // Game Over Overlay
    this.gameOverContainer = this.add.container(400, 300);
    const goTitle = this.add.text(0, -80, 'CONNECTION TERMINATED', {
      fontFamily: 'Orbitron',
      fontSize: '44px',
      color: '#ff3366',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.goInstruct = this.add.text(0, 50, 'The Jammer has completely overwritten your signal.\n\nPRESS SPACE TO REBOOT COGNITIVE DECK', {
      fontFamily: 'Space Mono',
      fontSize: '13px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    this.gameOverContainer.add([goTitle, this.goInstruct]);

    // Victory Overlay
    this.victoryContainer = this.add.container(400, 300);
    const vicTitle = this.add.text(0, -80, 'SYSTEM BYPASS SUCCESS', {
      fontFamily: 'Orbitron',
      fontSize: '44px',
      color: '#39ff14',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.vicInstruct = this.add.text(0, 50, 'You successfully bypassed the Jammer security grid!\n\nPRESS SPACE TO INITIATE RE-ENTRY SEQUENCE', {
      fontFamily: 'Space Mono',
      fontSize: '13px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    this.victoryContainer.add([vicTitle, this.vicInstruct]);

    // Interactive LOCK button for playing screen
    this.lockButton = this.add.text(400, 535, 'LOCK FREQUENCY [SPACE]', {
      fontFamily: 'Orbitron',
      fontSize: '18px',
      color: '#00f0ff',
      backgroundColor: '#0a0c10',
      padding: { x: 25, y: 12 },
      stroke: '#00f0ff',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive();

    // Stylize Lock Button Hover
    this.lockButton.on('pointerover', () => this.lockButton.setStyle({ backgroundColor: '#161a22', color: '#ffffff' }));
    this.lockButton.on('pointerout', () => this.lockButton.setStyle({ backgroundColor: '#0a0c10', color: '#00f0ff' }));

    this.lockButton.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      if (this.gameState === STATES.PLAYING) {
        this.attemptLock();
      }
    });
  }

  setupInputEvents() {
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.gameState === STATES.PLAYING) {
        this.attemptLock();
      } else if (this.gameState !== STATES.ANALYSIS && this.gameState !== STATES.UPGRADE) {
        // Initialize AudioContext on first space press
        this.audioManager.start();
        this.transitionToState(STATES.PLAYING);
      }
    });

    this.input.on('pointerdown', () => {
      if (
        this.gameState !== STATES.PLAYING && 
        this.gameState !== STATES.ANALYSIS && 
        this.gameState !== STATES.UPGRADE
      ) {
        this.audioManager.start();
        this.transitionToState(STATES.PLAYING);
      }
    });
  }

  transitionToState(newState) {
    this.gameState = newState;

    // Toggle overlays visibility
    this.titleContainer.setVisible(newState === STATES.TITLE);
    this.gameOverContainer.setVisible(newState === STATES.GAMEOVER);
    this.victoryContainer.setVisible(newState === STATES.VICTORY);

    const isPlaying = newState === STATES.PLAYING;
    const isAnalysis = newState === STATES.ANALYSIS;
    const isUpgrade = newState === STATES.UPGRADE;

    // Toggle modules visibility
    this.dialController.graphics.setVisible(isPlaying || isAnalysis);
    this.signalBand.graphics.setVisible(isPlaying || isAnalysis);
    this.scoreTimer.setVisible(isPlaying || isAnalysis);
    this.lockButton.setVisible(isPlaying);
    
    // Hide Jammer graphics unless analyzing
    this.jammer.setVisible(isAnalysis);
    this.jammerPresence.setVisible(true);

    // Stop EQ drawings unless active gameplay
    if (!isPlaying && !isAnalysis) {
      this.eqGraphics.clear();
    }

    // Toggle HTML Command Console CLI
    if (isPlaying) {
      this.terminalCLI.enable();
      this.audioManager.setGamePlaying(true);
    } else {
      this.terminalCLI.disable();
      if (newState !== STATES.ANALYSIS && newState !== STATES.UPGRADE) {
        this.audioManager.setGamePlaying(false);
      }
    }

    if (newState === STATES.TITLE) {
      // Reset upgraded parameters to defaults
      if (this.dialController) {
        this.dialController.speed = 40.0;
        this.dialController.friction = 0.82;
      }
      if (this.signalBand) {
        this.signalBand.width = 12.0;
      }
      if (this.jammer) {
        this.jammer.telemetryDampening = 1.0;
        this.jammer.phase = 1;
        this.jammer.confidence = 20;
        this.jammer.history = [];
      }

      this.shields = 0;
      this.hasOverclock = false;
      this.isOverclockActive = false;
      this.overclockTimer = 0.0;
      this.hasEMP = false;
      this.isEMPActive = false;
      this.empActiveTimer = 0.0;
      this.empCooldown = 0.0;
      this.savedBandSpeed = 1.5;
      this.isEndlessMode = false;
      this.upgradeCount = 0;

      this.comboMultiplier = 1;
      this.consecutiveLocks = 0;
      this.isBossGravityActive = false;
      this.isScanActive = false;
      this.isDecryptionActive = false;
      this.decryptionKeys = [];
      this.decryptionCorrectKey = '';
      this.decryptionAttempts = 0;
      if (this.typewriterTimeEvent) {
        this.typewriterTimeEvent.destroy();
        this.typewriterTimeEvent = null;
      }
      if (this.endlessBadgeText) {
        this.endlessBadgeText.setVisible(false);
      }
      if (this.scanGraphics) this.scanGraphics.clear();
      EventBus.emit('ROUND_RESET');
      
      this.terminalLogs = [];
      this.isLoggingTypewriter = false;
      if (this.logQueue) this.logQueue = [];
      
      this.logTerminal('CYBER_DECK BOOT SEQUENCE COMPLETE.');
      this.logTerminal('COGNITIVE CORES INITIATED.');
      this.logTerminal('PRESS SPACE TO ESTABLISH CONNECTION.');
      
      if (this.audioManager) {
        this.audioManager.stopTuning();
      }
    }

    if (isPlaying) {
      this.scoreTimer.resetGame();
      
      // Reset stats
      this.runCleanLocks = 0;
      this.runStandardLocks = 0;
      this.runNearMisses = 0;
      this.runTotalMisses = 0;
      this.runTimeouts = 0;
      this.speedSamples = [];

      this.comboMultiplier = 1;
      this.consecutiveLocks = 0;
      this.isBossGravityActive = false;
      this.isScanActive = false;
      if (this.scanGraphics) this.scanGraphics.clear();
      EventBus.emit('ROUND_RESET');

      this.startNewRound(false);
    } else if (isAnalysis) {
      this.scoreTimer.stopTimer();
      this.feedbackText.setVisible(false);
      if (this.audioManager) {
        this.audioManager.stopTuning();
      }
      this.runJammerAnalysis();
    } else if (isUpgrade) {
      this.scoreTimer.stopTimer();
      this.feedbackText.setVisible(false);
      if (this.audioManager) {
        this.audioManager.stopTuning();
      }
      this.upgradeSystem.showUpgrades();
    } else {
      // Game completion summaries
      this.scoreTimer.stopTimer();
      this.feedbackText.setVisible(false);
      if (this.audioManager) {
        this.audioManager.stopTuning();
      }

      if (newState === STATES.GAMEOVER || newState === STATES.VICTORY) {
        let avgSpeedOfRun = 0.0;
        if (this.speedSamples.length > 0) {
          let sum = 0;
          this.speedSamples.forEach(v => sum += v);
          avgSpeedOfRun = sum / this.speedSamples.length;
        }

        const stats = {
          score: this.scoreTimer.score,
          cleanLocks: this.runCleanLocks,
          standardLocks: this.runStandardLocks,
          nearMisses: this.runNearMisses,
          totalMisses: this.runTotalMisses,
          timeouts: this.runTimeouts,
          avgSpeed: avgSpeedOfRun,
          victory: newState === STATES.VICTORY
        };

        const summary = RunSummary.generate(stats);

        if (newState === STATES.GAMEOVER) {
          this.goInstruct.setText(`The Jammer has completely blocked you.\n\n${summary}\n\nPRESS SPACE TO REBOOT TERMINAL`);
        } else {
          this.vicInstruct.setText(`You successfully bypassed the Jammer!\n\n${summary}\n\nPRESS SPACE TO SURVIVE AGAIN`);
        }
      }
    }
  }

  startNewRound(keepCurrentBand = false) {
    this.dialController.value = 50.0;
    this.dialController.velocity = 0.0;
    this.scoreTimer.startRound();
    
    if (!keepCurrentBand) {
      this.signalBand.reset();
    }

    // Adapt background sequencer BPM & Filter squelch to current Jammer phase
    if (this.audioManager && this.audioManager.setJammerPhase) {
      this.audioManager.setJammerPhase(this.jammer.phase);
    }

    // Reset round counters
    this.roundDialValues = [];
    this.roundBandCenters = [];
    this.totalDialMovement = 0.0;
    this.roundTimeElapsed = 0.0;
    this.lastDialValue = 50.0;
    this.overshootCount = 0;
  }

  runJammerAnalysis() {
    let avgBias = 0.0;
    if (this.roundDialValues.length > 0) {
      let sumBias = 0.0;
      for (let i = 0; i < this.roundDialValues.length; i++) {
        sumBias += (this.roundDialValues[i] - this.roundBandCenters[i]);
      }
      avgBias = sumBias / this.roundDialValues.length;
    }

    const avgSpeed = this.roundTimeElapsed > 0 ? this.totalDialMovement / this.roundTimeElapsed : 0;
    this.speedSamples.push(avgSpeed);

    // Pass overshoot counts and locking delays to Jammer AI
    this.jammer.recordAttempt(avgBias, avgSpeed, this.overshootCount, this.roundTimeElapsed);

    this.jammer.startAnalysis(this.scoreTimer.score, (newParams) => {
      this.signalBand.applyJammerParams(newParams);

      // Save original speed before any modifications for proper restoration
      const originalSpeed = this.signalBand.speed;

      // Preserve overclock and EMP speed scaling across transitions
      if (this.isOverclockActive) {
        this.savedBandSpeed = originalSpeed;
        this.signalBand.speed *= 2.0;
      }
      if (this.isEMPActive) {
        this.savedBandSpeed = originalSpeed;
        this.signalBand.speed = 0.0;
      }
      
      // Boss Phase Overload check
      const score = this.scoreTimer.score;
      if (score === 5 || score === 10) {
        this.isBossGravityActive = true;
        this.signalBand.waveShape = 'MORPH';
        
        this.logTerminal('[!!!] WARNING: JAMMER RUNNING COGNITIVE OVERLOAD CODE!');
        this.logTerminal('[!!!] WARNING: MAGNETIC NEEDLE DRAFT ENGAGED.');
        this.cameras.main.flash(400, 255, 0, 0); // Warning crimson flash
      } else {
        this.isBossGravityActive = false;
      }

      // Return to gameplay
      this.gameState = STATES.PLAYING;
      this.lockButton.setVisible(true);
      this.jammer.setVisible(false);
      this.terminalCLI.enable();
      this.audioManager.setGamePlaying(true);

      this.startNewRound(true);
    });
  }

  resumeAfterUpgrade() {
    this.gameState = STATES.PLAYING;
    this.lockButton.setVisible(true);
    this.terminalCLI.enable();
    this.audioManager.setGamePlaying(true);
    
    this.startNewRound(true);
  }

  attemptLock() {
    // 1. First check if we are locking onto an active scanned sub-carrier node
    if (this.isScanActive && this.scannedTargetNode !== null) {
      const scanDiff = Math.abs(this.dialController.value - this.scannedTargetNode);
      if (scanDiff <= 3.5) {
        this.handleScanLockSuccess();
        return;
      }
    }

    // 2. Otherwise lock main signal band
    const diff = Math.abs(this.dialController.value - this.signalBand.center);
    const bandWidth = this.signalBand.width;

    const cleanZone = bandWidth * 0.22;    
    const standardZone = bandWidth * 0.50; 
    const nearMissZone = standardZone + 4.5; 

    if (diff <= cleanZone) {
      this.handleCleanLockSuccess();
    } else if (diff <= standardZone) {
      this.handleStandardLockSuccess();
    } else if (diff <= nearMissZone) {
      this.handleNearMissGrace();
    } else {
      this.handleLockMiss();
    }
  }

  handleCleanLockSuccess() {
    // 1. Calculate dynamic combo multipliers
    this.consecutiveLocks++;
    if (this.consecutiveLocks >= 6) this.comboMultiplier = 4;
    else if (this.consecutiveLocks >= 4) this.comboMultiplier = 3;
    else if (this.consecutiveLocks >= 2) this.comboMultiplier = 2;
    else this.comboMultiplier = 1;

    // 2. Award score multiplied by combo tier
    const earnedPoints = 2 * this.comboMultiplier;
    this.scoreTimer.score += earnedPoints;
    this.scoreTimer.updateHUD();

    this.cameras.main.flash(200, 0, 255, 120); // Neon green glow
    this.showFeedback(`CLEAN LOCK! +${earnedPoints} (x${this.comboMultiplier})`, '#39ff14');
    this.audioManager.playCleanLock();

    // Trigger dynamic particles blast on locks success
    if (this.sparkEmitter) {
      this.sparkEmitter.emitParticle(30);
    }

    this.logTerminal(`[+] Lock streak: ${this.consecutiveLocks} consecutive locks! (Combo: x${this.comboMultiplier})`);

    // Broadcast event to EventBus
    EventBus.emit('COMBO_UPDATED', this.comboMultiplier);

    this.runCleanLocks++;
    this.upgradeCount++;
    this.checkProgressTransitions();
  }

  handleStandardLockSuccess() {
    this.consecutiveLocks++;
    if (this.consecutiveLocks >= 6) this.comboMultiplier = 4;
    else if (this.consecutiveLocks >= 4) this.comboMultiplier = 3;
    else if (this.consecutiveLocks >= 2) this.comboMultiplier = 2;
    else this.comboMultiplier = 1;

    const earnedPoints = 1 * this.comboMultiplier;
    this.scoreTimer.score += earnedPoints;
    this.scoreTimer.updateHUD();

    this.cameras.main.flash(200, 0, 220, 180); 
    this.showFeedback(`SIGNAL LOCKED! +${earnedPoints} (x${this.comboMultiplier})`, '#00f0ff');
    this.audioManager.playLock();

    if (this.sparkEmitter) {
      this.sparkEmitter.emitParticle(15);
    }

    this.logTerminal(`[+] Lock streak: ${this.consecutiveLocks} consecutive locks! (Combo: x${this.comboMultiplier})`);
    EventBus.emit('COMBO_UPDATED', this.comboMultiplier);

    this.runStandardLocks++;
    this.upgradeCount++;
    this.checkProgressTransitions();
  }

  handleNearMissGrace() {
    this.scoreTimer.timeLeft = Math.min(this.scoreTimer.maxTime, this.scoreTimer.timeLeft + 1.5);
    this.scoreTimer.updateHUD();

    this.cameras.main.flash(150, 255, 170, 0); // Orange flash
    this.showFeedback('NEAR MISS! GRACE +1.5s', '#ffaa00');
    this.audioManager.playNearMiss();

    this.runNearMisses++;
  }

  handleLockMiss() {
    // Reset streak and multiplier on miss
    this.consecutiveLocks = 0;
    this.comboMultiplier = 1;
    EventBus.emit('LOCK_MISS');

    // Check active hardware shields
    if (this.shields > 0) {
      this.shields--;
      this.cameras.main.flash(200, 255, 170, 0); // shield flash orange
      this.cameras.main.shake(100, 0.008);
      this.showFeedback('SHIELD CORE DISCHARGED!', '#ffaa00');
      this.audioManager.playNearMiss();
      this.logTerminal(`[!] SHIELD ACTIVE. Absorbed lock failure strike. Cores remaining: ${this.shields}`);
      this.transitionToState(STATES.ANALYSIS);
      return;
    }

    const isAlive = this.scoreTimer.decrementLife();
    this.cameras.main.flash(200, 255, 51, 102); 
    this.cameras.main.shake(150, 0.012);        
    this.showFeedback('TOTAL MISS! -1 LIFE', '#ff3366');
    this.audioManager.playMiss();

    // Trigger visual glitch line offsets
    this.triggerGlitchSweep();

    this.runTotalMisses++;

    if (!isAlive) {
      this.transitionToState(STATES.GAMEOVER);
    } else {
      this.transitionToState(STATES.ANALYSIS);
    }
  }

  handleTimeout() {
    // Reset streak and multiplier on timeout
    this.consecutiveLocks = 0;
    this.comboMultiplier = 1;
    EventBus.emit('LOCK_MISS');

    if (this.shields > 0) {
      this.shields--;
      this.cameras.main.flash(200, 255, 170, 0);
      this.cameras.main.shake(100, 0.008);
      this.showFeedback('SHIELD CORE DISCHARGED!', '#ffaa00');
      this.audioManager.playNearMiss();
      this.logTerminal(`[!] SHIELD ACTIVE. Absorbed timeout strike. Cores remaining: ${this.shields}`);
      this.transitionToState(STATES.ANALYSIS);
      return;
    }

    const isAlive = this.scoreTimer.decrementLife();
    this.cameras.main.flash(250, 255, 51, 102); 
    this.cameras.main.shake(200, 0.015);        
    this.showFeedback('TIMEOUT! -1 LIFE', '#ff3366');
    this.audioManager.playMiss();

    this.triggerGlitchSweep();

    this.runTimeouts++;

    if (!isAlive) {
      this.transitionToState(STATES.GAMEOVER);
    } else {
      this.transitionToState(STATES.ANALYSIS);
    }
  }

  checkProgressTransitions() {
    if (this.upgradeCount >= 15 && !this.isEndlessMode) {
      this.transitionToState(STATES.VICTORY);
    } else if (this.upgradeCount > 0 && this.upgradeCount % 3 === 0) {
      this.transitionToState(STATES.UPGRADE);
    } else {
      this.transitionToState(STATES.ANALYSIS);
    }
  }

  /**
   * Console commands triggers
   */
  triggerOverclock() {
    this.isOverclockActive = true;
    this.overclockTimer = 3.0;
    
    // Boost dial speed by 50%
    this.dialController.speed = 80.0;
    
    // Double jammer target oscillation speed
    this.savedBandSpeed = this.signalBand.speed;
    this.signalBand.speed *= 2.0;

    this.logTerminal('[!] OVERCLOCK CORE ACTUATED. needle speed = 200%.');
    this.logTerminal('[!] WARNING: AI tracker frequency doubled.');
  }

  triggerEMP() {
    this.isEMPActive = true;
    this.empActiveTimer = 2.0;
    this.empCooldown = 15.0;

    // Stop band oscillation movements
    this.savedBandSpeed = this.signalBand.speed;
    this.signalBand.speed = 0.0;

    this.logTerminal('[!] EMP SHIELD BURST DISCHARGED.');
    this.logTerminal('[!] Wave oscillations frozen for 2.0s.');
  }

  toggleEndlessMode() {
    this.isEndlessMode = !this.isEndlessMode;
    this.logTerminal(`[!] SYSTEM SETTING: Endless run loop = ${this.isEndlessMode ? 'ACTIVE' : 'INACTIVE'}`);
  }

  logTerminal(message) {
    if (!this.logQueue) {
      this.logQueue = [];
    }
    this.logQueue.push(message);
    
    // Safety check: flush immediately if backlog grows too large
    if (this.logQueue.length > 8) {
      while (this.logQueue.length > 0) {
        this.terminalLogs.push(this.logQueue.shift());
      }
      if (this.terminalLogs.length > 9) {
        this.terminalLogs.splice(0, this.terminalLogs.length - 9);
      }
      if (this.terminalLogText) {
        this.terminalLogText.setText(this.terminalLogs.join('\n'));
      }
      return;
    }
    
    if (!this.isLoggingTypewriter) {
      this.typeNextLog();
    }
  }

  typeNextLog() {
    if (!this.logQueue || this.logQueue.length === 0) {
      this.isLoggingTypewriter = false;
      return;
    }
    
    this.isLoggingTypewriter = true;
    const fullMsg = this.logQueue.shift();
    
    this.terminalLogs.push('');
    if (this.terminalLogs.length > 9) {
      this.terminalLogs.shift();
    }
    
    const currentLineIdx = this.terminalLogs.length - 1;
    let charIdx = 0;
    
    this.typewriterTimeEvent = this.time.addEvent({
      delay: 15,
      repeat: fullMsg.length - 1,
      callback: () => {
        if (
          this.gameState !== STATES.TITLE && 
          this.gameState !== STATES.PLAYING && 
          this.gameState !== STATES.ANALYSIS && 
          this.gameState !== STATES.UPGRADE
        ) {
          this.isLoggingTypewriter = false;
          if (this.typewriterTimeEvent) {
            this.typewriterTimeEvent.destroy();
            this.typewriterTimeEvent = null;
          }
          return;
        }
        
        this.terminalLogs[currentLineIdx] += fullMsg[charIdx];
        charIdx++;
        
        if (this.terminalLogText) {
          this.terminalLogText.setText(this.terminalLogs.join('\n'));
        }
        
        if (charIdx % 2 === 0 && this.audioManager && this.audioManager.playKeyClick) {
          this.audioManager.playKeyClick();
        }
      },
      callbackScope: this,
      onComplete: () => {
        this.typewriterTimeEvent = null;
        this.typeNextLog();
      }
    });
  }

  triggerGlitchSweep() {
    // Draw 3 random glitch block rectangles on canvas for 100ms
    const glitchGraphics = this.add.graphics();
    glitchGraphics.fillStyle(0xff3366, 0.45);
    for (let i = 0; i < 4; i++) {
      const rx = Math.random() * 200 + 100;
      const ry = Math.random() * 300 + 100;
      const rw = Math.random() * 400 + 100;
      const rh = Math.random() * 15 + 5;
      glitchGraphics.fillRect(rx, ry, rw, rh);
    }
    
    this.time.delayedCall(120, () => {
      glitchGraphics.destroy();
    });
  }

  showFeedback(message, colorCode) {
    this.feedbackText.setText(message);
    this.feedbackText.setColor(colorCode);
    this.feedbackText.setPosition(400, 175);
    this.feedbackText.setAlpha(1);
    this.feedbackText.setScale(1);
    this.feedbackText.setVisible(true);

    if (this.feedbackTween) {
      this.feedbackTween.stop();
    }

    this.feedbackTween = this.tweens.add({
      targets: this.feedbackText,
      y: 130,
      alpha: 0,
      scale: 1.25,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.feedbackText.setVisible(false);
      }
    });
  }

  update(time, delta) {
    const dt = delta / 1000;

    // 1. Animate Gutter Hex Matrix code rain
    const isPlayingOrAnalyzing = this.gameState === STATES.PLAYING || this.gameState === STATES.ANALYSIS;
    if (this.hexRainTexts) {
      this.hexRainTexts.forEach(col => {
        if (isPlayingOrAnalyzing) {
          col.textObj.setVisible(true);
          col.y += col.speed * dt;
          col.charTimer += dt;
          
          if (col.charTimer >= 0.08) {
            col.charTimer = 0.0;
            col.chars.pop();
            col.chars.unshift(this.getRandomHexValue());
            col.textObj.setText(col.chars.join('\n'));
          }

          col.textObj.setY(col.y);

          if (col.y > 600) {
            col.y = Math.random() * -300 - 100;
            col.speed = 75.0 + Math.random() * 110.0;
          }
        } else {
          col.textObj.setVisible(false);
        }
      });
    }

    // 2. Render Tactical Radar sweep background grid
    if (this.radarSweepGraphics) {
      this.radarSweepGraphics.clear();
      if (isPlayingOrAnalyzing) {
        const cx = 400;
        const cy = 240;

        // Concentric grid circles
        this.radarSweepGraphics.lineStyle(1.0, 0x00ffaa, 0.04);
        this.radarSweepGraphics.strokeCircle(cx, cy, 120);
        this.radarSweepGraphics.strokeCircle(cx, cy, 220);
        this.radarSweepGraphics.strokeCircle(cx, cy, 320);

        // Radial cross lines
        this.radarSweepGraphics.lineStyle(1.0, 0x00ffaa, 0.025);
        for (let angle = 0; angle < Math.PI; angle += Math.PI / 4) {
          const dx = Math.cos(angle) * 340;
          const dy = Math.sin(angle) * 340;
          this.radarSweepGraphics.lineBetween(cx - dx, cy - dy, cx + dx, cy + dy);
        }

        // Rotating radar sweep line
        const sweepAngle = (time / 1400.0) % (Math.PI * 2);
        this.radarSweepGraphics.lineStyle(1.8, 0x00ffaa, 0.075);
        this.radarSweepGraphics.lineBetween(
          cx, 
          cy, 
          cx + Math.cos(sweepAngle) * 340, 
          cy + Math.sin(sweepAngle) * 340
        );

        // Faint sweep dot ticks around outer ring
        const dotCount = 24;
        this.radarSweepGraphics.fillStyle(0x00ffaa, 0.06);
        for (let i = 0; i < dotCount; i++) {
          const theta = (i / dotCount) * Math.PI * 2;
          this.radarSweepGraphics.fillCircle(cx + Math.cos(theta) * 320, cy + Math.sin(theta) * 320, 2);
        }
      }
    }

    // Always update Jammer Presence vector drawing (even in menus/overlays)
    let dialPosForEye = 50.0;
    if (this.gameState === STATES.PLAYING || this.gameState === STATES.ANALYSIS) {
      dialPosForEye = this.dialController.value;
    }
    this.jammerPresence.update(
      delta, 
      dialPosForEye, 
      this.jammer.phase, 
      this.gameState === STATES.ANALYSIS,
      this.isBossGravityActive
    );

    // Update real-time overlays for AI threat maps and grid fuses
    if (this.gameState === STATES.PLAYING || this.gameState === STATES.ANALYSIS) {
      this.drawRadarChart();
      this.drawFuseGauge();
      if (this.endlessBadgeText) {
        const showEndless = this.isEndlessMode;
        this.endlessBadgeText.setVisible(showEndless);
        if (showEndless) {
          this.endlessBadgeText.setAlpha(0.5 + 0.5 * Math.sin(time / 200.0));
        }
      }
    } else {
      if (this.radarGraphics) this.radarGraphics.clear();
      if (this.gaugeGraphics) this.gaugeGraphics.clear();
      if (this.scanGraphics) this.scanGraphics.clear();
      if (this.endlessBadgeText) this.endlessBadgeText.setVisible(false);
    }

    if (this.gameState === STATES.PLAYING) {
      this.roundTimeElapsed += dt;

      // CLI overclock timer updates
      if (this.isOverclockActive) {
        this.overclockTimer -= dt;
        if (this.overclockTimer <= 0) {
          this.isOverclockActive = false;
          // Restore base speeds based on upgrades status
          this.dialController.speed = this.dialController.friction === 0.05 ? 52.0 : 40.0;
          this.signalBand.speed = this.savedBandSpeed;
          this.logTerminal('[!] Overclock grid depleted. Needle friction restored.');
        }
      }

      // CLI emp timer updates
      if (this.isEMPActive) {
        this.empActiveTimer -= dt;
        if (this.empActiveTimer <= 0) {
          this.isEMPActive = false;
          this.signalBand.speed = this.savedBandSpeed;
          this.logTerminal('[!] EMP field discharged. Oscillations resume.');
        }
      }

      if (this.empCooldown > 0) {
        this.empCooldown = Math.max(0, this.empCooldown - dt);
      }

      // Track dial differences for speed metrics
      const currentDial = this.dialController.value;
      const dialDiff = Math.abs(currentDial - this.lastDialValue);
      this.totalDialMovement += dialDiff;

      // Track overshoots (crossing signal band center)
      if (
        (this.lastDialValue - this.signalBand.center) * 
        (currentDial - this.signalBand.center) < 0
      ) {
        this.overshootCount++;
      }
      this.lastDialValue = currentDial;

      this.roundDialValues.push(currentDial);
      this.roundBandCenters.push(this.signalBand.center);

      // Apply boss gravity drafts if active
      if (this.isBossGravityActive) {
        const gravityPull = Math.sin(time / 450.0) * 14.5;
        this.dialController.velocity += gravityPull * dt;
      }

      // Check if needle is exposed to active hazard zone segments
      const isNeedleInHazard = this.signalBand.isNeedleInHazard(currentDial);
      if (isNeedleInHazard) {
        // Drain clock twice as fast
        this.scoreTimer.timeLeft = Math.max(0, this.scoreTimer.timeLeft - dt * 1.0);
        this.scoreTimer.timerText.setColor('#ff3366'); // alert red
      } else {
        this.scoreTimer.timerText.setColor('#00f0ff'); // normal cyan
      }

      this.dialController.update(delta);
      this.signalBand.update(delta);
      this.scoreTimer.update(delta, () => this.handleTimeout());

      // Render scan sub-carrier node indicator pulse
      if (this.scanGraphics) {
        this.scanGraphics.clear();
        if (this.isScanActive && this.scannedTargetNode !== null) {
          const scanX = this.signalBand.trackStart + (this.scannedTargetNode / 100) * this.signalBand.trackWidth;
          const pulseAlpha = 0.4 + 0.35 * Math.sin(time / 100.0);
          this.scanGraphics.fillStyle(0x00f0ff, pulseAlpha);
          this.scanGraphics.fillCircle(scanX, this.signalBand.y, 8);
          this.scanGraphics.lineStyle(1.5, 0x00f0ff, 0.85);
          this.scanGraphics.strokeCircle(scanX, this.signalBand.y, 8);
        }
      }

      // Render needle particle trail effects
      if (this.sparkEmitter) {
        const needleX = this.dialController.trackStart + (currentDial / 100) * this.dialController.width;
        const needleY = this.dialController.y;
        this.sparkEmitter.setPosition(needleX, needleY);

        const dist = Math.abs(currentDial - this.signalBand.center);
        if (dist < 15.0) {
          this.sparkEmitter.setParticleTint(0x39ff14); // neon green sparks
          this.sparkEmitter.emitParticle(1);
        } else if (dist < 28.0) {
          this.sparkEmitter.setParticleTint(0x00f0ff); // neon cyan sparks
          this.sparkEmitter.emitParticle(1);
        }
      }

      // Update real-time detuning audio mix
      if (this.audioManager) {
        this.audioManager.updateTuning(
          currentDial, 
          this.signalBand.center, 
          this.signalBand.contains(currentDial)
        );
      }

      // Draw dynamic EQ equalizer columns
      if (this.audioManager && this.eqGraphics) {
        this.eqGraphics.clear();
        
        let eqColor = 0x00f0ff; // Phase 1 Teal
        if (this.jammer && this.jammer.phase === 2) {
          eqColor = 0xffaa00; // Phase 2 Orange
        } else if (this.jammer && this.jammer.phase >= 3) {
          eqColor = 0xff0055; // Phase 3 Red-Magenta
        }
        this.eqGraphics.fillStyle(eqColor, 0.45);
        const eqX = 530;
        const eqY = 510;
        const barWidth = 10;
        const gap = 5;
        const eqData = this.audioManager.getSpectrumData();

        for (let i = 0; i < 16; i++) {
          const barHeight = Math.max(2, eqData[i] * 125); // cap vertical pixels
          this.eqGraphics.fillRect(eqX + i * (barWidth + gap), eqY - barHeight, barWidth, barHeight);
        }
      }
    } 
    else if (this.gameState === STATES.ANALYSIS) {
      this.jammer.update(delta);
    }
    else if (this.gameState === STATES.UPGRADE) {
      this.upgradeSystem.update(delta);
    }
  }

  drawRadarChart() {
    if (!this.radarGraphics) return;
    this.radarGraphics.clear();

    const cx = 150;
    const cy = 95;
    const radius = 32;

    // Draw baseline grids
    this.radarGraphics.lineStyle(1, 0x536271, 0.4);
    
    // Draw 3 axes lines
    const angles = [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6];
    angles.forEach(a => {
      this.radarGraphics.lineBetween(cx, cy, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    });

    // Draw outer triangle grid
    this.radarGraphics.strokePoints([
      { x: cx + Math.cos(angles[0]) * radius, y: cy + Math.sin(angles[0]) * radius },
      { x: cx + Math.cos(angles[1]) * radius, y: cy + Math.sin(angles[1]) * radius },
      { x: cx + Math.cos(angles[2]) * radius, y: cy + Math.sin(angles[2]) * radius }
    ], true);

    // Draw standard reference envelope (50% value)
    this.radarGraphics.lineStyle(1, 0x00f0ff, 0.35);
    const standardRadius = radius * 0.45;
    this.radarGraphics.strokePoints([
      { x: cx + Math.cos(angles[0]) * standardRadius, y: cy + Math.sin(angles[0]) * standardRadius },
      { x: cx + Math.cos(angles[1]) * standardRadius, y: cy + Math.sin(angles[1]) * standardRadius },
      { x: cx + Math.cos(angles[2]) * standardRadius, y: cy + Math.sin(angles[2]) * standardRadius }
    ], true);

    // Get telemetry metrics averages
    const averages = this.jammer.getTelemetryAverages();
    
    // Normalize metrics
    const speedScale = Math.min(1.0, averages.speed / 30.0);
    const overshootScale = Math.min(1.0, averages.overshoots / 2.5);
    const delayScale = Math.min(1.0, averages.delay / 4.0);

    const r1 = radius * Math.max(0.15, speedScale);
    const r2 = radius * Math.max(0.15, overshootScale);
    const r3 = radius * Math.max(0.15, delayScale);

    const p1 = { x: cx + Math.cos(angles[0]) * r1, y: cy + Math.sin(angles[0]) * r1 };
    const p2 = { x: cx + Math.cos(angles[1]) * r2, y: cy + Math.sin(angles[1]) * r2 };
    const p3 = { x: cx + Math.cos(angles[2]) * r3, y: cy + Math.sin(angles[2]) * r3 };

    // Fill active threat web area
    this.radarGraphics.fillStyle(0xff3366, 0.25);
    this.radarGraphics.fillPoints([p1, p2, p3]);

    // Stroke active threat web border
    this.radarGraphics.lineStyle(2, 0xff3366, 0.85);
    this.radarGraphics.strokePoints([p1, p2, p3], true);

    // Plot vertex point dots
    this.radarGraphics.fillStyle(0xff3366, 1.0);
    this.radarGraphics.fillCircle(p1.x, p1.y, 3);
    this.radarGraphics.fillCircle(p2.x, p2.y, 3);
    this.radarGraphics.fillCircle(p3.x, p3.y, 3);
  }

  drawFuseGauge() {
    if (!this.gaugeGraphics) return;
    this.gaugeGraphics.clear();

    const cx = 650;
    const cy = 95;
    const radius = 28;

    // Draw circular ring track
    this.gaugeGraphics.lineStyle(2, 0x536271, 0.4);
    this.gaugeGraphics.strokeCircle(cx, cy, radius);

    // Draw active shields as arcs
    this.gaugeGraphics.lineStyle(4, 0x39ff14, 0.85);
    if (this.shields >= 1) {
      this.gaugeGraphics.beginPath();
      this.gaugeGraphics.arc(cx, cy, radius, -Math.PI + 0.1, -0.1, false);
      this.gaugeGraphics.strokePath();
    }
    if (this.shields >= 2) {
      this.gaugeGraphics.beginPath();
      this.gaugeGraphics.arc(cx, cy, radius, 0.1, Math.PI - 0.1, false);
      this.gaugeGraphics.strokePath();
    }

    if (this.shields === 0) {
      // Draw offline cross indicator
      this.gaugeGraphics.lineStyle(2, 0xff3366, 0.6);
      this.gaugeGraphics.lineBetween(cx - 10, cy - 10, cx + 10, cy + 10);
      this.gaugeGraphics.lineBetween(cx - 10, cy + 10, cx + 10, cy - 10);
    }

    // Draw EMP cooldown inside ring as an expanding circle
    if (this.empCooldown > 0) {
      const cooldownPercent = this.empCooldown / 15.0;
      this.gaugeGraphics.fillStyle(0xffaa00, 0.4);
      this.gaugeGraphics.fillCircle(cx, cy, radius * cooldownPercent);
      
      this.gaugeGraphics.lineStyle(1.5, 0xffaa00, 0.8);
      this.gaugeGraphics.strokeCircle(cx, cy, radius * cooldownPercent);
    } else if (this.isEMPActive) {
      this.gaugeGraphics.fillStyle(0x00f0ff, 0.6);
      this.gaugeGraphics.fillCircle(cx, cy, radius * 0.8);
    }
  }

  initiateDecryption() {
    if (this.isDecryptionActive) {
      this.logTerminal('[!] BYPASS LOCK RUNNING. Submit guess key with /submit.');
      return;
    }

    const wordBank = ['CYBER', 'CODES', 'CORES', 'CHIPS', 'CRYPT', 'SPEED', 'WAVES', 'SHIEL', 'JITTR', 'CLOCK'];
    
    // Select 4 random keys
    const shuffled = [...wordBank].sort(() => 0.5 - Math.random());
    this.decryptionKeys = shuffled.slice(0, 4);

    // Pick one correct key
    this.decryptionCorrectKey = this.decryptionKeys[Math.floor(Math.random() * this.decryptionKeys.length)];
    this.decryptionAttempts = 3;
    this.isDecryptionActive = true;

    this.logTerminal('--- DECRYPTION GRID LOCK DETECTED ---');
    this.logTerminal('KEYS: ' + this.decryptionKeys.join(' | '));
    this.logTerminal(`ATTEMPTS: ${this.decryptionAttempts} | TYPE /submit <key> TO LOCK.`);
  }

  submitDecryption(arg) {
    if (!this.isDecryptionActive) {
      this.logTerminal('[!] No active decryption bypass grid running. Type /decrypt.');
      return;
    }

    const inputKey = arg.trim().toUpperCase();
    if (!this.decryptionKeys.includes(inputKey)) {
      this.logTerminal(`[!] KEY OVERRIDE FAILS. Use keys: ${this.decryptionKeys.join(' | ')}`);
      return;
    }

    if (inputKey === this.decryptionCorrectKey) {
      this.isDecryptionActive = false;
      
      // Reward: Install 1 shield cap 2
      this.shields = Math.min(2, this.shields + 1);
      this.cameras.main.flash(200, 0, 255, 120);
      this.audioManager.playCleanLock();

      this.logTerminal('[+] LOCK BYPASS VERIFIED. Grid nodes aligned.');
      this.logTerminal('[+] SHIELD SYSTEM RESTORED (+1 Shield Core fuses).');
    } else {
      this.decryptionAttempts--;
      
      if (this.decryptionAttempts <= 0) {
        this.isDecryptionActive = false;
        
        // Penalty: deduct 1.5s round time
        this.scoreTimer.timeLeft = Math.max(0, this.scoreTimer.timeLeft - 1.5);
        this.cameras.main.flash(200, 255, 51, 102);
        this.cameras.main.shake(150, 0.01);
        this.audioManager.playMiss();
        this.triggerGlitchSweep();

        this.logTerminal('[-] ACCESS FORCED SHUTDOWN. Memory leak detected.');
        this.logTerminal('[-] CRITICAL FAILURE: -1.5s clock penalty applied.');
      } else {
        // Count matched characters in position
        let matches = 0;
        const target = this.decryptionCorrectKey;
        for (let i = 0; i < Math.min(inputKey.length, target.length); i++) {
          if (inputKey[i] === target[i]) {
            matches++;
          }
        }
        this.audioManager.playNearMiss();
        this.logTerminal(`[-] MATCH DENIED: alignment (${matches}/5).`);
        this.logTerminal(`[-] ATTEMPTS REMAINING: ${this.decryptionAttempts}`);
      }
    }
  }

  initiateScan() {
    if (this.isScanActive) {
      this.logTerminal(`[!] SCAN ACTIVE: Sub-carrier beacon coordinates: ${this.scannedTargetNode.toFixed(1)}`);
      return;
    }

    // Generate random scan coordinate target
    this.scannedTargetNode = Math.random() * 70 + 15; // 15 to 85 range
    this.isScanActive = true;

    this.logTerminal('--- FREQUENCY SPECTRUM SCANNING ---');
    this.logTerminal(`[+] SUB-CARRIER BEACON DETECTED AT: ${this.scannedTargetNode.toFixed(1)}`);
    this.logTerminal('[+] STEER DIAL NEEDLE TO BEACON AND PRESS SPACE.');
  }

  handleScanLockSuccess() {
    this.isScanActive = false;
    this.scannedTargetNode = null;

    if (this.scanGraphics) {
      this.scanGraphics.clear();
    }

    // Reward: Install 1 shield cap 2
    this.shields = Math.min(2, this.shields + 1);
    this.cameras.main.flash(200, 0, 240, 255); // Cyan lock flash
    this.audioManager.playCleanLock();

    this.logTerminal('[+] BEACON DATA INGESTION COMPLETE.');
    this.logTerminal('[+] SHIELD SYSTEM INTEGRATION RESTORED (+1 Shield Core).');
  }

  getRandomHexValue() {
    const list = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    const c1 = list[Math.floor(Math.random() * list.length)];
    const c2 = list[Math.floor(Math.random() * list.length)];
    return '0x' + c1 + c2;
  }

  /**
   * Cleanup method to prevent memory leaks on scene restart
   */
  destroy() {
    // Clean up AudioManager
    if (this.audioManager && this.audioManager.destroy) {
      this.audioManager.destroy();
    }

    // Clean up DialController
    if (this.dialController && this.dialController.destroy) {
      this.dialController.destroy();
    }

    // Clean up TerminalCLI
    if (this.terminalCLI && this.terminalCLI.destroy) {
      this.terminalCLI.destroy();
    }

    // Clean up Jammer
    if (this.jammer && this.jammer.destroy) {
      this.jammer.destroy();
    }

    // Clean up JammerPresence
    if (this.jammerPresence && this.jammerPresence.destroy) {
      this.jammerPresence.destroy();
    }

    // Clean up SignalBand
    if (this.signalBand && this.signalBand.destroy) {
      this.signalBand.destroy();
    }

    // Clean up ScoreTimer
    if (this.scoreTimer && this.scoreTimer.destroy) {
      this.scoreTimer.destroy();
    }

    // Clean up UpgradeSystem
    if (this.upgradeSystem && this.upgradeSystem.destroy) {
      this.upgradeSystem.destroy();
    }
  }
}





