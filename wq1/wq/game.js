// 围棋游戏核心逻辑

// 获取Canvas元素
const canvas = document.getElementById('goBoard');
const ctx = canvas.getContext('2d');

// 游戏配置
const BOARD_SIZE = 19; // 棋盘大小（19x19线）
const CANVAS_SIZE = 600;
const LINE_SPACING = CANVAS_SIZE / (BOARD_SIZE - 1);
const STONE_RADIUS = LINE_SPACING / 2.2;

// 游戏状态
let board = [];
let currentPlayer = 'black'; // 'black' 或 'white'
let blackCaptured = 0;
let whiteCaptured = 0;
let gameHistory = [];

// 初始化棋盘
function initBoard() {
    board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = null; // null表示空点
        }
    }
}

// 绘制棋盘
function drawBoard() {
    // 清空画布
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // 设置线条颜色
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
    // 绘制垂直线
    for (let i = 0; i < BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LINE_SPACING, 0);
        ctx.lineTo(i * LINE_SPACING, CANVAS_SIZE);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let i = 0; i < BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * LINE_SPACING);
        ctx.lineTo(CANVAS_SIZE, i * LINE_SPACING);
        ctx.stroke();
    }
    
    // 绘制星位点
    const starPoints = [3, 9, 15];
    ctx.fillStyle = '#000000';
    for (let i of starPoints) {
        for (let j of starPoints) {
            ctx.beginPath();
            ctx.arc(i * LINE_SPACING, j * LINE_SPACING, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 绘制所有棋子
    drawAllStones();
}

// 绘制单个棋子
function drawStone(x, y, color) {
    const centerX = x * LINE_SPACING;
    const centerY = y * LINE_SPACING;
    
    // 绘制棋子主体
    const gradient = ctx.createRadialGradient(
        centerX - STONE_RADIUS * 0.3, centerY - STONE_RADIUS * 0.3, 0,
        centerX, centerY, STONE_RADIUS
    );
    
    if (color === 'black') {
        gradient.addColorStop(0, '#333333');
        gradient.addColorStop(1, '#000000');
    } else {
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#cccccc');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, STONE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制棋子边缘
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;
    ctx.stroke();
}

// 绘制所有棋子
function drawAllStones() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j]) {
                drawStone(i, j, board[i][j]);
            }
        }
    }
}

// 获取点击位置对应的棋盘坐标
function getBoardCoordinates(canvasX, canvasY) {
    const x = Math.round(canvasX / LINE_SPACING);
    const y = Math.round(canvasY / LINE_SPACING);
    
    // 确保坐标在棋盘范围内
    return {
        x: Math.max(0, Math.min(BOARD_SIZE - 1, x)),
        y: Math.max(0, Math.min(BOARD_SIZE - 1, y))
    };
}

// 检查位置是否为空
function isEmpty(x, y) {
    return board[x][y] === null;
}

// 获取相邻位置
function getAdjacentPositions(x, y) {
    const positions = [];
    if (x > 0) positions.push({x: x-1, y});
    if (x < BOARD_SIZE - 1) positions.push({x: x+1, y});
    if (y > 0) positions.push({x, y: y-1});
    if (y < BOARD_SIZE - 1) positions.push({x, y: y+1});
    return positions;
}

