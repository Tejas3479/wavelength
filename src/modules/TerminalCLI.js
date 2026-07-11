/**
 * TerminalCLI
 * 
 * Manages the HTML input command-line interface.
 * Handles key captures, toggles focus, triggers tactile typewriter clicks,
 * parses terminal inputs, and coordinates commands with the active Phaser scene.
 */
export class TerminalCLI {
  constructor(scene) {
    this.scene = scene;
    
    this.inputElement = document.getElementById('cli-input');
    this.containerElement = document.getElementById('cli-container');
    
    this.history = [];
    this.historyIndex = -1;
    
    this.setupListeners();
  }
  
  setupListeners() {
    if (!this.inputElement) return;

    // Focus styling & disable dial controls
    this._focusHandler = () => {
      this.containerElement.classList.add('cli-focused');
      this.containerElement.classList.remove('cli-hidden');
      if (this.scene.dialController) {
        this.scene.dialController.enabled = false;
        // Suspend keyboard listening inside Phaser
        this.scene.input.keyboard.enabled = false;
      }
    };
    this.inputElement.addEventListener('focus', this._focusHandler);

    // Blur styling & restore dial controls
    this._blurHandler = () => {
      this.containerElement.classList.remove('cli-focused');
      this.containerElement.classList.add('cli-hidden');
      // Restore keyboard listening inside Phaser
      this.scene.input.keyboard.enabled = true;
      if (this.scene.dialController) {
        this.scene.dialController.enabled = true;
      }
    };
    this.inputElement.addEventListener('blur', this._blurHandler);

    // Capture typed text
    this._keydownHandler = (e) => {
      // Play typewriter audio tick on character strokes
      if (
        e.key !== 'Enter' &&
        e.key !== 'Escape' &&
        e.key !== 'ArrowUp' &&
        e.key !== 'ArrowDown' &&
        e.key !== 'Shift' &&
        e.key !== 'Control' &&
        e.key !== 'Alt'
      ) {
        if (this.scene.audioManager && this.scene.audioManager.playKeyClick) {
          this.scene.audioManager.playKeyClick();
        }
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        this.autocompleteCommand();
      } else if (e.key === 'Enter') {
        const cmd = this.inputElement.value.trim();
        if (cmd) {
          this.executeCommand(cmd);
          this.history.push(cmd);
          this.historyIndex = this.history.length;
          this.inputElement.value = '';
        }
      } else if (e.key === 'Escape') {
        this.inputElement.blur();
      } else if (e.key === 'ArrowUp') {
        // Scroll back in command history
        if (this.history.length > 0 && this.historyIndex > 0) {
          this.historyIndex--;
          this.inputElement.value = this.history[this.historyIndex];
        }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        // Scroll forward in command history
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.inputElement.value = this.history[this.historyIndex];
        } else {
          this.historyIndex = this.history.length;
          this.inputElement.value = '';
        }
        e.preventDefault();
      }
    };
    this.inputElement.addEventListener('keydown', this._keydownHandler);
    
