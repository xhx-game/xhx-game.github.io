class GoGame {
    constructor() {
        this.canvas = document.getElementById('go-board');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 19;
        this.cellSize = 20;
        this.margin = 10;
        
        this.board = this.initBoard();
        this.currentPlayer = 'black';
        this.blackCaptures = 0;
        this.whiteCaptures = 0;
        this.history = [];
        this.koPosition = null;
        
        // AI相关属性
        this.blackAIEnabled = false;
        this.whiteAIEnabled = false;
        this.blackAIStrength = 5;
        this.whiteAIStrength = 5;
        
        this.setupEventListeners();
        this.drawBoard();
        this.updateGameInfo();
    }
    
    initBoard() {
        const board = [];
        for (let i = 0; i < this.boardSize; i++) {
            board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                board[i][j] = null;
            }
        }
        return board;
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('undo').addEventListener('click', () => this.undo());
        document.getElementById('size-19').addEventListener('click', () => this.changeBoardSize(19));
        document.getElementById('size-13').addEventListener('click', () => this.changeBoardSize(13));
        document.getElementById('size-9').addEventListener('click', () => this.changeBoardSize(9));
        
        // AI控制事件监听
        // 黑方AI
        document.getElementById('black-ai-enable').addEventListener('change', (e) => {
            this.blackAIEnabled = e.target.checked;
            // 如果当前是黑方且AI启用，立即落子
            if (this.currentPlayer === 'black' && this.blackAIEnabled) {
                this.aiMakeMove();
            }
        });
        
        // 白方AI
        document.getElementById('white-ai-enable').addEventListener('change', (e) => {
            this.whiteAIEnabled = e.target.checked;
            // 如果当前是白方且AI启用，立即落子
            if (this.currentPlayer === 'white' && this.whiteAIEnabled) {
                this.aiMakeMove();
            }
        });
        
        // 黑方AI攻击力
        document.getElementById('black-ai-strength').addEventListener('input', (e) => {
            this.blackAIStrength = parseInt(e.target.value);
            document.getElementById('black-strength-value').textContent = this.blackAIStrength;
        });
        
        // 白方AI攻击力
        document.getElementById('white-ai-strength').addEventListener('input', (e) => {
            this.whiteAIStrength = parseInt(e.target.value);
            document.getElementById('white-strength-value').textContent = this.whiteAIStrength;
        });
    }
    
    drawBoard() {
        this.ctx.fillStyle = '#d18b47';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < this.boardSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin + i * this.cellSize, this.margin);
            this.ctx.lineTo(this.margin + i * this.cellSize, this.margin + (this.boardSize - 1) * this.cellSize);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin, this.margin + i * this.cellSize);
            this.ctx.lineTo(this.margin + (this.boardSize - 1) * this.cellSize, this.margin + i * this.cellSize);
            this.ctx.stroke();
        }
        
        this.drawStarPoints();
        this.drawStones();
    }
    
    drawStarPoints() {
        const starPositions = [3, 9, 15];
        this.ctx.fillStyle = '#000';
        
        starPositions.forEach(x => {
            starPositions.forEach(y => {
                if ((x === 9 && y === 9) || (x !== 9 || y !== 9)) {
                    this.ctx.beginPath();
                    this.ctx.arc(
                        this.margin + x * this.cellSize,
                        this.margin + y * this.cellSize,
                        3,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                }
            });
        });
    }
    
    drawStones() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j]) {
                    this.drawStone(i, j, this.board[i][j]);
                }
            }
        }
    }
    
    drawStone(x, y, color) {
        const centerX = this.margin + x * this.cellSize;
        const centerY = this.margin + y * this.cellSize;
        const radius = this.cellSize / 2 - 2;
        
        const gradient = this.ctx.createRadialGradient(
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            radius * 0.5,
            centerX,
            centerY,
            radius
        );
        
        if (color === 'black') {
            gradient.addColorStop(0, '#333333');
            gradient.addColorStop(1, '#000000');
        } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#cccccc');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = color === 'black' ? '#222' : '#ddd';
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const boardX = Math.round((x - this.margin) / this.cellSize);
        const boardY = Math.round((y - this.margin) / this.cellSize);
        
        if (this.isValidMove(boardX, boardY)) {
            this.makeMove(boardX, boardY);
        }
    }
    
    isValidMove(x, y) {
        if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize) {
            return false;
        }
        
        if (this.board[x][y] !== null) {
            return false;
        }
        
        if (this.koPosition && this.koPosition.x === x && this.koPosition.y === y) {
            return false;
        }
        
        const tempBoard = this.copyBoard();
        tempBoard[x][y] = this.currentPlayer;
        
        const capturedStones = this.findCapturedStones(tempBoard, this.getOpponentColor());
        const hasLiberties = this.hasLiberties(tempBoard, x, y);
        
        return capturedStones.length > 0 || hasLiberties;
    }
    
    makeMove(x, y) {
        this.saveState();
        
        this.board[x][y] = this.currentPlayer;
        
        const opponentColor = this.getOpponentColor();
        const capturedStones = this.findCapturedStones(this.board, opponentColor);
        
        if (capturedStones.length > 0) {
            this.removeStones(capturedStones);
            if (opponentColor === 'black') {
                this.blackCaptures += capturedStones.length;
            } else {
                this.whiteCaptures += capturedStones.length;
            }
            this.koPosition = null;
        } else {
            const playerStones = this.findCapturedStones(this.board, this.currentPlayer);
            if (playerStones.length > 0) {
                this.removeStones(playerStones);
                if (this.currentPlayer === 'black') {
                    this.blackCaptures += playerStones.length;
                } else {
                    this.whiteCaptures += playerStones.length;
                }
            }
            
            if (capturedStones.length === 1 && !this.hasLiberties(this.board, x, y)) {
                this.koPosition = { x: capturedStones[0].x, y: capturedStones[0].y };
            } else {
                this.koPosition = null;
            }
        }
        
        this.switchPlayer();
        this.drawBoard();
        this.updateGameInfo();
    }
    
    findCapturedStones(board, color) {
        const captured = [];
        const visited = new Set();
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === color && !visited.has(`${i},${j}`)) {
                    const group = this.getConnectedStones(board, i, j);
                    group.forEach(stone => visited.add(`${stone.x},${stone.y}`));
                    
                    if (!this.groupHasLiberties(board, group)) {
                        captured.push(...group);
                    }
                }
            }
        }
        
        return captured;
    }
    
    getConnectedStones(board, x, y) {
        const color = board[x][y];
        const connected = [];
        const visited = new Set();
        const queue = [{ x, y }];
        
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (board[x][y] === color) {
                connected.push({ x, y });
                
                const neighbors = this.getNeighbors(x, y);
                neighbors.forEach(neighbor => {
                    if (board[neighbor.x][neighbor.y] === color) {
                        queue.push(neighbor);
                    }
                });
            }
        }
        
        return connected;
    }
    
    hasLiberties(board, x, y) {
        const group = this.getConnectedStones(board, x, y);
        return this.groupHasLiberties(board, group);
    }
    
    groupHasLiberties(board, group) {
        const checked = new Set();
        
        for (const stone of group) {
            const neighbors = this.getNeighbors(stone.x, stone.y);
            
            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (!checked.has(key)) {
                    checked.add(key);
                    if (board[neighbor.x][neighbor.y] === null) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    getNeighbors(x, y) {
        const neighbors = [];
        if (x > 0) neighbors.push({ x: x - 1, y });
        if (x < this.boardSize - 1) neighbors.push({ x: x + 1, y });
        if (y > 0) neighbors.push({ x, y: y - 1 });
        if (y < this.boardSize - 1) neighbors.push({ x, y: y + 1 });
        return neighbors;
    }
    
    removeStones(stones) {
        stones.forEach(stone => {
            this.board[stone.x][stone.y] = null;
        });
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        // 切换玩家后检查是否需要AI落子
        this.aiMakeMove();
    }
    
    // AI自动落子
    aiMakeMove() {
        const aiEnabled = this.currentPlayer === 'black' ? this.blackAIEnabled : this.whiteAIEnabled;
        if (aiEnabled) {
            // 延迟执行，让用户有时间看到玩家切换
            setTimeout(() => {
                const move = this.getAIMove();
                if (move) {
                    this.makeMove(move.x, move.y);
                }
            }, 800);
        }
    }
    
    // 获取AI落子位置
    getAIMove() {
        const strength = this.currentPlayer === 'black' ? this.blackAIStrength : this.whiteAIStrength;
        const possibleMoves = [];
        
        // 收集所有有效落子位置
        for (let x = 0; x < this.boardSize; x++) {
            for (let y = 0; y < this.boardSize; y++) {
                if (this.isValidMove(x, y)) {
                    possibleMoves.push({ x, y });
                }
            }
        }
        
        if (possibleMoves.length === 0) return null;
        
        // 根据攻击力选择不同的落子策略
        if (strength <= 3) {
            // 简单随机落子
            return this.getRandomMove(possibleMoves);
        } else if (strength <= 7) {
            // 基于简单策略的落子
            return this.getBetterMove(possibleMoves);
        } else {
            // 更高级的策略
            return this.getBestMove(possibleMoves);
        }
    }
    
    // 随机落子
    getRandomMove(possibleMoves) {
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }
    
    // 基于简单策略的落子
    getBetterMove(possibleMoves) {
        let bestMove = null;
        let bestScore = -Infinity;
        const strength = this.currentPlayer === 'black' ? this.blackAIStrength : this.whiteAIStrength;
        
        // 根据攻击力调整随机因素的影响
        const randomFactor = 1 - (strength - 4) / 3 * 0.7; // 4-7攻击力对应0.3-1.0的随机因素
        
        possibleMoves.forEach(move => {
            let score = this.evaluatePosition(move.x, move.y, this.currentPlayer);
            // 添加随机因素，攻击力越高，随机因素影响越小
            score += (Math.random() - 0.5) * 20 * randomFactor;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        });
        
        return bestMove;
    }
    
    // 获取最佳落子 - 增强版带minimax搜索
    getBestMove(possibleMoves) {
        let bestMove = null;
        let bestScore = -Infinity;
        const strength = this.currentPlayer === 'black' ? this.blackAIStrength : this.whiteAIStrength;
        
        // 根据攻击力调整搜索深度：10级AI使用4层深度搜索
        const depth = strength >= 10 ? 4 : (strength >= 8 ? 3 : (strength >= 6 ? 2 : 1));
        
        // 对可能的落子进行排序，优先评估有潜力的位置
        const sortedMoves = this.sortMovesByPotential(possibleMoves);
        
        // 限制评估的移动数量，提高效率
        const movesToEvaluate = sortedMoves.slice(0, Math.min(strength >= 10 ? 30 : (strength >= 8 ? 25 : (strength >= 6 ? 20 : 15)), sortedMoves.length));
        
        movesToEvaluate.forEach(move => {
            // 模拟落子
            const tempBoard = this.copyBoard();
            tempBoard[move.x][move.y] = this.currentPlayer;
            
            // 使用minimax算法进行深度搜索
            let score;
            if (depth > 1) {
                // 深度搜索模式
                score = this.minimax(tempBoard, depth - 1, false, this.getOpponentColor(), -Infinity, Infinity);
            } else {
                // 单层搜索模式（保持兼容性）
                score = this.evaluateBoard(tempBoard, this.currentPlayer);
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        });
        
        return bestMove || this.getRandomMove(possibleMoves);
    }
    
    // Minimax算法带alpha-beta剪枝
    minimax(board, depth, isMaximizing, currentColor, alpha, beta) {
        // 获取当前颜色的所有有效移动
        const possibleMoves = [];
        for (let x = 0; x < this.boardSize; x++) {
            for (let y = 0; y < this.boardSize; y++) {
                if (board[x][y] === null && this.isValidMoveOnBoard(board, x, y, currentColor)) {
                    possibleMoves.push({ x, y });
                }
            }
        }
        
        // 递归终止条件
        if (depth === 0 || possibleMoves.length === 0) {
            return this.evaluateBoard(board, currentColor);
        }
        
        // 对移动进行排序，提高剪枝效率
        const sortedMoves = this.sortMovesByPotential(possibleMoves, currentColor, board);
        // 根据深度调整评估的移动数量，深度越大评估的移动越多
        const movesToEvaluate = sortedMoves.slice(0, Math.min(depth >= 3 ? 25 : (depth >= 2 ? 20 : 15), sortedMoves.length));
        
        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of movesToEvaluate) {
                const tempBoard = this.copyBoard(board);
                tempBoard[move.x][move.y] = currentColor;
                
                const score = this.minimax(tempBoard, depth - 1, false, this.getOpponentColor(currentColor), alpha, beta);
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                
                // Alpha-beta剪枝
                if (beta <= alpha) {
                    break;
                }
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of movesToEvaluate) {
                const tempBoard = this.copyBoard(board);
                tempBoard[move.x][move.y] = currentColor;
                
                const score = this.minimax(tempBoard, depth - 1, true, this.getOpponentColor(currentColor), alpha, beta);
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                
                // Alpha-beta剪枝
                if (beta <= alpha) {
                    break;
                }
            }
            return minScore;
        }
    }
    
    // 在指定棋盘上检查移动是否有效
    isValidMoveOnBoard(board, x, y, color) {
        // 检查边界
        if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize) {
            return false;
        }
        
        // 检查位置是否为空
        if (board[x][y] !== null) {
            return false;
        }
        
        // 临时落子
        const tempBoard = this.copyBoard(board);
        tempBoard[x][y] = color;
        
        // 检查是否会导致自己被吃
        const capturedStones = this.findCapturedStones(tempBoard, color);
        const hasLiberties = this.hasLiberties(tempBoard, x, y);
        
        // 检查是否有吃子或有气
        return capturedStones.length > 0 || hasLiberties;
    }
    
    // 在指定棋盘上根据潜力对落子进行排序
    sortMovesByPotentialOnBoard(moves, color, board) {
        return moves.sort((a, b) => {
            const scoreA = this.evaluatePositionOnBoard(a.x, a.y, color, board);
            const scoreB = this.evaluatePositionOnBoard(b.x, b.y, color, board);
            return scoreB - scoreA;
        });
    }
    
    // 评估整个棋盘的价值
    evaluateBoard(board, playerColor) {
        let score = 0;
        const opponentColor = this.getOpponentColor(playerColor);
        
        // 计算双方占领的点数
        let playerStones = 0;
        let opponentStones = 0;
        
        for (let x = 0; x < this.boardSize; x++) {
            for (let y = 0; y < this.boardSize; y++) {
                if (board[x][y] === playerColor) {
                    playerStones++;
                    score += this.evaluatePositionOnBoard(x, y, playerColor, board);
                } else if (board[x][y] === opponentColor) {
                    opponentStones++;
                    score -= this.evaluatePositionOnBoard(x, y, opponentColor, board);
                }
            }
        }
        
        // 棋子数量差异奖励
        score += (playerStones - opponentStones) * 50;
        
        // 领地控制奖励
        score += this.evaluateOverallTerritory(board, playerColor) * 3;
        
        return score;
    }
    
    // 评估整体领地控制
    evaluateOverallTerritory(board, playerColor) {
        let territoryScore = 0;
        const opponentColor = this.getOpponentColor(playerColor);
        
        // 统计被双方棋子包围的空地
        const visited = new Set();
        
        for (let x = 0; x < this.boardSize; x++) {
            for (let y = 0; y < this.boardSize; y++) {
                const key = `${x},${y}`;
                if (board[x][y] === null && !visited.has(key)) {
                    const result = this.analyzeTerritory(board, x, y, visited, playerColor);
                    
                    if (result.controlledBy === playerColor) {
                        territoryScore += result.size;
                    } else if (result.controlledBy === opponentColor) {
                        territoryScore -= result.size;
                    }
                }
            }
        }
        
        return territoryScore;
    }
    
    // 分析特定区域的领地控制情况
    analyzeTerritory(board, x, y, visited, playerColor) {
        const queue = [{ x, y }];
        const territory = [{ x, y }];
        visited.add(`${x},${y}`);
        const opponentColor = this.getOpponentColor(playerColor);
        
        let isPlayerControlled = true;
        let isOpponentControlled = true;
        
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            const neighbors = this.getNeighbors(x, y);
            
            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (!visited.has(key)) {
                    if (board[neighbor.x][neighbor.y] === null) {
                        queue.push(neighbor);
                        territory.push(neighbor);
                        visited.add(key);
                    } else if (board[neighbor.x][neighbor.y] === playerColor) {
                        isOpponentControlled = false;
                    } else {
                        isPlayerControlled = false;
                    }
                }
            }
        }
        
        if (isPlayerControlled) {
            return { size: territory.length, controlledBy: playerColor };
        } else if (isOpponentControlled) {
            return { size: territory.length, controlledBy: opponentColor };
        } else {
            return { size: territory.length, controlledBy: null }; // 未确定的领地
        }
    }
    
    // 根据潜力对落子进行排序
    sortMovesByPotential(moves, color = null, board = null) {
        if (!color) color = this.currentPlayer;
        if (!board) board = this.board;
        
        return moves.sort((a, b) => {
            const scoreA = this.evaluatePosition(a.x, a.y, color, board);
            const scoreB = this.evaluatePosition(b.x, b.y, color, board);
            return scoreB - scoreA;
        });
    }
    
    // 位置评估函数（支持自定义棋盘）
    evaluatePosition(x, y, color, board = null) {
        if (!board) board = this.board;
        
        let score = 0;
        const opponentColor = this.getOpponentColor(color);
        const strength = this.currentPlayer === 'black' ? this.blackAIStrength : this.whiteAIStrength;
        const isHighLevelAI = strength >= 8;
        
        // 1. 中心位置奖励（高级AI权重更高）
        const centerX = this.boardSize / 2;
        const centerY = this.boardSize / 2;
        const distanceFromCenter = Math.abs(x - centerX) + Math.abs(y - centerY);
        const centerWeight = isHighLevelAI ? 6 : 4;
        score += (this.boardSize - distanceFromCenter) * centerWeight;
        
        // 2. 边角和星位点奖励（更精确的边角评估，高级AI更重视）
        const cornerWeight = isHighLevelAI ? 50 : 40;
        const edgeWeight = isHighLevelAI ? 35 : 25;
        if ((x === 0 || x === this.boardSize - 1) && (y === 0 || y === this.boardSize - 1)) {
            score += cornerWeight; // 四角
        } else if (x === 0 || x === this.boardSize - 1 || y === 0 || y === this.boardSize - 1) {
            score += edgeWeight; // 边
        }
        
        // 星位点奖励
        const starPositions = [3, 9, 15];
        if (starPositions.includes(x) && starPositions.includes(y)) {
            score += isHighLevelAI ? 40 : 30;
        }
        
        // 3. 连接性奖励（高级AI更重视连接）
        const neighbors = this.getNeighbors(x, y);
        let friendlyNeighbors = 0;
        let enemyNeighbors = 0;
        
        neighbors.forEach(neighbor => {
            if (board[neighbor.x][neighbor.y] === color) {
                friendlyNeighbors++;
            } else if (board[neighbor.x][neighbor.y] === opponentColor) {
                enemyNeighbors++;
            }
        });
        
        const connectWeight = isHighLevelAI ? 35 : 25;
        const enemyWeight = isHighLevelAI ? 25 : 15;
        score += friendlyNeighbors * connectWeight;
        score -= enemyNeighbors * enemyWeight;
        
        // 4. 吃子潜力（增强权重，高级AI更积极）
        const tempBoard = this.copyBoard(board);
        tempBoard[x][y] = color;
        const capturedStones = this.findCapturedStones(tempBoard, opponentColor);
        const captureWeight = isHighLevelAI ? 100 : 80;
        score += capturedStones.length * captureWeight;
        
        // 5. 防止被吃的潜力（高级AI更重视生存）
        const playerStones = this.findCapturedStones(tempBoard, color);
        const survivalWeight = isHighLevelAI ? 90 : 70;
        score -= playerStones.length * survivalWeight;
        
        // 6. 控制更多领地的潜力（高级AI更重视）
        const territoryWeight = isHighLevelAI ? 3 : 2;
        score += this.evaluateTerritoryPotential(x, y, color, board) * territoryWeight;
        
        // 7. 棋形评估（高级AI更重视活棋）
        const shapeWeight = isHighLevelAI ? 45 : 30;
        score += this.evaluateShape(x, y, color, board) * shapeWeight;
        
        // 8. 高级AI额外战略因素
        if (isHighLevelAI) {
            // 检查是否是对手的关键点位
            const opponentScore = this.evaluatePosition(x, y, opponentColor, board);
            score += Math.max(0, opponentScore * 0.3); // 惩罚对手的好位置
            
            // 检查是否是大场（开阔地带的关键点）
            const openness = this.evaluateOpenness(x, y, board);
            score += openness * 20;
        }
        
        return score;
    }
    
    // 别名函数，保持兼容性
    evaluatePositionOnBoard(x, y, color, board = null) {
        return this.evaluatePosition(x, y, color, board);
    }
    
    // 评估位置的开阔程度（用于识别大场）
    evaluateOpenness(x, y, board) {
        let openness = 0;
        const maxDistance = 3; // 检查3格范围内的开阔程度
        
        for (let dx = -maxDistance; dx <= maxDistance; dx++) {
            for (let dy = -maxDistance; dy <= maxDistance; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const newX = x + dx;
                const newY = y + dy;
                
                if (newX >= 0 && newX < this.boardSize && newY >= 0 && newY < this.boardSize) {
                    // 距离越远权重越低
                    const distance = Math.abs(dx) + Math.abs(dy);
                    const weight = (maxDistance + 1 - distance) / (maxDistance + 1);
                    
                    if (board[newX][newY] === null) {
                        openness += weight;
                    } else {
                        openness -= weight * 0.5; // 有棋子的位置减少开阔度
                    }
                }
            }
        }
        
        return Math.max(0, openness);
    }
    
    // 评估领地潜力（支持自定义棋盘）
    evaluateTerritoryPotential(x, y, color, board = null) {
        if (!board) board = this.board;
        
        let potential = 0;
        const directions = [
            { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: -1, dy: 0 }
        ];
        
        directions.forEach(dir => {
            let distance = 0;
            let currentX = x + dir.dx;
            let currentY = y + dir.dy;
            
            // 向一个方向延伸，直到遇到边界或对方棋子
            while (currentX >= 0 && currentX < this.boardSize && 
                   currentY >= 0 && currentY < this.boardSize) {
                
                if (board[currentX][currentY] === color) {
                    // 遇到己方棋子，增加潜力
                    potential += distance;
                    break;
                } else if (board[currentX][currentY] === this.getOpponentColor(color)) {
                    // 遇到对方棋子，停止并减少潜力
                    potential -= distance * 0.5;
                    break;
                }
                
                distance++;
                currentX += dir.dx;
                currentY += dir.dy;
            }
            
            // 如果延伸到边界，增加更多潜力
            if (currentX < 0 || currentX >= this.boardSize || 
                currentY < 0 || currentY >= this.boardSize) {
                potential += distance * 1.5;
            }
        });
        
        return potential;
    }
    
    // 评估棋形（支持自定义棋盘）
    evaluateShape(x, y, color, board = null) {
        if (!board) board = this.board;
        
        let shapeScore = 0;
        const neighbors = this.getNeighbors(x, y);
        
        // 检查是否形成虎口
        let emptyNeighbors = 0;
        let enemyAdjacent = 0;
        
        neighbors.forEach(neighbor => {
            if (board[neighbor.x][neighbor.y] === null) {
                emptyNeighbors++;
            } else if (board[neighbor.x][neighbor.y] === this.getOpponentColor(color)) {
                enemyAdjacent++;
            }
        });
        
        // 虎口形状（1个空位，3个对方棋子）
        if (emptyNeighbors === 1 && enemyAdjacent === 3) {
            shapeScore += 2;
        }
        
        // 检查是否形成活棋形状的一部分
        const tempBoard = this.copyBoard(board);
        tempBoard[x][y] = color;
        
        // 检查是否形成两个眼位的潜力
        const eyePotential = this.checkEyePotential(x, y, tempBoard, color);
        shapeScore += eyePotential;
        
        return shapeScore;
    }
    
    // 检查眼位潜力（增强版，识别真眼和假眼）
    checkEyePotential(x, y, board, color) {
        let eyeScore = 0;
        const neighbors = this.getNeighbors(x, y);
        const diagonalNeighbors = [
            { x: x-1, y: y-1 }, { x: x-1, y: y+1 },
            { x: x+1, y: y-1 }, { x: x+1, y: y+1 }
        ];
        
        // 检查是否是真眼
        let solidNeighbors = 0;
        let emptyNeighbors = 0;
        
        neighbors.forEach(neighbor => {
            if (neighbor.x >= 0 && neighbor.x < this.boardSize && 
                neighbor.y >= 0 && neighbor.y < this.boardSize) {
                if (board[neighbor.x][neighbor.y] === color) {
                    solidNeighbors++;
                } else if (board[neighbor.x][neighbor.y] === null) {
                    emptyNeighbors++;
                }
            } else {
                // 边界视为己方棋子
                solidNeighbors++;
            }
        });
        
        // 真眼识别条件
        if (solidNeighbors === 4) {
            // 完全被包围的眼位
            eyeScore += 5; // 真眼
        } else if (solidNeighbors === 3 && emptyNeighbors === 1) {
            // 几乎被包围的眼位，检查对角线
            let cornerSupport = 0;
            diagonalNeighbors.forEach(corner => {
                if (corner.x >= 0 && corner.x < this.boardSize && 
                    corner.y >= 0 && corner.y < this.boardSize) {
                    if (board[corner.x][corner.y] === color) {
                        cornerSupport++;
                    }
                }
            });
            
            if (cornerSupport >= 2) {
                eyeScore += 3; // 较强的假眼或半真眼
            } else {
                eyeScore += 1; // 较弱的眼位
            }
        }
        
        // 检查是否有形成两眼活棋的潜力
        if (eyeScore > 0) {
            // 寻找附近是否还有其他眼位
            const eyePositions = [
                { dx: 0, dy: 2 }, { dx: 2, dy: 0 },
                { dx: 0, dy: -2 }, { dx: -2, dy: 0 }
            ];
            
            eyePositions.forEach(pos => {
                const newX = x + pos.dx;
                const newY = y + pos.dy;
                
                if (newX >= 0 && newX < this.boardSize && 
                    newY >= 0 && newY < this.boardSize) {
                    // 检查中间位置是否是己方棋子
                    const middleX = x + pos.dx / 2;
                    const middleY = y + pos.dy / 2;
                    
                    if (board[middleX][middleY] === color && board[newX][newY] === null) {
                        // 检查新位置是否也可能是眼位
                        const potentialEyeScore = this.checkSingleEyePotential(newX, newY, board, color);
                        if (potentialEyeScore > 0) {
                            eyeScore += 2; // 有形成两眼活棋的潜力
                        }
                    }
                }
            });
        }
        
        return eyeScore;
    }
    
    // 辅助函数：检查单个位置是否是眼位
    checkSingleEyePotential(x, y, board, color) {
        const neighbors = this.getNeighbors(x, y);
        let solidNeighbors = 0;
        
        neighbors.forEach(neighbor => {
            if (neighbor.x >= 0 && neighbor.x < this.boardSize && 
                neighbor.y >= 0 && neighbor.y < this.boardSize) {
                if (board[neighbor.x][neighbor.y] === color) {
                    solidNeighbors++;
                }
            } else {
                solidNeighbors++;
            }
        });
        
        return solidNeighbors >= 3 ? 1 : 0;
    }
    
    getOpponentColor(color = null) {
        if (!color) color = this.currentPlayer;
        return color === 'black' ? 'white' : 'black';
    }
    
    copyBoard() {
        const newBoard = [];
        for (let i = 0; i < this.boardSize; i++) {
            newBoard[i] = [...this.board[i]];
        }
        return newBoard;
    }
    
    saveState() {
        this.history.push({
            board: this.copyBoard(),
            currentPlayer: this.currentPlayer,
            blackCaptures: this.blackCaptures,
            whiteCaptures: this.whiteCaptures,
            koPosition: this.koPosition
        });
    }
    
    undo() {
        if (this.history.length === 0) return;
        
        const state = this.history.pop();
        this.board = state.board;
        this.currentPlayer = state.currentPlayer;
        this.blackCaptures = state.blackCaptures;
        this.whiteCaptures = state.whiteCaptures;
        this.koPosition = state.koPosition;
        
        this.drawBoard();
        this.updateGameInfo();
    }
    
    changeBoardSize(size) {
        if (size === this.boardSize) return;
        
        if (!confirm('切换棋盘大小将重置当前游戏进度，确定继续吗？')) {
            return;
        }
        
        this.boardSize = size;
        
        // 根据棋盘大小计算合适的格子大小
        if (size === 19) {
            this.cellSize = 20;
            this.margin = 10;
            this.canvas.width = this.margin * 2 + (size - 1) * this.cellSize;
            this.canvas.height = this.margin * 2 + (size - 1) * this.cellSize;
        } else if (size === 13) {
            this.cellSize = 25;
            this.margin = 15;
            this.canvas.width = this.margin * 2 + (size - 1) * this.cellSize;
            this.canvas.height = this.margin * 2 + (size - 1) * this.cellSize;
        } else if (size === 9) {
            this.cellSize = 35;
            this.margin = 20;
            this.canvas.width = this.margin * 2 + (size - 1) * this.cellSize;
            this.canvas.height = this.margin * 2 + (size - 1) * this.cellSize;
        }
        
        // 重置游戏
        this.board = this.initBoard();
        this.currentPlayer = 'black';
        this.blackCaptures = 0;
        this.whiteCaptures = 0;
        this.history = [];
        this.koPosition = null;
        
        this.drawBoard();
        this.updateGameInfo();
    }
    

    
    newGame() {
        if (this.history.length > 0) {
            if (!confirm('确定要开始新游戏吗？当前进度将丢失。')) {
                return;
            }
        }
        
        this.board = this.initBoard();
        this.currentPlayer = 'black';
        this.blackCaptures = 0;
        this.whiteCaptures = 0;
        this.history = [];
        this.koPosition = null;
        
        this.drawBoard();
        this.updateGameInfo();
    }
    
    updateGameInfo() {
        const playerElement = document.getElementById('current-player');
        playerElement.textContent = this.currentPlayer === 'black' ? '黑方' : '白方';
        playerElement.className = this.currentPlayer === 'black' ? 'player-black' : 'player-white';
        
        document.getElementById('black-captures').textContent = this.blackCaptures;
        document.getElementById('white-captures').textContent = this.whiteCaptures;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GoGame();
});