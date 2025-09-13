import * as THREE from 'three';

export class EnemySystem {
  constructor(scene, pathPoints) {
    this.scene = scene;
    this.pathPoints = pathPoints;
    this.enemies = [];
    this.spawning = false;
    this.spawnQueue = [];
    this.spawning = false;
    this.lastSpawnTime = 0;
  }
  startWave(composition) {
    this.spawnQueue = [];
    composition.forEach(group => {
        for (let i = 0; i < group.count; i++) {
            this.spawnQueue.push({ type: group.type, health: group.health });
        }
    });
    // Shuffle the queue for variety
    this.spawnQueue.sort(() => Math.random() - 0.5);
    this.spawning = true;
    this.lastSpawnTime = Date.now();
  }
  update(deltaTime) {
    const currentTime = Date.now();
    // Spawn enemies from the queue
    if (this.spawning && this.spawnQueue.length > 0) {
      if (currentTime - this.lastSpawnTime > 800) { // Spawn interval
        const enemyInfo = this.spawnQueue.shift();
        this.spawnEnemy(enemyInfo.type, enemyInfo.health);
        this.lastSpawnTime = currentTime;
      }
      if (this.spawnQueue.length === 0) {
          this.spawning = false;
      }
    }

    // Update enemies
    this.enemies.forEach(enemy => {
      this.updateEnemy(enemy, deltaTime);
    });
  }

  spawnEnemy(type, waveHealth) {
    const enemyConfigs = {
        grunt:  { health: 100, speed: 1.0, reward: 5 },
        scout:  { health: 60,  speed: 1.5, reward: 4 },
        brute:  { health: 300, speed: 0.7, reward: 10 },
    };
    const config = enemyConfigs[type];
    const enemy = this.createEnemy(type, config);
    
    // Use health from wave config if provided, otherwise use base health
    const health = waveHealth || config.health;
    enemy.health = health;
    enemy.maxHealth = health;
    enemy.speed = config.speed;
    enemy.reward = config.reward;
    
    this.enemies.push(enemy);
    this.scene.add(enemy.group);
  }

  createEnemy(type, config) {
    const group = new THREE.Group();
    let body, head;
    // Define materials based on type
    const materials = {
        grunt: { body: 0x1a237e, head: 0x283593, eye: 0x00bcd4 },
        scout: { body: 0xf9a825, head: 0xfbc02d, eye: 0xffeb3b },
        brute: { body: 0xb71c1c, head: 0xc62828, eye: 0xff5252 }
    };
    const mat = materials[type];
    // Create different shapes based on type
    if (type === 'scout') {
        const bodyGeometry = new THREE.ConeGeometry(0.5, 1.2, 4);
        body = new THREE.Mesh(bodyGeometry, new THREE.MeshLambertMaterial({ color: mat.body }));
        body.position.y = 0.6;
        body.rotation.y = Math.PI / 4;
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        head = new THREE.Mesh(headGeometry, new THREE.MeshLambertMaterial({ color: mat.head }));
        head.position.y = 1.4;
    } else if (type === 'brute') {
        const bodyGeometry = new THREE.BoxGeometry(1.2, 1.5, 1.0);
        body = new THREE.Mesh(bodyGeometry, new THREE.MeshLambertMaterial({ color: mat.body }));
        body.position.y = 0.75;
        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        head = new THREE.Mesh(headGeometry, new THREE.MeshLambertMaterial({ color: mat.head }));
        head.position.y = 1.8;
    } else { // grunt (default)
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.6);
        body = new THREE.Mesh(bodyGeometry, new THREE.MeshLambertMaterial({ color: mat.body }));
        body.position.y = 0.6;
        const headGeometry = new THREE.SphereGeometry(0.4, 8, 6);
        head = new THREE.Mesh(headGeometry, new THREE.MeshLambertMaterial({ color: mat.head }));
        head.position.y = 1.5;
    }
    body.castShadow = true;
    head.castShadow = true;
    group.add(body);
    group.add(head);

