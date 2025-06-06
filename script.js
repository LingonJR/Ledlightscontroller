// LED Strip Controller JavaScript
class LEDController {
    constructor() {
        this.device = null;
        this.server = null;
        this.commandCharacteristic = null;
        this.isConnected = false;
        this.isMicEnabled = false;
        this.fadeInterval = null;
        this.activePattern = null;
        this.isMusicMode = false;
        this.musicContext = null;
        this.musicAnalyser = null;
        this.musicSource = null;
        this.musicStream = null;
        this.visualizerAnimationId = null;
        this.timer = null;
        this.timerEndTime = null;
        this.strobeInterval = null;
        this.randomModeInterval = null;
        this.connectionStartTime = null;
        this.uptimeInterval = null;
        this.commandCount = 0;
        this.weatherEnabled = false;
        this.gestureEnabled = false;
        this.pomodoroTimer = null;
        this.pomodoroTime = 25 * 60; // 25 minutes in seconds
        this.pomodoroState = 'ready'; // ready, focus, break
        this.eyeCareInterval = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.audioReactiveMode = 'bass';
        this.audioContext2 = null;
        this.audioAnalyser2 = null;
        this.frequencyAnimationId = null;
        this.currentGameMode = null;
        this.currentScene = null;
        this.schedules = [];
        this.sunriseEnabled = false;

        // Bluetooth service and characteristic UUIDs
        this.SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
        this.CHARACTERISTIC_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';

        // Pattern data
        this.patterns = [
            'Static Red',
            'Static Blue',
            'Static Green',
            'Static Cyan',
            'Static Yellow',
            'Static Purple',
            'Static White',
            'Three Color Jumping Change',
            'Seven Color Jumping Change',
            'Three Color Cross Fade',
            'Seven Color Cross Fade',
            'Red Gradual Change',
            'Green Gradual Change',
            'Blue Gradual Change',
            'Yellow Gradual Change',
            'Cyan Gradual Change',
            'Purple Gradual Change',
            'White Gradual Change',
            'Red Green Cross Fade',
            'Red Blue Cross Fade',
            'Green Blue Cross Fade',
            'Seven color Strobe Flash',
            'Red Strobe Flash',
            'Green Strobe Flash',
            'Blue Strobe Flash',
            'Yellow Strobe Flash',
            'Cyan Strobe Flash',
            'Purple Strobe Flash',
            'White Strobe Flash'
        ];

        this.init();
    }

    init() {
        this.bindEvents();
        this.populatePatterns();
        this.loadSettings();
        this.updateUI();
        this.loadPresets();
        this.initUptime();
    }

    bindEvents() {
        // Connection events
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());

        // Power controls
        document.getElementById('powerOnBtn').addEventListener('click', () => this.setPower(true));
        document.getElementById('powerOffBtn').addEventListener('click', () => this.setPower(false));

