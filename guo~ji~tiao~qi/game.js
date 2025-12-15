class ChineseCheckersGame {
    constructor() {
        this.canvas = document.getElementById('checkers-board');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 17; // 17x17 board for hexagon pattern
        this.cellSize = 30;
        this.margin = 15;
        
        // Game state
        this.board = this.initBoard();
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.turnCount = 1;
        this.history = [];
        
        // Player colors - matching the image
        this.players = {
            red: { color: '#d32f2f', home: 'top', pieces: 10 },
            blue: { color: '#1976d2', home: 'bottom-left', pieces: 10 },
            green: { color: '#388e3c', home: 'bottom-right', pieces: 10 },
            yellow: { color: '#fbc02d', home: 'right', pieces: 10 },
            orange: { color: '#f57c00', home: 'top-right', pieces: 10 },
            purple: { color: '#7b1fa2', home: 'top-left', pieces: 10 }
        };
        
        this.setupEventListeners();
        this.drawBoard();
    }
    
    initBoard() {
        const board = [];
        for (let i = 0; i < this.boardSize; i++) {
            board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                board[i][j] = null;
            }
        }
        
        // Place red pieces (bottom-right) - 10 pieces
        for (let i = 12; i < 17; i++) {
            for (let j = 16 - (i - 12); j < 17; j++) {
                if (i < 16) {
                    board[i][j] = 'red';
                } else if (i === 16 && j >= 14 && j < 17) {
                    board[i][j] = 'red';
                }
            }
        }
        
        // Place blue pieces (bottom-left) - 10 pieces
        for (let i = 12; i < 17; i++) {
            for (let j = 0; j <= i - 12; j++) {
                if (i < 16) {
                    board[i][j] = 'blue';
                } else if (i === 16 && j >= 0 && j <= 2) {
                    board[i][j] = 'blue';
                }
            }
        }
        
        // Place green pieces (bottom)
        for (let i = 6; i <= 10; i++) {
            for (let j = 0; j <= 3; j++) {
                if (j < 3) {
                    board[i][j] = 'green';
                } else if (j === 3 && i >= 8 && i <= 9) {
                    board[i][j] = 'green';
                }
            }
        }
        
        // Place yellow pieces (right)
        for (let i = 6; i <= 10; i++) {
            for (let j = 13; j < 17; j++) {
                if (j > 13) {
                    board[i][j] = 'yellow';
                } else if (j === 13 && i >= 8 && i <= 9) {
                    board[i][j] = 'yellow';
                }
            }
        }
        
        // Place orange pieces (top-right) - 10 pieces
        for (let i = 0; i < 5; i++) {
            for (let j = 12 + i; j <= 16 - (4 - i); j++) {
                board[i][j] = 'orange';
            }
        }
        
        // Place purple pieces (top-left)
        for (let i = 0; i < 4; i++) {
            for (let j = 3 - i; j >= 0; j--) {
                if (i < 3) {
                    board[i][j] = 'purple';
                } else if (i === 3 && j >= 0 && j <= 2) {
                    board[i][j] = 'purple';
                }
            }
        }
        
        return board;
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('undo').addEventListener('click', () => this.undo());
        document.getElementById('reset').addEventListener('click', () => this.resetGame());
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left - this.margin) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top - this.margin) / this.cellSize);
        
        if (this.isValidPosition(x, y)) {
            if (this.selectedPiece) {
                if (this.isValidMove(this.selectedPiece.x, this.selectedPiece.y, x, y)) {
                    this.makeMove(this.selectedPiece.x, this.selectedPiece.y, x, y);
                    this.selectedPiece = null;
                    this.switchPlayer();
                    this.checkWin();
                } else if (this.board[y][x] === this.currentPlayer) {
                    this.selectedPiece = { x, y };
                }
            } else if (this.board[y][x] === this.currentPlayer) {
                this.selectedPiece = { x, y };
            }
            this.drawBoard();
        }
    }
    
    isValidPosition(x, y) {
        return x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize;
    }
    
    isValidMove(fromX, fromY, toX, toY) {
        if (!this.isValidPosition(toX, toY) || this.board[toY][toX] !== null) {
            return false;
        }
        
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);
        
        // Adjacent move
        if ((dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0)) {
            return true;
        }
        
        // Jump move
        if ((dx === 2 && dy === 0) || (dx === 0 && dy === 2) || (dx === 2 && dy === 2)) {
            const midX = fromX + (toX - fromX) / 2;
            const midY = fromY + (toY - fromY) / 2;
            return this.board[midY][midX] !== null;
        }
        
        return false;
    }
    
    makeMove(fromX, fromY, toX, toY) {
        // Save state for undo
        this.history.push({
            board: this.board.map(row => [...row]),
            currentPlayer: this.currentPlayer,
            turnCount: this.turnCount,
            selectedPiece: this.selectedPiece
        });
        
        this.board[toY][toX] = this.board[fromY][fromX];
        this.board[fromY][fromX] = null;
        this.turnCount++;
    }
    
    switchPlayer() {
        const players = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];
        const currentIndex = players.indexOf(this.currentPlayer);
        this.currentPlayer = players[(currentIndex + 1) % players.length];
        document.getElementById('current-player').textContent = this.getPlayerName(this.currentPlayer);
        document.getElementById('current-player').className = `player-${this.currentPlayer}`;
        document.getElementById('turn-count').textContent = this.turnCount;
    }
    
    getPlayerName(color) {
        const names = { red: '红方', blue: '蓝方', green: '绿方', yellow: '黄方', orange: '橙方', purple: '紫方' };
        return names[color] || color;
    }
    
    checkWin() {
        // Check if current player has all pieces in opponent's home
        let piecesInHome = 0;
        const player = this.currentPlayer;
        
        // Red's target is bottom-left (blue's starting area)
        if (player === 'red') {
            for (let i = 13; i < 17; i++) {
                for (let j = 0; j <= i - 13; j++) {
                    if (i < 16 && this.board[i][j] === player) {
                        piecesInHome++;
                    } else if (i === 16 && j >= 0 && j <= 2 && this.board[i][j] === player) {
                        piecesInHome++;
                    }
                }
            }
        }
        
        // Blue's target is top (red's starting area)
        if (player === 'blue') {
            for (let i = 0; i < 4; i++) {
                for (let j = 6 - i; j <= 10 + i; j++) {
                    if (i < 3 && this.board[i][j] === player) {
                        piecesInHome++;
                    } else if (i === 3 && j >= 7 && j <= 9 && this.board[i][j] === player) {
                        piecesInHome++;
                    }
                }
            }
        }
        
        // Green's target is top-left (purple's starting area)
        if (player === 'green') {
            for (let i = 0; i < 4; i++) {
                for (let j = 3 - i; j >= 0; j--) {
                    if (i < 3 && this.board[i][j] === player) {
                        piecesInHome++;
                    } else if (i === 3 && j >= 0 && j <= 2 && this.board[i][j] === player) {
                        piecesInHome++;
                    }
                }
            }
        }
        
        // Yellow's target is top-right (orange's starting area)
        if (player === 'yellow') {
            for (let i = 0; i < 4; i++) {
                for (let j = 13; j <= 13 + i; j++) {
                    if (i < 3 && this.board[i][j] === player) {
                        piecesInHome++;
                    } else if (i === 3 && j >= 13 && j <= 15 && this.board[i][j] === player) {
                        piecesInHome++;
                    }
                }
            }
        }
        
        // Orange's target is bottom-right (green's starting area)
        if (player === 'orange') {
            for (let i = 13; i < 17; i++) {
                for (let j = 16 - (i - 13); j < 17; j++) {
                    if (i < 16 && this.board[i][j] === player) {
                        piecesInHome++;
                    } else if (i === 16 && j >= 14 && j < 17 && this.board[i][j] === player) {
                        piecesInHome++;
                    }
                }
            }
        }
        
        // Purple's target is right (yellow's starting area)
        if (player === 'purple') {
            for (let i = 6; i <= 10; i++) {
                for (let j = 13; j < 17; j++) {
                    if (j > 13 && this.board[i][j] === player) {
                        piecesInHome++;
                    } else if (j === 13 && i >= 8 && i <= 9 && this.board[i][j] === player) {
                        piecesInHome++;
                    }
                }
            }
        }
        
        if (piecesInHome === 10) {
            alert(`${this.getPlayerName(player)}获胜！`);
        }
    }
    
    undo() {
        if (this.history.length > 0) {
            const lastState = this.history.pop();
            this.board = lastState.board;
            this.currentPlayer = lastState.currentPlayer;
            this.turnCount = lastState.turnCount;
            this.selectedPiece = lastState.selectedPiece;
            this.drawBoard();
            
            // Update UI
            document.getElementById('current-player').textContent = this.getPlayerName(this.currentPlayer);
            document.getElementById('current-player').className = `player-${this.currentPlayer}`;
            document.getElementById('turn-count').textContent = this.turnCount;
        }
    }
    
    newGame() {
        this.board = this.initBoard();
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.turnCount = 1;
        this.history = [];
        this.drawBoard();
        
        // Update UI
        document.getElementById('current-player').textContent = '红方';
        document.getElementById('current-player').className = 'player-red';
        document.getElementById('turn-count').textContent = '1';
    }
    
    resetGame() {
        this.newGame();
    }
    
    drawBoard() {
        // Clear canvas and draw wooden background
        this.ctx.fillStyle = '#f4e4b2'; // Wooden background color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw hexagon grid
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                // Only draw valid positions for hexagon pattern
                if (this.isValidHexPosition(i, j)) {
                    const x = this.margin + j * this.cellSize + (i % 2) * this.cellSize / 2;
                    const y = this.margin + i * this.cellSize * 0.866; // 0.866 is cos(30°)
                    
                    // Draw cell with dark color
                    this.ctx.fillStyle = '#333333';
                    this.ctx.strokeStyle = '#333333';
                    this.ctx.lineWidth = 1;
                    
                    this.ctx.beginPath();
                    for (let k = 0; k < 6; k++) {
                        const angle = (Math.PI / 3) * k;
                        const hexX = x + this.cellSize / 3 * Math.cos(angle);
                        const hexY = y + this.cellSize / 3 * Math.sin(angle);
                        if (k === 0) {
                            this.ctx.moveTo(hexX, hexY);
                        } else {
                            this.ctx.lineTo(hexX, hexY);
                        }
                    }
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // Draw piece if exists
                    if (this.board[i][j]) {
                        // Use exact colors from the image
                        const pieceColors = {
                            red: '#d32f2f',
                            blue: '#1976d2',
                            green: '#388e3c',
                            yellow: '#fbc02d',
                            orange: '#f57c00',
                            purple: '#7b1fa2'
                        };
                        
                        this.ctx.fillStyle = pieceColors[this.board[i][j]];
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, this.cellSize / 4, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        // Draw border around piece
                        this.ctx.strokeStyle = '#000000';
                        this.ctx.lineWidth = 1;
                        this.ctx.stroke();
                    }
                    
                    // Highlight selected piece
                    if (this.selectedPiece && this.selectedPiece.x === j && this.selectedPiece.y === i) {
                        this.ctx.strokeStyle = '#ffcc00';
                        this.ctx.lineWidth = 3;
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, this.cellSize / 3, 0, Math.PI * 2);
                        this.ctx.stroke();
                    }
                }
            }
        }
    }
    
    isValidHexPosition(row, col) {
        // Traditional Chinese checkers board pattern with 6 triangular areas
        // This creates a proper hexagon with 121 holes
        const centerRow = 8;
        const centerCol = 8;
        
        // Calculate hexagonal distance from center
        const dr = Math.abs(row - centerRow);
        const dc = Math.abs(col - centerCol);
        const sum = dr + dc + Math.abs(row + col - centerRow - centerCol);
        const distance = Math.floor(sum / 2);
        
        // Limit to 5 layers (total 121 holes)
        if (distance > 5) {
            return false;
        }
        
        // Special case for the outermost layer to create proper triangles
        if (distance === 5) {
            // Top triangle
            if (row < centerRow && col >= centerCol - (centerRow - row) && col <= centerCol + (centerRow - row)) {
                return true;
            }
            // Bottom-left triangle
            if (row > centerRow && col < centerCol && row + col > centerRow + centerCol - 5) {
                return true;
            }
            // Bottom-right triangle
            if (row > centerRow && col > centerCol && row - col < centerRow - centerCol + 5) {
                return true;
            }
            // Right triangle
            if (col > centerCol && row >= centerRow - (col - centerCol) && row <= centerRow + (col - centerCol)) {
                return true;
            }
            // Top-right triangle
            if (row < centerRow && col > centerCol && row + col < centerRow + centerCol + 5) {
                return true;
            }
            // Top-left triangle
            if (row < centerRow && col < centerCol && col - row > centerCol - centerRow - 5) {
                return true;
            }
            return false;
        }
        
        return true;
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new ChineseCheckersGame();
});