    // Eyes (glowing)
    const eyeGeometry = new THREE.SphereGeometry(0.08, 6, 6);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: mat.eye });
    
    const eyeZ = type === 'brute' ? 0.55 : 0.35;
    const eyeY = head.position.y;
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, eyeY, eyeZ);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, eyeY, eyeZ);
    group.add(rightEye);

    // Health bar background
    const hpBgGeometry = new THREE.PlaneGeometry(1, 0.1);
    const hpBgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const hpBg = new THREE.Mesh(hpBgGeometry, hpBgMaterial);
    hpBg.position.set(0, 2.2, 0);
    hpBg.lookAt(0, 2.2, 1); // Face camera
    group.add(hpBg);

    // Health bar
    const hpGeometry = new THREE.PlaneGeometry(0.9, 0.08);
    const hpMaterial = new THREE.MeshBasicMaterial({ color: 0x4caf50 });
    const hp = new THREE.Mesh(hpGeometry, hpMaterial);
    hp.position.set(0, 2.2, 0.01);
    hp.lookAt(0, 2.2, 1);
    group.add(hp);

    // Position at start of path
    group.position.copy(this.pathPoints[0]);

    return {
      group,
      mesh: group,
      body,
      head,
      healthBar: hp,
      position: group.position,
      pathIndex: 0,
      pathProgress: 0,
      health: 100,
      maxHealth: 100,
      speed: 1,
      reward: 10,
      reachedEnd: false,
      destroyed: false,
      slowedUntil: 0,
      takeDamage: (damage, slowAmount = 0) => {
        const enemy = this.enemies.find(e => e.group === group);
        if (enemy) {
          enemy.health -= damage;
          if (slowAmount > 0) {
            enemy.slowedUntil = Date.now() + 2000; // Slow for 2 seconds
          }
          if (enemy.health <= 0) {
            enemy.destroyed = true;
          }
          // Update health bar
          const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
          enemy.healthBar.scale.x = healthPercent;
          enemy.healthBar.material.color.setHex(
            healthPercent > 0.5 ? 0x4caf50 : 
            healthPercent > 0.25 ? 0xff9800 : 0xf44336
          );
        }
      }
    };
  }

  updateEnemy(enemy, deltaTime) {
    if (enemy.destroyed || enemy.reachedEnd) return;

    // Move along path
    const currentPoint = this.pathPoints[enemy.pathIndex];
    const nextPoint = this.pathPoints[enemy.pathIndex + 1];

    if (!nextPoint) {
      enemy.reachedEnd = true;
      return;
    }

    const direction = new THREE.Vector3().subVectors(nextPoint, currentPoint);
    const segmentLength = direction.length();
    direction.normalize();

    let currentSpeed = enemy.speed;
    if (Date.now() < enemy.slowedUntil) {
      currentSpeed *= 0.5; // 50% slow
    }
    const moveDistance = currentSpeed * deltaTime * 3; // Speed multiplier
    enemy.pathProgress += moveDistance / segmentLength;

    if (enemy.pathProgress >= 1) {
      enemy.pathIndex++;
      enemy.pathProgress = 0;
      
      if (enemy.pathIndex >= this.pathPoints.length - 1) {
        enemy.reachedEnd = true;
        return;
      }
    }

    // Interpolate position
    const currentPathPoint = this.pathPoints[enemy.pathIndex];
    const nextPathPoint = this.pathPoints[enemy.pathIndex + 1];
    
    if (nextPathPoint) {
      enemy.position.lerpVectors(currentPathPoint, nextPathPoint, enemy.pathProgress);
      
      // Rotate to face movement direction
      const moveDir = new THREE.Vector3().subVectors(nextPathPoint, currentPathPoint).normalize();
      const angle = Math.atan2(moveDir.x, moveDir.z);
      enemy.group.rotation.y = angle;
    }

    // Floating animation
    const time = Date.now() * 0.003;
    enemy.body.position.y = 0.6 + Math.sin(time + enemy.pathIndex) * 0.1;
    enemy.head.position.y = 1.5 + Math.sin(time + enemy.pathIndex) * 0.1;
  }

  getEnemiesAtEnd() {
    return this.enemies.filter(enemy => enemy.reachedEnd);
  }

  getDestroyedEnemies() {
    return this.enemies.filter(enemy => enemy.destroyed);
  }

  removeEnemies(enemiesToRemove) {
    enemiesToRemove.forEach(enemy => {
      this.scene.remove(enemy.group);
    });
    
    this.enemies = this.enemies.filter(enemy => 
      !enemiesToRemove.includes(enemy)
    );
  }
}