// 游戏变量
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏状态
let score = 0;
let level = 1;
let lives = 3;
let gameRunning = false; // 初始状态为暂停

// 玩家
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 5,
    color: '#00ff00',
    bullets: []
};

// 敌人和宝物数组
let enemies = [];
let treasures = [];

// 控制键
const keys = {
    left: false,
    right: false,
    space: false
};

// 游戏配置
const config = {
    enemySpawnRate: 1500, // 毫秒（增加生成间隔，减少敌人数量）
    treasureSpawnRate: 3000, // 毫秒
    bulletSpeed: 8,
    enemySpeed: 2,
    treasureSpeed: 1
};

// 初始化游戏
function initGame() {
    updateUI();
    gameLoop();
}

// 更新UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lives').textContent = lives;
}

// 绘制玩家（飞机）
function drawPlayer() {
    const planeWidth = player.width;
    const planeHeight = player.height;
    const centerX = player.x + planeWidth / 2;
    const centerY = player.y + planeHeight / 2;
    
    // 机身（主体）
    ctx.fillStyle = '#4169E1'; // 皇家蓝
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + planeHeight * 0.4);
    ctx.lineTo(player.x + planeWidth * 0.2, player.y + planeHeight * 0.1);
    ctx.lineTo(player.x + planeWidth * 0.8, player.y + planeHeight * 0.1);
    ctx.lineTo(player.x + planeWidth, player.y + planeHeight * 0.4);
    ctx.lineTo(player.x + planeWidth * 0.8, player.y + planeHeight * 0.7);
    ctx.lineTo(player.x + planeWidth * 0.2, player.y + planeHeight * 0.7);
    ctx.closePath();
    ctx.fill();
    
    // 机翼
    ctx.fillStyle = '#1E90FF'; // 深天蓝
    // 左机翼
    ctx.beginPath();
    ctx.moveTo(player.x + planeWidth * 0.3, player.y + planeHeight * 0.5);
    ctx.lineTo(player.x - planeWidth * 0.2, player.y + planeHeight * 0.6);
    ctx.lineTo(player.x - planeWidth * 0.2, player.y + planeHeight * 0.4);
    ctx.closePath();
    ctx.fill();
    // 右机翼
    ctx.beginPath();
    ctx.moveTo(player.x + planeWidth * 0.7, player.y + planeHeight * 0.5);
    ctx.lineTo(player.x + planeWidth * 1.2, player.y + planeHeight * 0.6);
    ctx.lineTo(player.x + planeWidth * 1.2, player.y + planeHeight * 0.4);
    ctx.closePath();
    ctx.fill();
    
    // 尾翼
    ctx.fillStyle = '#DC143C'; // 深红色
    // 垂直尾翼
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + planeHeight * 0.4);
    ctx.lineTo(player.x - planeWidth * 0.1, player.y + planeHeight * 0.2);
    ctx.lineTo(player.x, player.y + planeHeight * 0.3);
    ctx.closePath();
    ctx.fill();
    // 水平尾翼
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + planeHeight * 0.3);
    ctx.lineTo(player.x - planeWidth * 0.2, player.y + planeHeight * 0.35);
    ctx.lineTo(player.x - planeWidth * 0.2, player.y + planeHeight * 0.25);
    ctx.closePath();
    ctx.fill();
    
    // 驾驶舱
    ctx.fillStyle = '#FFD700'; // 金色
    ctx.beginPath();
    ctx.arc(player.x + planeWidth * 0.3, player.y + planeHeight * 0.4, planeWidth * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // 发动机
    ctx.fillStyle = '#808080'; // 灰色
    // 左发动机
    ctx.fillRect(player.x + planeWidth * 0.1, player.y + planeHeight * 0.65, planeWidth * 0.15, planeHeight * 0.1);
    // 右发动机
    ctx.fillRect(player.x + planeWidth * 0.75, player.y + planeHeight * 0.65, planeWidth * 0.15, planeHeight * 0.1);
}

