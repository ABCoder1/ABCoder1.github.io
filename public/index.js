class PacManScene extends Phaser.Scene {
    setCollisionWithTransformedTiles() {
        // Extract all unique tile IDs from the walls layer data, including transformed ones
        const wallsData = this.wallsLayer.layer.data;
        const uniqueTileIds = new Set();
        
        for (let row = 0; row < wallsData.length; row++) {
            for (let col = 0; col < wallsData[row].length; col++) {
                const tile = wallsData[row][col];
                if (tile && tile.index > 0) {
                    uniqueTileIds.add(tile.index);
                }
            }
        }
        
        // Convert to array and set collision
        const tileIdsArray = Array.from(uniqueTileIds);
        this.wallsLayer.setCollision(tileIdsArray);
    }

    resize() {
        const width = this.scale.width;
        const height = this.scale.height;
        const mapWidth = this.map.widthInPixels;
        const mapHeight = this.map.heightInPixels;

        // Scaling the entire map
        const scaleX = width / mapWidth;
        const scaleY = height / mapHeight;
        const scale = Math.min(scaleX, scaleY);

        this.backgroundLayer.setScale(scale);
        this.wallsLayer.setScale(scale);

        // Centering Map on screen
        const scaledWidth = mapWidth * scale;
        const scaledHeight = mapHeight * scale;
        
        // Centering Background Layer
        this.backgroundLayer.setPosition(
            (width - scaledWidth) / 2,
            (height - scaledHeight) / 2
        );
        
        // Centering Walls Layer
        this.wallsLayer.setPosition(
            (width - scaledWidth) / 2,
            (height - scaledHeight) / 2
        );

        // Resize Pacman
        const pacmanSize = 32 * scale * 0.8; // Scaling pacman to 80% of tile size
        this.pacman.setDisplaySize(pacmanSize, pacmanSize);

        // Initialize Pacman's Position if not already set
        if (!this.pacmanInitialized) {
            const tileSize = 32;
            const centerX = (width - scaledWidth) / 2 + (tileSize * scale * 19);
            const centerY = (height - scaledHeight) / 2 + (tileSize * scale * 10);
            this.pacman.setPosition(centerX, centerY);
            this.pacmanInitialized = true;
        }

        // Update Physics World Bounds
        if (this.physics && this.physics.world) {
            this.physics.world.setBounds(
                (width - scaledWidth) / 2,
                (height - scaledHeight) / 2,
                scaledWidth,
                scaledHeight
            );
            this.pacman.body.setCollideWorldBounds(true);
        }
    }

    // Phaser looks for this by-default on initialization
    preload() {
        this.load.tilemapTiledJSON('pacman-map', 'assets/pacman-layered-map.json');
        this.load.image('pacman-tiles', 'assets/pacman-background-992x672.png');
        this.load.spritesheet('pacman', 'assets/pacman-411x440-spritesheet.png', { frameWidth: 412, frameHeight: 440 });
    }

    create() {
        // Creating TileMap
        this.map = this.make.tilemap({ key: 'pacman-map' });

        // Adding tileSet to the Map
        const tileset = this.map.addTilesetImage('pacman-background-992x672', 'pacman-tiles');
        
        // Creating Layers from the Map JSON file
        this.backgroundLayer = this.map.createLayer('Background', tileset, 0, 0);
        this.wallsLayer = this.map.createLayer('Walls', tileset, 0, 0);

        this.setCollisionWithTransformedTiles(); // Set collision with transformed tiles

        /* NOTE 2 : Code for Debugging the Collisions */
        this.pacman = new PacManPlayer(this, 0, 0);

        // Store initial positioning flag
        this.pacmanInitialized = false;
        
        // Adding Collision between pacman and walls
        this.physics.add.collider(this.pacman, this.wallsLayer);

        this.resize(); // Initial resize
        this.scale.on('resize', this.resize, this); // Listen for resize events
    }

    update() {
        if (this.pacman) {
            this.pacman.update();
        }
    }
}

class PacManPlayer extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'pacman');
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this); // Adds physics body
        this.setOrigin(0.5, 0.5); // Center origin for better positioning

        // Set physics body size to be smaller than the sprite for better collision
        this.body.setSize(this.width * 0.8, this.height * 0.8);

        // Create Animations
        if (!this.scene.anims.exists('pacman-chomp')) {
            this.scene.anims.create({
                key: 'pacman-chomp',
                frames: this.scene.anims.generateFrameNumbers('pacman', { start: 0, end: 1 }),
                frameRate: 10, // Frames per second
                repeat: -1 // Loop the animation forever
            });
        }
        
        // Game Properties
        this.speed = 200; // Speed of Pacman
        this.direction = { x: 0, y: 0 }; // Initially stationary

        // Setup Inputs
        this.setupInputs();
    }

    setupInputs() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys('W,S,A,D');
    }

    update() {
        // Handle Input
        this.handleMovement();
    }

    handleMovement() {        
        // Reset direction
        this.direction.x = 0;
        this.direction.y = 0;
        
        // Check for cursor key input
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.direction.x = -1;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.direction.x = 1;
        }
        
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.direction.y = -1;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.direction.y = 1;
        }
        
        // Apply Movement
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
            this.direction.x /= length;
            this.direction.y /= length;
            this.body.setVelocity(this.direction.x * this.speed, this.direction.y * this.speed);
            
            // Play the chomp animation always
            this.anims.play('pacman-chomp', true);
        } else {
            this.body.setVelocity(0, 0);
            this.anims.stop(); // Stop the animation when not moving
        }

        // Apply Rotation based on direction
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            this.rotation = Phaser.Math.Angle.Between(0, 0, this.direction.x, this.direction.y);
        }
    }
}

const config = {
    // Can define parent container if needed
    type: Phaser.AUTO, // Rendering context used for our game (Phaser.CANVAS/Phaser.WEBGL/Phaser.AUTO)
    width: '100%',
    height: '100%',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.CENTER_BOTH
    },
    scene: PacManScene,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const game = new Phaser.Game(config);