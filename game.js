const config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 1200,
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

const game = new Phaser.Game(config);

let ship;
let cursors;
let bullets;
let asteroids;
let currentLevel = 1;
let levelTimer;
let scoreText;
let livesText;
let timeText;
let levelText;
let score = 0;
let lives = 3;

const levelConfigs = {
    1: {
        duration: 5000,
        asteroidCount: 5,
        shipControl: true,
        asteroidsBullets: false,
        shipRotates: true,
        asteroidMovement: true
    },
    2: {
        duration: 5000,
        asteroidCount: 8,
        shipControl: false,
        asteroidsBullets: true,
        shipRotates: false,
        asteroidMovement: false
    },
    3: {
        duration: 5000,
        asteroidCount: 10,
        shipControl: true,
        asteroidsBullets: false,
        shipRotates: true,
        asteroidMovement: true
    },
    // Add configurations for levels 4 and 5 here
};

function preload() {
    console.log('Preload function started');
    try {
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
        cursors = this.input.keyboard.createCursorKeys();
        bullets = this.physics.add.group();
        asteroids = this.physics.add.group();

        levelText = this.add.text(32, 32, 'Level: 1', { fontSize: '32px', fill: '#fff' });
        scoreText = this.add.text(32, 72, 'Score: 0', { fontSize: '32px', fill: '#fff' });
        livesText = this.add.text(32, 112, 'Lives: 3', { fontSize: '32px', fill: '#fff' });
        timeText = this.add.text(32, 152, 'Time: 10', { fontSize: '32px', fill: '#fff' });

        setupLevel(this);

        console.log('Create function completed successfully');
    } catch (error) {
        console.error('Error in create function:', error);
    }
}

function update() {
    try {
        const levelConfig = levelConfigs[currentLevel];

        if (levelConfig.shipControl) {
            if (levelConfig.shipRotates) {
                if (cursors.left.isDown) ship.angle -= 2;
                else if (cursors.right.isDown) ship.angle += 2;
            }
            if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
                shootBullet(this);
            }
        } else {
            if (cursors.left.isDown || cursors.right.isDown) {
                const rotationDirection = cursors.left.isDown ? -2 : 2;
                asteroids.getChildren().forEach(asteroid => {
                    asteroid.angle += rotationDirection;
                });
            }
            if (Phaser.Input.Keyboard.JustDown(cursors.space) && levelConfig.asteroidsBullets) {
                asteroids.getChildren().forEach(asteroid => {
                    shootBulletFromAsteroid(this, asteroid);
                });
            }
        }

        const timeLeft = Math.ceil((levelConfig.duration - levelTimer.getElapsed()) / 1000);
        timeText.setText('Time: ' + timeLeft);

        bullets.children.entries.forEach((bullet) => {
            bullet.lifespan -= 16;
            if (bullet.lifespan <= 0) {
                bullet.destroy();
            }
        });
    } catch (error) {
        console.error('Error in update function:', error);
    }
}

function setupLevel(scene) {
    const levelConfig = levelConfigs[currentLevel];

    if (ship) ship.destroy();
    ship = scene.physics.add.image(config.width / 2, config.height / 2, `ship${currentLevel}`);
    ship.setCollideWorldBounds(true);
    ship.setScale(0.2);
    ship.setImmovable(!levelConfig.shipControl);

    asteroids.clear(true, true);
    bullets.clear(true, true);

    spawnAsteroids(scene, levelConfig.asteroidCount, !levelConfig.asteroidMovement);

    // Use different collision functions based on the level
    if (currentLevel === 2) {
        scene.physics.add.collider(bullets, ship, bulletHitShipLevel2, null, scene);
    } else {
        scene.physics.add.collider(bullets, asteroids, bulletHitTarget, null, scene);
        scene.physics.add.collider(ship, asteroids, shipHitAsteroid, null, scene);
    }

    if (levelTimer) levelTimer.remove();
    levelTimer = scene.time.delayedCall(levelConfig.duration, () => nextLevel(scene), [], scene);

    levelText.setText('Level: ' + currentLevel);
    score = 0;
    scoreText.setText('Score: ' + score);
    lives = 3;
    livesText.setText('Lives: ' + lives);

    console.log('Level ' + currentLevel + ' started');
}

function shootBullet(scene) {
    const bulletX = ship.x + Math.cos(ship.rotation) * ship.width * 0.2 / 2;
    const bulletY = ship.y + Math.sin(ship.rotation) * ship.height * 0.2 / 2;

    const bullet = bullets.create(bulletX, bulletY, `bullet${currentLevel}`);
    bullet.setScale(0.2);
    bullet.setRotation(ship.rotation);
    scene.physics.velocityFromRotation(ship.rotation, 800, bullet.body.velocity);
    bullet.lifespan = 1000;
}

function shootBulletFromAsteroid(scene, asteroid) {
    const bulletX = asteroid.x + Math.cos(asteroid.rotation) * asteroid.width * 0.2 / 2;
    const bulletY = asteroid.y + Math.sin(asteroid.rotation) * asteroid.height * 0.2 / 2;

    const bullet = bullets.create(bulletX, bulletY, `bullet${currentLevel}`);
    bullet.setScale(0.2);
    bullet.setRotation(asteroid.rotation);
    scene.physics.velocityFromRotation(asteroid.rotation, 800, bullet.body.velocity);
    bullet.lifespan = 1000;
}

function spawnAsteroids(scene, count, fixedPositions) {
    for (let i = 0; i < count; i++) {
        let x, y;
        if (fixedPositions) {
            const angle = (i / count) * Math.PI * 2;
            const radius = Math.min(config.width, config.height) * 0.4;
            x = config.width / 2 + Math.cos(angle) * radius;
            y = config.height / 2 + Math.sin(angle) * radius;
        } else {
            x = Phaser.Math.Between(0, config.width);
            y = Phaser.Math.Between(0, config.height);
        }
        const asteroid = asteroids.create(x, y, `asteroid${currentLevel}`);
        asteroid.setScale(0.2);
        if (!fixedPositions) {
            asteroid.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200));
        }
    }
}

function bulletHitTarget(bullet, target) {
    bullet.destroy();
    if (target !== ship) {
        target.destroy();
        score += 10;
        scoreText.setText('Score: ' + score);
    }
}

function bulletHitShipLevel2(bullet, ship) {
    bullet.destroy();
    lives--;
    livesText.setText('Lives: ' + lives);
    console.log('Ship hit in level 2, ending level');
    if (levelTimer) levelTimer.remove();
    // Use a short delay to ensure all game logic has completed before moving to the next level
    this.time.delayedCall(100, () => nextLevel(this), [], this);
}

function shipHitAsteroid(ship, asteroid) {
    if (!levelConfigs[currentLevel].asteroidsBullets) {
        asteroid.destroy();
        lives--;
        livesText.setText('Lives: ' + lives);
        checkGameOver(this.scene);
    }
}

function checkGameOver(scene) {
    if (lives <= 0) {
        console.log('Game Over');
        nextLevel(scene);
    }
}

function nextLevel(scene) {
    currentLevel++;
    console.log('Moving to level:', currentLevel);
    if (currentLevel > 5) {
        console.log('Game completed');
        scene.scene.restart();
        currentLevel = 1;
    } else {
        if (levelTimer) levelTimer.remove(); // Ensure any existing timer is removed
        setupLevel(scene);
    }
}

window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', message, 'at', source, 'line', lineno, 'column', colno);
    console.error('Error object:', error);
};
