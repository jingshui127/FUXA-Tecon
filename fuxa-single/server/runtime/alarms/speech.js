/**
 * FUXA Speech Synthesis Module
 * Windows SAPI based text-to-speech for alarm notifications
 */

'use strict';

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class SpeechSynthesizer extends EventEmitter {
    constructor() {
        super();
        
        this.enabled = true;
        this.rate = 0;
        this.volume = 100;
        this.voice = null;
        
        this.queue = [];
        this.isPlaying = false;
        this.maxQueueSize = 50;
        this.queueTimeout = 10000;
        
        this.stats = {
            totalSpoken: 0,
            errors: 0,
            queueOverflows: 0
        };
        
        this.logger = null;
        this.scriptPath = null;
    }

    init(logger) {
        this.logger = logger;
        this.log('info', 'Speech synthesizer initialized');
        
        this.scriptPath = path.join(__dirname, '_speech_worker.ps1');
        
        return this.checkSystemRequirements();
    }

    async checkSystemRequirements() {
        return new Promise((resolve) => {
            const script = `
                Add-Type -AssemblyName System.Speech;
                $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
                $voices = $synth.GetInstalledVoices();
                $chineseVoices = @($voices | Where-Object { $_.VoiceInfo.Culture.Name -like "zh-*" });
                Write-Output "CHINESE_COUNT:$($chineseVoices.Count)";
                Write-Output "TOTAL_COUNT:$($voices.Count)";
                foreach ($voice in $voices) {
                    Write-Output "VOICE:$($voice.VoiceInfo.Name)|$($voice.VoiceInfo.Culture.Name)";
                }
            `;
            
            exec(`powershell -NoProfile -Command "${script}"`, { timeout: 10000, encoding: 'utf8' }, (error, stdout) => {
                if (error) {
                    this.log('error', `System requirements check failed: ${error.message}`);
                    resolve(false);
                } else {
                    const lines = stdout.trim().split('\n').filter(l => l.trim());
                    let chineseCount = 0;
                    let totalCount = 0;
                    const voices = [];
                    
                    lines.forEach(line => {
                        if (line.startsWith('CHINESE_COUNT:')) {
                            chineseCount = parseInt(line.split(':')[1], 10);
                        } else if (line.startsWith('TOTAL_COUNT:')) {
                            totalCount = parseInt(line.split(':')[1], 10);
                        } else if (line.startsWith('VOICE:')) {
                            const voiceInfo = line.substring(6);
                            voices.push(voiceInfo);
                        }
                    });
                    
                    this.log('info', `Found ${totalCount} voice(s), ${chineseCount} Chinese voice(s)`);
                    if (voices.length > 0) {
                        this.log('info', 'Available voices:');
                        voices.forEach(voice => {
                            this.log('info', `  ${voice}`);
                        });
                    }
                    
                    resolve(true);
                }
            });
        });
    }

    speak(text, options = {}) {
        if (!this.enabled) {
            this.log('debug', 'Speech is disabled, skipping');
            return false;
        }

        if (!text || typeof text !== 'string') {
            this.log('error', 'Invalid text parameter');
            return false;
        }

        if (this.queue.length >= this.maxQueueSize) {
            this.log('warn', 'Speech queue is full, dropping oldest message');
            this.queue.shift();
            this.stats.queueOverflows++;
        }

        const speechItem = {
            text: text.trim(),
            rate: options.rate !== undefined ? options.rate : this.rate,
            volume: options.volume !== undefined ? options.volume : this.volume,
            voice: options.voice || this.voice,
            priority: options.priority || 'normal',
            timestamp: Date.now()
        };

        if (options.priority === 'high') {
            this.queue.unshift(speechItem);
        } else {
            this.queue.push(speechItem);
        }

        this.log('debug', `Added to queue: "${text}" (queue size: ${this.queue.length})`);
        
        if (!this.isPlaying) {
            this.processQueue();
        }

        return true;
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.isPlaying = false;
            this.emit('queueEmpty');
            return;
        }

        this.isPlaying = true;
        const item = this.queue.shift();

        try {
            await this.speakInternal(item.text, {
                rate: item.rate,
                volume: item.volume,
                voice: item.voice
            });
            
            this.stats.totalSpoken++;
            this.emit('spoken', item.text);
            
            setTimeout(() => this.processQueue(), 100);
        } catch (error) {
            this.stats.errors++;
            this.log('error', `Speech failed: ${error.message}`);
            this.emit('error', error);
            
            setTimeout(() => this.processQueue(), 500);
        }
    }

    speakInternal(text, options = {}) {
        return new Promise((resolve, reject) => {
            const rate = options.rate !== undefined ? options.rate : this.rate;
            const volume = options.volume !== undefined ? options.volume : this.volume;
            const voice = options.voice || this.voice;

            this.log('info', `Speaking: "${text}"`);

            const psArgs = [
                '-NoProfile',
                '-NonInteractive',
                '-ExecutionPolicy', 'Bypass',
                '-Command',
                `& { Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Rate = ${rate}; $synth.Volume = ${volume}; $synth.Speak([char]34 + ${JSON.stringify(text)} + [char]34); }`
            ];

            const ps = spawn('powershell', psArgs, {
                windowsHide: true
            });

            let timeout = setTimeout(() => {
                ps.kill();
                reject(new Error('Speech timeout'));
            }, this.queueTimeout);

            ps.on('close', (code) => {
                clearTimeout(timeout);
                if (code === 0) {
                    this.log('info', 'Speech completed successfully');
                    resolve();
                } else {
                    reject(new Error(`PowerShell exited with code ${code}`));
                }
            });

            ps.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    speakAsync(text, options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.enabled) {
                resolve(false);
                return;
            }

            const rate = options.rate !== undefined ? options.rate : this.rate;
            const volume = options.volume !== undefined ? options.volume : this.volume;
            const voice = options.voice || this.voice;

            this.log('info', `Speaking (async): "${text}"`);

            const psArgs = [
                '-NoProfile',
                '-NonInteractive',
                '-ExecutionPolicy', 'Bypass',
                '-Command',
                `& { Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Rate = ${rate}; $synth.Volume = ${volume}; $synth.Speak([char]34 + ${JSON.stringify(text)} + [char]34); }`
            ];

            const ps = spawn('powershell', psArgs, {
                windowsHide: true
            });

            let timeout = setTimeout(() => {
                ps.kill();
                this.stats.errors++;
                reject(new Error('Speech timeout'));
            }, this.queueTimeout);

            ps.on('close', (code) => {
                clearTimeout(timeout);
                if (code === 0) {
                    this.log('info', 'Speech completed successfully');
                    this.stats.totalSpoken++;
                    resolve();
                } else {
                    this.stats.errors++;
                    reject(new Error(`PowerShell exited with code ${code}`));
                }
            });

            ps.on('error', (err) => {
                clearTimeout(timeout);
                this.stats.errors++;
                reject(err);
            });
        });
    }

    setRate(rate) {
        this.rate = Math.max(-10, Math.min(10, rate));
        this.log('info', `Speech rate set to: ${this.rate}`);
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        this.log('info', `Speech volume set to: ${this.volume}`);
    }

    setVoice(voice) {
        this.voice = voice;
        this.log('info', `Speech voice set to: ${this.voice}`);
    }

    enable() {
        this.enabled = true;
        this.log('info', 'Speech enabled');
        this.emit('enabled');
    }

    disable() {
        this.enabled = false;
        this.log('info', 'Speech disabled');
        this.emit('disabled');
        
        this.queue = [];
        this.isPlaying = false;
    }

    clearQueue() {
        const cleared = this.queue.length;
        this.queue = [];
        this.log('info', `Cleared ${cleared} items from queue`);
        return cleared;
    }

    getStats() {
        return {
            enabled: this.enabled,
            queueSize: this.queue.length,
            isPlaying: this.isPlaying,
            rate: this.rate,
            volume: this.volume,
            voice: this.voice,
            totalSpoken: this.stats.totalSpoken,
            errors: this.stats.errors,
            queueOverflows: this.stats.queueOverflows
        };
    }

    async getAvailableVoices() {
        return new Promise((resolve) => {
            const script = `
                Add-Type -AssemblyName System.Speech;
                $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
                $voices = $synth.GetInstalledVoices();
                foreach ($voice in $voices) {
                    $info = $voice.VoiceInfo;
                    Write-Output "$($info.Name)|$($info.Culture.Name)|$($info.Gender)|$($info.Age)";
                }
            `;
            
            exec(`powershell -NoProfile -Command "${script}"`, { timeout: 5000, encoding: 'utf8' }, (error, stdout) => {
                if (error) {
                    this.log('error', `Failed to get voices: ${error.message}`);
                    resolve([]);
                } else {
                    const voices = [];
                    const lines = stdout.trim().split('\n').filter(l => l.trim());
                    
                    lines.forEach(line => {
                        const parts = line.split('|');
                        if (parts.length >= 2) {
                            voices.push({
                                name: parts[0],
                                cultureName: parts[1],
                                gender: parts[2] || 'Unknown',
                                age: parts[3] || 'Unknown',
                                enabled: true
                            });
                        }
                    });
                    
                    resolve(voices);
                }
            });
        });
    }

    log(level, message) {
        const logMessage = `[Speech] ${message}`;
        
        if (this.logger) {
            this.logger[level](logMessage, true);
        } else {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [${level.toUpperCase()}] ${logMessage}`);
        }
    }

    test(text = 'FUXA语音播报测试成功') {
        return this.speakAsync(text, { rate: 0, volume: 100 });
    }
}

const speechSynthesizer = new SpeechSynthesizer();

module.exports = speechSynthesizer;
