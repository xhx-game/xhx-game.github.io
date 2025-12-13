// 买菜游戏 JavaScript

// 游戏状态
let gameState = {
    isPlaying: false,
    isPaused: false,
    money: 100,
    currentTask: null,
    cart: [],
    vegetables: []
};

// 菜品数据
const vegetableData = [
    { id: 1, name: '白菜', price: 2, emoji: '🥬' },
    { id: 2, name: '萝卜', price: 1.5, emoji: '🥕' },
    { id: 3, name: '西红柿', price: 3, emoji: '🍅' },
    { id: 4, name: '土豆', price: 2.5, emoji: '🥔' },
    { id: 5, name: '黄瓜', price: 2, emoji: '🥒' },
    { id: 6, name: '茄子', price: 3.5, emoji: '🍆' },
    { id: 7, name: '青椒', price: 4, emoji: '🫑' },
    { id: 8, name: '洋葱', price: 2.5, emoji: '🧅' },
    { id: 9, name: '胡萝卜', price: 2, emoji: '🥕' },
    { id: 10, name: '西兰花', price: 5, emoji: '🥦' },
    { id: 11, name: '大蒜', price: 6, emoji: '🧄' },
    { id: 12, name: '生姜', price: 5, emoji: '🫚' },
    { id: 13, name: '蘑菇', price: 7, emoji: '🍄' },
    { id: 14, name: '玉米', price: 3, emoji: '🌽' },
    { id: 15, name: '豌豆', price: 4, emoji: '🫛' },
    { id: 16, name: '南瓜', price: 2, emoji: '🎃' },
    { id: 17, name: '菠菜', price: 3, emoji: '🥬' },
    { id: 18, name: '生菜', price: 2, emoji: '🥬' }
];

