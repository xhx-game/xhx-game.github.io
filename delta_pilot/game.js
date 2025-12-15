const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreEl = document.getElementById('final-score');

// Game State
let animationId;
let score = 0;
let gameActive = false;
let lastTime = 0;
let spawnInterval;

// Resize Canvas
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Input Handling
const keys = { w: false, a: false, s: false, d: false };
const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

window.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
        case 'w': keys.w = true; break;
        case 'a': keys.a = true; break;
        case 's': keys.s = true; break;
        case 'd': keys.d = true; break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
        case 'w': keys.w = false; break;
        case 'a': keys.a = false; break;
        case 's': keys.s = false; break;
        case 'd': keys.d = false; break;
    }
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', () => {
    if (gameActive) {
        player.shoot();
    }
});

// Utility
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Classes
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = '#00f3ff';
        this.velocity = { x: 0, y: 0 };
        this.speed = 5;
        this.friction = 0.9;
        this.angle = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        // Triangle shape (The Delta)
        ctx.moveTo(20, 0);
        ctx.lineTo(-15, 10);
        ctx.lineTo(-10, 0); // Indent at the back for a sleek look
        ctx.lineTo(-15, -10);
        ctx.closePath();

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner Glow
        ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.fill();

        // Engine flame
        if (keys.w || keys.a || keys.s || keys.d) {
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            ctx.lineTo(-25 - Math.random() * 10, 0);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ff0055';
            ctx.stroke();
        }

        ctx.restore();
    }

    update() {
        // Movement Physics
        if (keys.w) this.velocity.y -= 0.5;
        if (keys.s) this.velocity.y += 0.5;
        if (keys.a) this.velocity.x -= 0.5;
        if (keys.d) this.velocity.x += 0.5;

        // Apply Velocity
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // Screen Boundaries
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Rotation (Look at mouse)
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        this.angle = Math.atan2(dy, dx);

        this.draw();
    }

    shoot() {
        const velocity = {
            x: Math.cos(this.angle) * 10,
            y: Math.sin(this.angle) * 10
        };
        projectiles.push(new Projectile(this.x, this.y, velocity));
    }
}

class Projectile {
    constructor(x, y, velocity) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.radius = 3;
        this.color = '#fff';
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        // Trail effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.draw();
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = '#ff0055';
        this.velocity = {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
        };
        this.angle = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.rect(-10, -10, 20, 20); // Square enemies for now
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    update() {
        // Simple homing towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);

        const speed = score >= 20 ? 6 : 2;
        this.velocity.x = Math.cos(angle) * speed;
        this.velocity.y = Math.sin(angle) * speed;

        // Evasion Logic
        if (score >= 20) {
            projectiles.forEach(proj => {
                const d = Math.hypot(proj.x - this.x, proj.y - this.y);
                if (d < 150) {
                    const angleToProj = Math.atan2(proj.y - this.y, proj.x - this.x);
                    this.velocity.x -= Math.cos(angleToProj) * speed * 0.8;
                    this.velocity.y -= Math.sin(angleToProj) * speed * 0.8;
                }
            });
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.angle += 0.05;

        this.draw();
    }
}

// Arrays
let player;
let projectiles = [];
let enemies = [];
let particles = [];

// Init
function init() {
    player = new Player(canvas.width / 2, canvas.height / 2);
    projectiles = [];
    enemies = [];
    score = 0;
    scoreEl.innerText = 'SCORE: 0';
}

function spawnEnemies(interval = 2500) {
    if (spawnInterval) clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
        if (!gameActive) return;

        let count = 1;
        if (score >= 40) {
            count = 3;
        } else if (score >= 20) {
            count = 2;
        }

        for (let i = 0; i < count; i++) {
            const radius = 30;
            let x, y;

            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
                y = Math.random() * canvas.height;
            } else {
                x = Math.random() * canvas.width;
                y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
            }

            enemies.push(new Enemy(x, y));
        }
    }, interval);
}

// Animation Loop
function animate() {
    if (!gameActive) return;
    animationId = requestAnimationFrame(animate);

    // Clear screen with trail effect
    ctx.fillStyle = 'rgba(10, 10, 18, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player
    player.update();

    // Projectiles
    projectiles.forEach((projectile, pIndex) => {
        projectile.update();

        // Remove off-screen projectiles
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => projectiles.splice(pIndex, 1), 0);
        }
    });

    // Enemies
    enemies.forEach((enemy, eIndex) => {
        enemy.update();

        // Projectile Collision
        projectiles.forEach((projectile, pIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if (dist - enemy.radius - projectile.radius < 1) {
                // Collision!
                score += 1;
                scoreEl.innerText = `SCORE: ${score}`;

                if (score === 20) {
                    spawnEnemies(500);
                }

                // Remove both
                setTimeout(() => {
                    enemies.splice(eIndex, 1);
                    projectiles.splice(pIndex, 1);
                }, 0);
            }
        });

        // Player Collision
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist - enemy.radius - player.radius < 1) {
            endGame();
        }
    });
}

function startGame() {
    gameActive = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    init();
    animate();
    spawnEnemies();
}

function endGame() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.innerText = `Final Score: ${score}`;
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
