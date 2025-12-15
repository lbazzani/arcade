/**
 * Generatore di suoni 8-bit per il gioco
 * Usa i parametri di sfxr.me per generare file WAV
 *
 * Esegui con: node scripts/generate-sounds.js
 */

const fs = require('fs');
const path = require('path');

// Parametri dei suoni (da sfxr.me) - VOLUME AUMENTATO
const SOUNDS = {
  laser: {
    "oldParams": true,
    "wave_type": 1,
    "p_env_attack": 0,
    "p_env_sustain": 0.35,
    "p_env_punch": 0.1,
    "p_env_decay": 0.1,
    "p_base_freq": 0.65,
    "p_freq_limit": 0.3,
    "p_freq_ramp": -0.35,
    "p_freq_dramp": 0,
    "p_vib_strength": 0,
    "p_vib_speed": 0,
    "p_arp_mod": 0,
    "p_arp_speed": 0,
    "p_duty": 0.1,
    "p_duty_ramp": 0.1,
    "p_repeat_speed": 0,
    "p_pha_offset": 0,
    "p_pha_ramp": 0,
    "p_lpf_freq": 1,
    "p_lpf_ramp": 0,
    "p_lpf_resonance": 0,
    "p_hpf_freq": 0.2,
    "p_hpf_ramp": 0,
    "sound_vol": 0.8,
    "sample_rate": 44100,
    "sample_size": 16
  },
  explosion: {
    "oldParams": true,
    "wave_type": 3,
    "p_env_attack": 0,
    "p_env_sustain": 0.35,
    "p_env_punch": 0.4,
    "p_env_decay": 0.5,
    "p_base_freq": 0.12,
    "p_freq_limit": 0,
    "p_freq_ramp": -0.15,
    "p_freq_dramp": 0,
    "p_vib_strength": 0,
    "p_vib_speed": 0,
    "p_arp_mod": 0,
    "p_arp_speed": 0,
    "p_duty": 0,
    "p_duty_ramp": 0,
    "p_repeat_speed": 0,
    "p_pha_offset": 0,
    "p_pha_ramp": 0,
    "p_lpf_freq": 1,
    "p_lpf_ramp": 0,
    "p_lpf_resonance": 0,
    "p_hpf_freq": 0,
    "p_hpf_ramp": 0,
    "sound_vol": 0.9,
    "sample_rate": 44100,
    "sample_size": 16
  },
  hit: {
    "oldParams": true,
    "wave_type": 3,
    "p_env_attack": 0,
    "p_env_sustain": 0.15,
    "p_env_punch": 0.3,
    "p_env_decay": 0.25,
    "p_base_freq": 0.25,
    "p_freq_limit": 0,
    "p_freq_ramp": -0.4,
    "p_freq_dramp": 0,
    "p_vib_strength": 0,
    "p_vib_speed": 0,
    "p_arp_mod": 0,
    "p_arp_speed": 0,
    "p_duty": 0,
    "p_duty_ramp": 0,
    "p_repeat_speed": 0,
    "p_pha_offset": 0,
    "p_pha_ramp": 0,
    "p_lpf_freq": 1,
    "p_lpf_ramp": 0,
    "p_lpf_resonance": 0,
    "p_hpf_freq": 0.05,
    "p_hpf_ramp": 0,
    "sound_vol": 0.85,
    "sample_rate": 44100,
    "sample_size": 16
  },
  powerup: {
    "oldParams": true,
    "wave_type": 0,
    "p_env_attack": 0,
    "p_env_sustain": 0.2,
    "p_env_punch": 0,
    "p_env_decay": 0.4,
    "p_base_freq": 0.35,
    "p_freq_limit": 0,
    "p_freq_ramp": 0.3,
    "p_freq_dramp": 0,
    "p_vib_strength": 0,
    "p_vib_speed": 0,
    "p_arp_mod": 0.5,
    "p_arp_speed": 0.4,
    "p_duty": 0.5,
    "p_duty_ramp": 0,
    "p_repeat_speed": 0,
    "p_pha_offset": 0,
    "p_pha_ramp": 0,
    "p_lpf_freq": 1,
    "p_lpf_ramp": 0,
    "p_lpf_resonance": 0,
    "p_hpf_freq": 0,
    "p_hpf_ramp": 0,
    "sound_vol": 0.7,
    "sample_rate": 44100,
    "sample_size": 16
  },
  gameOver: {
    "oldParams": true,
    "wave_type": 1,
    "p_env_attack": 0,
    "p_env_sustain": 0.4,
    "p_env_punch": 0,
    "p_env_decay": 0.6,
    "p_base_freq": 0.18,
    "p_freq_limit": 0,
    "p_freq_ramp": -0.08,
    "p_freq_dramp": 0,
    "p_vib_strength": 0.15,
    "p_vib_speed": 0.25,
    "p_arp_mod": -0.35,
    "p_arp_speed": 0.5,
    "p_duty": 0.5,
    "p_duty_ramp": 0,
    "p_repeat_speed": 0,
    "p_pha_offset": 0,
    "p_pha_ramp": 0,
    "p_lpf_freq": 1,
    "p_lpf_ramp": 0,
    "p_lpf_resonance": 0,
    "p_hpf_freq": 0,
    "p_hpf_ramp": 0,
    "sound_vol": 0.8,
    "sample_rate": 44100,
    "sample_size": 16
  }
};