        // Quick color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const [r, g, b] = btn.dataset.color.split(',').map(Number);
                this.setColor(r, g, b);
            });
        });

        // Custom color picker
        document.getElementById('customColorPicker').addEventListener('input', (e) => {
            this.updateColorPreview(e.target.value);
        });
        document.getElementById('setCustomColorBtn').addEventListener('click', () => this.setCustomColor());

        // Sliders
        document.getElementById('brightnessSlider').addEventListener('input', (e) => {
            this.updateSliderValue('brightness', e.target.value);
            this.setBrightness(parseInt(e.target.value));
        });
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.updateSliderValue('speed', e.target.value);
            this.setSpeed(parseInt(e.target.value));
        });
        document.getElementById('micSensitivitySlider').addEventListener('input', (e) => {
            this.updateSliderValue('micSensitivity', e.target.value);
            this.setMicSensitivity(parseInt(e.target.value));
        });

        // Microphone controls
        document.getElementById('micToggleBtn').addEventListener('click', () => this.toggleMicrophone());
        document.getElementById('eqModeSelect').addEventListener('change', (e) => {
            this.setEqMode(parseInt(e.target.value));
        });

        // Advanced features
        document.getElementById('syncTimeBtn').addEventListener('click', () => this.syncTime());
        document.getElementById('fadeEffectBtn').addEventListener('click', () => this.toggleFadeEffect());
        document.getElementById('strobeBtn').addEventListener('click', () => this.toggleStrobe());
        document.getElementById('randomModeBtn').addEventListener('click', () => this.toggleRandomMode());

        // Music visualizer
        document.getElementById('enableMusicBtn').addEventListener('click', () => this.toggleMusicMode());
        document.getElementById('musicSensitivitySlider').addEventListener('input', (e) => {
            this.updateSliderValue('musicSensitivity', e.target.value);
        });

        // Color schemes
        document.querySelectorAll('.scheme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activateColorScheme(btn.dataset.scheme);
            });
        });

        // Timer controls
        document.getElementById('startTimerBtn').addEventListener('click', () => this.startTimer());
        document.getElementById('stopTimerBtn').addEventListener('click', () => this.stopTimer());

        // Presets
        document.getElementById('savePresetBtn').addEventListener('click', () => this.savePreset());

        // Status message close
        document.querySelector('.close-btn').addEventListener('click', () => this.hideStatusMessage());

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Remote control buttons
        document.querySelectorAll('.remote-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleRemoteAction(btn));
        });

        // Scene buttons
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.addEventListener('click', () => this.activateScene(btn.dataset.scene));
        });

        // Weather sync
        document.getElementById('enableWeatherBtn').addEventListener('click', () => this.toggleWeatherSync());

        // Audio reactive
        document.getElementById('audioModeSelect').addEventListener('change', (e) => {
            this.audioReactiveMode = e.target.value;
        });
        document.getElementById('audioThresholdSlider').addEventListener('input', (e) => {
            this.updateSliderValue('audioThreshold', e.target.value);
        });

        // Gesture control
        document.getElementById('enableGestureBtn').addEventListener('click', () => this.toggleGestureControl());

        // Scheduling
        document.getElementById('enableSunriseBtn').addEventListener('click', () => this.toggleSunriseSync());
        document.getElementById('addSchedule1').addEventListener('click', () => this.addCustomSchedule());

        // Gaming
        document.querySelectorAll('.game-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.activateGameMode(btn.dataset.game));
        });
        document.getElementById('healthSlider').addEventListener('input', (e) => {
            this.updateHealthIndicator(e.target.value);
        });

        // Productivity
        document.getElementById('startPomodoroBtn').addEventListener('click', () => this.startPomodoro());
        document.getElementById('pausePomodoroBtn').addEventListener('click', () => this.pausePomodoro());
        document.getElementById('resetPomodoroBtn').addEventListener('click', () => this.resetPomodoro());
        document.getElementById('enableEyeCareBtn').addEventListener('click', () => this.toggleEyeCare());
    }

    populatePatterns() {
        const patternGrid = document.getElementById('patternGrid');
        patternGrid.innerHTML = '';

        this.patterns.forEach((pattern, index) => {
            const button = document.createElement('button');
            button.className = 'pattern-btn';
            button.textContent = pattern;
            button.disabled = true;
            button.dataset.patternIndex = index;
            button.addEventListener('click', () => this.setPattern(index));
            patternGrid.appendChild(button);
        });
    }

    loadSettings() {
        // Load saved settings from localStorage
        const settings = JSON.parse(localStorage.getItem('ledControllerSettings') || '{}');
        
        if (settings.brightness) {
            document.getElementById('brightnessSlider').value = settings.brightness;
            this.updateSliderValue('brightness', settings.brightness);
        }
        if (settings.speed) {
            document.getElementById('speedSlider').value = settings.speed;
            this.updateSliderValue('speed', settings.speed);
        }
        if (settings.micSensitivity) {
            document.getElementById('micSensitivitySlider').value = settings.micSensitivity;
            this.updateSliderValue('micSensitivity', settings.micSensitivity);
        }
        if (settings.customColor) {
            document.getElementById('customColorPicker').value = settings.customColor;
            this.updateColorPreview(settings.customColor);
        }
    }

    saveSettings() {
        const settings = {
            brightness: document.getElementById('brightnessSlider').value,
            speed: document.getElementById('speedSlider').value,
            micSensitivity: document.getElementById('micSensitivitySlider').value,
            customColor: document.getElementById('customColorPicker').value
        };
        localStorage.setItem('ledControllerSettings', JSON.stringify(settings));
    }

    updateSliderValue(type, value) {
        const valueElement = document.getElementById(`${type}Value`);
        if (valueElement) {
            valueElement.textContent = `${value}%`;
        }
    }

    updateColorPreview(color) {
        const preview = document.getElementById('colorPreview');
        preview.style.background = color;
    }

    async connect() {
        try {
            if (!navigator.bluetooth) {
                throw new Error('Web Bluetooth API is not supported in this browser');
            }

            this.showStatusMessage('Connecting to device...', 'info');

            this.device = await navigator.bluetooth.requestDevice({
                optionalServices: [this.SERVICE_UUID],
                acceptAllDevices: true
            });

            this.device.addEventListener('gattserverdisconnected', () => {
                this.handleDisconnection();
            });

            this.server = await this.device.gatt.connect();
            const service = await this.server.getPrimaryService(this.SERVICE_UUID);
            this.commandCharacteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);

            this.isConnected = true;
            this.connectionStartTime = new Date();
            this.startUptimeCounter();
            this.updateUI();
            this.updateDeviceInfo();
            this.showStatusMessage('Connected successfully!', 'success');
            
            // Sync time on connection
            setTimeout(() => this.syncTime(), 1000);

        } catch (error) {
            console.error('Connection failed:', error);
            this.showStatusMessage(`Connection failed: ${error.message}`, 'error');
        }
    }

    async disconnect() {
        try {
            if (this.device && this.device.gatt.connected) {
                await this.device.gatt.disconnect();
            }
            this.handleDisconnection();
            this.showStatusMessage('Disconnected successfully', 'info');
        } catch (error) {
            console.error('Disconnection failed:', error);
            this.showStatusMessage(`Disconnection failed: ${error.message}`, 'error');
        }
    }

    handleDisconnection() {
        this.isConnected = false;
        this.device = null;
        this.server = null;
        this.commandCharacteristic = null;
        this.connectionStartTime = null;
        this.clearFadeEffect();
        this.stopUptime();
        this.stopMusicMode();
        this.stopTimer();
        this.stopStrobe();
        this.stopRandomMode();
        this.updateUI();
        this.updateDeviceInfo();
    }

    updateUI() {
        const controls = [
            'powerOnBtn', 'powerOffBtn', 'setCustomColorBtn', 'brightnessSlider',
            'speedSlider', 'micToggleBtn', 'eqModeSelect', 'micSensitivitySlider',
            'syncTimeBtn', 'fadeEffectBtn', 'customColorPicker', 'enableMusicBtn',
            'musicSensitivitySlider', 'startTimerBtn', 'stopTimerBtn', 'timerHours',
            'timerMinutes', 'savePresetBtn', 'presetNameInput', 'strobeBtn', 'randomModeBtn',
            'enableWeatherBtn', 'audioModeSelect', 'audioThresholdSlider', 'enableGestureBtn',
            'enableSunriseBtn', 'addSchedule1', 'scheduleTime1', 'scheduleAction1',
            'healthSlider', 'startPomodoroBtn', 'pausePomodoroBtn', 'resetPomodoroBtn',
            'enableEyeCareBtn'
        ];

        controls.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.disabled = !this.isConnected;
            }
        });

        // Update color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.disabled = !this.isConnected;
        });

        // Update pattern buttons
        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.disabled = !this.isConnected;
        });

        // Update color scheme buttons
        document.querySelectorAll('.scheme-btn').forEach(btn => {
            btn.disabled = !this.isConnected;
        });

        // Update scene buttons
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.disabled = !this.isConnected;
        });

        // Update game mode buttons
        document.querySelectorAll('.game-mode-btn').forEach(btn => {
            btn.disabled = !this.isConnected;
        });

        // Update disconnect button
        document.getElementById('disconnectBtn').disabled = !this.isConnected;

        // Update connection status
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (this.isConnected) {
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Disconnected';
        }
    }

    async sendCommand(bytes) {
        if (!this.commandCharacteristic) {
            this.showStatusMessage('Device not connected', 'error');
            return false;
        }

        try {
            await this.commandCharacteristic.writeValue(new Uint8Array(bytes));
            console.log('Command sent:', bytes.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
            this.commandCount++;
            this.updateCommandCount();
            return true;
        } catch (error) {
            console.error('Command failed:', error);
            this.showStatusMessage(`Command failed: ${error.message}`, 'error');
            return false;
        }
    }

    updateCommandCount() {
        document.getElementById('commandCount').textContent = this.commandCount;
        
        // Simulate power usage based on commands
        const powerUsage = Math.round((this.commandCount * 0.5 + Math.random() * 2) * 10) / 10;
        document.getElementById('powerUsage').textContent = `${powerUsage} W`;
    }

    // Command creation methods based on Kotlin CommandUtils
    createOnOffCommand(isOn) {
        return [
            0x7E,
            0x04,
            0x04,
            isOn ? 0x01 : 0x00,
            0x00,
            isOn ? 0x01 : 0x00,
            0xFF,
            0x00,
            0xEF
        ];
    }

    createColorCommand(red, green, blue) {
        const brightness = parseInt(document.getElementById('brightnessSlider').value);
        return [
            0x7E,
            0x07,
            0x05,
            0x03,
            Math.max(0, Math.min(255, red)),
            Math.max(0, Math.min(255, green)),
            Math.max(0, Math.min(255, blue)),
            Math.max(0, Math.min(255, Math.round(brightness * 2.55))),
            0xEF
        ];
    }

    createPatternCommand(pattern) {
        return [
            0x7E,
            0x05,
            0x03,
            Math.max(0, Math.min(28, pattern)) + 128,
            0x03,
            0xFF,
            0xFF,
            0x00,
            0xEF
        ];
    }

    createSpeedCommand(speed) {
        return [
            0x7E,
            0x04,
            0x02,
            Math.max(0, Math.min(100, speed)),
            0xFF,
            0xFF,
            0xFF,
            0x00,
            0xEF
        ];
    }

    createBrightnessCommand(brightness) {
        return [
            0x7E,
            0x04,
            0x01,
            Math.max(0, Math.min(100, brightness)),
            0xFF,
            0xFF,
            0xFF,
            0x00,
            0xEF
        ];
    }

    createMicOnOffCommand(isOn) {
        return [
            0x7E,
            0x04,
            0x07,
            isOn ? 0x01 : 0x00,
            0xFF,
            0xFF,
            0xFF,
            0x00,
            0xEF
        ];
    }

    createMicEqCommand(eqMode) {
        return [
            0x7E,
            0x05,
            0x03,
            Math.max(0, Math.min(3, eqMode)) + 128,
            0x04,
            0xFF,
            0xFF,
            0x00,
            0xEF
        ];
    }

    createMicSensitivityCommand(sensitivity) {
        return [
            0x7E,
            0x04,
            0x06,
            Math.max(0, Math.min(100, sensitivity)),
            0xFF,
            0xFF,
            0xFF,
            0x00,
            0xEF
        ];
    }

    createSyncTimeCommand() {
        const now = new Date();
        return [
            0x7E,
            0x07,
            0x83,
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getDay(),
            0xFF,
            0xEF
        ];
    }

    // Music Visualizer Methods
    async toggleMusicMode() {
        if (!this.isMusicMode) {
            try {
                this.musicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.musicContext = new (window.AudioContext || window.webkitAudioContext)();
                this.musicAnalyser = this.musicContext.createAnalyser();
                this.musicSource = this.musicContext.createMediaStreamSource(this.musicStream);
                
                this.musicAnalyser.fftSize = 256;
                this.musicSource.connect(this.musicAnalyser);
                
                this.isMusicMode = true;
                document.getElementById('musicToggleText').textContent = 'Disable Music Mode';
                document.getElementById('enableMusicBtn').classList.add('btn-success');
                document.getElementById('enableMusicBtn').classList.remove('btn-secondary');
                document.getElementById('visualizerContainer').classList.add('active');
                
                this.startVisualizer();
                this.showStatusMessage('Music mode enabled', 'success');
            } catch (error) {
                this.showStatusMessage('Microphone access denied', 'error');
            }
        } else {
            this.stopMusicMode();
        }
    }

    stopMusicMode() {
        if (this.musicStream) {
            this.musicStream.getTracks().forEach(track => track.stop());
        }
        if (this.musicContext) {
            this.musicContext.close();
        }
        if (this.visualizerAnimationId) {
            cancelAnimationFrame(this.visualizerAnimationId);
        }
        
        this.isMusicMode = false;
        this.musicStream = null;
        this.musicContext = null;
        this.musicAnalyser = null;
        this.musicSource = null;
        
        document.getElementById('musicToggleText').textContent = 'Enable Music Mode';
        document.getElementById('enableMusicBtn').classList.remove('btn-success');
        document.getElementById('enableMusicBtn').classList.add('btn-secondary');
        document.getElementById('visualizerContainer').classList.remove('active');
    }

    startVisualizer() {
        const canvas = document.getElementById('visualizerCanvas');
        const ctx = canvas.getContext('2d');
        const bufferLength = this.musicAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            this.visualizerAnimationId = requestAnimationFrame(draw);
            
            this.musicAnalyser.getByteFrequencyData(dataArray);
            
            ctx.fillStyle = 'rgb(10, 10, 15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height;
                
                const hue = (i / bufferLength) * 360;
                ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
                
                // Send music data to LED strip
                if (this.isConnected && i % 8 === 0) {
                    const intensity = Math.floor((dataArray[i] / 255) * 100);
                    const sensitivity = parseInt(document.getElementById('musicSensitivitySlider').value);
                    if (intensity > (100 - sensitivity * 10)) {
                        const r = Math.floor((dataArray[i] / 255) * 255);
                        const g = Math.floor((dataArray[i + 1] || 0) / 255 * 255);
                        const b = Math.floor((dataArray[i + 2] || 0) / 255 * 255);
                        this.setColor(r, g, b);
                    }
                }
            }
        };
        
        draw();
    }

    // Color Scheme Methods
    activateColorScheme(scheme) {
        const schemes = {
            rainbow: this.rainbowScheme.bind(this),
            sunset: () => this.gradientScheme([255, 107, 53], [255, 215, 0]),
            ocean: () => this.gradientScheme([0, 105, 148], [135, 206, 235]),
            forest: () => this.gradientScheme([11, 83, 69], [125, 206, 160]),
            fire: () => this.gradientScheme([139, 0, 0], [255, 99, 71]),
            ice: () => this.gradientScheme([135, 206, 235], [240, 248, 255])
        };

        if (schemes[scheme]) {
            schemes[scheme]();
            this.showStatusMessage(`${scheme.charAt(0).toUpperCase() + scheme.slice(1)} scheme activated`, 'success');
        }
    }

    rainbowScheme() {
        const colors = [
            [255, 0, 0], [255, 127, 0], [255, 255, 0], [0, 255, 0],
            [0, 0, 255], [75, 0, 130], [148, 0, 211]
        ];
        let colorIndex = 0;

        this.clearFadeEffect();
        this.fadeInterval = setInterval(() => {
            const [r, g, b] = colors[colorIndex];
            this.setColor(r, g, b);
            colorIndex = (colorIndex + 1) % colors.length;
        }, 1000);
    }

    gradientScheme(color1, color2) {
        let step = 0;
        let direction = 1;

        this.clearFadeEffect();
        this.fadeInterval = setInterval(() => {
            const progress = step / 100;
            const r = Math.round(color1[0] * (1 - progress) + color2[0] * progress);
            const g = Math.round(color1[1] * (1 - progress) + color2[1] * progress);
            const b = Math.round(color1[2] * (1 - progress) + color2[2] * progress);
            
            this.setColor(r, g, b);
            
            step += direction * 2;
            if (step >= 100 || step <= 0) direction *= -1;
        }, 50);
    }

    // Timer Methods
    startTimer() {
        const hours = parseInt(document.getElementById('timerHours').value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
        const totalMs = (hours * 60 + minutes) * 60 * 1000;

        if (totalMs <= 0) {
            this.showStatusMessage('Please set a valid timer duration', 'error');
            return;
        }

        this.timerEndTime = new Date().getTime() + totalMs;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.updateTimerDisplay();
            
            if (new Date().getTime() >= this.timerEndTime) {
                this.setPower(false);
                this.stopTimer();
                this.showStatusMessage('Timer expired - Lights turned off', 'success');
            }
        }, 1000);

        document.getElementById('timerDisplay').classList.add('active');
        this.showStatusMessage('Timer started', 'success');
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            this.timerEndTime = null;
            document.getElementById('timerDisplay').textContent = 'Timer: Not Active';
            document.getElementById('timerDisplay').classList.remove('active');
        }
    }

    updateTimerDisplay() {
        if (!this.timerEndTime) return;

        const remaining = Math.max(0, this.timerEndTime - new Date().getTime());
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        document.getElementById('timerDisplay').textContent = 
            `Timer: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Preset Methods
    savePreset() {
        const name = document.getElementById('presetNameInput').value.trim();
        if (!name) {
            this.showStatusMessage('Please enter a preset name', 'error');
            return;
        }

        const preset = {
            name: name,
            brightness: document.getElementById('brightnessSlider').value,
            speed: document.getElementById('speedSlider').value,
            color: document.getElementById('customColorPicker').value,
            pattern: this.activePattern,
            timestamp: new Date().toISOString()
        };

        const presets = JSON.parse(localStorage.getItem('ledPresets') || '[]');
        presets.push(preset);
        localStorage.setItem('ledPresets', JSON.stringify(presets));

        document.getElementById('presetNameInput').value = '';
        this.loadPresets();
        this.showStatusMessage(`Preset "${name}" saved`, 'success');
    }

    loadPresets() {
        const presets = JSON.parse(localStorage.getItem('ledPresets') || '[]');
        const grid = document.getElementById('presetsGrid');
        grid.innerHTML = '';

        presets.forEach((preset, index) => {
            const presetElement = document.createElement('div');
            presetElement.className = 'preset-item';
            presetElement.innerHTML = `
                <button class="preset-btn" data-preset-index="${index}">${preset.name}</button>
                <button class="preset-delete" data-preset-index="${index}">Delete</button>
            `;
            grid.appendChild(presetElement);
        });

        // Bind preset events
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this.loadPreset(parseInt(btn.dataset.presetIndex)));
        });

        document.querySelectorAll('.preset-delete').forEach(btn => {
            btn.addEventListener('click', () => this.deletePreset(parseInt(btn.dataset.presetIndex)));
        });
    }

    loadPreset(index) {
        const presets = JSON.parse(localStorage.getItem('ledPresets') || '[]');
        const preset = presets[index];
        
        if (!preset) return;

        document.getElementById('brightnessSlider').value = preset.brightness;
        document.getElementById('speedSlider').value = preset.speed;
        document.getElementById('customColorPicker').value = preset.color;

        this.updateSliderValue('brightness', preset.brightness);
        this.updateSliderValue('speed', preset.speed);
        this.updateColorPreview(preset.color);

        if (preset.pattern !== null) {
            this.setPattern(preset.pattern);
        } else {
            const hex = preset.color;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            this.setColor(r, g, b);
        }

        this.setBrightness(parseInt(preset.brightness));
        this.setSpeed(parseInt(preset.speed));

        this.showStatusMessage(`Preset "${preset.name}" loaded`, 'success');
    }

    deletePreset(index) {
        const presets = JSON.parse(localStorage.getItem('ledPresets') || '[]');
        const preset = presets[index];
        
        if (confirm(`Delete preset "${preset.name}"?`)) {
            presets.splice(index, 1);
            localStorage.setItem('ledPresets', JSON.stringify(presets));
            this.loadPresets();
            this.showStatusMessage(`Preset "${preset.name}" deleted`, 'success');
        }
    }

    // Advanced Effect Methods
    toggleStrobe() {
        if (this.strobeInterval) {
            this.stopStrobe();
        } else {
            this.startStrobe();
        }
    }

    startStrobe() {
        this.clearFadeEffect();
        let isOn = true;
        
        this.strobeInterval = setInterval(() => {
            if (isOn) {
                this.setColor(255, 255, 255);
            } else {
                this.setColor(0, 0, 0);
            }
            isOn = !isOn;
        }, 100);

        document.getElementById('strobeText').textContent = 'Stop Strobe';
        document.getElementById('strobeBtn').classList.add('btn-warning');
        document.getElementById('strobeBtn').classList.remove('btn-secondary');
        this.showStatusMessage('Strobe effect started', 'success');
    }

    stopStrobe() {
        if (this.strobeInterval) {
            clearInterval(this.strobeInterval);
            this.strobeInterval = null;
            document.getElementById('strobeText').textContent = 'Start Strobe';
            document.getElementById('strobeBtn').classList.remove('btn-warning');
            document.getElementById('strobeBtn').classList.add('btn-secondary');
        }
    }

    toggleRandomMode() {
        if (this.randomModeInterval) {
            this.stopRandomMode();
        } else {
            this.startRandomMode();
        }
    }

    startRandomMode() {
        this.clearFadeEffect();
        
        this.randomModeInterval = setInterval(() => {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            this.setColor(r, g, b);
        }, 2000);

        document.getElementById('randomText').textContent = 'Stop Random';
        document.getElementById('randomModeBtn').classList.add('btn-success');
        document.getElementById('randomModeBtn').classList.remove('btn-secondary');
        this.showStatusMessage('Random mode started', 'success');
    }

    stopRandomMode() {
        if (this.randomModeInterval) {
            clearInterval(this.randomModeInterval);
            this.randomModeInterval = null;
            document.getElementById('randomText').textContent = 'Random Mode';
            document.getElementById('randomModeBtn').classList.remove('btn-success');
            document.getElementById('randomModeBtn').classList.add('btn-secondary');
        }
    }

    // Device Info Methods
    initUptime() {
        this.updateDeviceInfo();
    }

    startUptimeCounter() {
        this.uptimeInterval = setInterval(() => {
            this.updateUptime();
        }, 1000);
    }

    stopUptime() {
        if (this.uptimeInterval) {
            clearInterval(this.uptimeInterval);
            this.uptimeInterval = null;
        }
    }

    updateUptime() {
        if (!this.connectionStartTime) return;

        const uptime = new Date().getTime() - this.connectionStartTime.getTime();
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

        document.getElementById('uptime').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateDeviceInfo() {
        const deviceStatus = document.getElementById('deviceStatus');
        const batteryLevel = document.getElementById('batteryLevel');
        const signalStrength = document.getElementById('signalStrength');

        if (this.isConnected) {
            deviceStatus.textContent = 'Connected';
            deviceStatus.className = 'info-value connected';
            batteryLevel.textContent = '85%'; // Simulated
            batteryLevel.className = 'info-value';
            signalStrength.textContent = 'Strong';
            signalStrength.className = 'info-value connected';
        } else {
            deviceStatus.textContent = 'Disconnected';
            deviceStatus.className = 'info-value error';
            batteryLevel.textContent = 'Unknown';
            batteryLevel.className = 'info-value';
            signalStrength.textContent = '-';
            signalStrength.className = 'info-value';
            document.getElementById('uptime').textContent = '00:00:00';
        }
    }

    // Tab Management
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Update remote status to match main connection
        if (tabName === 'remote') {
            this.updateRemoteStatus();
        }
    }

    updateRemoteStatus() {
        const remoteLight = document.querySelector('#remoteStatus .status-light');
        const remoteLabel = document.querySelector('#remoteStatus .status-label');
        
        if (this.isConnected) {
            remoteLight.classList.add('connected');
            remoteLabel.textContent = 'Connected';
        } else {
            remoteLight.classList.remove('connected');
            remoteLabel.textContent = 'Disconnected';
        }
    }

    // Remote Control Actions
    handleRemoteAction(button) {
        const action = button.dataset.action;
        const color = button.dataset.color;

        // Add press animation
        button.classList.add('pressed');
        setTimeout(() => button.classList.remove('pressed'), 150);

        // Handle different actions
        switch (action) {
            case 'power-on':
                this.setPower(true);
                break;
            case 'power-off':
                this.setPower(false);
                break;
            case 'brightness-up':
                this.adjustBrightness(10);
                break;
            case 'brightness-down':
                this.adjustBrightness(-10);
                break;
            case 'color':
                if (color) {
                    const [r, g, b] = color.split(',').map(Number);
                    this.setColor(r, g, b);
                }
                break;
            case 'white':
                this.setColor(255, 255, 255);
                break;
            case 'flash':
                this.activateFlashMode();
                break;
            case 'strobe':
                this.toggleStrobe();
                break;
            case 'fade':
                this.toggleFadeEffect();
                break;
            case 'smooth':
                this.activateSmoothMode();
                break;
            case 'speed-up':
                this.adjustSpeed(10);
                break;
            case 'speed-down':
                this.adjustSpeed(-10);
                break;
            case 'jump3':
                this.activateJump3();
                break;
            case 'jump7':
                this.activateJump7();
                break;
            case 'auto':
                this.activateAutoMode();
                break;
            case 'quick':
                this.setSpeed(80);
                break;
            case 'slow':
                this.setSpeed(20);
                break;
            case 'diy':
                this.activateDIYMode();
                break;
        }
    }

    adjustBrightness(delta) {
        const slider = document.getElementById('brightnessSlider');
        const currentValue = parseInt(slider.value);
        const newValue = Math.max(0, Math.min(100, currentValue + delta));
        
        slider.value = newValue;
        this.updateSliderValue('brightness', newValue);
        this.setBrightness(newValue);
    }

    adjustSpeed(delta) {
        const slider = document.getElementById('speedSlider');
        const currentValue = parseInt(slider.value);
        const newValue = Math.max(0, Math.min(100, currentValue + delta));
        
        slider.value = newValue;
        this.updateSliderValue('speed', newValue);
        this.setSpeed(newValue);
    }

    activateFlashMode() {
        this.clearFadeEffect();
        this.stopStrobe();
        this.stopRandomMode();
        
        let isOn = true;
        this.fadeInterval = setInterval(() => {
            if (isOn) {
                this.setColor(255, 255, 255);
            } else {
                this.setColor(0, 0, 0);
            }
            isOn = !isOn;
        }, 500);
        
        this.showStatusMessage('Flash mode activated', 'success');
    }

    activateSmoothMode() {
        this.clearFadeEffect();
        this.activateColorScheme('rainbow');
        this.showStatusMessage('Smooth mode activated', 'success');
    }

    activateJump3() {
        this.clearFadeEffect();
        const colors = [[255, 0, 0], [0, 255, 0], [0, 0, 255]];
        let colorIndex = 0;

        this.fadeInterval = setInterval(() => {
            const [r, g, b] = colors[colorIndex];
            this.setColor(r, g, b);
            colorIndex = (colorIndex + 1) % colors.length;
        }, 1000);
        
        this.showStatusMessage('3-color jump activated', 'success');
    }

    activateJump7() {
        this.clearFadeEffect();
        const colors = [
            [255, 0, 0], [255, 127, 0], [255, 255, 0], [0, 255, 0],
            [0, 0, 255], [75, 0, 130], [148, 0, 211]
        ];
        let colorIndex = 0;

        this.fadeInterval = setInterval(() => {
            const [r, g, b] = colors[colorIndex];
            this.setColor(r, g, b);
            colorIndex = (colorIndex + 1) % colors.length;
        }, 800);
        
        this.showStatusMessage('7-color jump activated', 'success');
    }

    activateAutoMode() {
        this.toggleRandomMode();
        this.showStatusMessage('Auto mode activated', 'success');
    }

    activateDIYMode() {
        this.clearFadeEffect();
        this.stopStrobe();
        this.stopRandomMode();
        
        // Switch to controller tab for manual control
        this.switchTab('controller');
        this.showStatusMessage('DIY mode - Use controller tab for manual control', 'success');
    }

    // Smart Scenes
    activateScene(scene) {
        document.querySelectorAll('.scene-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-scene="${scene}"]`).classList.add('active');
        
        this.currentScene = scene;
        this.clearFadeEffect();
        this.stopStrobe();
        this.stopRandomMode();

        const scenes = {
            reading: () => {
                this.setColor(255, 248, 220);
                this.setBrightness(70);
            },
            party: () => {
                this.activateColorScheme('rainbow');
                this.setBrightness(100);
                this.setSpeed(80);
            },
            relax: () => {
                this.setColor(135, 206, 235);
                this.setBrightness(30);
            },
            gaming: () => {
                this.setColor(0, 255, 0);
                this.setBrightness(80);
                this.startStrobe();
            },
            sleep: () => {
                this.setColor(255, 69, 0);
                this.setBrightness(5);
            },
            movie: () => {
                this.setColor(128, 0, 128);
                this.setBrightness(20);
            }
        };

        if (scenes[scene]) {
            scenes[scene]();
            this.showStatusMessage(`${scene.charAt(0).toUpperCase() + scene.slice(1)} scene activated`, 'success');
        }
    }

    // Weather Sync
    toggleWeatherSync() {
        this.weatherEnabled = !this.weatherEnabled;
        const btn = document.getElementById('enableWeatherBtn');
        const text = document.getElementById('weatherToggleText');
        const display = document.getElementById('weatherDisplay');

        if (this.weatherEnabled) {
            btn.classList.add('btn-success');
            btn.classList.remove('btn-secondary');
            text.textContent = 'Disable Weather Sync';
            display.classList.add('active');
            this.startWeatherSync();
        } else {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
            text.textContent = 'Enable Weather Sync';
            display.classList.remove('active');
        }
    }

    startWeatherSync() {
        // Simulate weather data (in real implementation, would use weather API)
        const weatherConditions = ['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Snowy'];
        const temperatures = [15, 22, 8, 12, -2];
        const colors = [
            [255, 215, 0], // Sunny - Gold
            [169, 169, 169], // Cloudy - Gray
            [0, 191, 255], // Rainy - Blue
            [75, 0, 130], // Stormy - Purple
            [255, 250, 250] // Snowy - White
        ];

        const randomIndex = Math.floor(Math.random() * weatherConditions.length);
        const condition = weatherConditions[randomIndex];
        const temp = temperatures[randomIndex];
        const [r, g, b] = colors[randomIndex];

        document.getElementById('weatherCondition').textContent = condition;
        document.getElementById('weatherTemp').textContent = `${temp}°C`;

        this.setColor(r, g, b);
        this.showStatusMessage(`Weather sync active: ${condition}`, 'success');
    }

    // Gesture Control
    toggleGestureControl() {
        this.gestureEnabled = !this.gestureEnabled;
        const btn = document.getElementById('enableGestureBtn');
        const text = document.getElementById('gestureToggleText');
        const help = document.getElementById('gestureHelp');

        if (this.gestureEnabled) {
            btn.classList.add('btn-success');
            btn.classList.remove('btn-secondary');
            text.textContent = 'Disable Gestures';
            help.classList.add('active');
            this.setupGestureListeners();
        } else {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
            text.textContent = 'Enable Gestures';
            help.classList.remove('active');
            this.removeGestureListeners();
        }
    }

    setupGestureListeners() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    }

    removeGestureListeners() {
        document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    handleTouchMove(e) {
        if (!this.gestureEnabled) return;

        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                this.adjustBrightness(10); // Swipe right
            } else {
                this.adjustBrightness(-10); // Swipe left
            }
        } else if (Math.abs(deltaY) > 50) {
            if (deltaY < 0) {
                this.adjustSpeed(10); // Swipe up
            } else {
                this.adjustSpeed(-10); // Swipe down
            }
        }
    }

    // Gaming Integration
    activateGameMode(mode) {
        document.querySelectorAll('.game-mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-game="${mode}"]`).classList.add('active');
        
        this.currentGameMode = mode;

        const gameModes = {
            fps: () => {
                this.setColor(255, 0, 0);
                this.setBrightness(100);
                this.setSpeed(90);
            },
            racing: () => {
                this.activateColorScheme('fire');
                this.setBrightness(90);
                this.setSpeed(100);
            },
            rpg: () => {
                this.setColor(138, 43, 226);
                this.setBrightness(60);
                this.activateColorScheme('forest');
            },
            horror: () => {
                this.setColor(0, 0, 0);
                this.setBrightness(10);
                this.startStrobe();
            }
        };

        if (gameModes[mode]) {
            gameModes[mode]();
            this.showStatusMessage(`${mode.toUpperCase()} gaming mode activated`, 'success');
        }
    }

    updateHealthIndicator(health) {
        const healthFill = document.getElementById('healthFill');
        healthFill.style.width = `${health}%`;

        // Change LED color based on health
        if (health > 70) {
            this.setColor(0, 255, 0); // Green
        } else if (health > 30) {
            this.setColor(255, 255, 0); // Yellow
        } else {
            this.setColor(255, 0, 0); // Red
        }
    }

    // Productivity Features
    startPomodoro() {
        if (this.pomodoroState === 'ready' || this.pomodoroState === 'paused') {
            this.pomodoroState = 'focus';
            this.setColor(0, 255, 0);
            this.setBrightness(80);
            
            document.getElementById('pomodoroDisplay').classList.add('active');
            
            this.pomodoroTimer = setInterval(() => {
                this.pomodoroTime--;
                this.updatePomodoroDisplay();
                
                if (this.pomodoroTime <= 0) {
                    this.pomodoroBreak();
                }
            }, 1000);
            
            this.showStatusMessage('Focus session started', 'success');
        }
    }

    pausePomodoro() {
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
            this.pomodoroTimer = null;
            this.pomodoroState = 'paused';
            this.setColor(255, 255, 0);
            this.showStatusMessage('Pomodoro paused', 'info');
        }
    }

    resetPomodoro() {
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
            this.pomodoroTimer = null;
        }
        this.pomodoroTime = 25 * 60;
        this.pomodoroState = 'ready';
        document.getElementById('pomodoroDisplay').classList.remove('active', 'break');
        this.updatePomodoroDisplay();
        this.showStatusMessage('Pomodoro reset', 'info');
    }

    pomodoroBreak() {
        clearInterval(this.pomodoroTimer);
        this.pomodoroTime = 5 * 60; // 5 minute break
        this.pomodoroState = 'break';
        this.setColor(0, 0, 255);
        document.getElementById('pomodoroDisplay').classList.add('break');
        this.showStatusMessage('Break time! Take a 5-minute rest', 'success');
        
        this.pomodoroTimer = setInterval(() => {
            this.pomodoroTime--;
            this.updatePomodoroDisplay();
            
            if (this.pomodoroTime <= 0) {
                this.resetPomodoro();
                this.showStatusMessage('Break finished! Ready for next session', 'success');
            }
        }, 1000);
    }

    updatePomodoroDisplay() {
        const minutes = Math.floor(this.pomodoroTime / 60);
        const seconds = this.pomodoroTime % 60;
        document.getElementById('pomodoroDisplay').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    toggleEyeCare() {
        if (this.eyeCareInterval) {
            clearInterval(this.eyeCareInterval);
            this.eyeCareInterval = null;
            document.getElementById('enableEyeCareBtn').classList.remove('btn-success');
            document.getElementById('enableEyeCareBtn').classList.add('btn-secondary');
            this.showStatusMessage('Eye care disabled', 'info');
        } else {
            this.eyeCareInterval = setInterval(() => {
                this.showStatusMessage('Eye Care Reminder: Look at something 20 feet away for 20 seconds', 'success');
                this.setColor(0, 255, 255);
                setTimeout(() => this.setColor(255, 255, 255), 3000);
            }, 20 * 60 * 1000); // Every 20 minutes
            
            document.getElementById('enableEyeCareBtn').classList.add('btn-success');
            document.getElementById('enableEyeCareBtn').classList.remove('btn-secondary');
            this.showStatusMessage('Eye care enabled - 20-20-20 rule active', 'success');
        }
    }

    // Scheduling
    toggleSunriseSync() {
        this.sunriseEnabled = !this.sunriseEnabled;
        const btn = document.getElementById('enableSunriseBtn');
        
        if (this.sunriseEnabled) {
            btn.classList.add('btn-success');
            btn.classList.remove('btn-secondary');
            this.setupSunriseSync();
            this.showStatusMessage('Sunrise/Sunset sync enabled', 'success');
        } else {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
            this.showStatusMessage('Sunrise/Sunset sync disabled', 'info');
        }
    }

    setupSunriseSync() {
        // Simulate sunrise/sunset times
        const now = new Date();
        const sunrise = new Date(now);
        sunrise.setHours(6, 30, 0, 0);
        const sunset = new Date(now);
        sunset.setHours(18, 30, 0, 0);

        // Check every minute for sunrise/sunset
        setInterval(() => {
            const currentTime = new Date();
            const currentHour = currentTime.getHours();
            const currentMinute = currentTime.getMinutes();

            if (currentHour === 6 && currentMinute === 30) {
                this.setColor(255, 215, 0); // Sunrise color
                this.setBrightness(50);
                this.showStatusMessage('Good morning! Sunrise simulation', 'success');
            } else if (currentHour === 18 && currentMinute === 30) {
                this.setColor(255, 69, 0); // Sunset color
                this.setBrightness(30);
                this.showStatusMessage('Good evening! Sunset simulation', 'success');
            }
        }, 60000);
    }

    addCustomSchedule() {
        const time = document.getElementById('scheduleTime1').value;
        const action = document.getElementById('scheduleAction1').value;
        
        if (time) {
            this.schedules.push({ time, action });
            this.showStatusMessage(`Schedule added: ${action} at ${time}`, 'success');
            document.getElementById('scheduleTime1').value = '';
        }
    }

    // Control methods
    async setPower(isOn) {
        const command = this.createOnOffCommand(isOn);
        const success = await this.sendCommand(command);
        if (success) {
            this.showStatusMessage(`Lights turned ${isOn ? 'on' : 'off'}`, 'success');
        }
    }

    async setColor(red, green, blue) {
        const command = this.createColorCommand(red, green, blue);
        const success = await this.sendCommand(command);
        if (success) {
            this.showStatusMessage(`Color set to RGB(${red}, ${green}, ${blue})`, 'success');
        }
    }

    async setCustomColor() {
        const colorPicker = document.getElementById('customColorPicker');
        const hex = colorPicker.value;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        await this.setColor(r, g, b);
        this.saveSettings();
    }

    async setPattern(patternIndex) {
        this.clearFadeEffect();
        const command = this.createPatternCommand(patternIndex);
        const success = await this.sendCommand(command);
        
        if (success) {
            // Update active pattern UI
            document.querySelectorAll('.pattern-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const activeBtn = document.querySelector(`[data-pattern-index="${patternIndex}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
            
            this.activePattern = patternIndex;
            this.showStatusMessage(`Pattern set to: ${this.patterns[patternIndex]}`, 'success');
        }
    }

    async setBrightness(brightness) {
        const command = this.createBrightnessCommand(brightness);
        await this.sendCommand(command);
        this.saveSettings();
    }

    async setSpeed(speed) {
        const command = this.createSpeedCommand(speed);
        await this.sendCommand(command);
        this.saveSettings();
    }

    async toggleMicrophone() {
        this.isMicEnabled = !this.isMicEnabled;
        const command = this.createMicOnOffCommand(this.isMicEnabled);
        const success = await this.sendCommand(command);
        
        if (success) {
            const toggleBtn = document.getElementById('micToggleBtn');
            const toggleText = document.getElementById('micToggleText');
            
            toggleText.textContent = this.isMicEnabled ? 'Disable Mic' : 'Enable Mic';
            toggleBtn.classList.toggle('btn-success', this.isMicEnabled);
            toggleBtn.classList.toggle('btn-secondary', !this.isMicEnabled);
            
            this.showStatusMessage(`Microphone ${this.isMicEnabled ? 'enabled' : 'disabled'}`, 'success');
            
            // If enabling mic, set the EQ mode
            if (this.isMicEnabled) {
                const eqMode = parseInt(document.getElementById('eqModeSelect').value);
                setTimeout(() => this.setEqMode(eqMode), 100);
            }
        }
    }

    async setEqMode(eqMode) {
        if (!this.isMicEnabled) return;
        
        const command = this.createMicEqCommand(eqMode);
        const success = await this.sendCommand(command);
        
        if (success) {
            const modes = ['Classic', 'Soft', 'Dynamic', 'Disco'];
            this.showStatusMessage(`EQ Mode set to: ${modes[eqMode]}`, 'success');
        }
    }

    async setMicSensitivity(sensitivity) {
        const command = this.createMicSensitivityCommand(sensitivity);
        await this.sendCommand(command);
        this.saveSettings();
    }

    async syncTime() {
        const command = this.createSyncTimeCommand();
        const success = await this.sendCommand(command);
        
        if (success) {
            this.showStatusMessage('Time synchronized', 'success');
        }
    }

    toggleFadeEffect() {
        if (this.fadeInterval) {
            this.clearFadeEffect();
        } else {
            this.startFadeEffect();
        }
    }

    startFadeEffect() {
        this.clearFadeEffect();
        
        const colors = [
            [255, 0, 0],     // Red
            [255, 127, 0],   // Orange
            [255, 255, 0],   // Yellow
            [0, 255, 0],     // Green
            [0, 255, 255],   // Cyan
            [0, 0, 255],     // Blue
            [127, 0, 255],   // Purple
            [255, 0, 255]    // Magenta
        ];
        
        let colorIndex = 0;
        let step = 0;
        const stepsPerColor = 50;
        
        this.fadeInterval = setInterval(() => {
            const currentColor = colors[colorIndex];
            const nextColor = colors[(colorIndex + 1) % colors.length];
            
            const progress = step / stepsPerColor;
            const r = Math.round(currentColor[0] * (1 - progress) + nextColor[0] * progress);
            const g = Math.round(currentColor[1] * (1 - progress) + nextColor[1] * progress);
            const b = Math.round(currentColor[2] * (1 - progress) + nextColor[2] * progress);
            
            this.setColor(r, g, b);
            
            step++;
            if (step >= stepsPerColor) {
                step = 0;
                colorIndex = (colorIndex + 1) % colors.length;
            }
        }, 100);
        
        const fadeBtn = document.getElementById('fadeEffectBtn');
        const fadeText = document.getElementById('fadeEffectText');
        fadeText.textContent = 'Stop Fade';
        fadeBtn.classList.add('btn-danger');
        fadeBtn.classList.remove('btn-secondary');
        
        this.showStatusMessage('Fade effect started', 'success');
    }

    clearFadeEffect() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
            
            const fadeBtn = document.getElementById('fadeEffectBtn');
            const fadeText = document.getElementById('fadeEffectText');
            fadeText.textContent = 'Start Fade';
            fadeBtn.classList.remove('btn-danger');
            fadeBtn.classList.add('btn-secondary');
        }
    }

    showStatusMessage(message, type = 'info') {
        const statusMessage = document.getElementById('statusMessage');
        const messageText = statusMessage.querySelector('.message-text');
        
        messageText.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideStatusMessage();
        }, 3000);
    }

    hideStatusMessage() {
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.classList.add('hidden');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LEDController();
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
