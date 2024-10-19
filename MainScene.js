class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        
        // Add level configurations here
        this.levelConfigs = {
            1: {
                duration: 5000,
                asteroidCount: 5,
                shipControl: true,
                asteroidsBullets: false,
                shipRotates: true,
                asteroidMovement: true,
                asteroidSplits: true
            },
            2: {
                duration: 5000,
                asteroidCount: 8,
                shipControl: false,
                asteroidsBullets: true,
                shipRotates: false,
                asteroidMovement: false,
                asteroidSplits: true
            },
            3: {
                duration: 5000,
                asteroidCount: 10,
                shipControl: true,
                asteroidsBullets: false,
                shipRotates: true,
                asteroidMovement: true,
                asteroidSplits: false
            },
            4: {
                duration: 5000,
                asteroidCount: 12,
                shipControl: true,
                asteroidsBullets: false,
                shipRotates: true,
                asteroidMovement: true,
                asteroidSplits: true
            },
            5: {
                duration: 5000,
                asteroidCount: 8,
                shipControl: true,
                asteroidsBullets: true,
                shipRotates: true,
                asteroidMovement: true,
                asteroidSplits: true,
                ufoSpawn: true
            }
        };
    }

    init(data) {
        this.customBulletSoundData = data.customBulletSound;
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 3;
    }

    preload() {
        console.log('Preload function started');
        try {
            // Load assets for each level
            for (let level = 1; level <= 5; level++) {
                this.load.image(`ship${level}`, `assets/level${level}/ship.png`);
                this.load.image(`asteroid${level}`, `assets/level${level}/asteroid.png`);
                this.load.image(`bullet${level}`, `assets/level${level}/bullet.png`);
                this.load.image(`ufo${level}`, `assets/level${level}/ufo.png`);
            }
            // Load default bullet sound
            this.load.audio('defaultBulletSound', 'assets/sound/level1/bullet.mp3');
            console.log('All assets loaded successfully');
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }

    create() {
        console.log('Create function started');
        try {
            // Set up input, groups, and UI elements
            this.cursors = this.input.keyboard.createCursorKeys();
            this.bullets = this.physics.add.group();
            this.asteroids = this.physics.add.group();

            this.levelText = this.add.text(32, 32, 'Level: 1', { fontSize: '32px', fill: '#fff' });
            this.scoreText = this.add.text(32, 72, 'Score: 0', { fontSize: '32px', fill: '#fff' });
            this.livesText = this.add.text(32, 112, 'Lives: 3', { fontSize: '32px', fill: '#fff' });
            this.timeText = this.add.text(32, 152, 'Time: 10', { fontSize: '32px', fill: '#fff' });

            // Create bullet sound
            if (this.customBulletSoundData) {
                this.createCustomBulletSound(this.customBulletSoundData);
            } else {
                console.log('Using default bullet sound');
                this.bulletSound = this.sound.add('defaultBulletSound');
            }

            // Set up the initial level
            this.setupLevel();

            console.log('Create function completed successfully');
        } catch (error) {
            console.error('Error in create function:', error);
        }
    }

    update() {
        try {
            const levelConfig = this.levelConfigs[this.currentLevel];

            // Handle ship control and rotation
            if (levelConfig.shipControl) {
                if (levelConfig.shipRotates) {
                    if (this.cursors.left.isDown) this.ship.angle -= 2;
                    else if (this.cursors.right.isDown) this.ship.angle += 2;
                }
                if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
                    this.shootBullet();
                }
            } else {
                // Handle asteroid rotation and shooting in level 2
                if (this.cursors.left.isDown || this.cursors.right.isDown) {
                    const rotationDirection = this.cursors.left.isDown ? -2 : 2;
                    this.asteroids.getChildren().forEach(asteroid => {
                        asteroid.angle += rotationDirection;
                    });
                }
                if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && levelConfig.asteroidsBullets) {
                    this.asteroids.getChildren().forEach(asteroid => {
                        this.shootBulletFromAsteroid(asteroid);
                    });
                }
            }

            // Remove the automatic asteroid shooting for Level 2

            // Update time display
            const elapsedTime = this.levelTimer ? this.levelTimer.getElapsed() : 0;
            const timeLeft = Math.ceil((levelConfig.duration - elapsedTime) / 1000);
            this.timeText.setText('Time: ' + timeLeft);

            // Handle bullet lifespan
            this.bullets.children.entries.forEach((bullet) => {
                // Only apply lifespan for non-level 3 bullets
                if (this.currentLevel !== 3) {
                    bullet.lifespan -= 16;
                    if (bullet.lifespan <= 0) {
                        bullet.destroy();
                    }
                }
            });
        } catch (error) {
            console.error('Error in update function:', error);
        }
    }

    setupLevel() {
        console.log(`Setting up level ${this.currentLevel}`);
        const levelConfig = this.levelConfigs[this.currentLevel];

        // Reset ship
        if (this.ship) this.ship.destroy();
        this.ship = this.physics.add.image(this.sys.game.config.width / 2, this.sys.game.config.height / 2, `ship${this.currentLevel}`);
        this.ship.setCollideWorldBounds(true);
        this.ship.setScale(0.2);
        this.ship.setImmovable(!levelConfig.shipControl);

        // Clear existing bullets and asteroids
        this.asteroids.clear(true, true);
        this.bullets.clear(true, true);

        // Spawn new asteroids
        this.spawnAsteroids(levelConfig.asteroidCount, !levelConfig.asteroidMovement);

        // Set up collisions based on level
        if (this.currentLevel === 2) {
            this.physics.add.collider(this.bullets, this.ship, this.bulletHitShipLevel2, null, this);
        } else {
            this.physics.add.collider(this.bullets, this.asteroids, this.bulletHitTarget, null, this);
            this.physics.add.collider(this.ship, this.asteroids, this.shipHitAsteroid, null, this);
            // Add collision handler for level 3
            if (this.currentLevel === 3) {
                this.physics.add.collider(this.ship, this.bullets, this.shipHitBullet, null, this);
            }
        }

        // Spawn UFO if needed
        if (levelConfig.ufoSpawn) {
            this.spawnUFO();
        }

        // Set up level timer
        if (this.levelTimer) this.levelTimer.remove();
        this.levelTimer = this.time.addEvent({
            delay: levelConfig.duration,
            callback: this.nextLevel,
            callbackScope: this
        });

        // Update UI
        this.levelText.setText('Level: ' + this.currentLevel);
        this.score = 0;
        this.scoreText.setText('Score: ' + this.score);
        this.lives = 3;
        this.livesText.setText('Lives: ' + this.lives);

        console.log(`Level ${this.currentLevel} setup completed`);

        // Add bouncing behavior for level 3 bullets
        if (this.currentLevel === 3) {
            this.physics.world.on('worldbounds', (body) => {
                if (body.gameObject && body.gameObject.texture.key === `bullet${this.currentLevel}`) {
                    // Do nothing, let it bounce naturally
                }
            });
        }
    }

    createCustomBulletSound(base64Data) {
        const arrayBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        audioContext.decodeAudioData(arrayBuffer, (buffer) => {
            this.bulletSound = {
                play: () => {
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContext.destination);
                    source.start(0);
                }
            };
            console.log('Custom bullet sound created');
        }, (error) => {
            console.error('Error decoding audio data', error);
            this.bulletSound = this.sound.add('defaultBulletSound');
        });
    }

    shootBullet() {
        const bulletX = this.ship.x + Math.cos(this.ship.rotation) * this.ship.width * 0.2 / 2;
        const bulletY = this.ship.y + Math.sin(this.ship.rotation) * this.ship.height * 0.2 / 2;

        const bullet = this.bullets.create(bulletX, bulletY, `bullet${this.currentLevel}`);
        bullet.setScale(0.2);
        bullet.setRotation(this.ship.rotation);
        this.physics.velocityFromRotation(this.ship.rotation, 800, bullet.body.velocity);
        
        // Set lifespan for non-level 3 bullets
        if (this.currentLevel !== 3) {
            bullet.lifespan = 1000;
        }

        // Add bouncing behavior for level 3 bullets
        if (this.currentLevel === 3) {
            bullet.setBounce(1);
            bullet.setCollideWorldBounds(true);
        }

        if (this.bulletSound) {
            this.bulletSound.play();
        }
    }

    // ... (implement other game functions like shootBulletFromAsteroid, spawnAsteroids, bulletHitTarget, etc.)

    bulletHitShipLevel2(bullet, ship) {
        bullet.destroy();
        this.lives--;
        this.livesText.setText('Lives: ' + this.lives);
        console.log('Ship hit in level 2, ending level');
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Use a short delay to ensure all game logic has completed before moving to the next level
            this.time.delayedCall(100, () => this.nextLevel(), [], this);
        }
    }

    gameOver() {
        console.log('Game Over');
        this.scene.restart();
        this.currentLevel = 1;
    }

    nextLevel() {
        this.currentLevel++;
        console.log('Moving to level:', this.currentLevel);
        if (this.currentLevel > 5) {
            console.log('Game completed');
            this.scene.restart();
            this.currentLevel = 1;
        } else {
            if (this.levelTimer) this.levelTimer.remove();
            try {
                this.setupLevel();
            } catch (error) {
                console.error('Error setting up level:', error);
                if (this.currentLevel < 5) {
                    this.currentLevel++;
                    this.setupLevel();
                } else {
                    this.scene.restart();
                    this.currentLevel = 1;
                }
            }
        }
    }

    // ... (implement other helper functions like checkGameOver, etc.)

    spawnAsteroids(count, fixedPositions) {
        for (let i = 0; i < count; i++) {
            let x, y;
            if (fixedPositions) {
                const angle = (i / count) * Math.PI * 2;
                const radius = Math.min(this.sys.game.config.width, this.sys.game.config.height) * 0.4;
                x = this.sys.game.config.width / 2 + Math.cos(angle) * radius;
                y = this.sys.game.config.height / 2 + Math.sin(angle) * radius;
            } else {
                x = Phaser.Math.Between(0, this.sys.game.config.width);
                y = Phaser.Math.Between(0, this.sys.game.config.height);
            }
            const asteroid = this.asteroids.create(x, y, `asteroid${this.currentLevel}`);
            asteroid.setScale(0.2);
            if (!fixedPositions) {
                asteroid.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200));
            }
            asteroid.setCollideWorldBounds(true);
            asteroid.setBounce(1);
        }
    }

    shootBulletFromAsteroid(asteroid) {
        const bulletX = asteroid.x + Math.cos(asteroid.rotation) * asteroid.width * 0.2 / 2;
        const bulletY = asteroid.y + Math.sin(asteroid.rotation) * asteroid.height * 0.2 / 2;

        const bullet = this.bullets.create(bulletX, bulletY, `bullet${this.currentLevel}`);
        bullet.setScale(0.2);
        bullet.setRotation(asteroid.rotation);
        this.physics.velocityFromRotation(asteroid.rotation, 800, bullet.body.velocity);
        bullet.lifespan = 1000;

        if (this.bulletSound) {
            this.bulletSound.play();
        }
    }

    bulletHitTarget(bullet, target) {
        if (target !== this.ship) {
            const levelConfig = this.levelConfigs[this.currentLevel];
            if (levelConfig.asteroidSplits && target.texture.key.includes('asteroid')) {
                this.splitAsteroid(target);
            } else {
                target.destroy();
            }
            this.score += 10;
            this.scoreText.setText('Score: ' + this.score);
        }
        bullet.destroy();
    }

    splitAsteroid(asteroid) {
        const smallAsteroidCount = 2;
        for (let i = 0; i < smallAsteroidCount; i++) {
            const smallAsteroid = this.asteroids.create(asteroid.x, asteroid.y, `asteroid${this.currentLevel}`);
            smallAsteroid.setScale(asteroid.scale * 0.5); // Half the size of the original
            smallAsteroid.setVelocity(
                Phaser.Math.Between(-150, 150),
                Phaser.Math.Between(-150, 150)
            );
            smallAsteroid.setCollideWorldBounds(true);
            smallAsteroid.setBounce(1);
        }
        asteroid.destroy();
    }
}

export default MainScene;
