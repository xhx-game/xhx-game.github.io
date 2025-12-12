import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- Constants ---
const PLAYER_HEIGHT = 1.8;
const MOVEMENT_SPEED = 10.0;
const JUMP_FORCE = 15;

// --- Global Variables ---
let camera, scene, renderer;
let controls;
let raycaster;

// Movement state
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
};
let canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();

// Game Objects
const objects = []; // Use for collision detection primarily
const enemies = [];
let playerHealth = 100;
let ammo = 30;
let maxAmmo = 90;
let score = 0;

// Zone Variables
let zoneRadius = 500;
let zoneTargetRadius = 50;
let zoneShrinkSpeed = 20; // Units per second
let zoneDamageTimer = 0;
let zoneMesh;

// Particles
const particles = [];

// Loot
const lootItems = [];
const LOOT_TYPES = {
    AMMO: 'ammo',
    HEALTH: 'health'
};

// --- Initialization ---
init();
animate();

function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 0, 750);

    // 2. Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = PLAYER_HEIGHT;

    // 3. Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0x777777, 0.6); // Soft white light
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // 4. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // 5. Controls (First Person)
    controls = new PointerLockControls(camera, document.body);

    const instructions = document.getElementById('ui-layer');
    instructions.addEventListener('click', function () {
        controls.lock();
    });

    scene.add(controls.getObject());

    // 6. Environment (Simple Floor)
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(-Math.PI / 2);

    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.8
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    scene.add(floor);

    // Simple buildings/boxes
    const boxGeometry = new THREE.BoxGeometry(20, 20, 20);
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

    for (let i = 0; i < 50; i++) {
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
        box.position.y = 10;
        box.position.z = Math.floor(Math.random() * 20 - 10) * 20;

        box.castShadow = true;
        box.receiveShadow = true;

        scene.add(box);
        objects.push(box);
    }

    // Spawn Loot
    spawnLoot(15);

    // 7. Event Listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);

    // Raycaster for shooting (center screen)
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 100);

    // Spawn Enemies
    spawnEnemies(20);

    // Shooting
    document.addEventListener('mousedown', function (event) {
        if (controls.isLocked) {
            shoot();
        }
    });
}

function spawnEnemies(count) {
    const enemyGeometry = new THREE.BoxGeometry(2, 4, 2);
    const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red for enemies

    for (let i = 0; i < count; i++) {
        const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
        // Random position on the map
        const x = Math.floor(Math.random() * 200 - 100) * 10; // Spread out more
        const z = Math.floor(Math.random() * 200 - 100) * 10;
        enemy.position.set(x, 2, z);

        enemy.castShadow = true;
        enemy.receiveShadow = true;

        enemy.userData = {
            health: 100,
            speed: 5 + Math.random() * 5,
            lastShot: 0,
            shootRate: 2000 + Math.random() * 2000
        };

        scene.add(enemy);
        enemies.push(enemy);
        objects.push(enemy); // Can be hit
    }
    updateHUD();

    // Create Zone Visuals
    const zoneGeo = new THREE.CylinderGeometry(zoneRadius, zoneRadius, 500, 32, 1, true);
    const zoneMat = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
    zoneMesh.position.y = 0;
    scene.add(zoneMesh);
}

function spawnLoot(count) {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    for (let i = 0; i < count; i++) {
        const type = Math.random() > 0.5 ? LOOT_TYPES.AMMO : LOOT_TYPES.HEALTH;
        const color = type === LOOT_TYPES.AMMO ? 0x00ff00 : 0xffffff; // Green or White

        const material = new THREE.MeshStandardMaterial({ color: color });
        if (type === LOOT_TYPES.HEALTH) material.emissive.setHex(0xff0000); // Glowing red for health

        const loot = new THREE.Mesh(boxGeo, material);

        const x = Math.floor(Math.random() * 200 - 100) * 10;
        const z = Math.floor(Math.random() * 200 - 100) * 10;
        loot.position.set(x, 0.5, z);

        loot.userData = { type: type };

        // Spinning animation offset
        loot.userData.rotSpeed = Math.random() * 2 + 1;

        scene.add(loot);
        lootItems.push(loot);
    }
}