// Generatore sfxr
class SfxrGenerator {
  constructor(params) {
    this.params = params;
    this.sampleRate = params.sample_rate || 44100;
  }

  generate() {
    const p = this.params;
    const samples = [];

    // Converti parametri
    const attackTime = p.p_env_attack * p.p_env_attack * 100000;
    const sustainTime = p.p_env_sustain * p.p_env_sustain * 100000;
    const decayTime = p.p_env_decay * p.p_env_decay * 100000;

    // Minimo 0.3 secondi di suono per essere udibile
    const minSamples = Math.floor(0.3 * this.sampleRate);
    const totalSamples = Math.max(
      Math.floor((attackTime + sustainTime + decayTime) * this.sampleRate / 1000000),
      minSamples
    );

    let phase = 0;
    let period = 100 / (p.p_base_freq * p.p_base_freq + 0.001);
    let periodMax = 100 / (p.p_freq_limit * p.p_freq_limit + 0.001);
    let slide = 1 - p.p_freq_ramp * p.p_freq_ramp * p.p_freq_ramp * 0.01;
    let dutyCycle = 0.5 - p.p_duty * 0.5;
    let dutySlide = -p.p_duty_ramp * 0.00005;

    // Arpeggio
    let arpTime = 0;
    let arpLimit = Math.floor(p.p_arp_speed * p.p_arp_speed * 20000 * this.sampleRate / 1000000);
    let arpMod = 1 + p.p_arp_mod * (p.p_arp_mod > 0 ? 1 : -1) * 0.1;

    // Vibrato
    let vibPhase = 0;
    let vibSpeed = p.p_vib_speed * p.p_vib_speed * 0.01;
    let vibAmp = p.p_vib_strength * 0.5;

    let env = 0;
    let envStage = 0;
    let envTime = 0;

    for (let i = 0; i < totalSamples; i++) {
      // Envelope
      envTime++;
      const attackSamples = attackTime * this.sampleRate / 1000000;
      const sustainSamples = sustainTime * this.sampleRate / 1000000;
      const decaySamples = decayTime * this.sampleRate / 1000000;

      if (envStage === 0) {
        env = attackSamples > 0 ? envTime / attackSamples : 1;
        if (envTime >= attackSamples) {
          envStage = 1;
          envTime = 0;
        }
      } else if (envStage === 1) {
        env = 1 + (1 - (sustainSamples > 0 ? envTime / sustainSamples : 1)) * p.p_env_punch * 2;
        if (envTime >= sustainSamples) {
          envStage = 2;
          envTime = 0;
        }
      } else {
        env = 1 - (decaySamples > 0 ? envTime / decaySamples : 1);
        if (env < 0) env = 0;
      }

      // Frequency slide
      period *= slide;
      if (period < 8) period = 8;
      if (periodMax > 0 && period > periodMax) {
        period = periodMax;
      }

      // Arpeggio
      arpTime++;
      if (arpLimit > 0 && arpTime >= arpLimit) {
        arpTime = 0;
        period *= arpMod;
      }

      // Vibrato
      vibPhase += vibSpeed;
      let vibPeriod = period * (1 + Math.sin(vibPhase) * vibAmp);

      // Duty cycle
      dutyCycle = Math.max(0, Math.min(0.5, dutyCycle + dutySlide));

      // Oscillator
      phase++;
      if (phase >= vibPeriod) {
        phase = phase % vibPeriod;
      }

      let sample = 0;
      const fp = phase / vibPeriod;

      switch (p.wave_type) {
        case 0: // Square
          sample = fp < (0.5 - dutyCycle * 0.5) ? 0.5 : -0.5;
          break;
        case 1: // Sawtooth
          sample = 1 - fp * 2;
          break;
        case 2: // Sine
          sample = Math.sin(fp * Math.PI * 2);
          break;
        case 3: // Noise
          sample = Math.random() * 2 - 1;
          break;
      }

      sample *= env * (p.sound_vol || 0.5);
      samples.push(Math.max(-1, Math.min(1, sample)));
    }

    return samples;
  }

  toWav() {
    const samples = this.generate();
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Samples
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, s * 32767, true);
    }

    return Buffer.from(buffer);
  }
}

// Crea directory se non esiste
const soundsDir = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Genera tutti i suoni
console.log('Generazione suoni 8-bit (volume alto)...\n');

for (const [name, params] of Object.entries(SOUNDS)) {
  const generator = new SfxrGenerator(params);
  const wav = generator.toWav();
  const filePath = path.join(soundsDir, `${name}.wav`);
  fs.writeFileSync(filePath, wav);
  console.log(`✓ ${name}.wav generato (${wav.length} bytes)`);
}

console.log('\nSuoni generati in assets/sounds/');
