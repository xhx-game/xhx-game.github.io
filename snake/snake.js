// snake.js - 贪吃蛇游戏逻辑 (支持 AI)

const canvas = document.getElementById('gameCanvas');
console.log('snake.js loaded');
const ctx = canvas.getContext('2d');
const gridSize = 20; // 每格大小
const canvasSize = canvas.width; // 假设宽高相等
const tileCount = canvasSize / gridSize;

// Game State
let snakes = [];
let foods = [];
const maxFoods = 50;
const aiSnakeCount = 3; // Number of AI snakes

let gameInterval = null;
const startBtn = document.getElementById('startBtn');
const scoreSpan = document.getElementById('scoreBox');
const difficultySelect = document.getElementById('difficultySelect');

// --- Snake Class ---
class Snake {
    constructor(id, x, y, color, isAI = false) {
        this.id = id;
        this.body = [{ x: x, y: y }];
        this.direction = { x: 0, y: 0 }; // Initial static
        this.nextDirection = { x: 0, y: 0 };
        this.color = color;
        this.isAI = isAI;
        this.score = 0;
        this.alive = true;
        this.growPending = 0;

        // Start moving randomly if AI, right if player
        if (isAI) {
            const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            this.direction = dirs[Math.floor(Math.random() * dirs.length)];
            this.nextDirection = this.direction;
        } else {
            this.direction = { x: 1, y: 0 };
            this.nextDirection = { x: 1, y: 0 };
        }
    }

    update() {
        if (!this.alive) return;

        // Apply next direction
        this.direction = this.nextDirection;

        // AI Logic: Decide direction before moving
        if (this.isAI) {
            this.aiDecide();
        }

        const head = this.body[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // Check Wall Collision
        if (newHead.x < 0 || newHead.x >= tileCount || newHead.y < 0 || newHead.y >= tileCount) {
            this.die();
            return;
        }

        // Check Snake Collision (Self and Others)
        for (let s of snakes) {
            if (!s.alive) continue;
            // Allow passing through self
            if (s === this) continue;
            // Note: simple collision, head-on-head handled by processing order roughly
            if (s.body.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
                this.die();
                return;
            }
        }

        // Move
        this.body.unshift(newHead);

        // Check Food
        const eatenIndex = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
        if (eatenIndex !== -1) {
            this.score++;
            foods.splice(eatenIndex, 1);
            foods.push(generateRandomFood());

            if (!this.isAI) {
                updateScore();
                checkLevelUp();
            }
        } else {
            this.body.pop();
        }
    }

    aiDecide() {
        // 1. Find nearest food
        let nearestFood = null;
        let minDist = Infinity;
        const head = this.body[0];

        foods.forEach(f => {
            const d = Math.abs(f.x - head.x) + Math.abs(f.y - head.y); // Manhattan distance
            if (d < minDist) {
                minDist = d;
                nearestFood = f;
            }
        });

        const possibleMoves = [
            { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
        ];

        // Filter out reverse moves
        const validMoves = possibleMoves.filter(m => !(m.x === -this.direction.x && m.y === -this.direction.y));

        // Sort moves by distance to food
        validMoves.sort((a, b) => {
            if (!nearestFood) return 0;
            const distA = Math.abs((head.x + a.x) - nearestFood.x) + Math.abs((head.y + a.y) - nearestFood.y);
            const distB = Math.abs((head.x + b.x) - nearestFood.x) + Math.abs((head.y + b.y) - nearestFood.y);
            return distA - distB;
        });

        // Try best move first, check for safety
        for (let move of validMoves) {
            if (this.isSafe(head.x + move.x, head.y + move.y)) {
                this.nextDirection = move;
                return;
            }
        }

        // If trapped, just keep going or die trying
    }

    isSafe(x, y) {
        // Wall
        if (x < 0 || x >= tileCount || y < 0 || y >= tileCount) return false;

        // Snakes
        for (let s of snakes) {
            if (!s.alive) continue;
            if (s.body.some(seg => seg.x === x && seg.y === y)) return false;
        }
        return true;
    }

    die() {
        this.alive = false;
        if (!this.isAI) {
            gameOver();
        } else {
            // Turn body into food
            this.body.forEach(seg => {
                foods.push({ x: seg.x, y: seg.y });
            });

            // Respawn AI after short delay or immediately? Let's respawn immediately for chaos
            setTimeout(() => {
                // Remove this dead snake instance
                snakes = snakes.filter(s => s !== this);
                // Add new AI
                spawnAI();
            }, 1000);
        }
    }

    draw() {
        if (!this.alive) return;

        // Use instance color
        let snakeColor = this.color;

        this.body.forEach((seg, i) => {
            ctx.fillStyle = snakeColor;

            // Highlight head
            if (i === 0) {
                // Player head: Dark Red, AI head: Grey
                ctx.fillStyle = this.isAI ? '#cccccc' : '#8b0000';
            }

            ctx.fillRect(seg.x * gridSize, seg.y * gridSize, gridSize, gridSize);
        });
    }
}

// --- Game Logic ---

function initGame() {
    snakes = [];
    foods = [];

    // Player - Red
    const player = new Snake('player', 5, 5, '#ff0000', false);
    snakes.push(player);

    // AI
    for (let i = 0; i < aiSnakeCount; i++) {
        spawnAI();
    }

    // Foods
    for (let i = 0; i < maxFoods; i++) {
        foods.push(generateRandomFood());
    }

    updateScore();
}

function spawnAI() {
    // Random position not on things
    let x, y;
    let safe = false;
    while (!safe) {
        x = Math.floor(Math.random() * tileCount);
        y = Math.floor(Math.random() * tileCount);
        if (isPositionSafe(x, y)) safe = true;
    }

    // AI - White
    const color = '#ffffff';

    const ai = new Snake('ai-' + Date.now(), x, y, color, true);
    snakes.push(ai);
}

function isPositionSafe(x, y) {
    if (snakes.some(s => s.alive && s.body.some(b => b.x === x && b.y === y))) return false;
    // Don't spawn too close to player head?
    return true;
}

function startGame() {
    console.log('Start button clicked');
    initGame();
    startBtn.disabled = true;
    if (gameInterval) clearInterval(gameInterval);

    const fps = parseInt(difficultySelect.value) || 5;
    setGameSpeed(fps);
}

function setGameSpeed(fps) {
    if (gameInterval) clearInterval(gameInterval);
    // AI needs to be reasonably fast or it's boring, but tied to game loop
    const interval = 1000 / fps;
    gameInterval = setInterval(gameLoop, interval);
}

function resetGame() {
    clearInterval(gameInterval);
    startBtn.disabled = false;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
}

function generateRandomFood() {
    let newFood;
    while (true) {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        // Check collisions (simplified)
        // Ideally check against all snakes, but random is usually fine
        let collision = false;
        snakes.forEach(s => {
            if (s.body.some(seg => seg.x === newFood.x && seg.y === newFood.y)) collision = true;
        });
        if (foods.some(f => f.x === newFood.x && f.y === newFood.y)) collision = true;

        if (!collision) break;
    }
    return newFood;
}

function updateScore() {
    // Only player score
    const player = snakes.find(s => !s.isAI);
    if (player) {
        scoreSpan.textContent = `得分: ${player.score}`;
    }
}

function gameLoop() {
    // Filter dead snakes (cleanup)
    // Actually we keep dead snakes until they are removed by their own die timer or logic

    // Update all snakes
    // Copy array to avoid issues if snakes die/spawn during update
    [...snakes].forEach(s => s.update());

    draw();
}

function checkLevelUp() {
    const player = snakes.find(s => !s.isAI);
    if (!player) return;

    const score = player.score;
    const currentFPS = parseInt(difficultySelect.value);
    let targetFPS = currentFPS;

    if (score >= 20) targetFPS = 8;
    else if (score >= 10) targetFPS = 5;

    if (targetFPS > currentFPS) {
        difficultySelect.value = targetFPS;
        setGameSpeed(targetFPS);
    }
}

function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw Foods
    const time = Date.now() / 500;
    const pulse = 0.8 + 0.2 * Math.abs(Math.sin(time));
    ctx.fillStyle = '#ffcc00';

    foods.forEach(food => {
        ctx.save();
        ctx.translate(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2);
        ctx.scale(pulse, pulse);
        ctx.fillRect(-gridSize / 2, -gridSize / 2, gridSize, gridSize);
        ctx.restore();
    });

    // Draw Snakes
    snakes.forEach(s => s.draw());
}

function changeDirection(event) {
    const key = event.key;

    // Prevent scrolling when using arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        event.preventDefault();
    }