// 绘制敌人
function drawEnemies() {
    enemies.forEach(enemy => {
        const centerX = enemy.x + enemy.width / 2;
        const centerY = enemy.y + enemy.height / 2;
        const radius = enemy.width / 2;
        
        // 绘制怪物身体（粉色圆形）
        ctx.fillStyle = '#FFB6C1'; // 浅粉色
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制白色斑点
        ctx.fillStyle = '#FFFFFF';
        // 左上方斑点
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // 右上方斑点
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.4, centerY - radius * 0.5, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        // 左下方斑点
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.5, centerY + radius * 0.3, radius * 0.18, 0, Math.PI * 2);
        ctx.fill();
        // 右下方斑点
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.5, centerY + radius * 0.4, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制眼睛
        // 左眼
        ctx.fillStyle = '#FFFF00'; // 黄色眼白
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.25, centerY, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // 左瞳孔
        ctx.fillStyle = '#000000'; // 黑色瞳孔
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.25, centerY, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // 左高光
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.05, radius * 0.05, 0, Math.PI * 2);
        ctx.fill();
        
        // 右眼
        ctx.fillStyle = '#FFFF00'; // 黄色眼白
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.25, centerY, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // 右瞳孔
        ctx.fillStyle = '#000000'; // 黑色瞳孔
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.25, centerY, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // 右高光
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.2, centerY - radius * 0.05, radius * 0.05, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制嘴巴
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY + radius * 0.2, radius * 0.2, 0, Math.PI);
        ctx.stroke();
        
        // 绘制牙齿
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.15, centerY + radius * 0.2, radius * 0.05, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制耳朵
        // 左耳朵
        ctx.fillStyle = '#FFB6C1'; // 浅粉色
        ctx.beginPath();
        ctx.moveTo(centerX - radius * 0.5, centerY - radius * 0.5);
        ctx.lineTo(centerX - radius * 0.8, centerY - radius * 0.9);
        ctx.lineTo(centerX - radius * 0.4, centerY - radius * 0.7);
        ctx.closePath();
        ctx.fill();
        // 左内耳
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(centerX - radius * 0.55, centerY - radius * 0.6);
        ctx.lineTo(centerX - radius * 0.7, centerY - radius * 0.8);
        ctx.lineTo(centerX - radius * 0.45, centerY - radius * 0.7);
        ctx.closePath();
        ctx.fill();
        
        // 右耳朵
        ctx.fillStyle = '#FFB6C1'; // 浅粉色
        ctx.beginPath();
        ctx.moveTo(centerX + radius * 0.5, centerY - radius * 0.5);
        ctx.lineTo(centerX + radius * 0.8, centerY - radius * 0.9);
        ctx.lineTo(centerX + radius * 0.4, centerY - radius * 0.7);
        ctx.closePath();
        ctx.fill();
        // 右内耳
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(centerX + radius * 0.55, centerY - radius * 0.6);
        ctx.lineTo(centerX + radius * 0.7, centerY - radius * 0.8);
        ctx.lineTo(centerX + radius * 0.45, centerY - radius * 0.7);
        ctx.closePath();
        ctx.fill();
    });
}