function shoot() {
    if (ammo <= 0) return;

    ammo--;
    updateHUD();

    createMuzzleFlash();

    // Raycast from camera center
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        if (enemies.includes(hitObject)) {
            // Hit an enemy
            hitObject.material.color.setHex(0xffffff); // Flash white
            setTimeout(() => {
                if (enemies.includes(hitObject)) hitObject.material.color.setHex(0xff0000);
            }, 100);

            hitObject.userData.health -= 25; // 4 shots to kill

            if (hitObject.userData.health <= 0) {
                scene.remove(hitObject);
                enemies.splice(enemies.indexOf(hitObject), 1);
                objects.splice(objects.indexOf(hitObject), 1);

                // Death particles
                createExplosion(hitObject.position, 0xff0000);

                score++;
                document.getElementById('survivors-count').innerText = "生存人数: " + (enemies.length + 1);

                if (enemies.length === 0) {
                    alert("大吉大利，今晚吃鸡！你消灭了所有人。");
                    location.reload();
                }
            }
        }
    }
}

function updateHUD() {
    document.getElementById('ammo-count').innerText = ammo + " / " + maxAmmo;
    document.getElementById('hp-text').innerText = playerHealth;
    document.getElementById('health-fill').style.width = playerHealth + "%";
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveState.forward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveState.left = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveState.backward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveState.right = true;
            break;
        case 'Space':
            if (canJump === true) velocity.y += JUMP_FORCE;
            canJump = false;
            break;
        case 'ShiftLeft':
            moveState.sprint = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveState.forward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveState.left = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveState.backward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveState.right = false;
            break;
        case 'ShiftLeft':
            moveState.sprint = false;
            break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked === true) {
        // Friction / Deceleration
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 10.0 * delta; // 100.0 = mass

        direction.z = Number(moveState.forward) - Number(moveState.backward);
        direction.x = Number(moveState.right) - Number(moveState.left);
        direction.normalize(); // Ensure consistent speed in all directions

        if (moveState.forward || moveState.backward) velocity.z -= direction.z * 400.0 * delta;
        if (moveState.left || moveState.right) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.getObject().position.y += (velocity.y * delta);

        // Simple floor collision
        if (controls.getObject().position.y < PLAYER_HEIGHT) {
            velocity.y = 0;
            controls.getObject().position.y = PLAYER_HEIGHT;
            canJump = true;
        }
    }

    // Enemy Logic
    updateEnemies(time);

    // Zone Logic
    updateZone(delta);

    // Loot Logic
    updateLoot(delta);

    // Particles Logic
    updateParticles(delta);

    // Minimap
    updateMinimap();

    prevTime = time;

    renderer.render(scene, camera);
}

