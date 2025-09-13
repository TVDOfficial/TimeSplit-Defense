import * as THREE from 'three';

export class SceneSetup {
  constructor(scene) {
    this.scene = scene;
    this.pathPoints = [];
    this.setupLighting();
    this.createTerrain();
    this.createPath();
    this.createEnvironment();
  }

  setupLighting() {
    // Ambient light for bright, cheerful lighting
    const ambientLight = new THREE.AmbientLight(0x87ceeb, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    this.scene.add(directionalLight);
  }

  createTerrain() {
    // Create rolling hills terrain
    const geometry = new THREE.PlaneGeometry(40, 30, 32, 24);
    const vertices = geometry.attributes.position.array;

    // Add gentle rolling hills
    for (let i = 2; i < vertices.length; i += 3) {
      const x = vertices[i - 2];
      const z = vertices[i - 1];
      vertices[i] = Math.sin(x * 0.1) * 0.8 + Math.cos(z * 0.15) * 0.6;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({ 
      color: 0x4caf50, // Bright green
      side: THREE.DoubleSide 
    });
    
    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.rotation.x = -Math.PI / 2;
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
  }

  createPath() {
    // Define curved path points
    this.pathPoints = [
      new THREE.Vector3(-18, 0.2, -8),
      new THREE.Vector3(-12, 0.2, -6),
      new THREE.Vector3(-6, 0.2, -4),
      new THREE.Vector3(0, 0.2, -2),
      new THREE.Vector3(6, 0.2, 2),
      new THREE.Vector3(8, 0.2, 8),
      new THREE.Vector3(4, 0.2, 12),
      new THREE.Vector3(-2, 0.2, 10),
      new THREE.Vector3(-8, 0.2, 6),
      new THREE.Vector3(-12, 0.2, 2),
      new THREE.Vector3(-10, 0.2, -2),
      new THREE.Vector3(-4, 0.2, -6),
      new THREE.Vector3(2, 0.2, -8),
      new THREE.Vector3(8, 0.2, -6),
      new THREE.Vector3(12, 0.2, -2),
      new THREE.Vector3(18, 0.2, 2)
    ];

    // Create path geometry
    const pathGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(this.pathPoints),
      100, 1.2, 8, false
    );

    const pathMaterial = new THREE.MeshLambertMaterial({ color: 0x424242 });
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.receiveShadow = true;
    this.scene.add(path);

    // Create glowing path edges
    const glowGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(this.pathPoints),
      100, 1.4, 8, false
    );

    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00bcd4,
      transparent: true,
      opacity: 0.6
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(glow);
  }

  createEnvironment() {
    // Create stylized trees
    for (let i = 0; i < 15; i++) {
      this.createTree(
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 25
      );
    }

    // Create small bushes
    for (let i = 0; i < 20; i++) {
      this.createBush(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20
      );
    }
  }

  createTree(x, z) {
    if (this.isTooCloseToPath(x, z, 4)) return;

    const group = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    group.add(trunk);

    // Leaves (multiple spheres for cartoon look)
    const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    
    for (let i = 0; i < 3; i++) {
      const leafGeometry = new THREE.SphereGeometry(1.2 + Math.random() * 0.5, 8, 6);
      const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
      leaves.position.set(
        (Math.random() - 0.5) * 1.5,
        3 + i * 0.8,
        (Math.random() - 0.5) * 1.5
      );
      leaves.castShadow = true;
      group.add(leaves);
    }

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  createBush(x, z) {
    if (this.isTooCloseToPath(x, z, 2)) return;

    const geometry = new THREE.SphereGeometry(0.8, 8, 6);
    const material = new THREE.MeshLambertMaterial({ color: 0x388e3c });
    const bush = new THREE.Mesh(geometry, material);
    bush.position.set(x, 0.4, z);
    bush.scale.y = 0.6;
    bush.castShadow = true;
    this.scene.add(bush);
  }

  isTooCloseToPath(x, z, minDistance) {
    const point = new THREE.Vector3(x, 0, z);
    for (const pathPoint of this.pathPoints) {
      if (point.distanceTo(pathPoint) < minDistance) {
        return true;
      }
    }
    return false;
  }
}