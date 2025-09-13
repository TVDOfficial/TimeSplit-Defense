import * as THREE from 'three';

export class TowerSystem {
  constructor(scene, audioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.towers = [];
    this.projectiles = [];
  }

  placeTower(position, type) {
    const tower = this.createTower(position, type);
    this.towers.push(tower);
    this.scene.add(tower.group);
  }
  removeTower(towerToRemove) {
    this.scene.remove(towerToRemove.group);
    this.towers = this.towers.filter(tower => tower !== towerToRemove);
  }

  createTower(position, type) {
    const group = new THREE.Group();
    group.userData.isTowerGroup = true;
    
    let turret, barrel;
    if (type === 'basic') {
      // Create the new detailed Gun Turret model
      const lightGreyMat = new THREE.MeshLambertMaterial({ color: 0xe0e0e0 });
      const darkGreyMat = new THREE.MeshLambertMaterial({ color: 0x37474f });
      const blackMat = new THREE.MeshLambertMaterial({ color: 0x212121 });
      // Base
      const lowerBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 2.2), blackMat);
      lowerBase.position.y = 0.2;
      group.add(lowerBase);
      const upperBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 0.5, 4), lightGreyMat);
      upperBase.position.y = 0.65;
      upperBase.rotation.y = Math.PI / 4;
      group.add(upperBase);
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6), darkGreyMat);
      pedestal.position.y = 1.15;
      group.add(pedestal);
      
      // Turret (this will rotate)
      turret = new THREE.Group();
      turret.position.y = 1.65;
      group.add(turret);
      const turretCore = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), lightGreyMat);
      turret.add(turretCore);
      const sidePodGeom = new THREE.BoxGeometry(0.6, 0.8, 1.2);
      const leftPod = new THREE.Mesh(sidePodGeom, lightGreyMat);
      leftPod.position.x = -0.7;
      turret.add(leftPod);
      const rightPod = new THREE.Mesh(sidePodGeom, lightGreyMat);
      rightPod.position.x = 0.7;
      turret.add(rightPod);
      // Barrels (this will be the 'barrel' for logic)
      barrel = new THREE.Group();
      barrel.position.z = 0.4;
      turret.add(barrel);
      
      const barrelGeom = new THREE.CylinderGeometry(0.1, 0.1, 1.2);
      const barrelPositions = [
          new THREE.Vector3(-0.7, 0.15, 0), new THREE.Vector3(-0.7, -0.15, 0),
          new THREE.Vector3(0.7, 0.15, 0),  new THREE.Vector3(0.7, -0.15, 0)
      ];
      barrelPositions.forEach(pos => {
          const b = new THREE.Mesh(barrelGeom, blackMat);
          b.rotation.x = Math.PI / 2;
          b.position.copy(pos);
          barrel.add(b);
      });
    } else {
      // --- Existing logic for other towers ---
      const baseGeometry = new THREE.CylinderGeometry(1.2, 1.5, 0.8);
      const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x37474f });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.4;
      base.castShadow = true;
      group.add(base);
      turret = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.2), new THREE.MeshLambertMaterial({ color: 0x546e7a }));
      turret.position.y = 1.4;
      turret.castShadow = true;
      group.add(turret);
      
      let barrelGeometry, barrelMaterial;
      if (type === 'rapid') {
        barrelGeometry = new THREE.BoxGeometry(0.3, 0.3, 1.5);
        barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x263238 });
      } else if (type === 'laser') {
        barrelGeometry = new THREE.ConeGeometry(0.2, 1.2);
        barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a237e });
      } else if (type === 'frost') {
        barrelGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x00bcd4 });
      } else if (type === 'artillery') {
        barrelGeometry = new THREE.CylinderGeometry(0.3, 0.25, 2.0);
        barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
      } else if (type === 'tesla') {
        barrelGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x455a64 });
      }
      barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(0, 1.8, 0.75);
      barrel.rotation.x = Math.PI / 2;
      barrel.castShadow = true;
      group.add(barrel);
    }
    
    // Glowing elements - kept separate
    if (type === 'laser') {
      const glowGeometry = new THREE.SphereGeometry(0.1, 8, 6);
      const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x00bcd4 });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(0, 1.8, 1.3);
      group.add(glow);
    } else if (type === 'tesla') {
      const coilGeometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
      const coilMaterial = new THREE.MeshBasicMaterial({ color: 0xfdd835 });
      const coil = new THREE.Mesh(coilGeometry, coilMaterial);
      coil.position.set(0, 1.8, 0);
      coil.rotation.x = Math.PI / 2;
      group.add(coil);
    }

    group.position.copy(position);

    const towerStats = {
      basic: { damage: 30, range: 6, fireRate: 1.0, slow: 0 },
      rapid: { damage: 15, range: 5, fireRate: 3.0, slow: 0 },
      laser: { damage: 50, range: 8, fireRate: 0.5, slow: 0 },
      frost: { damage: 5, range: 7, fireRate: 0.8, slow: 0.5 },
      artillery: { damage: 100, range: 12, fireRate: 0.4, slow: 0 }, // High damage, low rate, long range
      tesla: { damage: 30, range: 5, fireRate: 1.0, slow: 0 } // Chain lightning effect is custom
    };

    return {
      group,
      type,
      position,
      turret,
      barrel,
      target: null,
      lastFireTime: 0,
      upgrades: { damage: 0, range: 0, rate: 0 },
      ...towerStats[type]
    };
  }
  getTowerByGroup(group) {
    return this.towers.find(t => t.group === group);
  }
  update(deltaTime, enemies) {
    this.allEnemies = enemies; // Store for use in firing logic
    const currentTime = Date.now() / 1000;

    // Update towers
    this.towers.forEach(tower => {
      // Find closest enemy in range
      let closestEnemy = null;
      let closestDistance = tower.range;

      enemies.forEach(enemy => {
        const distance = tower.position.distanceTo(enemy.position);
        if (distance < closestDistance) {
          closestEnemy = enemy;
          closestDistance = distance;
        }
      });

      tower.target = closestEnemy;

      // Rotate turret towards target
      if (tower.target) {
        const direction = new THREE.Vector3()
          .subVectors(tower.target.position, tower.position)
          .normalize();
        const angle = Math.atan2(direction.x, direction.z);
        tower.turret.rotation.y = angle;
        // The new basic tower's barrel is a group, so it doesn't need individual rotation
        if (tower.type !== 'basic') {
          tower.barrel.rotation.y = angle;
        }

        // Fire at target
        if (currentTime - tower.lastFireTime > 1 / tower.fireRate) {
          this.fireTower(tower, enemies);
          tower.lastFireTime = currentTime;
        }
      }
    });

    // Update projectiles
    this.projectiles = this.projectiles.filter(projectile => {
      projectile.position.add(projectile.velocity.clone().multiplyScalar(deltaTime));
      
      // Check collision with target
      if (projectile.target && projectile.position.distanceTo(projectile.target.position) < 0.5) {
        projectile.target.takeDamage(projectile.damage, projectile.slow);
        this.createHitEffect(projectile.position, projectile.type);
        this.scene.remove(projectile.mesh);
        return false;
      }

      // Remove if too far
      if (projectile.position.length() > 50) {
        this.scene.remove(projectile.mesh);
        return false;
      }

      return true;
    });
  }

  fireTower(tower, enemies) {
    if (!tower.target) return;

    const startPos = tower.position.clone();
    startPos.y += 2;

    const direction = new THREE.Vector3()
      .subVectors(tower.target.position, startPos)
      .normalize();

    let projectileGeometry, projectileMaterial;
    
    if (tower.type === 'laser') {
      // Create beam effect
      this.createLaserBeam(startPos, tower.target.position);
      tower.target.takeDamage(tower.damage);
      this.audioManager.playSound('laser');
      return;
    } else if (tower.type === 'tesla') {
        const maxJumps = 4;
        const jumpRange = 5;
        let currentTarget = tower.target;
        const hitEnemies = [currentTarget];
        let lastPosition = tower.position.clone();
        lastPosition.y = 1.8; // Tesla coil height
        for (let i = 0; i < maxJumps; i++) {
            if (!currentTarget || currentTarget.destroyed) break;
            const damage = tower.damage * Math.pow(0.75, i); // Damage falls off
            currentTarget.takeDamage(damage);
            this.createLightningBolt(lastPosition, currentTarget.position);
            lastPosition = currentTarget.position.clone();
            let nextTarget = null;
            let closestDist = jumpRange;
            this.allEnemies.forEach(enemy => {
                if (!hitEnemies.includes(enemy) && !enemy.destroyed) {
                    const dist = currentTarget.position.distanceTo(enemy.position);
                    if (dist < closestDist) {
                        closestDist = dist;
                        nextTarget = enemy;
                    }
                }
            });
            
            currentTarget = nextTarget;
            if (currentTarget) {
                hitEnemies.push(currentTarget);
            }
        }
        this.audioManager.playSound('laser'); // TODO: Add a unique tesla sound
        return;
    } else {
      switch (tower.type) {
        case 'frost':
          projectileGeometry = new THREE.IcosahedronGeometry(0.15, 0); // Ice shard
          projectileMaterial = new THREE.MeshBasicMaterial({ color: 0x80deea });
          break;
        case 'rapid':
          projectileGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.4); // Tracer
          projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });
          break;
        case 'artillery':
          projectileGeometry = new THREE.SphereGeometry(0.3, 8, 8); // Shell
          projectileMaterial = new THREE.MeshBasicMaterial({ color: 0x5d4037 });
          break;
        default: // basic
          projectileGeometry = new THREE.SphereGeometry(0.15, 6, 6);
          projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
      }
    }

    const projectileMesh = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectileMesh.position.copy(startPos);
    this.scene.add(projectileMesh);

    this.projectiles.push({
      mesh: projectileMesh,
      position: startPos,
      velocity: direction.multiplyScalar(20),
      target: tower.target,
      damage: tower.damage,
      slow: tower.slow,
      type: tower.type
    });
    if (tower.type !== 'laser') {
        this.audioManager.playSound('shoot');
    }
  }

  createLaserBeam(start, end) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, length);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00bcd4,
      transparent: true,
      opacity: 0.8
    });
    
    const beam = new THREE.Mesh(geometry, material);
    beam.position.copy(start).add(direction.multiplyScalar(0.5));
    beam.lookAt(end);
    beam.rotateX(Math.PI / 2);
    
    this.scene.add(beam);

    // Remove beam after short time
    setTimeout(() => {
      this.scene.remove(beam);
    }, 100);
  }
  createLightningBolt(start, end) {
      const points = [];
      const numSegments = 10;
      const direction = new THREE.Vector3().subVectors(end, start);
      
      points.push(start);
      for (let i = 1; i < numSegments; i++) {
          const pos = start.clone().add(direction.clone().multiplyScalar(i / numSegments));
          pos.add(new THREE.Vector3(
              (Math.random() - 0.5) * 0.8,
              (Math.random() - 0.5) * 0.8,
              (Math.random() - 0.5) * 0.8
          ));
          points.push(pos);
      }
      points.push(end);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
          color: 0xfdd835,
          linewidth: 2,
          transparent: true,
          opacity: 0.9
      });
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      setTimeout(() => {
          this.scene.remove(line);
      }, 150); // Lightning is very fast
  }
  createHitEffect(position, type) {
    // Create explosion particles
    const particleCount = type === 'frost' ? 10 : 5;
    const particleColor = type === 'frost' ? 0x00e5ff : 0xff5722;
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 6, 6);
      const material = new THREE.MeshBasicMaterial({ color: particleColor, transparent: true });
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.copy(position);
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3,
        (Math.random() - 0.5) * 4
      );
      
      this.scene.add(particle);
      
      // Animate particle
      let life = 1.0;
      const animate = () => {
        life -= 0.05;
        particle.position.add(particle.velocity.clone().multiplyScalar(0.02));
        particle.velocity.y -= 0.1; // gravity
        particle.material.opacity = life;
        
        if (life > 0) {
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(particle);
        }
      };
      animate();
    }
  }
}