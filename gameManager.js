import * as THREE from 'three';
import { TowerSystem } from './towerSystem.js';
import { EnemySystem } from './enemySystem.js';
import { AudioManager } from './audioManager.js';

export class GameManager {
  constructor(scene, pathPoints, camera) {
    this.scene = scene;
    this.pathPoints = pathPoints;
    this.camera = camera;

    // Game state
    this.money = 150;
    this.lives = 20;
    this.wave = 1;
    this.enemiesRemaining = 0;
    this.waveActive = false;
    this.selectedTowerForUpgrade = null;
    this.selectionIndicator = null;
    
    // Systems
    this.audioManager = new AudioManager(this.camera);
    this.towerSystem = new TowerSystem(scene, this.audioManager);
    this.enemySystem = new EnemySystem(scene, pathPoints);

    // Wave configuration (generated up to 100 rounds)
    this.waveConfigs = this.generateWaves(100);
  }

  // Generates wave configurations programmatically
  generateWaves(maxWaves = 100) {
    const waves = [];

    for (let i = 1; i <= maxWaves; i++) {
      const composition = [];

      // --- Base scaling values (tweak to taste) ---
      const gruntHealth = 40 + Math.floor(i * 1.8);   // gentle grunt HP ramp
      const scoutHealth = 30 + Math.floor(i * 1.6);   // scouts are squishier
      const bruteHealth = 120 + Math.floor(i * 6);    // brutes scale faster

      // --- Counts scaling (start easy, then grow) ---
      let gruntCount;
      if (i === 1) gruntCount = 4;
      else if (i <= 5) gruntCount = 4 + i * 2; // small intro
      else gruntCount = 6 + Math.floor(i * 1.3);

      // Give a soft cap so early counts don't explode
      gruntCount = Math.max(1, gruntCount);

      // Add grunts (always present)
      composition.push({ type: 'grunt', count: gruntCount, health: gruntHealth });

      // Scouts appear from wave 3 (fast, lower HP, increase relative to wave)
      if (i >= 3) {
        const scoutCount = Math.floor(Math.max(0, i * 0.9)); // lighter than grunts early
        if (scoutCount > 0) composition.push({ type: 'scout', count: scoutCount, health: scoutHealth });
      }

      // Brutes appear later (wave 6+), slow but tough
      if (i >= 6) {
        const bruteCount = Math.floor(Math.max(0, i * 0.35)); // small numbers at first
        if (bruteCount > 0) composition.push({ type: 'brute', count: bruteCount, health: bruteHealth });
      }

      // --- Special milestone modifiers ---
      // Every 10 waves = Horde (boost counts)
      if (i % 10 === 0) {
        composition.forEach(enemy => {
          enemy.count = Math.floor(Math.max(1, enemy.count * 1.5));
        });
      }

      // Every 25 waves = Mini-boss (extra strong brute)
      if (i % 25 === 0) {
        composition.push({ type: 'brute', count: 2, health: Math.floor(bruteHealth * 3) });
      }

      // Every 50 waves = Boss wave
      if (i % 50 === 0) {
        composition.push({ type: 'boss', count: 1, health: Math.floor(bruteHealth * 18) }); // single huge boss
      }

      // Slight randomness option (commented out) — can be enabled to add variety
      // composition.forEach(enemy => enemy.count = Math.max(1, enemy.count + (Math.random() < 0.2 ? Math.floor(Math.random()*3) : 0)));

      waves.push({ wave: i, composition });
    }

    return waves;
  }

  update(deltaTime) {
    // Update systems
    this.towerSystem.update(deltaTime, this.enemySystem.enemies);
    this.enemySystem.update(deltaTime);

    // Check for enemies that reached the end
    const enemiesAtEnd = this.enemySystem.getEnemiesAtEnd();
    if (enemiesAtEnd.length > 0) {
      this.lives -= enemiesAtEnd.length;
      this.enemySystem.removeEnemies(enemiesAtEnd);
    }

    // Check for destroyed enemies
    const destroyedEnemies = this.enemySystem.getDestroyedEnemies();
    if (destroyedEnemies.length > 0) {
      destroyedEnemies.forEach(enemy => {
        this.money += enemy.reward;
        this.createCoinEffect(enemy.mesh.position);
        this.audioManager.playSound('explosion');
      });
      this.enemySystem.removeEnemies(destroyedEnemies);
    }

    // Update enemies remaining
    this.enemiesRemaining = this.enemySystem.enemies.length;

    // Check wave completion
    if (this.waveActive && this.enemiesRemaining === 0 && !this.enemySystem.spawning) {
      this.waveActive = false;
      this.wave++;
    }
    if (this.selectedTowerForUpgrade && this.selectionIndicator) {
      // Future logic for animations on selected tower could go here
      this.selectionIndicator.rotation.y += deltaTime * 0.5;
    }
  }

