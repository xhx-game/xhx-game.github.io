const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ui = {
    score: document.getElementById('score'),
    hp: document.getElementById('hp'),
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    finalScore: document.getElementById('final-score'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn')
};

const state = {
    isPlaying: false,
    score: 0,
    hp: 100,
    lastTime: 0,
    spawnTimer: 0
};

const input = { x: window.innerWidth / 2, isShooting: false };
const config = { speed: 5, spawnRate: 1500, bulletCooldown: 200 };

let player, bullets = [], enemies = [], particles = [], bubbles = [];

class Submarine {
    constructor() {
        this.width = 60;
        this.height = 40;
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.lastShot = 0;
    }
    update() {
        this.x += (input.x - this.x) * 0.1;
        if (input.isShooting && Date.now() - this.lastShot > config.bulletCooldown) {
            this.shoot();
        }
    }
    shoot() {
        bullets.push(new Bubble(this.x, this.y - 30));
        this.lastShot = Date.now();
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Body
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cockpit
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.arc(10, -10, 10, 0, Math.PI * 2);
        ctx.fill();
        // Propeller
        ctx.fillStyle = '#fbc02d';
        ctx.fillRect(-35, -5, 10, 10);
        ctx.restore();
    }
}

class Bubble {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.remove = false;
    }
    update() {
        this.y -= 8;
        if (this.y < 0) this.remove = true;
    }
    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Trash {
    constructor() {
        this.x = Math.random() * (canvas.width - 40) + 20;
        this.y = -40;
        this.size = 30;
        this.speed = Math.random() * 2 + 1;
        this.type = Math.floor(Math.random() * 3); // 0: Square, 1: Circle, 2: Triangle
        this.remove = false;
    }
    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.remove = true;
            state.hp -= 10;
            ui.hp.innerText = state.hp;
            if (state.hp <= 0) gameOver();
        }
    }
    draw() {
        ctx.fillStyle = '#5d4037';
        if (this.type === 1) ctx.fillStyle = '#424242'; // Plastic
        if (this.type === 2) ctx.fillStyle = '#3e2723'; // Old boot?

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        if (this.type === 0) ctx.fillRect(-15, -15, 30, 30);
        else if (this.type === 1) ctx.arc(0, 0, 15, 0, Math.PI * 2);
        else {
            ctx.moveTo(0, -15);
            ctx.lineTo(15, 15);
            ctx.lineTo(-15, 15);
        }
        ctx.fill();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.05; }
    draw() {
        ctx.globalAlpha = this.life; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', e => input.x = e.clientX);
window.addEventListener('mousedown', () => input.isShooting = true);
window.addEventListener('mouseup', () => input.isShooting = false);
window.addEventListener('touchstart', (e) => { input.isShooting = true; input.x = e.touches[0].clientX; });
window.addEventListener('touchend', () => input.isShooting = false);
window.addEventListener('touchmove', (e) => { e.preventDefault(); input.x = e.touches[0].clientX; }, { passive: false });
window.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'b') input.isShooting = true; });
window.addEventListener('keyup', e => { if (e.key.toLowerCase() === 'b') input.isShooting = false; });

function loop(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    const dt = timestamp - state.lastTime;
    state.lastTime = timestamp;

    if (state.isPlaying) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear

        // Background bubbles
        if (Math.random() < 0.05) bubbles.push(new Bubble(Math.random() * canvas.width, canvas.height + 20));
        bubbles.forEach((b, i) => { b.y -= 2; b.draw(); if (b.y < -20) bubbles.splice(i, 1); });

        player.update();
        player.draw();

        if (timestamp > state.spawnTimer) {
            enemies.push(new Trash());
            state.spawnTimer = timestamp + config.spawnRate;
            if (config.spawnRate > 500) config.spawnRate -= 10;
        }

        bullets.forEach((b, i) => {
            b.update(); b.draw();
            if (b.remove) bullets.splice(i, 1);
        });

        enemies.forEach((e, i) => {
            e.update(); e.draw();
            // Collision Bullet-Trash
            bullets.forEach((b, bi) => {
                const dx = b.x - e.x, dy = b.y - e.y;
                if (Math.sqrt(dx * dx + dy * dy) < 30) {
                    e.remove = true; b.remove = true;
                    state.score++; ui.score.innerText = state.score;
                    for (let k = 0; k < 5; k++) particles.push(new Particle(e.x, e.y, '#fff'));
                }
            });
            if (e.remove) enemies.splice(i, 1);
        });

        particles.forEach((p, i) => { p.update(); p.draw(); if (p.life <= 0) particles.splice(i, 1); });
    }
    requestAnimationFrame(loop);
}

function startGame() {
    state.isPlaying = true; state.score = 0; state.hp = 100;
    ui.score.innerText = 0; ui.hp.innerText = 100;
    bullets = []; enemies = []; particles = [];
    player = new Submarine();
    ui.startScreen.classList.remove('active');
    ui.gameOverScreen.classList.remove('active');
    requestAnimationFrame(loop);
}

function gameOver() {
    state.isPlaying = false;
    ui.finalScore.innerText = state.score;
    ui.gameOverScreen.classList.add('active');
}

ui.startBtn.addEventListener('click', startGame);
ui.restartBtn.addEventListener('click', startGame);
requestAnimationFrame(loop);
