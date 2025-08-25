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

    createSectionIcons() {
        // Create a container for all section icons
        this.sectionIconsContainer = this.add.container(0, 0);

        // Define section positions (in tile coordinates)
        const sections = [
            { 
                // Top Left Section
                x: 9, y: 5, icon: 'work-experience', name: 'Work Experience',
                bounds: { minX: 2, maxX: 17, minY: 2, maxY: 7 },        // Outer bounds for detection
                innerBounds: { minX: 2, maxX: 16, minY: 2, maxY: 6 }    // Inner bounds for camera centering
            },
            { 
                // Top Right Section
                x: 30, y: 5, icon: 'projects', name: 'Projects',
                bounds: { minX: 22, maxX: 38, minY: 2, maxY: 7 },       // Outer bounds for detection
                innerBounds: { minX: 23, maxX: 38, minY: 2, maxY: 6 }   // Inner bounds for camera centering
            },
            { 
                // Bottom Left Section
                x: 9, y: 15, icon: 'skills', name: 'Skills',
                bounds: { minX: 2, maxX: 17, minY: 12, maxY: 18 },      // Outer bounds for detection
                innerBounds: { minX: 2, maxX: 16, minY: 13, maxY: 18 }  // Inner bounds for camera centering
            },
            { 
                // Bottom Right Section
                x: 30, y: 15, icon: 'about-me', name: 'About Me',
                bounds: { minX: 22, maxX: 38, minY: 12, maxY: 18 },     // Outer bounds for detection
                innerBounds: { minX: 23, maxX: 38, minY: 13, maxY: 18 } // Inner bounds for camera centering
            },
        ];

        this.sectionIcons = [];

        sections.forEach((section, index) => {
            // Create the icon
            const icon = this.add.image(0, 0, section.icon);
            icon.setScale(0.3);
            icon.setAlpha(0.9);
            
            // Create glow effect using multiple copies
            const glow1 = this.add.image(0, 0, section.icon);
            const glow2 = this.add.image(0, 0, section.icon);
            const glow3 = this.add.image(0, 0, section.icon);

            // Set glow properties
            glow1.setScale(0.6).setAlpha(0.3).setTint(0x00ffff);
            glow2.setScale(0.7).setAlpha(0.2).setTint(0x0080ff);
            glow3.setScale(0.8).setAlpha(0.1).setTint(0x8000ff);
            
            // Create blur effect container
            const blurContainer = this.add.container(0, 0);
            blurContainer.add([glow3, glow2, glow1, icon]);
            
            // Store section data
            const sectionData = {
                container: blurContainer,
                icon: icon,
                glows: [glow1, glow2, glow3],
                tileX: section.x,
                tileY: section.y,
                name: section.name,
                isRevealed: false,
                contentText: null,                  // Placeholder for content text
                originalY: 0,                       // Will be set properly in resize()
                index: index,                       // Store index for animations
                bounds: section.bounds,             // Store bounds for proximity detection
                innerBounds: section.innerBounds    // Store inner bounds for camera centering
            };
            
            this.sectionIcons.push(sectionData);
            this.sectionIconsContainer.add(blurContainer);
        });
    }

    setupCamera() {
        // Don't follow Pacman by default
        this.cameras.main.stopFollow();

        // Set initial camera properties
        this.cameras.main.setLerp(0.08, 0.08); // For smoother camera movement
        this.currentCameraZoom = this.calculateFullMapZoom();
        this.targetCameraZoom = this.currentCameraZoom;
        this.currentSection = null;

        // Initialize camera animation tracking
        this.activeCameraTween = null;
        this.isAnimating = false;
        this.isInTransition = false; // Track if camera is in transition mode

        // Set initial zoom
        this.cameras.main.setZoom(this.currentCameraZoom);

        // Set the camera viewport to cover the full window
        this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height);

        // Initially center camera on map center since Pacman starts in center
        const mapCenterX = this.mapOffsetX + (this.map.widthInPixels * this.currentScale) / 2;
        const mapCenterY = this.mapOffsetY + (this.map.heightInPixels * this.currentScale) / 2;
        this.cameras.main.centerOn(mapCenterX, mapCenterY);
    }

    calculateFullMapZoom() {
        // Calculate zoom level to fit entire map in viewport
        const viewportWidth = this.scale.width;
        const viewportHeight = this.scale.height;
        const mapPixelWidth = this.map.widthInPixels * this.currentScale;
        const mapPixelHeight = this.map.heightInPixels * this.currentScale;
        
        // No padding for maximum coverage
        const padding = 0;
        const scaleX = (viewportWidth - padding) / mapPixelWidth;
        const scaleY = (viewportHeight - padding) / mapPixelHeight;

        // Use the smaller scale to ensure entire map fits, with a reasonable minimum
        return Math.max(0.3, Math.min(scaleX, scaleY));
    }

    calculateSectionZoom() {
        // Calculate zoom for section view - should be larger than full map zoom
        const fullMapZoom = this.calculateFullMapZoom();
        return Math.min(2.5, fullMapZoom * 4); // 4x zoom from full map, capped at 2.5x
    }

    updateCamera() {
        const pacmanTileX = Math.floor((this.pacman.x - this.mapOffsetX) / (32 * this.currentScale));
        const pacmanTileY = Math.floor((this.pacman.y - this.mapOffsetY) / (32 * this.currentScale));

        // Check which section Pacman is in
        let pacmanInSection = null;
        let pacmanInInnerSection = null;
        
        this.sectionIcons.forEach(section => {
            const bounds = section.bounds;
            const innerBounds = section.innerBounds;
            
            // Check outer bounds (for section detection)
            if (pacmanTileX >= bounds.minX && pacmanTileX <= bounds.maxX &&
                pacmanTileY >= bounds.minY && pacmanTileY <= bounds.maxY) {
                pacmanInSection = section;
            }

            // Check inner bounds (for camera centering)
            if (pacmanTileX >= innerBounds.minX && pacmanTileX <= innerBounds.maxX &&
                pacmanTileY >= innerBounds.minY && pacmanTileY <= innerBounds.maxY) {
                pacmanInInnerSection = section;
            }
        });

        if (pacmanInSection) { 
            // Pacman is in a section's outer bounds
            if (pacmanInSection !== this.currentSection) {
                // Stop any existing camera animation
                this.stopActiveCameraAnimation();
                
                this.isInTransition = true;
                this.targetCameraZoom = this.calculateSectionZoom();
                this.currentSection = pacmanInSection;

                // Start following Pacman during transition
                this.cameras.main.startFollow(this.pacman, false, 0.1, 0.1);
            }

            // Check if Pacman is in the inner bounds of the current section
            if (pacmanInInnerSection === this.currentSection && this.isInTransition) {
                // Pacman reached the center area - stop following and center on section
                this.isInTransition = false;
                this.cameras.main.stopFollow();

                const sectionCenterX = this.mapOffsetX + (this.currentSection.tileX * 32 * this.currentScale);
                const sectionCenterY = this.mapOffsetY + (this.currentSection.tileY * 32 * this.currentScale);
                this.animateCameraTo(sectionCenterX, sectionCenterY);
            } else if (pacmanInInnerSection !== this.currentSection && !this.isInTransition && this.currentSection === pacmanInSection) {
                // Pacman left the inner bounds but is still in the same section - start following again
                this.stopActiveCameraAnimation();
                this.isInTransition = true;
                
                // Start following Pacman again
                this.cameras.main.startFollow(this.pacman, false, 0.1, 0.1);
            }
        } else {
            // Pacman is not in any section and left the last section it entered
            if (this.currentSection !== null) {
                // Stop any existing camera animation
                this.stopActiveCameraAnimation();

                // Leaving a section - show full map
                this.targetCameraZoom = this.calculateFullMapZoom();
                this.currentSection = null;
                this.isInTransition = false;

                // Center on full map
                const mapCenterX = this.mapOffsetX + (this.map.widthInPixels * this.currentScale) / 2;
                const mapCenterY = this.mapOffsetY + (this.map.heightInPixels * this.currentScale) / 2;

                this.cameras.main.stopFollow();
                this.animateCameraTo(mapCenterX, mapCenterY);
            }
        }

        // Smoothly interpolate camera zoom
        const zoomLerpFactor = 0.03; // For slower & smoother zoom transitions
        const zoomDifference = Math.abs(this.currentCameraZoom - this.targetCameraZoom);
        
        // Use adaptive lerp factor - faster when difference is large, slower when close
        const adaptiveLerpFactor = Math.min(0.08, zoomLerpFactor + (zoomDifference * 0.02));

        this.currentCameraZoom = Phaser.Math.Linear(
            this.currentCameraZoom,
            this.targetCameraZoom,
            adaptiveLerpFactor
        );

        // Apply the zoom
        this.cameras.main.setZoom(this.currentCameraZoom);
    }

    // Separate camera animation methods
    animateCameraTo(x, y) {
        this.isAnimating = true;
        
        // Create a tween that we can properly control
        this.activeCameraTween = this.tweens.add({
            targets: this.cameras.main,
            scrollX: x - this.cameras.main.width / 2,
            scrollY: y - this.cameras.main.height / 2,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                this.activeCameraTween = null;
                this.isAnimating = false;
            }
        });
    }

    stopActiveCameraAnimation() {
        if (this.activeCameraTween) {
            this.activeCameraTween.stop();
            this.activeCameraTween.destroy();
            this.activeCameraTween = null;
        }
        this.isAnimating = false;
    }

    updateSectionIconsProximity() {
        // Initialize variables if they don't exist
        if (this.mapOffsetX === undefined || this.mapOffsetY === undefined || !this.currentScale || !this.pacman) {
            console.log("Map variables not initialized yet, skipping proximity check");
            return;
        }

        const pacmanTileX = Math.floor((this.pacman.x - this.mapOffsetX) / (32 * this.currentScale));
        const pacmanTileY = Math.floor((this.pacman.y - this.mapOffsetY) / (32 * this.currentScale));
        
        // Debug logging to see if proximity detection is working
        console.log(`Pacman at tile: (${pacmanTileX}, ${pacmanTileY})`);
        console.log(`Pacman world pos: (${this.pacman.x.toFixed(2)}, ${this.pacman.y.toFixed(2)})`);
        console.log(`Map offset: (${this.mapOffsetX.toFixed(2)}, ${this.mapOffsetY.toFixed(2)})`);
        console.log(`Current scale: ${this.currentScale.toFixed(2)}`);

        this.sectionIcons.forEach((section, index) => {
            const distance = Phaser.Math.Distance.Between(
                pacmanTileX, pacmanTileY,
                section.tileX, section.tileY
            );

            console.log(`Distance to ${section.name}: ${distance.toFixed(2)}`);
            
            const proximityRadius = 3; // tiles
            
            if (distance <= proximityRadius && !section.isRevealed) {
                console.log(`Revealing ${section.name}`);
                // Fade out icon and reveal content
                this.revealSection(section);
            } else if (distance > proximityRadius && section.isRevealed) {
                console.log(`Hiding ${section.name}`);
                // Fade in icon and hide content
                this.hideSection(section, index);
            }
        });
    }

    revealSection(section) {
        section.isRevealed = true;

        // Stop ALL existing tweens on this section's elements
        this.tweens.killTweensOf(section.container);
        this.tweens.killTweensOf(section.glows);
        this.tweens.killTweensOf(section.icon);
        
        // Fade out the icon
        this.tweens.add({
            targets: section.container,
            alpha: 0,
            scale: 0.5,
            duration: 500,
            ease: 'Power2'
        });
        
        // TODO: Add content reveal logic
        // Show text or other elements
        this.showSectionContent(section);
    }

    startAnimations() {
        // Start all the animations after positioning is correct
        this.sectionIcons.forEach(section => {
            // Create Floating animation
            this.tweens.add({
                targets: section.container,
                y: section.originalY + 10,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Create Glowing animation
            this.tweens.add({
                targets: section.glows,
                alpha: { from: 0.1, to: 0.5 },
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    hideSection(section, index) {
        section.isRevealed = false;
        
        // Hide content first
        this.hideSectionContent(section);
        
        // Stop any existing tweens on this container to prevent conflicts
        this.tweens.killTweensOf(section.container);
        this.tweens.killTweensOf(section.glows);
        this.tweens.killTweensOf(section.icon);

        // Reset position to original position
        section.container.setPosition(
            this.mapOffsetX + (section.tileX * 32 * this.currentScale),
            section.originalY
        );

        // Fade in the icon
        this.tweens.add({
            targets: section.container,
            alpha: 1,
            scale: this.currentScale * 0.8,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Start floating animation after fade in is complete
                this.tweens.add({
                    targets: section.container,
                    y: section.originalY + 10,
                    duration: 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                // Restart the glowing animation
                this.tweens.add({
                    targets: section.glows,
                    alpha: { from: 0.1, to: 0.5 },
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    showSectionContent(section) {
        // Clean up any existing content first
        if (section.contentText && section.contentText.active) {
            section.contentText.destroy();
        }

        // Create temporary content display
        section.contentText = this.add.text(0, 0, section.name, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Simplified positioning
        const worldPos = this.tilesToWorldPosition(section.tileX, section.tileY);
        section.contentText.setPosition(worldPos.x, worldPos.y - 60);
        
        // Animate content in
        section.contentText.setAlpha(0).setScale(0.5);
        this.tweens.add({
            targets: section.contentText,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    hideSectionContent(section) {
        if (section.contentText && section.contentText.active) {
            this.tweens.add({
                targets: section.contentText,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    // Check if contentText still exists and is active before destroying
                    if (section.contentText && section.contentText.active) {
                        section.contentText.destroy();
                    }
                    section.contentText = null;
                }
            });
        } else {
            // If contentText doesn't exist or is already destroyed, just set to null
            section.contentText = null;
        }
    }

    tilesToWorldPosition(tileX, tileY) {
        return {
            x: this.mapOffsetX + (tileX * 32 * this.currentScale),
            y: this.mapOffsetY + (tileY * 32 * this.currentScale)
        };
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

        // Storing scale value for other methods
        this.currentScale = scale;

        // Centering Map on screen
        const scaledWidth = mapWidth * scale;
        const scaledHeight = mapHeight * scale;
        
        // Storing map offset values for other methods
        this.mapOffsetX = (width - scaledWidth) / 2;
        this.mapOffsetY = (height - scaledHeight) / 2;

        // Centering Background Layer
        this.backgroundLayer.setPosition(
            this.mapOffsetX,
            this.mapOffsetY
        );
        
        // Centering Walls Layer
        this.wallsLayer.setPosition(
            this.mapOffsetX,
            this.mapOffsetY
        );

        // Position section icons
        if (this.sectionIcons) {
            this.sectionIcons.forEach(section => {
                const worldPos = this.tilesToWorldPosition(section.tileX, section.tileY);
                section.container.setPosition(worldPos.x, worldPos.y);
                section.container.setScale(scale * 0.8); // Scale relative to map scale

                // Store original Y position for floating effect
                section.originalY = worldPos.y;

            });
            
            // Start animations after first resize (i.e. after creation)
            if (!this.animationsStarted) {
                this.startAnimations();
                this.animationsStarted = true;
            }
        }

        // Resize Pacman
        const pacmanSize = 32 * scale * 0.8; // Scaling pacman to 80% of tile size
        this.pacman.setDisplaySize(pacmanSize, pacmanSize);

        // Initialize Pacman's Position if not already set
        if (!this.pacmanInitialized) {
            const tileSize = 32;
            const centerX = this.mapOffsetX + (tileSize * scale * 20);
            const centerY = this.mapOffsetY + (tileSize * scale * 10);
            this.pacman.setPosition(centerX, centerY);
            this.pacmanInitialized = true;
        }

        // Update Physics World Bounds - Make them larger to allow camera movement
        if (this.physics && this.physics.world) {
            // Set physics bounds to be larger than the map to allow smooth camera movement
            const boundsWidth = Math.max(scaledWidth, width * 2);
            const boundsHeight = Math.max(scaledHeight, height * 2);
            const boundsX = this.mapOffsetX - (boundsWidth - scaledWidth) / 2;
            const boundsY = this.mapOffsetY - (boundsHeight - scaledHeight) / 2;
            
            this.physics.world.setBounds(boundsX, boundsY, boundsWidth, boundsHeight);
            this.pacman.body.setCollideWorldBounds(true);
        }

        // Update camera setup after resize
        if (this.pacman && this.pacmanInitialized) {
            this.setupCamera();
        }
    }

    // Phaser looks for this by-default on initialization
    preload() {
        this.load.tilemapTiledJSON('pacman-map', 'assets/pacman-layered-map.json');
        this.load.image('pacman-tiles', 'assets/pacman-background-992x672.png');
        this.load.spritesheet('pacman', 'assets/pacman-411x440-spritesheet.png', { frameWidth: 412, frameHeight: 440 });
        this.load.image('work-experience', 'assets/work-experience.png');
        this.load.image('projects', 'assets/projects.png');
        this.load.image('skills', 'assets/skills.png');
        this.load.image('about-me', 'assets/about-me.png');
    }

    create() {
        // Initialize variables early
        this.mapOffsetX = 0;
        this.mapOffsetY = 0;
        this.currentScale = 1;
        this.pacmanInitialized = false;
        this.animationsStarted = false; // Flag to prevent multiple animation starts

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

        // Create section icons after map's creation
        this.createSectionIcons();

        // Adding Collision between pacman and walls
        this.physics.add.collider(this.pacman, this.wallsLayer);

        this.resize(); // Initial resize, also stores other parameters
        this.scale.on('resize', this.resize, this); // Listen for resize events
    }

    update() {
        if (this.pacman) {
            this.pacman.update();
            this.updateSectionIconsProximity();
            this.updateCamera();
        }
    }

    // Add cleanup method for when scene is destroyed
    destroy() {
        // Stop any active camera animation
        if (this.activeCameraTween) {
            this.activeCameraTween.stop();
            this.activeCameraTween = null;
        }

        // Clean up all section content
        if (this.sectionIcons) {
            this.sectionIcons.forEach(section => {
                if (section.contentText && section.contentText.active) {
                    section.contentText.destroy();
                }
                section.contentText = null;
            });
        }
        
        // Call parent destroy
        super.destroy();
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