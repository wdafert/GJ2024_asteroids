// At the top of the file, add:
import IntroScene from './IntroScene.js';
import MainScene from './MainScene.js';

// Replace the existing config object with:
const config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 1200,
    parent: 'game-container',
    scene: [IntroScene, MainScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

// Initialize the game
const game = new Phaser.Game(config);

// Level configurations
const levelConfigs = {
    1: {
        duration: 5000,
        asteroidCount: 5,
        shipControl: true,
        asteroidsBullets: false,
        shipRotates: true,
        asteroidMovement: true,
        asteroidSplits: true
    },
    // ... (keep the rest of the level configurations)
};

// Keep any other utility functions you need