// DOM 元素
const elements = {
    money: document.getElementById('money'),
    clearCartBtn: document.getElementById('clear-cart-btn'),
    taskList: document.getElementById('task-list'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    checkoutBtn: document.getElementById('checkout-btn'),
    vegetableMarket: document.getElementById('vegetable-market'),
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    gameMessage: document.getElementById('game-message')
};

// 初始化游戏
function initGame() {
    // 生成菜市场菜品
    generateVegetables();
    
    // 更新界面
    updateUI();
    
    // 添加事件监听器
    elements.startBtn.addEventListener('click', startGame);
    elements.pauseBtn.addEventListener('click', pauseGame);
    elements.checkoutBtn.addEventListener('click', checkout);
    elements.clearCartBtn.addEventListener('click', clearCart);
}

// 生成菜市场菜品
function generateVegetables() {
    elements.vegetableMarket.innerHTML = '';
    
    // 随机选择6-10种蔬菜显示在市场中
    const marketSize = Math.floor(Math.random() * 5) + 6; // 6到10之间的随机数
    const shuffledVegetables = [...vegetableData].sort(() => Math.random() - 0.5);
    const marketVegetables = shuffledVegetables.slice(0, marketSize);
    
    marketVegetables.forEach(vegetable => {
        const vegetableElement = document.createElement('div');
        vegetableElement.className = 'vegetable-item';
        vegetableElement.dataset.id = vegetable.id;
        
        vegetableElement.innerHTML = `
            <div class="vegetable-image">${vegetable.emoji}</div>
            <div class="vegetable-name">${vegetable.name}</div>
            <div class="vegetable-price">${vegetable.price}元</div>
        `;
        
        vegetableElement.addEventListener('click', () => addToCart(vegetable));
        elements.vegetableMarket.appendChild(vegetableElement);
    });
}

// 暂停游戏
function pauseGame() {
    if (!gameState.isPlaying) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    // 更新按钮文本
    elements.pauseBtn.textContent = gameState.isPaused ? '继续游戏' : '暂停游戏';
    
    // 更新界面
    updateUI();
    
    // 显示消息
    const message = gameState.isPaused ? '游戏已暂停' : '游戏继续';
    showMessage(message, gameState.isPaused ? 'info' : 'success');
}

// 开始游戏
function startGame() {
    if (gameState.isPlaying && !gameState.isPaused) return;
    
    if (!gameState.isPlaying) {
        gameState.isPlaying = true;
        gameState.isPaused = false;
        // 重置游戏状态
        gameState.money = 100; // 只有重新开始游戏时才重置金钱
        gameState.cart = [];
        
        // 生成新任务
        generateTask();
        
        showMessage('游戏开始！请完成任务', 'success');
    } else if (gameState.isPaused) {
        // 如果游戏已暂停，则继续游戏
        pauseGame();
        return;
    }
    
    // 更新界面
    updateUI();
}

// 生成随机任务
function generateTask() {
    // 随机选择1-3种菜品
    const taskCount = Math.floor(Math.random() * 3) + 1;
    const shuffledVegetables = [...vegetableData].sort(() => Math.random() - 0.5);
    const taskItems = shuffledVegetables.slice(0, taskCount);
    
    gameState.currentTask = {
        items: taskItems.map(veg => ({
            id: veg.id,
            name: veg.name,
            price: veg.price,
            required: Math.floor(Math.random() * 3) + 1 // 需要1-3个
        }))
    };
    
    // 显示任务
    renderTask();
}

// 显示任务
function renderTask() {
    if (!gameState.currentTask) {
        elements.taskList.innerHTML = '<p>点击"开始游戏"获取任务</p>';
        return;
    }
    
    let taskHTML = '';
    gameState.currentTask.items.forEach(item => {
        taskHTML += `<div class="task-item">
            需要: ${item.required}个 ${item.name} (${item.price}元/个)
        </div>`;
    });
    
    elements.taskList.innerHTML = taskHTML;
}

// 添加到购物车
function addToCart(vegetable) {
    if (!gameState.isPlaying || gameState.isPaused) {
        showMessage('请先开始游戏或继续游戏！', 'error');
        return;
    }
    
    // 检查是否超过金钱
    if (gameState.money < vegetable.price) {
        showMessage('金钱不足！', 'error');
        return;
    }
    
    // 添加到购物车
    const existingItem = gameState.cart.find(item => item.id === vegetable.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        gameState.cart.push({
            ...vegetable,
            quantity: 1
        });
    }
    
    // 扣除金钱
    gameState.money -= vegetable.price;
    
    // 更新界面
    updateUI();
    
    showMessage(`已添加${vegetable.name}到购物车`, 'success');
    
    // 检查金钱是否为0
    if (gameState.money <= 0) {
        gameOver();
    }
}

// 清空购物车
function clearCart() {
    if (gameState.cart.length === 0) {
        showMessage('购物车已经是空的', 'info');
        return;
    }
    
    // 返还所有金钱
    const totalRefund = gameState.cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    gameState.money += totalRefund;
    
    // 清空购物车
    gameState.cart = [];
    
    // 更新界面
    updateUI();
    
    showMessage('购物车已清空', 'info');
}

// 从购物车移除
function removeFromCart(vegetableId) {
    const index = gameState.cart.findIndex(item => item.id === vegetableId);
    if (index === -1) return;
    
    const item = gameState.cart[index];
    
    // 如果数量大于1，减少数量
    if (item.quantity > 1) {
        item.quantity--;
    } else {
        // 否则移除
        gameState.cart.splice(index, 1);
    }
    
    // 返还金钱
    gameState.money += item.price;
    
    // 更新界面
    updateUI();
    
    showMessage(`已移除一个${item.name}`, 'info');
}

// 清空购物车函数已移除，不再提供该功能

// 结账
function checkout() {
    if (!gameState.isPlaying || gameState.isPaused || gameState.cart.length === 0) {
        showMessage('购物车是空的！', 'error');
        return;
    }
    
    // 检查任务完成情况
    if (checkTaskCompletion()) {
        showMessage('任务完成！', 'success');
        
        // 生成新任务和新蔬菜
        setTimeout(() => {
            generateTask();
            generateVegetables(); // 重新生成市场上的蔬菜
        }, 2000);
    } else {
        showMessage('任务未完成，请检查购物车！', 'error');
        
        // 任务未完成时也重新生成蔬菜
        generateVegetables();
    }
    
    // 无论任务是否完成，都清空购物车
    clearCart();
}

// 检查任务完成情况
function checkTaskCompletion() {
    if (!gameState.currentTask) return false;
    
    for (const taskItem of gameState.currentTask.items) {
        const cartItem = gameState.cart.find(item => item.id === taskItem.id);
        if (!cartItem || cartItem.quantity < taskItem.required) {
            return false;
        }
    }
    
    return true;
}

// 游戏结束
function gameOver() {
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.money = 0;
    
    showMessage('游戏结束！金钱已用完。', 'error');
    updateUI();
}



// 重置游戏功能已移除，不再提供该功能

// 更新UI
function updateUI() {
    // 更新游戏信息
    elements.money.textContent = gameState.money;
    
    // 更新购物车
    renderCart();
    
    // 更新按钮状态
    elements.checkoutBtn.disabled = !gameState.isPlaying || gameState.isPaused || gameState.cart.length === 0;
    elements.startBtn.disabled = gameState.isPlaying && !gameState.isPaused;
    elements.pauseBtn.disabled = !gameState.isPlaying;
}

// 渲染购物车
function renderCart() {
    if (gameState.cart.length === 0) {
        elements.cartItems.innerHTML = '<p>购物车是空的</p>';
        elements.cartTotal.textContent = '0';
        return;
    }
    
    let cartHTML = '';
    let totalPrice = 0;
    
    gameState.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        
        cartHTML += `<div class="cart-item">
            <span>${item.emoji} ${item.name} x${item.quantity}</span>
            <div>
                <span>${itemTotal}元</span>
                <button onclick="removeFromCart(${item.id})" style="margin-left: 10px; padding: 2px 5px;">×</button>
            </div>
        </div>`;
    });
    
    elements.cartItems.innerHTML = cartHTML;
    elements.cartTotal.textContent = totalPrice;
}

// 显示消息
function showMessage(text, type = 'info') {
    elements.gameMessage.textContent = text;
    elements.gameMessage.className = `game-message ${type}`;
    
    // 3秒后清除消息
    setTimeout(() => {
        elements.gameMessage.textContent = '';
        elements.gameMessage.className = 'game-message';
    }, 3000);
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);