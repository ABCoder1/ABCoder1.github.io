class PacManScene extends Phaser.Scene {
    createInstructionalArrows() {
        // Create a container for all instructional elements
        this.instructionContainer = this.add.container(0, 0);
        
        // Arrow properties
        const arrowDistance = 80; // Distance from Pacman center
        const arrowSize = 32;
        const keySize = 24;
        
        // Create arrows and keys for each direction
        const directions = [
            { key: 'W', angle: 0, x: 0, y: -arrowDistance, direction: 'up' },
            { key: 'S', angle: 180, x: 0, y: arrowDistance, direction: 'down' },
            { key: 'A', angle: -90, x: -arrowDistance, y: 0, direction: 'left' },
            { key: 'D', angle: 90, x: arrowDistance, y: 0, direction: 'right' }
        ];
        
        this.instructionArrows = [];
        
        directions.forEach(dir => {
            // Create arrow graphics
            const arrow = this.add.graphics();
            arrow.fillStyle(0xFFD700, 0.8); // Gold color with transparency
            arrow.lineStyle(2, 0xFFFFFF, 1); // White outline
            
            // Draw arrow shape
            arrow.beginPath();
            arrow.moveTo(0, -15);     // Top point
            arrow.lineTo(-10, 5);     // Bottom left
            arrow.lineTo(-5, 5);      // Inner left
            arrow.lineTo(-5, 15);     // Bottom left inner
            arrow.lineTo(5, 15);      // Bottom right inner
            arrow.lineTo(5, 5);       // Inner right
            arrow.lineTo(10, 5);      // Bottom right
            arrow.closePath();
            arrow.fillPath();
            arrow.strokePath();
            
            // Rotate arrow to correct direction
            arrow.setRotation(Phaser.Math.DegToRad(dir.angle));
            
            // Create key background (rounded rectangle)
            const keyBg = this.add.graphics();
            keyBg.fillStyle(0x000000, 0.8); // Black background
            keyBg.lineStyle(2, 0xFFFFFF, 1); // White border
            keyBg.fillRoundedRect(-keySize/2, -keySize/2, keySize, keySize, 4);
            keyBg.strokeRoundedRect(-keySize/2, -keySize/2, keySize, keySize, 4);
            
            // Create key text
            const keyText = this.add.text(0, 0, dir.key, {
                fontSize: '16px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }).setOrigin(0.5);
            
            // Create container for this direction's elements
            const directionContainer = this.add.container(dir.x, dir.y);
            directionContainer.add([arrow, keyBg, keyText]);
            
            // Position key below/beside arrow based on direction
            if (dir.direction === 'up') {
                keyBg.setPosition(0, 35);
                keyText.setPosition(0, 35);
            } else if (dir.direction === 'down') {
                keyBg.setPosition(0, -35);
                keyText.setPosition(0, -35);
            } else if (dir.direction === 'left') {
                keyBg.setPosition(35, 0);
                keyText.setPosition(35, 0);
            } else if (dir.direction === 'right') {
                keyBg.setPosition(-35, 0);
                keyText.setPosition(-35, 0);
            }
            
            // Store references
            this.instructionArrows.push({
                container: directionContainer,
                arrow: arrow,
                keyBg: keyBg,
                keyText: keyText,
                direction: dir.direction
            });
            
            this.instructionContainer.add(directionContainer);
        });
        
        // Initially hide the instruction container
        this.instructionContainer.setAlpha(0);
        this.instructionsVisible = false;
        this.hasPlayerMoved = false;
    }

    showInstructions() {
        if (!this.instructionsVisible && !this.hasPlayerMoved) {
            this.instructionsVisible = true;
            
            // Position instruction container at Pacman's position
            this.instructionContainer.setPosition(this.pacman.x, this.pacman.y);
            
            // Fade in instructions
            this.tweens.add({
                targets: this.instructionContainer,
                alpha: 1,
                duration: 500,
                ease: 'Power2'
            });
            
            // Add pulsing animation to arrows
            this.instructionArrows.forEach(instruction => {
                this.tweens.add({
                    targets: instruction.arrow,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                
                // Add glow effect to key
                this.tweens.add({
                    targets: instruction.keyBg,
                    alpha: 0.6,
                    duration: 800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            });
        }
    }

    hideInstructions() {
        if (this.instructionsVisible) {
            this.instructionsVisible = false;
            this.hasPlayerMoved = true;
            
            // Stop all instruction animations
            this.instructionArrows.forEach(instruction => {
                this.tweens.killTweensOf(instruction.arrow);
                this.tweens.killTweensOf(instruction.keyBg);
            });
            
            // Fade out instructions
            this.tweens.add({
                targets: this.instructionContainer,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.instructionContainer.setVisible(false);
                }
            });
        }
    }

    updateInstructions() {
        // Stop showing instructions if Pacman is moving
        if (this.pacman && this.pacman.isMoving) {
            this.hideInstructions();
        }

        // Show instructions when game starts
        if (!this.instructionsVisible && !this.hasPlayerMoved && this.pacman && this.pacmanInitialized) {
            this.showInstructions();
        }
        
        // Update instruction position to follow Pacman (in case of camera movement)
        if (this.instructionsVisible && this.pacman) {
            this.instructionContainer.setPosition(this.pacman.x, this.pacman.y);
        }
    }

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
                x: 10, y: 5, icon: 'work-experience', name: 'Work Experience',
                bounds: { minX: 2, maxX: 17, minY: 2, maxY: 7 },        // Outer bounds for detection
                innerBounds: { minX: 3, maxX: 16.5, minY: 3, maxY: 6.5 }    // Inner bounds for camera centering
            },
            { 
                // Top Right Section
                x: 30, y: 5, icon: 'projects', name: 'Projects',
                bounds: { minX: 22, maxX: 38, minY: 2, maxY: 7 },       // Outer bounds for detection
                innerBounds: { minX: 23, maxX: 36.5, minY: 3, maxY: 6.5 }   // Inner bounds for camera centering
            },
            { 
                // Bottom Left Section
                x: 10, y: 15, icon: 'skills', name: 'Skills',
                bounds: { minX: 2, maxX: 17, minY: 12, maxY: 18 },      // Outer bounds for detection
                innerBounds: { minX: 3, maxX: 16.5, minY: 13, maxY: 16.5 }  // Inner bounds for camera centering
            },
            { 
                // Bottom Right Section
                x: 30, y: 15, icon: 'about-me', name: 'About Me',
                bounds: { minX: 22, maxX: 38, minY: 12, maxY: 18 },     // Outer bounds for detection
                innerBounds: { minX: 23, maxX: 36.5, minY: 13, maxY: 16.5 } // Inner bounds for camera centering
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
                contentContainer: null,             // Container for section heading & content
                originalY: 0,                       // Will be set properly in resize()
                index: index,                       // Store index for animations
                bounds: section.bounds,             // Store bounds for proximity detection
                innerBounds: section.innerBounds    // Store inner bounds for camera centering
            };
            
            this.sectionIcons.push(sectionData);
            this.sectionIconsContainer.add(blurContainer);
        });
    }

    createSectionData() {
        // Define custom data for each section
        this.sectionData = {
            'Work Experience': [
                {
                    logo: 'smartbridge-logo',
                    title: 'Machine Learning Intern',
                    company: 'Smartbridge',
                    period: 'June 2019 - July 2019',
                    description: 'Developed a facial recognition module using Python, OpenCV and Scikit-Learn for tackling identity theft via facial spoofing attacks in biometric authentication systems.',
                    technologies: ['OpenCV', 'scikit-learn', 'NumPy', 'Pandas', 'Matplotlib', 'PyTorch', 'TensorFlow'],
                    achievements: [
                        'Developed a facial recognition module using OpenCV & NumPy for data analytics and data modeling.',
                        'Implemented anomaly detection algorithms using scikit-learn and PyTorch, testing & refining the model\'s problem solving aptitude to achieve optimal accuracy based on the confusion matrix, thereby mitigating identity theft risks.',
                    ]
                },
                {
                    logo: 'serc-logo',
                    title: 'Full Stack Developer',
                    company: 'SERC, IIIT Hyderabad',
                    period: 'June 2020 - July 2020',
                    description: 'Developed interactive web interfaces for programming lab simulations and contributed to the Virtual Labs platform at IIIT Hyderabad, making coding concepts more interactive for students.',
                    technologies: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express.js', 'Socket.io', 'MongoDB'],
                    achievements: [
                        'Resolved front-end bugs for Virtual Labs at IIIT Hyderabad, enhancing user experience and system stability.',
                        'Developed efficient REST APIs with query-parameter optimization & lazy-loading and evaluated the scalability of various technologies in internal projects.',
                    ]
                },
                {
                    logo: 'forcepoint-logo',
                    title: 'Software Engineer',
                    company: 'Forcepoint',
                    period: 'July 2022 - August 2024',
                    description: 'Developed and maintained cybersecurity solutions using design patterns like CQRS & DDD. Worked on threat detection systems and user interface improvements for Remote Browser Isolation (RBI) and Cloud Access Security Broker (CASB).',
                    technologies: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Kubernetes', 'Kafka', 'Docker', 'Memcached', 'Redis', 'MongoDB', 'MariaDB', 'Amazon RDS'],
                    achievements: [
                        'Products : RBI (Remote Browser Isolation) & CASB (Cloud Access Security Broker)',
                        'Migrated RBI codebase to cloud infrastructure and implemented AWS latency-based load balancing, enabling access to over a million daily end-users from any device globally, increasing user reach by 50% and reducing downtime by 20%.',
                        'Incorporated Antivirus, OPSWAT, and deep-secure scanning support, ensuring security compliance by processing over 500,000 scans weekly and ensuring 100% safe downloads through CDR and remote rendering of popular file formats.',
                        'Revamped CASB\'s monolithic architecture into an event-driven CQRS architecture using Golang, improving system responsiveness by 30%, eliminating testing framework bottlenecks and increasing scalability for future growth & load.'
                    ]
                },
                {
                    logo: 'ucr-logo',
                    title: 'Research Assistant',
                    company: 'UC Riverside',
                    period: 'Jun 2025 - Present',
                    description: 'Built and optimized ML pipelines on HPCC Linux servers for large-scale genomic data, leveraging Bash scripting and CUDA libraries to accelerate training and inference of foundational models.',
                    technologies: ['Pytorch', 'TensorFlow', 'HuggingFace', 'WandB', 'LangChain'],
                    achievements: [
                        'Designed & Developed Transformer & VAE based ML models for scRNA-Seq data to model viral-host interactions.',
                        'Leveraged Contrastive Learning to extract latent biological features, boosting cellular differentiation prediction rate.',
                        'Integrated MLOps and workflow orchestration with Databricks, Prometheus, and W&B to streamline ML pipelines.'
                    ]
                }
            ],
            'Projects': [
                {
                    logo: 'forcepoint-logo',
                    title: 'AI-Powered Portfolio',
                    company: 'Personal Project',
                    period: '2024',
                    description: 'Interactive portfolio website built with Phaser.js featuring AI-driven animations and game mechanics.',
                    technologies: ['Phaser.js', 'JavaScript', 'WebGL', 'CSS3'],
                    achievements: [
                        'Unique gaming interface',
                        'Responsive design',
                        'Interactive animations'
                    ]
                }
            ],
            'Skills': [
                {
                    logo: 'ucr-logo',
                    title: 'Programming Languages',
                    company: 'Technical Skills',
                    period: 'Proficient',
                    description: 'Expertise in multiple programming languages and frameworks for full-stack development.',
                    technologies: ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript'],
                    achievements: [
                        '5+ years experience',
                        'Full-stack development',
                        'Algorithm optimization'
                    ]
                }
            ],
            'About Me': [
                {
                    logo: 'forcepoint-logo',
                    title: 'Passionate Developer',
                    company: 'Personal Info',
                    period: 'Always Learning',
                    description: 'Dedicated software engineer with a passion for creating innovative solutions and learning new technologies.',
                    technologies: ['Problem Solving', 'Team Leadership', 'Innovation'],
                    achievements: [
                        'Quick learner',
                        'Team player',
                        'Innovation focused'
                    ]
                }
            ]
        };
    }

    createSectionContent(section) {
        if (!this.sectionData[section.name]) {
            console.log('No section data found for:', section.name);
            return;
        }

        const sectionItems = this.sectionData[section.name];
        
        // Create container for all orbs in this section
        section.orbsContainer = this.add.container(0, 0);
        section.orbs = [];

        // Calculate section bounds in WORLD coordinates
        const innerBounds = section.innerBounds;
        const tileSize = 32 * this.currentScale;
        
        // Calculate the actual section dimensions in world coordinates
        const sectionWorldWidth = (innerBounds.maxX - innerBounds.minX + 1) * tileSize;
        const sectionWorldHeight = (innerBounds.maxY - innerBounds.minY + 1) * tileSize;

        // Orb area settings - only use a portion of the section for orbs
        const orbAreaWidth = sectionWorldWidth * 0.8;  // 80% of inner section width
        const orbAreaHeight = sectionWorldHeight * 0.4; // 40% of inner section height
        
        // Calculate grid layout
        const numOrbs = sectionItems.length;
        const maxOrbsPerRow = Math.min(4, numOrbs);
        const numRows = Math.ceil(numOrbs / maxOrbsPerRow);
        
        // Calculate cell dimensions
        const cellWidth = orbAreaWidth / maxOrbsPerRow;
        const cellHeight = orbAreaHeight / numRows;

        // For debug purposes - shows the orb area and grid
        const debug = false;
        if (debug) {
            const debugGraphics = this.add.graphics();
            
            // Inner bounds (green)
            debugGraphics.lineStyle(2, 0x00ff00, 0.7);
            debugGraphics.strokeRect(
                - sectionWorldWidth/2,
                - sectionWorldHeight/2 + 85,
                sectionWorldWidth,
                sectionWorldHeight
            );
            
            // Orb area (blue) -- Hidden below yellow table
            debugGraphics.lineStyle(2, 0x0000ff, 0.7);
            debugGraphics.strokeRect(
                -orbAreaWidth/2,
                -orbAreaHeight/2 + 85, // Since, orb positioning is offseted at +85
                orbAreaWidth,
                orbAreaHeight
            );

            // Table grid cells (yellow) - RELATIVE positioning
            debugGraphics.lineStyle(1, 0xffff00, 0.7);
            for (let r = 0; r < numRows; r++) {
                // Calculate orbs in this row
                const orbsInThisRow = (r === numRows-1) 
                    ? (numOrbs - (numRows-1) * maxOrbsPerRow) 
                    : maxOrbsPerRow;
                    
                // Calculate row offset to center cells
                const rowOffset = (maxOrbsPerRow - orbsInThisRow) * cellWidth / 2;
                
                for (let c = 0; c < orbsInThisRow; c++) {
                    debugGraphics.strokeRect(
                        -orbAreaWidth/2 + rowOffset + c * cellWidth,
                        -orbAreaHeight/2 + 85 + r * cellHeight, // +85 to match orb offset
                        cellWidth,
                        cellHeight
                    );
                }
            }
            
            // Section center (red dot)
            debugGraphics.fillStyle(0xff0000, 1);
            debugGraphics.fillCircle(0, 85, 5);
            
            section.orbsContainer.add(debugGraphics);
        }

        // Create orbs
        sectionItems.forEach((item, index) => {
            // Calculate grid position
            const row = Math.floor(index / maxOrbsPerRow);
            const col = index % maxOrbsPerRow;
            
            // Calculate how many orbs are in this row (last row might have fewer)
            const orbsInThisRow = (row === numRows-1) 
                ? (numOrbs - (numRows-1) * maxOrbsPerRow) 
                : maxOrbsPerRow;
                
            // Center orbs in each row
            const rowOffset = (maxOrbsPerRow - orbsInThisRow) * cellWidth / 2;

            // Calculate RELATIVE position within the orb area 
            const orbX = -orbAreaWidth/2 + rowOffset + (col + 0.5) * cellWidth;
            const orbY = -orbAreaHeight/2 + (row + 0.5) * cellHeight + 85; // +85 to position below heading

            // Create floating orb
            const orb = this.add.image(0, 0, item.logo);
            orb.setScale(0.07); // Small size
            orb.setAlpha(0.9);
            
            // Create cooldown meter graphics
            const cooldownMeter = this.add.graphics();
            cooldownMeter.setAlpha(0); // Initially invisible
            cooldownMeter.setDepth(10); // Ensure it's visible above the orb
            
            // Create orb container at calculated position
            const orbContainer = this.add.container(orbX, orbY);
            orbContainer.add([orb, cooldownMeter]);
            
            // Store orb data
            const orbObject = {
                container: orbContainer,
                orb: orb,
                cooldownMeter: cooldownMeter,
                glows: [],
                data: item,
                isInteracted: false,
                canInteract: true,
                originalX: orbX,
                originalY: orbY,
                originalAlpha: 0.9,
                isInCooldown: false,
                cooldownProgress: 0
            };
            
            section.orbs.push(orbObject);
            section.orbsContainer.add(orbContainer);
            
            // Add physics body for collision detection
            this.physics.add.existing(orbContainer);
            orbContainer.body.setSize(30, 30); // Small collision area
            orbContainer.body.setImmovable(true);

            // Collision with Pacman - keep reference to collider per orb
            const overlapCollider = this.physics.add.overlap(this.pacman, orbContainer, () => {
                this.handleOrbInteraction(orbObject, section);
            });
            orbObject.overlapCollider = overlapCollider;
        });
        
        // Adding orbs to section content for proper cleanup
        if (section.contentContainer) {
            section.contentContainer.add(section.orbsContainer);
        }

        // Start orb animations
        this.startOrbAnimations(section);
    }

    // Animation for orbs
    startOrbAnimations(section) {
        section.orbs.forEach(orb => {
            // Floating animation
            this.tweens.add({
                targets: orb.container,
                y: orb.originalY + 2, // Subtle movement
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    // Start cooldown visual effect on an orb
    startCooldownVisual(orbObject) {
        if (!orbObject || !orbObject.orb || !orbObject.cooldownMeter) return;
        
        orbObject.isInCooldown = true;
        orbObject.cooldownProgress = 0;
        
        // Fade the orb (reduce alpha)
        orbObject.orb.setAlpha(0.3);
        
        // Show the cooldown meter and animate its appearance
        orbObject.cooldownMeter.setAlpha(1);
        
        const COOLDOWN_DURATION = 1200; // milliseconds
        const METER_RADIUS = 20; // Radius of the circular meter
        const METER_WIDTH = 3; // Width of the arc
        const METER_COLOR = 0x00FFFF; // Cyan color for the meter
        
        // Animate the cooldown progress
        const startTime = this.time.now;
        
        const updateCooldown = () => {
            if (!orbObject.isInCooldown || !orbObject.cooldownMeter) return;
            
            const elapsed = this.time.now - startTime;
            orbObject.cooldownProgress = Math.min(elapsed / COOLDOWN_DURATION, 1);
            
            // Clear previous drawings
            orbObject.cooldownMeter.clear();
            
            // Draw the cooldown progress arc
            if (orbObject.cooldownProgress > 0) {
                orbObject.cooldownMeter.lineStyle(METER_WIDTH, METER_COLOR, 1);
                
                // Calculate the end angle (in radians)
                // Starting from top (-Math.PI/2), going clockwise
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + (orbObject.cooldownProgress * 2 * Math.PI);
                
                // Draw the arc
                orbObject.cooldownMeter.arc(
                    0, 0,                    // Center of the orb
                    METER_RADIUS,             // Radius
                    startAngle,              // Start angle
                    endAngle,                // End angle
                    false                     // Anticlockwise
                );
                orbObject.cooldownMeter.strokePath();
            }
            
            // Continue updating until cooldown is complete
            if (orbObject.cooldownProgress < 1) {
                this.time.addEvent({
                    delay: 16, // ~60fps
                    callback: updateCooldown,
                    callbackScope: this
                });
            }
        };
        
        // Start the cooldown update loop
        updateCooldown();
    }

    // End cooldown visual effect on an orb
    endCooldownVisual(orbObject) {
        if (!orbObject || !orbObject.orb || !orbObject.cooldownMeter) return;
        
        orbObject.isInCooldown = false;
        
        // Restore the orb's original alpha with a smooth transition
        this.tweens.add({
            targets: orbObject.orb,
            alpha: orbObject.originalAlpha,
            duration: 300,
            ease: 'Power2.easeOut'
        });
        
        // Hide the cooldown meter with a fade out
        this.tweens.add({
            targets: orbObject.cooldownMeter,
            alpha: 0,
            duration: 200,
            ease: 'Power2.easeOut',
            onComplete: () => {
                orbObject.cooldownMeter.clear();
                orbObject.cooldownProgress = 0;
            }
        });
    }

    // Interaction handler when Pacman touches an orb
    handleOrbInteraction(orbObject, section) {
        if (orbObject.isInteracted || this.overlayOpen || !orbObject.canInteract) return;
        
        orbObject.isInteracted = true;
        // Disable this orb's overlap collider to avoid immediate retrigger while Pacman overlaps
        if (orbObject.overlapCollider) {
            orbObject.overlapCollider.active = false;
        }
        this.showOverlay(orbObject, section);
        
        // Visual feedback for interaction
        this.tweens.add({
            targets: orbObject.container,
            scale: 1.3,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
    }

    // Show overlay with details
    showOverlay(orbObject, section) {
        // Close any existing overlay first
        if (this.overlayOpen) {
            this.closeOverlay();
            // Wait a moment for cleanup to complete
            // this.time.delayedCall(200, () => {
            //     this.createNewOverlay(orbObject, section);
            // });
            return;
        }
        
        this.createNewOverlay(orbObject, section);
    }
    
    createNewOverlay(orbObject, section) {
        // Safety check - don't create overlay if one already exists
        if (this.overlayOpen || this.overlayBg || this.overlayContainer) {
            console.log('Overlay already exists, skipping creation');
            return;
        }
        
        this.overlayOpen = true;
        orbObject.canInteract = false;
        const data = orbObject.data;

        // Get current camera properties
        const camera = this.cameras.main;
        // Create overlay background - covers the entire visible area
        this.overlayBg = this.add.graphics();
        this.overlayBg.fillStyle(0x000000, 0.7);
        this.overlayBg.fillRect(0, 0, camera.width, camera.height);
        this.overlayBg.setScrollFactor(0); // Fixed to camera
        this.overlayBg.setDepth(1000); // Ensure it's on top

        // Keep your current overlay size
        const overlayWidth = Math.min(camera.width * 0.6, 350);
        const overlayHeight = Math.min(camera.height * 0.35, 250);

        // Create overlay container at SCREEN CENTER
        this.overlayContainer = this.add.container(camera.width / 2, camera.height / 2);
        this.overlayContainer.setScrollFactor(0); // Fixed to camera
        this.overlayContainer.setDepth(1001); // Ensure it's above background
        
        // Create window background with neon border
        const overlayWindow = this.add.graphics();
        overlayWindow.fillStyle(0x001122, 0.95);
        overlayWindow.lineStyle(3, 0x00ffff, 1);
        overlayWindow.fillRoundedRect(-overlayWidth/2, -overlayHeight/2, overlayWidth, overlayHeight, 15);
        overlayWindow.strokeRoundedRect(-overlayWidth/2, -overlayHeight/2, overlayWidth, overlayHeight, 15);
        
        // Create non-scrollable content container
        this.nonScrollableContent = this.add.container(0, 0);
        this.nonScrollableContent.setScrollFactor(0); // Fixed to camera
        this.nonScrollableContent.setDepth(1002); // Ensure it's above the overlayWindow & overlayContainer

        // Position main content container at the top
        this.nonScrollableContent.setPosition(-overlayWidth/2, -overlayHeight/2);
        this.nonScrollableContent.setSize(overlayWidth, overlayHeight/2);

        // Create scrollable content container
        this.scrollableContent = this.add.container(0, 0);
        this.scrollableContent.setScrollFactor(0); // Fixed to camera
        this.scrollableContent.setDepth(1002); // Ensure it's above the overlayWindow & overlayContainer

        // Position scrollable content in the lower half of the OverlayContainer
        this.scrollableContent.setPosition(-overlayWidth/2, 0);
        this.scrollableContent.setSize(overlayWidth, overlayHeight/2);

        // Calculate text scaling for your specific overlay size - much smaller text
        const textScale = Math.max(0.5, Math.min(1, overlayWidth / 350));
        // const textScale = 1;
        
        // Content positioning - start from top with appropriate padding
        let currentY = 20; // Start from top with smaller padding
        const contentPadding = 20;
        const lineSpacing = 10; // Smaller line spacing


        // Add logo at top
        const logo = this.add.image(overlayWidth/2, currentY + contentPadding, data.logo);
        logo.setScale(0.07 * textScale);
        currentY += contentPadding + 2*lineSpacing;
        
        // Add title
        const titleSize = Math.floor(14 * textScale);
        const title = this.add.text(overlayWidth/2, currentY + contentPadding, data.title, {
            fontSize: `${titleSize}px`,
            fill: '#FFE400',
            // fontFamily: this.fontLoaded ? 'Pixelify Sans' : 'Arial',
            fontFamily: 'Monaco',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        currentY += titleSize/2 + 2*lineSpacing;
        
        // Add company and period
        const subtitleSize = Math.floor(10 * textScale);
        const company = this.add.text(overlayWidth/2, currentY + contentPadding, `${data.company} | ${data.period}`, {
            fontSize: `${subtitleSize}px`,
            fill: '#00FFFF',
            // fontFamily: this.fontLoaded ? 'Pixelify Sans' : 'Arial'
            fontFamily: 'Monaco'
        }).setOrigin(0.5);
        currentY += subtitleSize/2 + 2*lineSpacing;
        
        // Reset position for scrollableContent container
        currentY = overlayHeight/2;

        // Add description
        const bodySize = Math.floor(10 * textScale);
        const description = this.add.text(overlayWidth/2, overlayHeight/6 + 0.6*lineSpacing, data.description, { // We use overlayHeight/4 here because our description itself takes 4 lines of space
            fontSize: `${bodySize}px`,
            fill: '#FFFFFF',
            // fontFamily: this.fontLoaded ? 'Pixelify Sans' : 'Arial',
            fontFamily: 'Monaco',
            wordWrap: { width: overlayWidth - contentPadding * 2 },
            align: 'center'
        }).setOrigin(0.5);
        currentY -= 1.5*lineSpacing;
        
        // Add technologies title
        const sectionTitleSize = Math.floor(12 * textScale);
        const techTitle = this.add.text(overlayWidth/2, currentY, 'Technologies:', {
            fontSize: `${sectionTitleSize}px`,
            fill: '#FFE400',
            // fontFamily: this.fontLoaded ? 'Pixelify Sans' : 'Arial',
            fontFamily: 'Monaco',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        currentY += 2*lineSpacing;

        // Add technologies body
        const techBodySize = Math.floor(10 * textScale);
        const technologies = this.add.text(overlayWidth/2, currentY + contentPadding, data.technologies.join(' • '), {
            fontSize: `${techBodySize}px`,
            fill: '#00FF00',
            // fontFamily: this.fontLoaded ? 'Pixelify Sans' : 'Arial',
            fontFamily: 'Monaco',
            wordWrap: { width: overlayWidth - contentPadding * 2 },
            align: 'center'
        }).setOrigin(0.5);
        
        const techHeight = technologies.height;
        currentY += techHeight + 2*lineSpacing;
        
        // Add achievements title
        const achieveTitle = this.add.text(overlayWidth/2, currentY + lineSpacing, 'Key Achievements:', {
            fontSize: `${sectionTitleSize}px`,
            fill: '#FFE400',
            // fontFamily: this.fontLoaded ? 'Pixelify Sans' : 'Arial',
            fontFamily: 'Monaco',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        currentY += sectionTitleSize + lineSpacing;
        
        const achievements = this.add.text(overlayWidth/2, currentY + lineSpacing, data.achievements.map(a => `• ${a}`).join('\n\n'), {
            fontSize: `${techBodySize}px`,
            fill: '#FFFFFF',
            // fontFamily: this.fontLoaded ? 'Pixelify Sans' : 'Arial',
            fontFamily: 'Arial',
            wordWrap: { width: overlayWidth - contentPadding * 2 },
            align: 'left',
            lineSpacing: 2
        }).setOrigin(0.5, 0);
        
        const achievementsHeight = achievements.height;
        currentY += achievementsHeight + lineSpacing;

        // Add non-scrollable content elements to main content container
        this.nonScrollableContent.add([
            logo, title, company
        ]);

        // Add all the scrollable content elements to scrollable container
        this.scrollableContent.add([
            description, techTitle, technologies, achieveTitle, achievements
        ]);
        
        // Calculate total content height and if scrolling is needed
        const startY = -overlayHeight/2 + 20; // content start Y
        const totalContentHeight = currentY - startY; // Total content height from start position
        const availableHeight = overlayHeight - 50;
        const needsScrolling = totalContentHeight > availableHeight;
        console.log('needsScrolling', needsScrolling);

        // Create & position the mask graphics
        const worldPos = this.tilesToWorldPosition(section.tileX, section.tileY);
        const maskShape = this.add.graphics();
        maskShape.fillStyle(0x001122); // Color doesn't matter for the mask, just its shape
        maskShape.fillRect(worldPos.x - overlayWidth/2, worldPos.y + 1.5*lineSpacing, overlayWidth, overlayHeight/4 + contentPadding);

        this.maskShape = maskShape;
        // Create the mask itself
        const mask = maskShape.createGeometryMask();

        // Apply the mask to the scrollable content
        this.scrollableContent.setMask(mask);
        
        // Scroll properties
        this.scrollY = 0;
        this.maxScrollY = needsScrolling ? Math.max(0, totalContentHeight - availableHeight) : 0;
        console.log('maxScrollY', this.maxScrollY);
        
        // Add scroll instructions if needed
        let scrollInstructions = null;
        // if (needsScrolling) {
        //     scrollInstructions = this.add.text(0, overlayHeight/2 - 25, 'Use Mouse Wheel to scroll', {
        //         fontSize: `${Math.floor(8 * textScale)}px`,
        //         // fill: '#888888',
        //         fill: '#FFFFFF',
        //         // fontFamily: this.fontLoaded ? 'Pixelify Sans' : 'Arial',
        //         fontFamily: 'Monaco',
        //         fontStyle: 'italic'
        //     }).setOrigin(0.5);
        // }
        
        // Add close instruction
        const closeText = this.add.text(0, overlayHeight/2 - 15, 'Use Mouse Wheel to scroll | Press ESC to close', {
            fontSize: `${Math.floor(8 * textScale)}px`,
            // fill: '#888888',
            fill: '#FFFFFF',
            // fontFamily: this.fontLoaded ? 'Pixelify Sans' : 'Arial',
            fontFamily: 'Monaco',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        
        // Add all elements to overlayContainer
        const elementsToAdd = [overlayWindow, this.nonScrollableContent, this.scrollableContent, closeText];
        if (scrollInstructions) elementsToAdd.push(scrollInstructions);
        this.overlayContainer.add(elementsToAdd);

        const debug = 0;
        if (debug > 0) {
            switch (debug) {
                case 1:
                    // For debugging the nonScrollableContent's position, draw a green rectangle around it
                    const debugGraphics1 = this.add.graphics();
                    debugGraphics1.fillStyle(0x00ff00, 0.5);
                    debugGraphics1.fillRect(0, 0, this.nonScrollableContent.width, this.nonScrollableContent.height);
                    this.nonScrollableContent.add(debugGraphics1);
                    break;
                case 2:
                    // For debugging the scrollableContent's position, draw a red rectangle around it
                    const debugGraphics2 = this.add.graphics();
                    debugGraphics2.fillStyle(0x0000ff, 0.5);
                    debugGraphics2.fillRect(0, 0, this.scrollableContent.width, this.scrollableContent.height);
                    this.scrollableContent.add(debugGraphics2);
                    break;
                case 3:
                    // For debugging both the nonScrollableContent and the scrollableContent
                    const debugGraphics3a = this.add.graphics();
                    debugGraphics3a.fillStyle(0x0000ff, 0.5);
                    debugGraphics3a.fillRect(0, 0, this.nonScrollableContent.width, this.nonScrollableContent.height);
                    this.nonScrollableContent.add(debugGraphics3a);
                    
                    const debugGraphics3b = this.add.graphics();
                    debugGraphics3b.fillStyle(0x00ff00, 0.5);
                    debugGraphics3b.fillRect(0, 0, this.scrollableContent.width, overlayHeight/2);
                    this.scrollableContent.add(debugGraphics3b);
                    break;
                case 4:
                    // For debugging the mask's position, draw a blue rectangle around it
                    const debugGraphics4 = this.add.graphics();
                    debugGraphics4.fillStyle(0x0000ff, 0.5);
                    debugGraphics4.fillRect(0, 3*contentPadding + overlayHeight/2, overlayWidth, overlayHeight/4 + contentPadding);
                    this.scrollableContent.add(debugGraphics4);
                    break;
                default:
                    // For debugging everything
                    const debugGraphics5a = this.add.graphics();
                    debugGraphics5a.fillStyle(0x0000ff, 0.5);
                    debugGraphics5a.fillRect(0, 0, this.nonScrollableContent.width, this.nonScrollableContent.height);
                    this.nonScrollableContent.add(debugGraphics5a);

                    const debugGraphics5b = this.add.graphics();
                    debugGraphics5b.fillStyle(0x0000ff, 0.5);
                    debugGraphics5b.fillRect(0, 0, this.scrollableContent.width, this.scrollableContent.height);
                    this.scrollableContent.add(debugGraphics5b);
                    
                    const debugGraphics5c = this.add.graphics();
                    debugGraphics5c.fillStyle(0x0000ff, 0.5);
                    debugGraphics5c.fillRect(0, 3*contentPadding + overlayHeight/2, overlayWidth, overlayHeight/4 + contentPadding);
                    this.scrollableContent.add(debugGraphics5c);
                    break;
            }
        }

        // Setup scroll controls if needed
        if (needsScrolling) {
            // Mouse-only scroll: prevent default page scroll while overlay open
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                if (this.overlayOpen) {
                    this.scrollContent(deltaY, overlayHeight);
                }
            });
        }
        
        // Animate overlay in
        this.overlayContainer.setAlpha(0).setScale(0.8);
        this.tweens.add({
            targets: this.overlayContainer,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // Setup ESC key listener
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // Create a temporary property to hold the current orbObject
        this.currentOrbToClose = orbObject;

        // Use the standard listener, which will call the closeOverlay method on the scene instance.
        // The orbObject reference is now stored on the scene instance.
        this.escKey.on('down', this.closeOverlay, this);
    }

    // Cleanup overlay elements immediately
    cleanupOverlayElements() {
        // Remove the mask and destroy it
        if (this.scrollableContent && this.scrollableContent.mask) {
            this.scrollableContent.mask.destroy();
            this.scrollableContent.setMask(null);
        }

        // Destroy the graphics object that created the mask
        if (this.maskShape) {
            this.maskShape.destroy();
            this.maskShape = null;
        }

        // Destroy overlay background first
        if (this.overlayBg) {
            this.overlayBg.destroy();
            this.overlayBg = null;
        }
        
        // Destroy overlay container and its children
        if (this.overlayContainer) {
            this.overlayContainer.destroy();
            this.overlayContainer = null;
        }
        
        // Destroy non-scrollable content container
        if (this.nonScrollableContent) {
            this.nonScrollableContent.destroy();
            this.nonScrollableContent = null;
        }
        
        // Destroy scrollable content container
        if (this.scrollableContent) {
            this.scrollableContent.destroy();
            this.scrollableContent = null;
        }
    }

    // Handle content scrolling
    scrollContent(deltaY, overlayHeight) {
        if (!this.scrollableContent || this.maxScrollY <= 0) return;
        this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, 0, this.maxScrollY);

        this.scrollableContent.setY(-this.scrollY);
        // this.scrollableContent.setY(this.scrollY + (overlayHeight / 2 + 20));
    }

    // Close overlay when ESC is pressed
    closeOverlay() {
        if (!this.overlayOpen) return;
        
        this.overlayOpen = false;

        // Stop any existing tweens on overlay elements to prevent conflicts
        if (this.overlayContainer) {
            this.tweens.killTweensOf(this.overlayContainer);
        }

        // Remove wheel event listener
        this.input.off('wheel');
        
        // Immediate cleanup - don't wait for animation
        this.cleanupOverlayElements();
        
        // Optional: Add a quick fade out animation
        if (this.overlayContainer && this.overlayContainer.active) {
            this.tweens.add({
                targets: this.overlayContainer,
                alpha: 0,
                scale: 0.5,
                duration: 100, // Shorter duration for rapid operations
                ease: 'Power2',
                onComplete: () => {
                    // Double-check cleanup
                    this.cleanupOverlayElements();
                }
            });
        }
        
        // Remove ESC key listener
        if (this.escKey) {
            this.escKey.off('down', this.closeOverlay, this);
            this.escKey = null;
        }

        // Retrieve the orb object that was stored in showOverlay
        const orbObject = this.currentOrbToClose;

        console.log('orbObject after closeOverlay', orbObject);
        // Only reset the current orb; leave others intact
        if (orbObject) {
            // Reset flags
            orbObject.isInteracted = false;
            orbObject.canInteract = false;

            // Re-enable this orb's collider after a short delay to avoid immediate retrigger
            this.time.delayedCall(200, () => {
                if (orbObject.overlapCollider) {
                    orbObject.overlapCollider.active = true;
                }
            }, [], this);

            this.currentOrbToClose = null;
            
            // Start cooldown visual effect
            this.startCooldownVisual(orbObject);
            
            // Allow interaction again after a cooldown
            this.time.delayedCall(1200, () => {
                orbObject.canInteract = true;
                this.endCooldownVisual(orbObject);
            }, [], this);
        } else {
            // Fallback: do not touch other orbs' state; just clear reference
            this.currentOrbToClose = null;
        }
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

        this.sectionIcons.forEach((section, index) => {
            const innerBounds = section.innerBounds;
        
            // Check if Pacman is in the inner bounds of this section
            const pacmanInInnerBounds = (
                pacmanTileX >= innerBounds.minX && pacmanTileX <= innerBounds.maxX &&
                pacmanTileY >= innerBounds.minY && pacmanTileY <= innerBounds.maxY
            );

            // Check if camera is centered on this section and isn't in transition
            const cameraIsCenteredOnThisSection = (
                this.currentSection === section && 
                !this.isInTransition
            );

            // Reveal section content when Pacman is in inner bounds && camera is centered
            if (pacmanInInnerBounds && cameraIsCenteredOnThisSection && !section.isRevealed) {
                this.revealSection(section);
            } 
            // Hide section content when either condition is not met
            else if (section.isRevealed && (!pacmanInInnerBounds || !cameraIsCenteredOnThisSection)) {
                this.hideSection(section);
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

    hideSection(section) {
        section.isRevealed = false;

        // Reset orb interactions when hiding section
        if (section.orbs) {
            section.orbs.forEach(orb => {
                // Reset orb interaction state
                orb.isInteracted = false;
                orb.canInteract = true;
                orb.isInCooldown = false;
                orb.cooldownProgress = 0;
                
                // Restore original alpha
                if (orb.orb && orb.originalAlpha !== undefined) {
                    orb.orb.setAlpha(orb.originalAlpha);
                }
                
                // Hide and clear cooldown meter
                if (orb.cooldownMeter) {
                    orb.cooldownMeter.setAlpha(0);
                    orb.cooldownMeter.clear();
                }
                
                // Stop any active tweens on orbs
                this.tweens.killTweensOf(orb.container);
                this.tweens.killTweensOf(orb.orb);
                this.tweens.killTweensOf(orb.cooldownMeter);
            });
        }
        
        // Hide content first
        this.hideSectionContent(section);
        
        // Stop any existing tweens on this section's elements to prevent conflicts
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
        if (section.contentContainer && section.contentContainer.active) {
            section.contentContainer.destroy();
        }

        // Create Animated Section Heading
        this.createSectionHeading(section);

        // Create contents inside each section
        this.createSectionContent(section);
    }

    createSectionHeading(section) {
        // Create background glow/border effect
        const glowContainer = this.add.container(0, 0);
        
        // Create multiple text layers for the 3D effect
        const shadowOffset = 4;

        // Bottom shadow layer (darkest)
        const shadowText = this.add.text(shadowOffset, shadowOffset, section.name.toUpperCase(), {
            fontFamily: this.fontLoaded ? 'Pixelify Sans Bold' : 'Arial',
            fontSize: '32px',
            fill: '#000000',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Glow layers for neon effect
        const glow1 = this.add.text(0, 0, section.name.toUpperCase(), {
            fontFamily: this.fontLoaded ? 'Pixelify Sans Bold' : 'Arial',
            fontSize: '32px',
            fill: '#00FFFF',
            stroke: '#00FFFF',
            strokeThickness: 8
        }).setOrigin(0.5).setAlpha(0.3);

        const glow2 = this.add.text(0, 0, section.name.toUpperCase(), {
            fontFamily: this.fontLoaded ? 'Pixelify Sans Bold' : 'Arial',
            fontSize: '32px',
            fill: '#0080FF',
            stroke: '#0080FF',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0.5);
        
        // Main text layer with gradient-like effect
        const mainText = this.add.text(0, 0, section.name.toUpperCase(), {
            fontFamily: this.fontLoaded ? 'Pixelify Sans Bold' : 'Arial',
            fontSize: '32px',
            fill: '#FFE400',
            stroke: '#FF8000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Highlight layer for 3D effect
        const highlightText = this.add.text(-1, -1, section.name.toUpperCase(), {
            fontFamily: this.fontLoaded ? 'Pixelify Sans Bold' : 'Arial',
            fontSize: '32px',
            fill: '#FFFFA0',
            stroke: '#FFFFFF',
            strokeThickness: 1
        }).setOrigin(0.5).setAlpha(0.8);
        
        // Add all layers to container
        glowContainer.add([shadowText, glow1, glow2, mainText, highlightText]);
        
        // Create main container
        section.contentContainer = this.add.container(0, 0);
        section.contentContainer.add([glowContainer]);
        
        // Position heading higher to make room for orbs
        const worldPos = this.tilesToWorldPosition(section.tileX, section.tileY);
        section.contentContainer.setPosition(worldPos.x, worldPos.y - 60);
        
        // Animate content in
        section.contentContainer.setAlpha(0).setScale(0.3);
        this.tweens.add({
            targets: section.contentContainer,
            alpha: 1,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });

        // Pulsing glow effect
        this.tweens.add({
            targets: [glow1, glow2],
            alpha: { from: 0.1, to: 0.6 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Subtle floating animation
        this.tweens.add({
            targets: section.contentContainer,
            y: worldPos.y - 60 + 5,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    hideSectionContent(section) {
        if (section.contentContainer && section.contentContainer.active) {
            this.tweens.add({
                targets: section.contentContainer,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    // Check if contentContainer still exists and is active before destroying
                    if (section.contentContainer && section.contentContainer.active) {
                        section.contentContainer.destroy();
                    }
                    section.contentContainer = null;
                }
            });
        } else {
            // If contentContainer doesn't exist or is already destroyed, just set to null
            section.contentContainer = null;
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
        this.load.image('forcepoint-logo', 'assets/forcepoint-neon-logo.png');
        this.load.image('ucr-logo', 'assets/ucr-neon-logo.png');
        this.load.image('serc-logo', 'assets/serc-neon-logo.png');
        this.load.image('smartbridge-logo', 'assets/smartbridge-neon-logo.png');
    }

    create() {
        // Initialize variables early
        this.mapOffsetX = 0;
        this.mapOffsetY = 0;
        this.currentScale = 1;
        this.pacmanInitialized = false;
        this.animationsStarted = false; // Flag to prevent multiple animation starts
        this.fontLoaded = false;
        this.overlayOpen = false; // Track overlay state
        // this.canInteract = true; // Track if orb can be interacted with (to deal with race condition)

        // Create section data
        this.createSectionData();

        WebFont.load({
            custom: {
                families: ['Pixelify Sans Bold', 'Pixelify Sans Regular'],
                urls: ['index.css']
            },
            active: () => {
                this.fontLoaded = true;
                console.log('Font loaded successfully');
            }
        });

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

        // Create section icons and instructional arrows after map's creation
        this.createSectionIcons();
        if (!this.pacman.isMoving) {
            this.createInstructionalArrows();
        }

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
            this.updateInstructions();
        }
    }

    // Add cleanup method for when scene is destroyed
    destroy() {
        // Close overlay if open
        if (this.overlayOpen) {
            this.closeOverlay();
        }

        // Stop any active camera animation
        if (this.activeCameraTween) {
            this.activeCameraTween.stop();
            this.activeCameraTween = null;
        }

        // Stop instruction animations
        if (this.instructionArrows) {
            this.instructionArrows.forEach(instruction => {
                this.tweens.killTweensOf(instruction.arrow);
                this.tweens.killTweensOf(instruction.keyBg);
            });
        }

        // Clean up all section content
        if (this.sectionIcons) {
            this.sectionIcons.forEach(section => {
                if (section.contentContainer && section.contentContainer.active) {
                    section.contentContainer.destroy();
                }
                section.contentContainer = null;
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
        this.isMoving = false;

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
        // Disable movement if overlay is open
        if (this.scene.overlayOpen) {
            this.body.setVelocity(0, 0);
            this.anims.stop(); // Stop the animation when overlay is open
            return;
        }
        
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
            // Hide instructions on first movement
            if (!this.isMoving) {
                this.isMoving = true;
                this.scene.hideInstructions();
            }

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