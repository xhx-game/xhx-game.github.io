class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.score = 0;
        this.isRunning = false;
        this.gameLoopId = null;

        // Game Entities
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];

        // Input
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Tab') {
                e.preventDefault();
                if (document.getElementById('start-screen').style.display !== 'none' ||
                    !document.getElementById('game-over-screen').classList.contains('hidden')) {
                    this.start();
                }
            }
            if (e.code === 'Space' && this.isRunning) {
                this.playerShoot();
            }
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        window.addEventListener('click', () => {
            if (this.isRunning) this.playerShoot();
            else if (document.getElementById('start-screen').style.display !== 'none') this.start();
        });

        // Start Screen Interactivity
        const startScreen = document.getElementById('start-screen');
        const restartBtn = document.getElementById('restart-btn');
        restartBtn.addEventListener('click', () => this.restart());

        // Initial Draw
        this.drawBackground();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-over-screen').classList.add('hidden');

        this.isRunning = true;
        this.score = 0;
        this.updateScore();

        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: 40,
            height: 40,
            speed: 5,
            color: '#00f3ff'
        };

        this.bullets = [];
        this.enemies = [];
        this.particles = [];

        this.lastEnemySpawn = 0;

        this.loop();
    }

    restart() {
        this.start();
    }

    gameOver() {
        this.isRunning = false;
        cancelAnimationFrame(this.gameLoopId);
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
    }

    playerShoot() {
        if (!this.player) return;
        this.bullets.push({
            x: this.player.x,
            y: this.player.y - 20,
            width: 4,
            height: 15,
            speed: 10,
            color: '#ffff00'
        });
    }

    spawnEnemy() {
        const size = 30 + Math.random() * 20;
        this.enemies.push({
            x: Math.random() * (this.canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: 2 + Math.random() * 3,
            color: '#ff0055'
        });
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1.0,
                color: color
            });
        }
    }

    update() {
        if (!this.isRunning) return;

        // Player Movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.player.x -= this.player.speed;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.player.x += this.player.speed;
        // Clamp player
        this.player.x = Math.max(this.player.width / 2, Math.min(this.canvas.width - this.player.width / 2, this.player.x));

        // Spawning Enemies
        if (Date.now() - this.lastEnemySpawn > 1000) {
            this.spawnEnemy();
            this.lastEnemySpawn = Date.now();
        }

        // Update Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.y -= b.speed;
            if (b.y < -50) this.bullets.splice(i, 1);
        }

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            e.y += e.speed;

            // Level 2 & 3: Zigzag movement
            if (this.score >= 20) {
                let sway = 2;
                if (this.score >= 40) sway = 6; // Level 3: Increase sway

                e.x += Math.sin(e.y * 0.05) * sway;
                // Keep inside screen
                if (e.x < 0) e.x = 0;
                if (e.x > this.canvas.width) e.x = this.canvas.width;
            }

            // Player Collision check
            if (this.checkCollision(this.player, e)) {
                this.createExplosion(this.player.x, this.player.y, this.player.color);
                this.gameOver();
                return;
            }

            if (e.y > this.canvas.height) {
                this.enemies.splice(i, 1);
            }
        }

        // Bullet Hit Enemy Check
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.checkCollision(this.bullets[i], this.enemies[j])) {
                    this.createExplosion(this.enemies[j].x, this.enemies[j].y, this.enemies[j].color);
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    this.score += 1;
                    this.updateScore();
                    break;
                }
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    checkCollision(rect1, rect2) {
        // Simple AABB collision (assuming center x,y for simple rendering adjustment)
        // Actually my coords above are center based for player but top-left for enemies? 
        // Let's standardise.
        // Drawing assumes center? Let's check draw.
        // Let's assume x,y is center for all entity logic to be consistent.

        return (
            Math.abs(rect1.x - rect2.x) < (rect1.width + rect2.width) / 2 &&
            Math.abs(rect1.y - rect2.y) < (rect1.height + rect2.height) / 2
        );
    }

    draw() {
        // Clear
        this.ctx.fillStyle = 'rgba(10, 10, 18, 0.3)'; // Trail effect
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.isRunning) return;

        // Draw Player (Cute Biplane)
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);

        // Colors derived from the image
        const bodyColor = '#f4d03f'; // Yellowish cream
        const accentColor = '#e67e22'; // Orange
        const propColor = '#5d6d7e'; // Grey

        // 1. Lower Wing
        this.ctx.fillStyle = accentColor;
        this.ctx.fillRect(-20, -5, 40, 8);

        // 2. Tail components
        this.ctx.fillStyle = accentColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 15);
        this.ctx.lineTo(-10, 25);
        this.ctx.lineTo(10, 25);
        this.ctx.fill();

        // 3. Fuselage (Body)
        this.ctx.fillStyle = bodyColor;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 5, 8, 20, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 4. Engine Cowling (Nose)
        this.ctx.fillStyle = accentColor;
        this.ctx.beginPath();
        this.ctx.arc(0, -12, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // 5. Top Wing
        this.ctx.fillStyle = accentColor;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
        this.ctx.fillRect(-22, -10, 44, 8);
        this.ctx.shadowBlur = 0;

        // 6. Propeller (Spinning)
        this.ctx.save();
        this.ctx.translate(0, -20);
        this.ctx.rotate(Date.now() / 50); // Spin based on time
        this.ctx.fillStyle = propColor;
        this.ctx.fillRect(-18, -2, 36, 4);
        this.ctx.fillRect(-2, -18, 4, 36);
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.restore();

        // Draw Bullets
        this.ctx.fillStyle = '#ffff00';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = '#ffff00';
        this.bullets.forEach(b => {
            this.ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
        });
        this.ctx.shadowBlur = 0;

        // Draw Enemies (Monsters)
        this.enemies.forEach(e => {
            this.ctx.save();
            this.ctx.translate(e.x, e.y);
            this.ctx.fillStyle = e.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = e.color;

            // Monster Body (Blob shape)
            this.ctx.beginPath();
            this.ctx.moveTo(-e.width / 2, -e.height / 2 + 5);
            this.ctx.quadraticCurveTo(0, -e.height / 2 - 5, e.width / 2, -e.height / 2 + 5); // Top head
            this.ctx.lineTo(e.width / 2, e.height / 3);
            // Jagged bottom/legs
            this.ctx.lineTo(e.width / 4, e.height / 2);
            this.ctx.lineTo(0, e.height / 3);
            this.ctx.lineTo(-e.width / 4, e.height / 2);
            this.ctx.lineTo(-e.width / 2, e.height / 3);
            this.ctx.closePath();
            this.ctx.fill();

            // Eyes
            this.ctx.fillStyle = '#000'; // Dark eyes
            this.ctx.beginPath();
            this.ctx.arc(-e.width / 4, -e.height / 6, 4, 0, Math.PI * 2);
            this.ctx.arc(e.width / 4, -e.height / 6, 4, 0, Math.PI * 2);
            this.ctx.fill();

            // Angry Eyebrows
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(-e.width / 2 + 5, -e.height / 4 - 2);
            this.ctx.lineTo(-e.width / 6, -e.height / 6);
            this.ctx.moveTo(e.width / 2 - 5, -e.height / 4 - 2);
            this.ctx.lineTo(e.width / 6, -e.height / 6);
            this.ctx.stroke();

            this.ctx.restore();
        });

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }

    drawBackground() {
        // Static background stars if not running loop frequently or efficiently? 
        // Actually with trail effect clear, stars would blur. 
        // Let's just keep simple background for now.
    }

    updateScore() {
        document.getElementById('score').textContent = `得分: ${this.score}`;
    }

    loop() {
        this.update();
        this.draw();
        if (this.isRunning) {
            this.gameLoopId = requestAnimationFrame(() => this.loop());
        }
    }
}

// Init Game
window.onload = () => {
    new Game();
};