    // Hook up key listeners inside Phaser to focus input field on `~` or `/`
    this.scene.input.keyboard.on('keydown-BACKTICK', (event) => {
      if (this.scene.gameState === 'PLAYING') {
        event.preventDefault();
        this.focus();
      }
    });
    this.scene.input.keyboard.on('keydown-SLASH', (event) => {
      if (this.scene.gameState === 'PLAYING') {
        event.preventDefault();
        this.focus();
      }
    });
  }
  
  focus() {
    if (this.inputElement && document.activeElement !== this.inputElement) {
      this.inputElement.disabled = false;
      this.inputElement.placeholder = "Enter terminal command...";
      this.inputElement.focus();
      this.inputElement.value = '';
    }
  }
  
  blur() {
    if (this.inputElement) {
      this.inputElement.blur();
    }
  }
  
  enable() {
    if (this.inputElement) {
      this.inputElement.disabled = false;
      this.inputElement.placeholder = "Press ~ or / to type commands...";
      this.containerElement.classList.remove('cli-hidden');
    }
  }
  
  disable() {
    if (this.inputElement) {
      this.inputElement.value = '';
      this.inputElement.placeholder = "Terminal CLI disabled in menus...";
      this.inputElement.disabled = true;
      this.inputElement.blur();
      this.containerElement.classList.add('cli-hidden');
    }
  }

  destroy() {
    // Clean up DOM event listeners
    if (this.inputElement) {
      this.inputElement.removeEventListener('focus', this._focusHandler);
      this.inputElement.removeEventListener('blur', this._blurHandler);
      this.inputElement.removeEventListener('keydown', this._keydownHandler);
    }
  }
  
  executeCommand(commandString) {
    // Print the typed command to the scene log
    this.scene.logTerminal(`> ${commandString}`);
    
    const parts = commandString.split(' ');
    const command = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');
    
    switch (command) {
      case '/help':
        this.scene.logTerminal('--- SYSTEM OPERATOR COMMANDS ---');
        this.scene.logTerminal('  /diagnose     - query AI Jammer parameters');
        this.scene.logTerminal('  /spoof [0-100]- spoof telemetry drift bias');
        this.scene.logTerminal('  /overclock    - trigger temporary +50% needle speed');
        this.scene.logTerminal('  /shield       - check shield modules capacity');
        this.scene.logTerminal('  /emp          - pause wave oscillation for 2s');
        this.scene.logTerminal('  /scan         - scan coordinates for sub-carrier node');
        this.scene.logTerminal('  /decrypt      - start memory bypass crack minigame');
        this.scene.logTerminal('  /submit [key] - submit passcode vector match');
        this.scene.logTerminal('  /endless      - toggle post-game endless loop');
        this.scene.logTerminal('  /agent        - toggle autonomous AI tuning agent');
        break;
        
      case '/diagnose':
        if (this.scene.gameState === 'PLAYING') {
          const profile = this.scene.jammer.getProfileName ? this.scene.jammer.getProfileName() : 'OBSERVER';
          const p = this.scene.jammer.currentParams;
          this.scene.logTerminal('--- JAMMER TARGET DIAGNOSTICS ---');
          this.scene.logTerminal(`ACTIVE PHASE: ${this.scene.jammer.phase} | CONFIDENCE: ${this.scene.jammer.confidence}%`);
          this.scene.logTerminal(`BEHAVIORAL SIGNATURE: ${profile}`);
          this.scene.logTerminal(`BASELINE WAVE: center=${(100 - p.baselineCenter).toFixed(0)}% speed=${p.speed.toFixed(1)}Hz`);
          this.scene.logTerminal(`SWING RANGE: ${p.amplitude.toFixed(1)} units`);
        } else {
          this.scene.logTerminal('ERROR: diagnostics only available in PLAYING mode.');
        }
        break;
        
      case '/spoof':
        if (this.scene.gameState === 'PLAYING') {
          const val = parseFloat(arg);
          if (!isNaN(val) && val >= 0 && val <= 100) {
            // Calculate a fake drift coordinate bias relative to the center and insert
            const fakeBias = val - this.scene.signalBand.center;
            this.scene.jammer.recordAttempt(fakeBias, 5); // slow speed simulation
            this.scene.logTerminal(`SPOOF SUCCESS: injected drift offset = ${fakeBias.toFixed(1)}`);
          } else {
            this.scene.logTerminal('ERROR: usage: /spoof [target_value 0-100]');
          }
        } else {
          this.scene.logTerminal('ERROR: spoof scripts only active in PLAYING mode.');
        }
        break;
        
      case '/overclock':
        if (this.scene.gameState === 'PLAYING') {
          if (this.scene.hasOverclock) {
            this.scene.triggerOverclock();
          } else {
            this.scene.logTerminal('ERROR: Overclock Grid not installed. Buy at Upgrade Shop.');
          }
        } else {
          this.scene.logTerminal('ERROR: overclock commands only active in PLAYING mode.');
        }
        break;
        
      case '/shield':
        const shieldsCount = this.scene.shields || 0;
        this.scene.logTerminal(`SHIELD CORES: ${shieldsCount} / 2 [absorbs miss strikes]`);
        break;
        
      case '/emp':
        if (this.scene.gameState === 'PLAYING') {
          if (this.scene.empCooldown && this.scene.empCooldown > 0) {
            this.scene.logTerminal(`ERROR: EMP charging. Cooldown: ${this.scene.empCooldown.toFixed(1)}s`);
          } else if (this.scene.hasEMP) {
            this.scene.triggerEMP();
          } else {
            this.scene.logTerminal('ERROR: EMP capacitor not installed. Buy at Upgrade Shop.');
          }
        } else {
          this.scene.logTerminal('ERROR: EMP only firing in PLAYING mode.');
        }
        break;
        
      case '/endless':
        this.scene.toggleEndlessMode();
        break;

      case '/agent':
        this.scene.toggleAgentAutopilot();
        break;

      case '/scan':
        if (this.scene.gameState === 'PLAYING') {
          this.scene.initiateScan();
        } else {
          this.scene.logTerminal('ERROR: Frequency scanner offline outside active run.');
        }
        break;

      case '/decrypt':
        if (this.scene.gameState === 'PLAYING') {
          this.scene.initiateDecryption();
        } else {
          this.scene.logTerminal('ERROR: Decryption sequence offline outside active run.');
        }
        break;

      case '/submit':
        if (this.scene.gameState === 'PLAYING') {
          if (!arg) {
            this.scene.logTerminal('ERROR: Usage is /submit <key>');
          } else {
            this.scene.submitDecryption(arg);
          }
        } else {
          this.scene.logTerminal('ERROR: Cryptographic grids offline outside active run.');
        }
        break;
        
      default:
        this.scene.logTerminal(`ERROR: command "${command}" not recognized. Type /help`);
    }
  }

  /**
   * Autocompletes command prefix in focus terminal CLI bar
   */
  autocompleteCommand() {
    const val = this.inputElement.value.trim().toLowerCase();
    if (!val.startsWith('/')) {
      this.inputElement.value = '/';
      return;
    }

    const commandsList = [
      '/help',
      '/diagnose',
      '/spoof',
      '/overclock',
      '/shield',
      '/emp',
      '/scan',
      '/decrypt',
      '/submit',
      '/endless',
      '/agent'
    ];

    const matches = commandsList.filter(c => c.startsWith(val));
    if (matches.length === 1) {
      this.inputElement.value = matches[0] + ' ';
    } else if (matches.length > 1) {
      this.scene.logTerminal('Completions: ' + matches.join(', '));
    }
  }
}
