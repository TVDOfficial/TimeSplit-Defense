import * as THREE from 'three';
import { GameManager } from './gameManager.js';
import { SceneSetup } from './sceneSetup.js';
import { UI } from './ui.js';

class TowerDefenseGame {
  constructor() {
    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x4dd0e1); // Bright cyan sky
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Initialize game systems
    this.sceneSetup = new SceneSetup(this.scene);
    this.gameManager = new GameManager(this.scene, this.sceneSetup.pathPoints, this.camera);
    this.ui = new UI(this.gameManager, this.camera);
    // Camera setup
    this.camera.position.set(0, 25, 15);
    this.camera.lookAt(0, 0, 0);

    // Mouse interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.setupMouseControls();

    // Start game loop
    this.clock = new THREE.Clock();
    this.animate();

    // Window resize handler
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupMouseControls() {
    this.renderer.domElement.addEventListener('click', (event) => {
      // Prevent UI clicks from affecting the game world
      if (event.target.closest('.ui-panel, #upgrade-panel')) return;
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      // Check for tower clicks first
      const towerMeshes = this.gameManager.towerSystem.towers.map(t => t.group);
      const towerIntersects = this.raycaster.intersectObjects(towerMeshes, true);
      if (towerIntersects.length > 0) {
        let clickedGroup = towerIntersects[0].object;
        while(clickedGroup.parent && !clickedGroup.userData.isTowerGroup) {
          clickedGroup = clickedGroup.parent;
        }
        const tower = this.gameManager.towerSystem.getTowerByGroup(clickedGroup);
        this.gameManager.selectTowerForUpgrade(tower);
        return; // Stop further processing
      }
      
      // If no tower clicked, check for terrain click
      const terrainIntersects = this.raycaster.intersectObjects([this.sceneSetup.terrain]);
      if (terrainIntersects.length > 0) {
        // If placing a tower
        if (this.ui.selectedTower) {
          const point = terrainIntersects[0].point;
          this.gameManager.placeTower(point, this.ui.selectedTower);
        } else {
          // If just clicking terrain, deselect any tower
          this.gameManager.deselectTower();
        }
      } else {
        // Clicked empty space
        this.gameManager.deselectTower();
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    this.gameManager.update(deltaTime);
    this.ui.update();

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Start the game
new TowerDefenseGame();