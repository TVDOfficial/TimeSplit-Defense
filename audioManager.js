import * as THREE from 'three';

export class AudioManager {
  constructor(camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    
    this.audioLoader = new THREE.AudioLoader();
    this.sounds = {};
    
    this.loadSounds();
  }

  loadSounds() {
    const soundPaths = {
      place: 'https://actions.google.com/sounds/v1/foley/building_block_place.ogg',
      shoot: 'https://actions.google.com/sounds/v1/weapons/gun_shot_with_ricochet.ogg',
      laser: 'https://actions.google.com/sounds/v1/weapons/laser_gun_fire.ogg',
      explosion: 'https://actions.google.com/sounds/v1/explosions/explosion_with_rumble.ogg',
      sell: 'https://actions.google.com/sounds/v1/coins/cash_register.ogg',
      upgrade: 'https://actions.google.com/sounds/v1/tools/wrench_ratchet.ogg',
    };

    for (const key in soundPaths) {
      this.audioLoader.load(soundPaths[key], (buffer) => {
        // We create a sound object for each key to allow for overlapping plays if needed
        this.sounds[key] = {
            buffer: buffer,
            volume: key === 'laser' ? 0.3 : 0.5 // Laser is loud, so reduce its volume
        };
      });
    }
  }

  playSound(name) {
    if (this.sounds[name]) {
      const soundData = this.sounds[name];
      const sound = new THREE.Audio(this.listener);
      sound.setBuffer(soundData.buffer);
      sound.setVolume(soundData.volume);
      sound.play();
    } else {
        console.warn(`Sound not found: ${name}`);
    }
  }
}