// 获取同色连通的所有棋子（包括自身）
function getConnectedStones(x, y) {
    const color = board[x][y];
    if (!color) return [];
    
    const connected = [];
    const visited = new Set();
    const queue = [{x, y}];
    
    while (queue.length > 0) {
        const pos = queue.shift();
        const key = `${pos.x},${pos.y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        if (board[pos.x][pos.y] === color) {
            connected.push(pos);
            
            // 添加相邻位置到队列
            const adjacent = getAdjacentPositions(pos.x, pos.y);
            for (let adj of adjacent) {
                if (!visited.has(`${adj.x},${adj.y}`)) {
                    queue.push(adj);
                }
            }
        }
    }
    
    return connected;
}

// 计算一组棋子的气
function calculateLiberties(stones) {
    const liberties = new Set();
    
    for (let stone of stones) {
        const adjacent = getAdjacentPositions(stone.x, stone.y);
        for (let adj of adjacent) {
            if (isEmpty(adj.x, adj.y)) {
                liberties.add(`${adj.x},${adj.y}`);
            }
        }
    }
    
    return liberties.size;
}

// 检查位置是否为禁着点（劫争）
function isKoPoint(x, y, color) {
    // 简单的劫争判断：落子后是否立即形成只有1气的情况
    // 保存当前状态
    const tempBoard = board.map(row => [...row]);
    
    // 模拟落子
    board[x][y] = color;
    
    // 计算新落子的连通棋子的气
    const newStones = getConnectedStones(x, y);
    const newLiberties = calculateLiberties(newStones);
    
    // 检查是否只有1气，并且没有提子
    let capturedStones = [];
    const adjacent = getAdjacentPositions(x, y);
    for (let adj of adjacent) {
        if (board[adj.x][adj.y] && board[adj.x][adj.y] !== color) {
            const enemyStones = getConnectedStones(adj.x, adj.y);
            if (calculateLiberties(enemyStones) === 0) {
                capturedStones = capturedStones.concat(enemyStones);
            }
        }
    }
    
    // 恢复棋盘
    board = tempBoard;
    
    // 如果新落子只有1气且没有提子，则为禁着点
    return newLiberties === 1 && capturedStones.length === 0;
}

// 检查位置是否可以落子
function canPlaceStone(x, y, color) {
    if (!isEmpty(x, y)) return false;
    
    // 检查是否为禁着点
    if (isKoPoint(x, y, color)) return false;
    
    // 检查落子后是否有气，或者是否能提掉对方棋子
    const tempBoard = board.map(row => [...row]);
    tempBoard[x][y] = color;
    
    // 计算新落子的气
    const newStones = getConnectedStones(x, y);
    let hasLiberty = calculateLiberties(newStones) > 0;
    
    // 检查是否能提掉对方棋子
    let canCapture = false;
    const adjacent = getAdjacentPositions(x, y);
    for (let adj of adjacent) {
        if (tempBoard[adj.x][adj.y] && tempBoard[adj.x][adj.y] !== color) {
            const enemyStones = getConnectedStones(adj.x, adj.y);
            if (calculateLiberties(enemyStones) === 0) {
                canCapture = true;
                break;
            }
        }
    }
    
    return hasLiberty || canCapture;
}

// 提掉没有气的棋子
function captureStones() {
    let captured = [];
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j]) {
                const stones = getConnectedStones(i, j);
                if (calculateLiberties(stones) === 0) {
                    captured = captured.concat(stones);
                }
            }
        }
    }
    
    // 移除被提掉的棋子
    for (let stone of captured) {
        board[stone.x][stone.y] = null;
    }
    
    return captured;
}

// 放置棋子
function placeStone(x, y) {
    if (!canPlaceStone(x, y, currentPlayer)) return false;
    
    // 保存当前状态用于悔棋
    saveGameState();
    
    // 放置棋子
    board[x][y] = currentPlayer;
    
    // 提掉没有气的对方棋子
    const capturedStones = captureStones();
    
    // 更新提子数
    if (capturedStones.length > 0) {
        if (currentPlayer === 'black') {
            blackCaptured += capturedStones.length;
            document.getElementById('blackCaptured').textContent = blackCaptured;
        } else {
            whiteCaptured += capturedStones.length;
            document.getElementById('whiteCaptured').textContent = whiteCaptured;
        }
    }
    
    // 切换玩家
    switchPlayer();
    
    // 重新绘制棋盘
    drawBoard();
    
    return true;
}

// 切换玩家
function switchPlayer() {
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    const playerElement = document.getElementById('currentPlayer');
    playerElement.textContent = currentPlayer === 'black' ? '黑方' : '白方';
    playerElement.style.color = currentPlayer === 'black' ? '#000000' : '#ffffff';
    playerElement.style.backgroundColor = currentPlayer === 'black' ? '#ffffff' : '#000000';
    playerElement.style.padding = '0 5px';
    playerElement.style.borderRadius = '3px';
    playerElement.style.border = '1px solid #000000';
}

// 保存游戏状态
function saveGameState() {
    const state = {
        board: board.map(row => [...row]),
        currentPlayer: currentPlayer,
        blackCaptured: blackCaptured,
        whiteCaptured: whiteCaptured
    };
    gameHistory.push(state);
    
    // 限制历史记录数量
    if (gameHistory.length > 50) {
        gameHistory.shift();
    }
}

// 悔棋
function undo() {
    if (gameHistory.length === 0) return;
    
    const lastState = gameHistory.pop();
    board = lastState.board;
    currentPlayer = lastState.currentPlayer;
    blackCaptured = lastState.blackCaptured;
    whiteCaptured = lastState.whiteCaptured;
    
    // 更新UI
    document.getElementById('blackCaptured').textContent = blackCaptured;
    document.getElementById('whiteCaptured').textContent = whiteCaptured;
    document.getElementById('currentPlayer').textContent = currentPlayer === 'black' ? '黑方' : '白方';
    document.getElementById('currentPlayer').style.color = currentPlayer === 'black' ? '#000000' : '#ffffff';
    document.getElementById('currentPlayer').style.backgroundColor = currentPlayer === 'black' ? '#ffffff' : '#000000';
    
    // 重新绘制棋盘
    drawBoard();
}

// 跳过回合
function passTurn() {
    saveGameState();
    switchPlayer();
}

// 新游戏
function newGame() {
    // 重置游戏状态
    initBoard();
    currentPlayer = 'black';
    blackCaptured = 0;
    whiteCaptured = 0;
    gameHistory = [];
    
    // 更新UI
    document.getElementById('currentPlayer').textContent = '黑方';
    document.getElementById('currentPlayer').style.color = '#000000';
    document.getElementById('currentPlayer').style.backgroundColor = '#ffffff';
    document.getElementById('blackCaptured').textContent = '0';
    document.getElementById('whiteCaptured').textContent = '0';
    
    // 绘制棋盘
    drawBoard();
}

// 初始化游戏
function initGame() {
    initBoard();
    drawBoard();
    
    // 添加事件监听器
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        const pos = getBoardCoordinates(canvasX, canvasY);
        placeStone(pos.x, pos.y);
    });
    
    // 添加按钮事件
    document.getElementById('newGameBtn').addEventListener('click', newGame);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('passBtn').addEventListener('click', passTurn);
}

// 页面加载完成后初始化游戏
window.addEventListener('load', initGame);
