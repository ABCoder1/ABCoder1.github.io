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
            { x: 9, y: 5, icon: 'work-experience', name: 'Work Experience',
              bounds: { minX: 2, maxX: 17, minY: 2, maxY: 7 } // Top-left section
            },
            { x: 30, y: 5, icon: 'projects', name: 'Projects',
              bounds: { minX: 22, maxX: 38, minY: 2, maxY: 7 } // Top-right section
            },
            { x: 9, y: 15, icon: 'skills', name: 'Skills',
              bounds: { minX: 2, maxX: 17, minY: 12, maxY: 18 } // Bottom-left section
            },
            { x: 30, y: 15, icon: 'about-me', name: 'About Me',
              bounds: { minX: 22, maxX: 38, minY: 12, maxY: 18 } // Bottom-right section
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
                contentText: null, // Placeholder for content text
                originalY: 0,      // Will be set properly in resize()
                index: index,       // Store index for animations
                bounds: section.bounds // Store bounds for proximity detection
            };
            
            this.sectionIcons.push(sectionData);
            this.sectionIconsContainer.add(blurContainer);
        });
    }

    setupCamera() {
        // // Store the map's world bounds for camera calculations
        // this.mapWorldBounds = {
        //     x: this.mapOffsetX,
        //     y: this.mapOffsetY,
        //     width: this.map.widthInPixels * this.currentScale,
        //     height: this.map.heightInPixels * this.currentScale
        // };

        // // Set camera bounds to the map size
        // this.cameras.main.setBounds(
        //     this.mapWorldBounds.x,
        //     this.mapWorldBounds.y,
        //     this.mapWorldBounds.width,
        //     this.mapWorldBounds.height
        // );

        // Start camera following Pacman
        this.cameras.main.startFollow(this.pacman);

        // Set initial camera properties
        // this.cameras.main.setLerp(0.1, 0.1); // Smooth camera movement
        this.cameras.main.setLerp(0.08, 0.08); // Smoother camera movement
        
        // this.currentCameraZoom = 1;
        // this.targetCameraZoom = 1;
        this.currentCameraZoom = this.calculateFullMapZoom();
        this.targetCameraZoom = this.currentCameraZoom;

        this.currentSection = null;

        // Set initial zoom
        this.cameras.main.setZoom(this.currentCameraZoom);

        // Set the camera viewport to cover the full window
        this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height);

        // Initially center camera on map center since Pacman starts in center
        const mapCenterX = this.mapOffsetX + (this.map.widthInPixels * this.currentScale) / 2;
        const mapCenterY = this.mapOffsetY + (this.map.heightInPixels * this.currentScale) / 2;
        this.cameras.main.stopFollow();
        this.cameras.main.centerOn(mapCenterX, mapCenterY);
    }

    calculateFullMapZoom() {
        // Calculate zoom level to fit entire map in viewport
        const viewportWidth = this.scale.width;
        const viewportHeight = this.scale.height;
        const mapPixelWidth = this.map.widthInPixels * this.currentScale;
        const mapPixelHeight = this.map.heightInPixels * this.currentScale;
        
        // Add some padding
        // const padding = 50;
        
        // Reduce padding for better screen coverage
        const padding = 20;
        const scaleX = (viewportWidth - padding) / mapPixelWidth;
        const scaleY = (viewportHeight - padding) / mapPixelHeight;
        
        // Use the smaller scale to ensure entire map fits
        // return Math.min(scaleX, scaleY);
        return Math.max(0.5, Math.min(scaleX, scaleY));
    }

    updateCamera() {
        const pacmanTileX = Math.floor((this.pacman.x - this.mapOffsetX) / (32 * this.currentScale));
        const pacmanTileY = Math.floor((this.pacman.y - this.mapOffsetY) / (32 * this.currentScale));

        // Check which section Pacman is in
        let pacmanInSection = null;
        
        this.sectionIcons.forEach(section => {
            const bounds = section.bounds;
            if (pacmanTileX >= bounds.minX && pacmanTileX <= bounds.maxX &&
                pacmanTileY >= bounds.minY && pacmanTileY <= bounds.maxY) {
                pacmanInSection = section;
            }
        });

        // Determine target zoom based on Pacman's position
        const fullMapZoom = this.calculateFullMapZoom();

        if (pacmanInSection) {
            // In a section - zoom in
            // this.targetCameraZoom = 2.5;
            this.targetCameraZoom = Math.min(2.0, fullMapZoom * 3); // Limit max zoom
            this.currentSection = pacmanInSection;
        } else {
            // Check if Pacman is in the center area (show full map)
            const centerBounds = { minX: 19, maxX: 20, minY: 8, maxY: 11 };
            if (pacmanTileX >= centerBounds.minX && pacmanTileX <= centerBounds.maxX &&
                pacmanTileY >= centerBounds.minY && pacmanTileY <= centerBounds.maxY) {
                // In center - show full map
                this.targetCameraZoom = this.calculateFullMapZoom();
                this.currentSection = null;
            } else {
                // In corridor/transition area - medium zoom
                // this.targetCameraZoom = 1.5;
                this.targetCameraZoom = Math.min(1.5, fullMapZoom * 2);
                this.currentSection = null;
            }
        }

        // Smoothly interpolate camera zoom
        // const zoomLerpFactor = 0.05;
        const zoomLerpFactor = 0.02; // Slower, smoother zoom transitions
        const zoomDifference = Math.abs(this.currentCameraZoom - this.targetCameraZoom);
        
        // Use adaptive lerp factor - faster when difference is large, slower when close
        const adaptiveLerpFactor = Math.min(0.08, zoomLerpFactor + (zoomDifference * 0.02));

        this.currentCameraZoom = Phaser.Math.Linear(
            this.currentCameraZoom,
            this.targetCameraZoom,
            // zoomLerpFactor
            adaptiveLerpFactor
        );

        // Apply the zoom
        this.cameras.main.setZoom(this.currentCameraZoom);

        // // Adjust camera follow offset based on section
        // if (this.currentSection) {
        //     // Focus camera on the section center when zoomed in
        //     const sectionCenterX = this.mapOffsetX + (this.currentSection.tileX * 32 * this.currentScale);
        //     const sectionCenterY = this.mapOffsetY + (this.currentSection.tileY * 32 * this.currentScale);
            
        //     this.cameras.main.setFollowOffset(
        //         sectionCenterX - this.pacman.x,
        //         sectionCenterY - this.pacman.y
        //     );
        // } else {
        //     // Reset follow offset when not in a section
        //     this.cameras.main.setFollowOffset(0, 0);
        // }

        // Adjust camera follow behavior based on zoom level
        const isFullMapView = Math.abs(this.targetCameraZoom - fullMapZoom) < 0.01;

        // Adjust camera follow behavior based on zoom level
        // if (this.targetCameraZoom === this.calculateFullMapZoom()) {
        if (isFullMapView) {
            // When showing full map, center camera on map center
            const mapCenterX = this.mapOffsetX + (this.map.widthInPixels * this.currentScale) / 2;
            const mapCenterY = this.mapOffsetY + (this.map.heightInPixels * this.currentScale) / 2;
            
            // Stop following Pacman and center on map
            this.cameras.main.stopFollow();
            // this.cameras.main.centerOn(mapCenterX, mapCenterY);
            this.cameras.main.pan(mapCenterX, mapCenterY, 1000, 'Power2'); // Smooth pan to center
        } else if (this.currentSection) {
            // In a section - follow Pacman but bias toward section center
            if (!this.cameras.main.followTarget) {
                // this.cameras.main.startFollow(this.pacman);
                this.cameras.main.startFollow(this.pacman, false, 0.08, 0.08);
            }
            
            const sectionCenterX = this.mapOffsetX + (this.currentSection.tileX * 32 * this.currentScale);
            const sectionCenterY = this.mapOffsetY + (this.currentSection.tileY * 32 * this.currentScale);
            
            // this.cameras.main.setFollowOffset(
            //     (sectionCenterX - this.pacman.x) * 0.3, // Reduce offset for smoother transition
            //     (sectionCenterY - this.pacman.y) * 0.3
            // );

            // Smoother offset calculation
            const offsetFactor = 0.2;
            this.cameras.main.setFollowOffset(
                (sectionCenterX - this.pacman.x) * offsetFactor,
                (sectionCenterY - this.pacman.y) * offsetFactor
            );
        } else {
            // In corridors - normal follow
            if (!this.cameras.main.followTarget) {
                // this.cameras.main.startFollow(this.pacman);
                this.cameras.main.startFollow(this.pacman, false, 0.08, 0.08);
            }
            this.cameras.main.setFollowOffset(0, 0);
        }
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
                // Fade out icon and reveal content
                console.log(`Revealing ${section.name}`);
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
        
        // Here you can add content reveal logic
        // For example, show text or other elements
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
            
            // Create Rotation animation
            this.tweens.add({
                targets: section.icon,
                rotation: '+=0.0',
                duration: 3000,
                repeat: -1,
                ease: 'Linear'
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

                // Restart rotation animation
                this.tweens.add({
                    targets: section.icon,
                    rotation: '+=0.0',
                    duration: 3000,
                    repeat: -1,
                    ease: 'Linear'
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
        
        // Position the text
        // const worldPos = this.tilesToWorldPosition(section.tileX, section.tileY);
        
        // const contentY =  worldPos.y -  (4 * 32 * this.currentScale - this.mapOffsetY);
        // section.contentText.setPosition(worldPos.x, contentY);
        
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

        // Storing scale value for other methods
        this.currentScale = scale;

        this.backgroundLayer.setScale(scale);
        this.wallsLayer.setScale(scale);

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

        // // Update Physics World Bounds
        // if (this.physics && this.physics.world) {
        //     this.physics.world.setBounds(
        //         this.mapOffsetX,
        //         this.mapOffsetY,
        //         scaledWidth,
        //         scaledHeight
        //     );
        //     this.pacman.body.setCollideWorldBounds(true);
        // }

        // Update Physics World Bounds - Make them larger to allow camera movement
        if (this.physics && this.physics.world) {
            // Set physics bounds to be larger than the map to allow smooth camera movement
            // const boundsWidth = Math.max(scaledWidth, width * 2);
            const boundsWidth = Math.max(scaledWidth, width * 3);
            // const boundsHeight = Math.max(scaledHeight, height * 2);
            const boundsHeight = Math.max(scaledHeight, height * 3);
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