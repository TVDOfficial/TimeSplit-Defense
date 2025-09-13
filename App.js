import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [money, setMoney] = useState(150);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [enemiesLeft, setEnemiesLeft] = useState(10);
  const [selectedTower, setSelectedTower] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  const towers = [
    { id: 'plasma', name: 'Plasma Rifle', cost: 50, icon: '⚡' },
    { id: 'gatling', name: 'Gatling Laser', cost: 100, icon: '🔫' },
    { id: 'cryo', name: 'Cryo Cannon', cost: 125, icon: '❄' },
    { id: 'beam', name: 'Beam Cannon', cost: 200, icon: '🔴' },
    { id: 'missile', name: 'Missile Pod', cost: 250, icon: '💥' },
    { id: 'tesla', name: 'Tesla Coil', cost: 350, icon: '⚡' },
  ];

  const startWave = () => {
    setGameStarted(true);
    // Game logic will go here
  };

  const selectTower = (towerId) => {
    const tower = towers.find(t => t.id === towerId);
    if (tower && money >= tower.cost) {
      setSelectedTower(towerId);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      {/* Background with gradient */}
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.background}
      >
        {/* Game UI */}
        <View style={styles.gameUI}>
          {/* Top Panel */}
          <View style={styles.topPanel}>
            <View style={styles.moneyContainer}>
              <Text style={styles.moneyText}>${money}</Text>
            </View>
            <View style={styles.livesContainer}>
              <Text style={styles.livesText}>Lives: {lives}</Text>
            </View>
          </View>

          {/* Wave Panel */}
          <View style={styles.wavePanel}>
            <Text style={styles.waveText}>WAVE {wave}</Text>
            <Text style={styles.enemiesText}>{enemiesLeft} enemies left</Text>
          </View>

          {/* Tower Selection Panel */}
          <View style={styles.towerPanel}>
            {towers.map((tower) => (
              <TouchableOpacity
                key={tower.id}
                style={[
                  styles.towerButton,
                  selectedTower === tower.id && styles.selectedTower,
                  money < tower.cost && styles.disabledTower
                ]}
                onPress={() => selectTower(tower.id)}
                disabled={money < tower.cost}
              >
                <View style={styles.towerIcon}>
                  <Text style={styles.towerIconText}>{tower.icon}</Text>
                </View>
                <Text style={styles.towerName}>{tower.name}</Text>
                <Text style={styles.towerCost}>${tower.cost}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={[styles.startButton, gameStarted && styles.startButtonActive]}
            onPress={startWave}
          >
            <Text style={styles.startButtonText}>
              {gameStarted ? 'WAVE IN PROGRESS' : 'START WAVE'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Portals */}
        <View style={styles.portalsContainer}>
          {/* Start Portal */}
          <View style={[styles.portal, styles.startPortal]}>
            <View style={styles.portalRing} />
            <View style={styles.portalCore} />
            <Text style={styles.portalLabel}>SPAWN</Text>
          </View>

          {/* End Portal */}
          <View style={[styles.portal, styles.endPortal]}>
            <View style={[styles.portalRing, styles.endPortalRing]} />
            <View style={[styles.portalCore, styles.endPortalCore]} />
            <Text style={[styles.portalLabel, styles.endPortalLabel]}>EXIT</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  background: {
    flex: 1,
  },
  gameUI: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  topPanel: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  moneyContainer: {
    backgroundColor: 'rgba(20, 20, 40, 0.95)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  moneyText: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  livesContainer: {
    backgroundColor: 'rgba(20, 20, 40, 0.95)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  livesText: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  wavePanel: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(20, 20, 40, 0.95)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00ffff',
    alignItems: 'center',
  },
  waveText: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  enemiesText: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  towerPanel: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -width * 0.4 }],
    flexDirection: 'row',
    gap: 10,
  },
  towerButton: {
    width: 70,
    height: 80,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderWidth: 2,
    borderColor: '#00ffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  selectedTower: {
    borderColor: '#ff6b35',
    backgroundColor: 'rgba(15, 52, 96, 0.95)',
  },
  disabledTower: {
    opacity: 0.5,
    borderColor: '#666',
  },
  towerIcon: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  towerIconText: {
    fontSize: 16,
    color: '#00ffff',
  },
  towerName: {
    color: '#00ffff',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  towerCost: {
    color: '#00ffff',
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  startButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderWidth: 2,
    borderColor: '#00ffff',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  startButtonActive: {
    borderColor: '#ff6b35',
    backgroundColor: 'rgba(15, 52, 96, 0.95)',
  },
  startButtonText: {
    color: '#00ffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  portalsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  portal: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startPortal: {
    top: height * 0.2,
    left: width * 0.1,
  },
  endPortal: {
    bottom: height * 0.2,
    right: width * 0.1,
  },
  portalRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderWidth: 3,
    borderColor: '#00ffff',
    borderRadius: 30,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  endPortalRing: {
    borderColor: '#ff4757',
    shadowColor: '#ff4757',
  },
  portalCore: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 255, 255, 0.6)',
    borderRadius: 20,
  },
  endPortalCore: {
    backgroundColor: 'rgba(255, 71, 87, 0.6)',
  },
  portalLabel: {
    position: 'absolute',
    bottom: -20,
    color: '#00ffff',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  endPortalLabel: {
    color: '#ff4757',
    textShadowColor: 'rgba(255, 71, 87, 0.8)',
  },
});