function updateMinimap() {
    const canvas = document.getElementById('minimap');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Config
    const mapScale = width / 1000; // Map size 1000x1000
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw Zone
    ctx.beginPath();
    ctx.arc(centerX, centerY, zoneRadius * mapScale, 0, 2 * Math.PI);
    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Optional: Fill zone slightly
    ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
    ctx.fill();

    // Draw Enemies
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => {
        const x = centerX + enemy.position.x * mapScale;
        const y = centerY + enemy.position.z * mapScale;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Draw Loot (Optional)
    lootItems.forEach(loot => {
        ctx.fillStyle = loot.userData.type === LOOT_TYPES.AMMO ? '#00ff00' : '#ffffff';
        const x = centerX + loot.position.x * mapScale;
        const y = centerY + loot.position.z * mapScale;

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Draw Player
    const playerPos = controls.getObject().position;
    const px = centerX + playerPos.x * mapScale;
    const py = centerY + playerPos.z * mapScale;

    // Player Arrow
    ctx.save();
    ctx.translate(px, py);
    // Get camera rotation (yaw)
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    const angle = Math.atan2(cameraDir.x, cameraDir.z);

    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.restore();
}

function updateEnemies(time) {
    const playerPos = controls.getObject().position;

    enemies.forEach(enemy => {
        // Simple Chase AI
        const dist = enemy.position.distanceTo(playerPos);
        const engageDistance = 30; // Stop and shoot distance

        if (dist < 100 && dist > engageDistance) {
            const dir = new THREE.Vector3().subVectors(playerPos, enemy.position).normalize();
            dir.y = 0; // Don't fly
            enemy.position.add(dir.multiplyScalar(enemy.userData.speed * 0.01));
            enemy.lookAt(playerPos);
        } else if (dist <= engageDistance) {
            enemy.lookAt(playerPos);

            // Ranged Attack
            if (time - enemy.userData.lastShot > enemy.userData.shootRate) {
                enemy.userData.lastShot = time;
                enemyShoot(enemy, playerPos);
            }
        }
    });
}

function enemyShoot(enemy, targetPos) {
    // 1. Visual Tracer
    const tracerGeo = new THREE.BufferGeometry().setFromPoints([
        enemy.position,
        new THREE.Vector3(targetPos.x, targetPos.y - 0.5, targetPos.z) // Aim slightly low/center
    ]);
    const tracerMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const tracer = new THREE.Line(tracerGeo, tracerMat);
    scene.add(tracer);

    setTimeout(() => {
        scene.remove(tracer);
        tracer.geometry.dispose();
        tracer.material.dispose();
    }, 100);

    // 2. Hit Calculation (Simple probability based on movement?)
    // Let's make it hit if no obstacle (simplified raycast) or just random chance
    // For now, purely random chance to mimic "accuracy"
    if (Math.random() < 0.4) {
        playerHealth -= 10;
        if (playerHealth < 0) playerHealth = 0;
        updateHUD();

        // Damage Flash
        const flash = document.createElement('div');
        flash.className = 'damage-flash';
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.pointerEvents = 'none';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 200);

        if (playerHealth === 0) {
            alert("游戏结束！剩余人数: " + enemies.length);
            location.reload();
        }
    }
}

function updateZone(delta) {
    if (!delta) return;
    // Shrink Zone
    if (zoneRadius > zoneTargetRadius) {
        zoneRadius -= zoneShrinkSpeed * delta;
        if (zoneRadius < zoneTargetRadius) zoneRadius = zoneTargetRadius;

        // Update Visuals
        zoneMesh.scale.set(zoneRadius / 500, 1, zoneRadius / 500);
    }

    // Check Player in Zone
    const playerDist = controls.getObject().position.distanceTo(new THREE.Vector3(0, controls.getObject().position.y, 0)); // Distance from center (0,0,0)

    if (playerDist > zoneRadius) {
        // Outside Zone - Take Damage
        zoneDamageTimer += delta;
        if (zoneDamageTimer > 1.0) { // Damage every second
            playerHealth -= 5;
            if (playerHealth < 0) playerHealth = 0;
            updateHUD();

            // Blue flash for zone damage
            const flash = document.createElement('div');
            flash.className = 'damage-flash';
            flash.style.backgroundColor = 'rgba(0, 0, 255, 0.3)';
            flash.style.position = 'absolute';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.pointerEvents = 'none';
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 200);

            if (playerHealth === 0) {
                alert("你倒在了信号接收区外！剩余人数: " + enemies.length);
                location.reload();
            }
            zoneDamageTimer = 0;
        }
    } else {
        zoneDamageTimer = 0;
    }
}

function updateLoot(delta) {
    if (!delta) return;
    const playerPos = controls.getObject().position;

    for (let i = lootItems.length - 1; i >= 0; i--) {
        const loot = lootItems[i];

        // Animation
        loot.rotation.y += delta * loot.userData.rotSpeed;

        // Collision (Simple distance check for now)
        if (loot.position.distanceTo(playerPos) < 2.5) {
            // Pickup
            if (loot.userData.type === LOOT_TYPES.AMMO) {
                if (ammo < maxAmmo) {
                    ammo = Math.min(ammo + 30, maxAmmo);
                    // Pickup Effect
                    createExplosion(loot.position, 0x00ff00);
                    scene.remove(loot);
                    lootItems.splice(i, 1);
                    updateHUD();
                }
            } else if (loot.userData.type === LOOT_TYPES.HEALTH) {
                if (playerHealth < 100) {
                    playerHealth = Math.min(playerHealth + 50, 100);
                    // Pickup Effect
                    createExplosion(loot.position, 0xff0000);
                    scene.remove(loot);
                    lootItems.splice(i, 1);
                    updateHUD();
                }
            }
        }
    }
}

function createMuzzleFlash() {
    const flashGeo = new THREE.PlaneGeometry(0.5, 0.5);
    const flashMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);

    flash.position.set(0.5, -0.5, -1); // Relative to camera
    camera.add(flash);

    setTimeout(() => {
        camera.remove(flash);
        flash.geometry.dispose();
        flash.material.dispose();
    }, 50);
}

function createExplosion(position, color) {
    const particleCount = 20;
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: color });

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);

        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        particle.userData.life = 1.0;

        scene.add(particle);
        particles.push(particle);
    }
}

function updateParticles(delta) {
    if (!delta) return;
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.userData.life -= delta;
        p.position.addScaledVector(p.userData.velocity, delta);
        p.userData.velocity.y -= 9.8 * delta; // Gravity

        if (p.userData.life <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        } else {
            p.scale.setScalar(p.userData.life);
        }
    }
}