  startWave() {
    if (this.waveActive) return;

    // clamp wave index to last available config if player surpasses configured waves
    const waveIndex = Math.min(this.wave - 1, this.waveConfigs.length - 1);
    const config = this.waveConfigs[waveIndex];

    // Defensive: ensure composition array exists
    if (!config || !Array.isArray(config.composition)) return;

    this.enemySystem.startWave(config.composition);
    this.waveActive = true;
  }

  placeTower(position, towerType) {
    const costs = { basic: 50, rapid: 100, laser: 200, frost: 125, artillery: 250, tesla: 350 };
    const cost = costs[towerType];

    if (this.money >= cost && this.isValidTowerPosition(position)) {
      this.towerSystem.placeTower(position, towerType);
      this.money -= cost;
      this.audioManager.playSound('place');
      return true;
    }
    return false;
  }

  selectTowerForUpgrade(tower) {
    this.selectedTowerForUpgrade = tower;
    if (!this.selectionIndicator) {
        const ringGeometry = new THREE.TorusGeometry(1.5, 0.1, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffeb3b, transparent: true, opacity: 0.8 });
        this.selectionIndicator = new THREE.Mesh(ringGeometry, ringMaterial);
        this.selectionIndicator.rotation.x = Math.PI / 2;
        this.scene.add(this.selectionIndicator);
    }
    this.selectionIndicator.position.copy(tower.position);
    this.selectionIndicator.visible = true;
  }

  deselectTower() {
    this.selectedTowerForUpgrade = null;
    if (this.selectionIndicator) {
      this.selectionIndicator.visible = false;
    }
  }

  upgradeTower(upgradeType) {
    if (!this.selectedTowerForUpgrade) return;
    const tower = this.selectedTowerForUpgrade;
    
    // Define base costs and boosts
    const upgradeConfig = {
      damage: { baseCost: 100, boost: tower.type === 'laser' ? 40 : 15 },
      range: { baseCost: 75, boost: 0.5 },
    };
    const config = upgradeConfig[upgradeType];
    if (!config) return;
    
    // Cost increases with each upgrade level
    const cost = config.baseCost * (tower.upgrades[upgradeType] + 1);
    if (this.money >= cost) {
      this.money -= cost;
      tower.upgrades[upgradeType]++;
      if (upgradeType === 'damage') {
        tower.damage += config.boost;
      } else if (upgradeType === 'range') {
        tower.range += config.boost;
      }
      this.audioManager.playSound('upgrade');
    }
  }

  sellSelectedTower() {
    if (!this.selectedTowerForUpgrade) return;
    
    const tower = this.selectedTowerForUpgrade;
    const sellValue = this.getTowerSellValue(tower);
    
    this.money += sellValue;
    this.towerSystem.removeTower(tower);
    this.deselectTower();
    this.audioManager.playSound('sell');
  }

  getTowerSellValue(tower) {
    const costs = { basic: 50, rapid: 100, laser: 200, frost: 125, artillery: 250, tesla: 350 };
    let totalSpent = costs[tower.type];
    const upgradeConfig = {
      damage: { baseCost: 100 },
      range: { baseCost: 75 },
    };
    for (let i = 0; i < tower.upgrades.damage; i++) {
      totalSpent += upgradeConfig.damage.baseCost * (i + 1);
    }
    for (let i = 0; i < tower.upgrades.range; i++) {
      totalSpent += upgradeConfig.range.baseCost * (i + 1);
    }
    
    return Math.floor(totalSpent * 0.75); // Sell for 75% of total cost
  }

  isValidTowerPosition(position) {
    // Check distance from path
    const minDistance = 2.0;
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const pathStart = this.pathPoints[i];
      const pathEnd = this.pathPoints[i + 1];
      
      const distance = this.distanceToLineSegment(position, pathStart, pathEnd);
      if (distance < minDistance) {
        return false;
      }
    }

    // Check distance from other towers
    const towers = this.towerSystem.towers;
    for (const tower of towers) {
      if (position.distanceTo(tower.position) < 3.0) {
        return false;
      }
    }

    return true;
  }

  distanceToLineSegment(point, lineStart, lineEnd) {
    const line = new THREE.Vector3().subVectors(lineEnd, lineStart);
    const lineLength = line.length();
    
    if (lineLength === 0) return point.distanceTo(lineStart);
    
    const t = Math.max(0, Math.min(1, 
      new THREE.Vector3().subVectors(point, lineStart).dot(line) / (lineLength * lineLength)
    ));
    
    const projection = new THREE.Vector3().addVectors(lineStart, line.multiplyScalar(t));
    return point.distanceTo(projection);
  }

  createCoinEffect(position) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 6);
    const material = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    const coin = new THREE.Mesh(geometry, material);
    coin.position.copy(position);
    coin.position.y += 1;
    this.scene.add(coin);

    // Animate coin
    const startY = coin.position.y;
    let time = 0;
    const animate = () => {
      time += 0.05;
      coin.position.y = startY + Math.sin(time * 4) * 0.5;
      coin.rotation.y += 0.2;
      coin.scale.multiplyScalar(0.95);
      
      if (coin.scale.x > 0.1) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(coin);
      }
    };
    animate();
  }
}