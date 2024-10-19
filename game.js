const config = {
    type: Phaser.AUTO,
    width: 1600,  // Doubled from 800
    height: 1200, // Doubled from 600
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false // Change this to false to remove the purple squares
        }
    }
};

const game = new Phaser.Game(config);

let ship;
let cursors;
let bullets;
let asteroids;
let currentLevel = 1;
let levelTime = 5000; // 10 seconds in milliseconds
let levelTimer;
let scoreText;
let livesText;
let timeText;
let score = 0;
let lives = 3;
let levelText; // Add this new variable for the level display
let levelAssets = {};

function preload() {
    console.log('Preload function started');
    try {
        // Load assets for all levels
        for (let level = 1; level <= 5; level++) {
            this.load.image(`ship${level}`, `assets/level${level}/ship.png`);
            this.load.image(`asteroid${level}`, `assets/level${level}/asteroid.png`);
            this.load.image(`bullet${level}`, `assets/level${level}/bullet.png`);
            this.load.image(`ufo${level}`, `assets/level${level}/ufo.png`);
        }
        console.log('All assets loaded successfully');
    } catch (error) {
        console.error('Error loading assets:', error);
    }
}

function create() {
    console.log('Create function started');
    try {
        // Create player ship
        updateLevelAssets(this, currentLevel);
        ship = this.physics.add.image(800, 600, levelAssets.ship); // Updated starting position
        ship.setCollideWorldBounds(true);
        ship.setScale(0.2); // Doubled from 0.1
        console.log('Ship created at', ship.x, ship.y);

        // Set up keyboard input
        cursors = this.input.keyboard.createCursorKeys();

        // Create bullet group
        bullets = this.physics.add.group({
            defaultKey: levelAssets.bullet,
            maxSize: 10
        });

        // Create asteroid group
        asteroids = this.physics.add.group();

        // Add collision detection
        this.physics.add.collider(bullets, asteroids, bulletHitAsteroid, null, this);
        this.physics.add.collider(ship, asteroids, shipHitAsteroid, null, this);

        // Add UI elements
        levelText = this.add.text(32, 32, 'Level: 1', { fontSize: '64px', fill: '#fff' }); // Doubled font size and position
        scoreText = this.add.text(32, 112, 'Score: 0', { fontSize: '64px', fill: '#fff' });
        livesText = this.add.text(32, 192, 'Lives: 3', { fontSize: '64px', fill: '#fff' });
        timeText = this.add.text(32, 272, 'Time: 10', { fontSize: '64px', fill: '#fff' });

        // Start level timer
        levelTimer = this.time.delayedCall(levelTime, () => nextLevel(this), [], this);

        // Spawn initial asteroids
        spawnAsteroids(this);

        console.log('Create function completed successfully');
    } catch (error) {
        console.error('Error in create function:', error);
    }
}

function update() {
    try {
        // Rotate ship
        if (cursors.left.isDown) {
            ship.angle -= 2; // Reduced from 3 to account for larger screen
        } else if (cursors.right.isDown) {
            ship.angle += 2; // Reduced from 3 to account for larger screen
        }

        // Shoot bullets
        if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
            shootBullet(this);
        }

        // Update time text
        const timeLeft = Math.ceil((levelTime - levelTimer.getElapsed()) / 1000);
        timeText.setText('Time: ' + timeLeft);

        // Update bullet positions
        bullets.children.entries.forEach((bullet) => {
            bullet.lifespan -= 16; // Assuming 60 FPS
            if (bullet.lifespan <= 0) {
                bullet.destroy();
            }
        });
    } catch (error) {
        console.error('Error in update function:', error);
    }
}

function shootBullet(scene) {
    // Calculate bullet spawn position at the tip of the ship
    const bulletX = ship.x + Math.cos(ship.rotation) * ship.width * 0.2 / 2; // Updated from 0.1 to 0.2
    const bulletY = ship.y + Math.sin(ship.rotation) * ship.height * 0.2 / 2; // Updated from 0.1 to 0.2

    const bullet = bullets.get(bulletX, bulletY);
    if (bullet) {
        bullet.setTexture(levelAssets.bullet);
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setScale(0.2); // Doubled from 0.1
        bullet.setRotation(ship.rotation);
        scene.physics.velocityFromRotation(ship.rotation, 800, bullet.body.velocity); // Doubled speed from 400
        bullet.lifespan = 1000; // Bullet lives for 1 second
    }
}

function spawnAsteroids(scene, count = 5) {
    for (let i = 0; i < count; i++) {
        const x = Phaser.Math.Between(0, 1600);
        const y = Phaser.Math.Between(0, 1200);
        const asteroid = asteroids.create(x, y, levelAssets.asteroid);
        asteroid.setScale(0.2);
        asteroid.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200));
    }
}

function bulletHitAsteroid(bullet, asteroid) {
    bullet.destroy();
    asteroid.destroy();
    score += 10;
    scoreText.setText('Score: ' + score);
}

function shipHitAsteroid(ship, asteroid) {
    asteroid.destroy();
    lives--;
    livesText.setText('Lives: ' + lives);
    if (lives <= 0) {
        // Game over logic
    }
}

function nextLevel(scene) {
    currentLevel++;
    console.log('Moving to level:', currentLevel);
    if (currentLevel > 5) {
        console.log('Game completed');
        // Game completion logic
        scene.scene.restart(); // Restart the game for now
    } else {
        // Update level assets
        updateLevelAssets(scene, currentLevel);

        // Update ship texture
        ship.setTexture(levelAssets.ship);

        // Update level text
        levelText.setText('Level: ' + currentLevel);

        // Reset level and update assets
        score = 0;
        scoreText.setText('Score: ' + score);
        
        // Clear existing asteroids
        asteroids.clear(true, true);
        
        // Spawn new asteroids
        spawnAsteroids(scene);
        
        // Reset the timer
        if (levelTimer) levelTimer.remove();
        levelTimer = scene.time.delayedCall(levelTime, () => nextLevel(scene), [], scene);
        
        console.log('Level ' + currentLevel + ' started');

        // Add level-specific logic here
        if (currentLevel === 3) {
            // Add any special behavior for level 3
            console.log('Level 3 specific logic activated');
            // For example, you could increase the number of asteroids:
            spawnAsteroids(scene, 8); // Spawn 8 asteroids instead of 5
        }
    }
}

function updateLevelAssets(scene, level) {
    levelAssets = {
        ship: `ship${level}`,
        asteroid: `asteroid${level}`,
        bullet: `bullet${level}`,
        ufo: `ufo${level}`
    };
}

// Add this at the end of the file
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', message, 'at', source, 'line', lineno, 'column', colno);
    console.error('Error object:', error);
};