// 绘制宝物
function drawTreasures() {
    treasures.forEach(treasure => {
        const centerX = treasure.x + treasure.width / 2;
        const centerY = treasure.y + treasure.height / 2;
        const radius = treasure.width / 2;
        
        if (treasure.isHealthItem) {
            // 绘制生命值奖励（心形）
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            // 绘制左半心
            ctx.moveTo(centerX, centerY - radius * 0.4);
            ctx.bezierCurveTo(
                centerX - radius * 0.6, centerY - radius * 1.0, 
                centerX - radius * 0.6, centerY + radius * 0.4, 
                centerX, centerY + radius * 0.8
            );
            // 绘制右半心
            ctx.bezierCurveTo(
                centerX + radius * 0.6, centerY + radius * 0.4, 
                centerX + radius * 0.6, centerY - radius * 1.0, 
                centerX, centerY - radius * 0.4
            );
            ctx.closePath();
            ctx.fill();
            
            // 绘制心形高光
            ctx.fillStyle = '#ff6666';
            ctx.beginPath();
            ctx.moveTo(centerX - radius * 0.1, centerY - radius * 0.2);
            ctx.bezierCurveTo(
                centerX - radius * 0.3, centerY - radius * 0.6, 
                centerX - radius * 0.3, centerY + radius * 0.1, 
                centerX - radius * 0.1, centerY + radius * 0.3
            );
            ctx.closePath();
            ctx.fill();
        } else {
            // 绘制普通金币
            // 创建金币的渐变效果
            const gradient = ctx.createRadialGradient(
                centerX - radius * 0.3, centerY - radius * 0.3, 0,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, '#ffd700'); // 亮金色中心
            gradient.addColorStop(0.8, '#b8860b'); // 暗金色边缘
            gradient.addColorStop(1, '#daa520'); // 金色轮廓
            
            // 绘制金币圆形
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制金币边缘高光
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
            ctx.stroke();
            
            // 绘制美元符号
            ctx.fillStyle = '#8b4513';
            ctx.font = `${radius * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', centerX, centerY);
        }
    });
}

// 绘制子弹
function drawBullets() {
    player.bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

// 移动玩家
function movePlayer() {
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

// 移动敌人
function moveEnemies() {
    // 从后往前遍历，避免删除元素时跳过检查
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        
        // 敌人到达底部
        if (enemy.y > canvas.height) {
            removeEnemy(enemy);
        }
    }
}

// 移动宝物
function moveTreasures() {
    // 从后往前遍历，避免删除元素时跳过检查
    for (let i = treasures.length - 1; i >= 0; i--) {
        const treasure = treasures[i];
        treasure.y += treasure.speed;
        
        // 宝物到达底部
        if (treasure.y > canvas.height) {
            removeTreasure(treasure);
        }
    }
}

// 移动子弹
function moveBullets() {
    // 从后往前遍历，避免删除元素时跳过检查
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        bullet.y -= bullet.speed;
        
        // 子弹离开屏幕
        if (bullet.y < 0) {
            removeBullet(bullet);
        }
    }
}

// 生成敌人
function spawnEnemy() {
    if (!gameRunning) return;
    
    const enemy = {
        x: Math.random() * (canvas.width - 40),
        y: -40,
        width: 40,
        height: 40,
        speed: config.enemySpeed + (level - 1) * 0.5,
        color: '#ff4444'
    };
    
    enemies.push(enemy);
}

// 生成宝物
function spawnTreasure() {
    if (!gameRunning) return;
    
    // 决定生成普通金币还是生命值奖励
    const isHealthItem = Math.random() < 0.25; // 25%概率生成生命值奖励
    
    const treasure = {
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: config.treasureSpeed,
        isHealthItem: isHealthItem,
        color: isHealthItem ? '#ff0000' : '#ffd700',
        value: 10
    };
    
    treasures.push(treasure);
}

// 射击
function shoot() {
    if (!gameRunning) return;
    
    const bullet = {
        x: player.x + player.width / 2 - 2.5,
        y: player.y,
        width: 5,
        height: 15,
        speed: config.bulletSpeed,
        color: '#ffff00'
    };
    
    player.bullets.push(bullet);
}

// 碰撞检测
function checkCollisions() {
    // 子弹和敌人碰撞 - 从后往前遍历，避免删除元素时跳过检查
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (isColliding(bullet, enemy)) {
                removeBullet(bullet);
                removeEnemy(enemy);
                score += 2;
                updateUI();
                break; // 一颗子弹只能击中一个敌人
            }
        }
    }
    
    // 玩家和敌人碰撞 - 从后往前遍历，避免删除元素时跳过检查
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (isColliding(player, enemy)) {
            removeEnemy(enemy);
            lives--;
            updateUI();
            checkGameOver();
        }
    }
    
    // 玩家和宝物碰撞 - 从后往前遍历，避免删除元素时跳过检查
    for (let i = treasures.length - 1; i >= 0; i--) {
        const treasure = treasures[i];
        if (isColliding(player, treasure)) {
            removeTreasure(treasure);
            if (treasure.isHealthItem) {
                // 生命值奖励逻辑
                lives = Math.min(lives + 1, 5); // 限制最大生命值为5
            } else {
                // 普通金币逻辑
                score += treasure.value;
                checkLevelUp();
            }
            updateUI();
        }
    }
}

// 碰撞检测函数
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 移除元素
function removeEnemy(enemy) {
    const index = enemies.indexOf(enemy);
    if (index > -1) {
        enemies.splice(index, 1);
    }
}

function removeTreasure(treasure) {
    const index = treasures.indexOf(treasure);
    if (index > -1) {
        treasures.splice(index, 1);
    }
}

function removeBullet(bullet) {
    const index = player.bullets.indexOf(bullet);
    if (index > -1) {
        player.bullets.splice(index, 1);
    }
}

// 检查关卡升级
function checkLevelUp() {
    if (score >= level * 100) {
        level++;
        config.enemySpawnRate = Math.max(500, config.enemySpawnRate - 100);
        config.enemySpeed += 0.5;
        updateUI();
    }
}

// 检查游戏结束
function checkGameOver() {
    if (lives <= 0) {
        gameRunning = false;
        showGameOver();
    }
}

// 显示游戏结束
function showGameOver() {
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

// 重新开始游戏
function restartGame() {
    score = 0;
    level = 1;
    lives = 3;
    gameRunning = true;
    
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 60;
    player.bullets = [];
    
    enemies = [];
    treasures = [];
    
    config.enemySpawnRate = 1500; // 与新的配置一致
    config.enemySpeed = 2;
    
    updateUI();
    document.getElementById('gameOver').classList.add('hidden');
    
    // 设置敌人和宝物生成定时器
    setInterval(spawnEnemy, config.enemySpawnRate);
    setInterval(spawnTreasure, config.treasureSpawnRate);
}

// 游戏循环
function gameLoop() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameRunning) {
        // 更新游戏状态
        movePlayer();
        moveEnemies();
        moveTreasures();
        moveBullets();
        checkCollisions();
        
        // 绘制游戏元素
        drawPlayer();
        drawEnemies();
        drawTreasures();
        drawBullets();
    } else {
        // 绘制开始游戏提示
        ctx.fillStyle = '#ffffff';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('按Tab键开始游戏', canvas.width / 2, canvas.height / 2);
        
        // 绘制玩家以便预览
        drawPlayer();
    }
    
    requestAnimationFrame(gameLoop);
}

// 键盘事件
window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowRight':
            keys.right = true;
            break;
        case ' ':
            if (!keys.space) {
                keys.space = true;
                shoot();
            }
            break;
        case 'Tab':
            e.preventDefault(); // 阻止默认的Tab键行为
            if (!gameRunning) {
                restartGame();
            }
            break;
        case 'B':
        case 'b':
            e.preventDefault();
            if (gameRules.classList.contains('hidden')) {
                gameRules.classList.remove('hidden');
                rulesBtn.textContent = '隐藏游戏规则';
            } else {
                gameRules.classList.add('hidden');
                rulesBtn.textContent = '显示游戏规则';
            }
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
        case ' ':
            keys.space = false;
            break;
    }
});

// 游戏规则按钮功能
const rulesBtn = document.getElementById('rulesBtn');
const gameRules = document.getElementById('gameRules');

rulesBtn.addEventListener('click', () => {
    if (gameRules.classList.contains('hidden')) {
        gameRules.classList.remove('hidden');
        rulesBtn.textContent = '隐藏游戏规则';
    } else {
        gameRules.classList.add('hidden');
        rulesBtn.textContent = '显示游戏规则';
    }
});

// 启动游戏
initGame();