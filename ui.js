import * as THREE from 'three';
export class UI {
  constructor(gameManager, camera) {
    this.gameManager = gameManager;
    this.camera = camera;
    this.selectedTower = null;
    
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.moneyEl = document.getElementById('money');
    this.livesEl = document.getElementById('lives');
    this.waveEl = document.getElementById('wave');
    this.enemiesLeftEl = document.getElementById('enemies-left');
    this.startWaveBtn = document.getElementById('start-wave');
    this.towerButtons = document.querySelectorAll('.tower-button');
    
    // Upgrade panel elements
    this.upgradePanel = document.getElementById('upgrade-panel');
    this.upgradeTowerName = document.getElementById('upgrade-tower-name');
    this.upgradeDamage = document.getElementById('upgrade-damage');
    this.upgradeRange = document.getElementById('upgrade-range');
    this.upgradeRate = document.getElementById('upgrade-rate');
    this.upgradeDamageBtn = document.getElementById('upgrade-damage-btn');
    this.upgradeRangeBtn = document.getElementById('upgrade-range-btn');
    this.sellTowerBtn = document.getElementById('sell-tower-btn');
    this.upgradePanelCloseBtn = document.getElementById('upgrade-panel-close');
  }

  setupEventListeners() {
    // Tower selection
    this.towerButtons.forEach(button => {
      button.addEventListener('click', () => {
        const towerType = button.dataset.tower;
        
        // Remove previous selection
        this.towerButtons.forEach(btn => btn.classList.remove('selected'));
        
        if (this.selectedTower === towerType) {
          this.selectedTower = null;
        } else {
          this.selectedTower = towerType;
          button.classList.add('selected');
        }
      });
    });

    // Start wave button
    this.startWaveBtn.addEventListener('click', () => {
      this.gameManager.startWave();
    });
    // Upgrade buttons
    this.upgradeDamageBtn.addEventListener('click', () => {
      this.gameManager.upgradeTower('damage');
    });
    this.upgradeRangeBtn.addEventListener('click', () => {
      this.gameManager.upgradeTower('range');
    });
    this.sellTowerBtn.addEventListener('click', () => {
      this.gameManager.sellSelectedTower();
    });
    this.upgradePanelCloseBtn.addEventListener('click', () => {
      this.gameManager.deselectTower();
    });
  }

  update() {
    // Update UI elements
    this.moneyEl.textContent = this.gameManager.money;
    this.livesEl.textContent = this.gameManager.lives;
    this.waveEl.textContent = this.gameManager.wave;
    const enemiesLeft = this.gameManager.enemiesRemaining + this.gameManager.enemySystem.spawnQueue.length;
    this.enemiesLeftEl.textContent = Math.max(0, enemiesLeft);

    // Update start wave button
    if (this.gameManager.waveActive) {
      this.startWaveBtn.textContent = 'WAVE ACTIVE';
      this.startWaveBtn.style.opacity = '0.5';
      this.startWaveBtn.style.cursor = 'not-allowed';
    } else {
      this.startWaveBtn.textContent = 'START WAVE';
      this.startWaveBtn.style.opacity = '1';
      this.startWaveBtn.style.cursor = 'pointer';
    }

    // Update tower button affordability
    const costs = { basic: 50, rapid: 100, laser: 200, frost: 125, artillery: 250, tesla: 350 };
    this.towerButtons.forEach(button => {
      const cost = costs[button.dataset.tower];
      if (this.gameManager.money < cost) {
        button.style.opacity = '0.5';
      } else {
        button.style.opacity = '1';
      }
    });

    // Game over check
    if (this.gameManager.lives <= 0) {
      this.showGameOver();
    }
    
    this.updateUpgradePanel();
  }

  showGameOver() {
    const gameOverDiv = document.createElement('div');
    gameOverDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 40px;
      border-radius: 20px;
      text-align: center;
      font-size: 24px;
      z-index: 1000;
    `;
    gameOverDiv.innerHTML = `
      <h2>Game Over!</h2>
      <p>You reached Wave ${this.gameManager.wave}</p>
      <button onclick="location.reload()" style="
        background: #4caf50;
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 10px;
        font-size: 18px;
        cursor: pointer;
        margin-top: 20px;
      ">Play Again</button>
    `;
    document.body.appendChild(gameOverDiv);
  }
  updateUpgradePanel() {
    const tower = this.gameManager.selectedTowerForUpgrade;
    if (tower) {
      this.upgradePanel.style.display = 'block';
      this.upgradeTowerName.textContent = tower.type;
      this.upgradeDamage.textContent = tower.damage;
      this.upgradeRange.textContent = tower.range.toFixed(1);
      this.upgradeRate.textContent = tower.fireRate.toFixed(1);
      // Update upgrade button text and disabled state
      const upgradeCosts = {
        damage: 100 * (tower.upgrades.damage + 1),
        range: 75 * (tower.upgrades.range + 1)
      };
      this.upgradeDamageBtn.textContent = `Upgrade Damage ($${upgradeCosts.damage})`;
      this.upgradeRangeBtn.textContent = `Upgrade Range ($${upgradeCosts.range})`;
      this.upgradeDamageBtn.disabled = this.gameManager.money < upgradeCosts.damage;
      this.upgradeRangeBtn.disabled = this.gameManager.money < upgradeCosts.range;
      
      this.upgradeDamageBtn.style.opacity = this.upgradeDamageBtn.disabled ? '0.5' : '1';
      this.upgradeRangeBtn.style.opacity = this.upgradeRangeBtn.disabled ? '0.5' : '1';
      this.positionUpgradePanel(tower);
      // Update sell button text
      const sellValue = this.gameManager.getTowerSellValue(tower);
      this.sellTowerBtn.textContent = `Sell ($${sellValue})`;
    } else {
      this.upgradePanel.style.display = 'none';
    }
  }
  positionUpgradePanel(tower) {
    const screenPosition = new THREE.Vector3();
    tower.group.getWorldPosition(screenPosition);
    screenPosition.project(this.camera);
    const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
    const y = (screenPosition.y * -0.5 + 0.5) * window.innerHeight;
    this.upgradePanel.style.left = `${x}px`;
    this.upgradePanel.style.top = `${y}px`;
    // Adjust position to prevent going off-screen
    const panelRect = this.upgradePanel.getBoundingClientRect();
    if (x + panelRect.width > window.innerWidth - 20) {
      this.upgradePanel.style.left = `${x - panelRect.width - 20}px`;
    } else {
       this.upgradePanel.style.left = `${x + 20}px`;
    }
    
    if (y + panelRect.height > window.innerHeight - 20) {
      this.upgradePanel.style.top = `${window.innerHeight - panelRect.height - 20}px`;
    }
  }
}