    const player = snakes.find(s => !s.isAI && s.alive);
    if (!player) return;

    // Determine current direction to prevent 180 turn
    // Use last applied direction (player.direction)

    if (key === 'ArrowUp' && player.direction.y !== 1) { player.nextDirection = { x: 0, y: -1 }; }
    else if (key === 'ArrowDown' && player.direction.y !== -1) { player.nextDirection = { x: 0, y: 1 }; }
    else if (key === 'ArrowLeft' && player.direction.x !== 1) { player.nextDirection = { x: -1, y: 0 }; }
    else if (key === 'ArrowRight' && player.direction.x !== -1) { player.nextDirection = { x: 1, y: 0 }; }
}

function gameOver() {
    clearInterval(gameInterval);
    const player = snakes.find(s => !s.isAI);
    alert(`游戏结束！你的得分是 ${player ? player.score : 0}`);
    resetGame();
}

// bind events
startBtn.addEventListener('click', startGame);
window.addEventListener('keydown', changeDirection);

// Rules Modal Logic
const rulesModal = document.getElementById('rulesModal');
const rulesBtn = document.getElementById('rulesBtn');
const closeRules = document.getElementById('closeRules');

if (rulesBtn && rulesModal && closeRules) {
    rulesBtn.addEventListener('click', () => {
        rulesModal.classList.remove('hidden');
    });

    closeRules.addEventListener('click', () => {
        rulesModal.classList.add('hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target === rulesModal) {
            rulesModal.classList.add('hidden');
        }
    });
}

// Spacebar to start
window.addEventListener('keydown', function (event) {
    if ((event.code === 'Space' || event.key === ' ') && !startBtn.disabled) {
        event.preventDefault();
        startGame();
    }
});

// initial draw
ctx.fillStyle = '#111';
ctx.fillRect(0, 0, canvasSize, canvasSize);
