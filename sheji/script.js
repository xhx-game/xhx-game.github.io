/**
 * Neon Space Shooter
 * Core Game Logic
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const ui = {
    score: document.getElementById('score'),
    hp: document.getElementById('hp'),
    level: document.getElementById('level'),
    deaths: document.getElementById('deaths'),
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    victoryScreen: document.getElementById('victory-screen'),
    finalScore: document.getElementById('final-score'),
    victoryScore: document.getElementById('victory-score'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    victoryRestartBtn: document.getElementById('victory-restart-btn')
};

// State
const state = {
    isPlaying: false,
    score: 0,
    level: 1,
    deaths: 0,
    levelScoreThreshold: 100, // Points to reach next level
    lastTime: 0,
    enemySpawnTimer: 0,
    gameTime: 0
};

// Configuration
const config = {
    playerSpeed: 0.15, // Lerp factor
    bulletSpeed: 15,
    bulletCooldown: 150, // ms
    enemySpawnRate: 1500, // ms, SLOWER than before (was 1000)
    baseEnemySpeed: 1.5, // SLOWER than before (was ~3.5 avg)
    starCount: 100,
    maxLevels: 5
};

// Input
const input = {
    x: window.innerWidth / 2,
    y: window.innerHeight - 100,
    isShooting: false
};

// Game Objects
let player;
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];

class Star {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 3 + 0.5;
        this.brightness = Math.random();
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Player {
    constructor() {
        this.width = 40;
        this.height = 60;
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.hp = 100;
        this.lastShot = 0;
    }

    update(dt) {
        // Smooth movement towards input
        this.x += (input.x - this.x) * config.playerSpeed;

        // Bounds checking
        if (this.x < this.width / 2) this.x = this.width / 2;
        if (this.x > canvas.width - this.width / 2) this.x = canvas.width - this.width / 2;

        // Shooting
        if (input.isShooting && Date.now() - this.lastShot > config.bulletCooldown) {
            this.shoot();
        }
    }

    shoot() {
        bullets.push(new Bullet(this.x, this.y - this.height / 2));
        this.lastShot = Date.now();
        createParticles(this.x, this.y - 40, 3, '#00f3ff');
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00f3ff';

        // Ship Body
        ctx.fillStyle = '#00f3ff';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(0, this.height / 2 - 10);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();

        // Engine Flame
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.fillStyle = `rgba(255, 0, 255, ${0.5 + Math.random() * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(-10, this.height / 2 - 5);
        ctx.lineTo(0, this.height / 2 + 20 + Math.random() * 10);
        ctx.lineTo(10, this.height / 2 - 5);
        ctx.fill();

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.markedForDeletion = false;
    }

    update() {
        this.y -= config.bulletSpeed;
        if (this.y < 0) this.markedForDeletion = true;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Enemy {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = Math.random() * (canvas.width - this.width) + this.width / 2;
        this.y = -50;
        this.speed = Math.random() * 1.5 + config.baseEnemySpeed + (state.level * 0.2); // Slower base speed, slight increase per level
        this.hp = 1 + Math.floor(state.level / 2); // HP increases every 2 levels
        this.angle = 0;
        this.spin = (Math.random() - 0.5) * 0.1;
        this.markedForDeletion = false;
        this.color = '#ff3333';
    }

    update() {
        this.y += this.speed;
        this.angle += this.spin;

        if (this.y > canvas.height + 50) this.markedForDeletion = true;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;

        // Enemy Shape (Diamond)
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(20, 0);
        ctx.lineTo(0, 20);
        ctx.lineTo(-20, 0);
        ctx.closePath();
        ctx.stroke();

        // Core
        ctx.fillStyle = `rgba(255, 51, 51, ${this.hp * 0.3})`;
        ctx.fill();

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Setup & Resize
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < config.starCount; i++) stars.push(new Star());
}

window.addEventListener('resize', resize);
resize();

// Input Listeners
window.addEventListener('mousemove', e => {
    input.x = e.clientX;
    input.y = e.clientY;
});
window.addEventListener('mousedown', () => input.isShooting = true);
window.addEventListener('mouseup', () => input.isShooting = false);

window.addEventListener('touchmove', e => {
    e.preventDefault();
    input.x = e.touches[0].clientX;
    input.y = e.touches[0].clientY;
}, { passive: false });
window.addEventListener('touchstart', () => input.isShooting = true);
window.addEventListener('touchend', () => input.isShooting = false);

// Keyboard Input for Shooting (B key)
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'b') {
        input.isShooting = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'b') {
        input.isShooting = false;
    }
});

// Game Loop
function loop(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    const dt = timestamp - state.lastTime;
    state.lastTime = timestamp;

    if (state.isPlaying) {
        state.gameTime += dt;

        ctx.fillStyle = 'rgba(11, 11, 20, 0.4)'; // Trails
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update & Draw Stars
        stars.forEach(star => {
            star.update();
            star.draw();
        });

        // Player
        player.update(dt);
        player.draw();

        // Bullets
        bullets.forEach((b, i) => {
            b.update();
            b.draw();
            if (b.markedForDeletion) bullets.splice(i, 1);
        });

        // Enemies
        if (state.gameTime > state.enemySpawnTimer) {
            enemies.push(new Enemy());
            // Difficulty scaling: spawn faster as level goes up
            const rate = Math.max(500, config.enemySpawnRate - (state.level * 150));
            state.enemySpawnTimer = state.gameTime + rate;
        }

        enemies.forEach((e, i) => {
            e.update();
            e.draw();

            // Collision: Bullet -> Enemy
            for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
                const b = bullets[bIndex];
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < e.width / 2 + b.radius) {
                    e.hp--;
                    state.score += 10;
                    ui.score.innerText = state.score;
                    createParticles(e.x, e.y, 5, '#ffff00');

                    // Level Progression
                    if (state.score >= state.level * state.levelScoreThreshold) {
                        nextLevel();
                    }

                    bullets.splice(bIndex, 1);
                    if (e.hp <= 0) {
                        e.markedForDeletion = true;
                        createParticles(e.x, e.y, 15, '#ff3333');
                        state.score += 50;

                        // Heal Player on Kill
                        if (player.hp < 100) {
                            player.hp++;
                            ui.hp.innerText = player.hp;
                            // Visual feedback for healing
                            createParticles(player.x, player.y, 5, '#00ff00');
                        }
                    }
                    break;
                }
            }

            // Collision: Enemy -> Player
            const pdx = e.x - player.x;
            const pdy = e.y - player.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pdist < player.width / 2 + e.width / 2) {
                e.markedForDeletion = true;
                player.hp -= 20;
                ui.hp.innerText = player.hp;
                createParticles(player.x, player.y, 20, '#ff00ff');
                createParticles(e.x, e.y, 10, '#ff3333');

                if (player.hp <= 0) {
                    player.hp = 100;
                    state.deaths++;
                    ui.hp.innerText = player.hp;
                    ui.deaths.innerText = state.deaths;
                    createParticles(player.x, player.y, 50, '#ff0000');
                    state.score = Math.max(0, state.score - 500);
                    ui.score.innerText = state.score;
                }
            }

            if (e.markedForDeletion) enemies.splice(i, 1);
        });

        // Particles
        particles.forEach((p, i) => {
            p.update();
            p.draw();
            if (p.life <= 0) particles.splice(i, 1);
        });
    }

    requestAnimationFrame(loop);
}

function startGame() {
    state.isPlaying = true;
    state.score = 0;
    player = new Player();
    bullets = [];
    enemies = [];
    particles = [];
    state.gameTime = 0;
    state.enemySpawnTimer = 0;

    ui.score.innerText = '0';
    ui.hp.innerText = '100';
    ui.level.innerText = '1';
    ui.deaths.innerText = '0';

    // Reset Level & Deaths
    state.level = 1;
    state.deaths = 0;

    ui.startScreen.classList.remove('active');
    ui.gameOverScreen.classList.remove('active');
    ui.victoryScreen.classList.remove('active');

    requestAnimationFrame(loop);
}

function gameOver() {
    // Game Over removed for endless mode
}

// Init
ui.startBtn.addEventListener('click', startGame);
ui.restartBtn.addEventListener('click', startGame);
ui.victoryRestartBtn.addEventListener('click', startGame);

function nextLevel() {
    state.level++;
    // Infinite levels

    ui.level.innerText = state.level;
    // Visual feedback for level up
    createParticles(canvas.width / 2, canvas.height / 2, 50, '#ffffff');
}

function victory() {
    // Victory removed for endless mode
}

// Start Loop just for background stars
function attractLoop() {
    if (!state.isPlaying) {
        ctx.fillStyle = 'rgba(11, 11, 20, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            star.update();
            star.draw();
        });
        requestAnimationFrame(attractLoop);
    }
}
attractLoop();
