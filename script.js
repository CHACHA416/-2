// 游戏配置
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const INITIAL_SPEED = 150;

// 游戏状态
let canvas, ctx;
let snake = [];
let food = {};
let direction = { x: 0, y: 0 };
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop;

// 初始化游戏
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 设置初始蛇的位置
    snake = [
        { x: 200, y: 200 },
        { x: 180, y: 200 },
        { x: 160, y: 200 }
    ];
    
    // 设置初始方向
    direction = { x: GRID_SIZE, y: 0 };
    
    // 生成食物
    generateFood();
    
    // 更新显示
    updateScore();
    updateHighScore();
    
    // 绑定事件
    bindEvents();
    
    // 绘制初始状态
    draw();
}

// 绑定事件
function bindEvents() {
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    document.getElementById('shareBtn').addEventListener('click', shareGame);
    
    // 手机端方向控制
    document.getElementById('upBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        changeDirection({ x: 0, y: -GRID_SIZE });
    });
    document.getElementById('downBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        changeDirection({ x: 0, y: GRID_SIZE });
    });
    document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        changeDirection({ x: -GRID_SIZE, y: 0 });
    });
    document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        changeDirection({ x: GRID_SIZE, y: 0 });
    });
    
    // 也支持点击事件作为备选
    document.getElementById('upBtn').addEventListener('click', (e) => {
        e.preventDefault();
        changeDirection({ x: 0, y: -GRID_SIZE });
    });
    document.getElementById('downBtn').addEventListener('click', (e) => {
        e.preventDefault();
        changeDirection({ x: 0, y: GRID_SIZE });
    });
    document.getElementById('leftBtn').addEventListener('click', (e) => {
        e.preventDefault();
        changeDirection({ x: -GRID_SIZE, y: 0 });
    });
    document.getElementById('rightBtn').addEventListener('click', (e) => {
        e.preventDefault();
        changeDirection({ x: GRID_SIZE, y: 0 });
    });
    
    // 触摸滑动控制
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!gameRunning || gamePaused) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平滑动
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0 && direction.x === 0) {
                    changeDirection({ x: GRID_SIZE, y: 0 }); // 右
                } else if (deltaX < 0 && direction.x === 0) {
                    changeDirection({ x: -GRID_SIZE, y: 0 }); // 左
                }
            }
        } else {
            // 垂直滑动
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0 && direction.y === 0) {
                    changeDirection({ x: 0, y: GRID_SIZE }); // 下
                } else if (deltaY < 0 && direction.y === 0) {
                    changeDirection({ x: 0, y: -GRID_SIZE }); // 上
                }
            }
        }
    });
}

// 处理键盘输入
function handleKeyPress(e) {
    if (!gameRunning || gamePaused) return;
    
    switch(e.key) {
        case 'ArrowUp':
            changeDirection({ x: 0, y: -GRID_SIZE });
            break;
        case 'ArrowDown':
            changeDirection({ x: 0, y: GRID_SIZE });
            break;
        case 'ArrowLeft':
            changeDirection({ x: -GRID_SIZE, y: 0 });
            break;
        case 'ArrowRight':
            changeDirection({ x: GRID_SIZE, y: 0 });
            break;
        case ' ':
            e.preventDefault();
            togglePause();
            break;
    }
}

// 改变方向（统一的方向控制函数）
function changeDirection(newDirection) {
    if (!gameRunning || gamePaused) return;
    
    // 防止反向移动
    if (newDirection.x !== 0 && direction.x === 0) {
        direction = newDirection;
    } else if (newDirection.y !== 0 && direction.y === 0) {
        direction = newDirection;
    }
}

// 开始游戏
function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    gamePaused = false;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    gameLoop = setInterval(update, INITIAL_SPEED);
}

// 暂停/继续游戏
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        clearInterval(gameLoop);
        document.getElementById('pauseBtn').textContent = '继续';
    } else {
        gameLoop = setInterval(update, INITIAL_SPEED);
        document.getElementById('pauseBtn').textContent = '暂停';
    }
}

// 重置游戏
function resetGame() {
    clearInterval(gameLoop);
    gameRunning = false;
    gamePaused = false;
    score = 0;
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('pauseBtn').textContent = '暂停';
    document.getElementById('gameOver').style.display = 'none';
    
    initGame();
}

// 游戏主循环
function update() {
    moveSnake();
    
    if (checkCollision()) {
        gameOver();
        return;
    }
    
    if (checkFoodCollision()) {
        eatFood();
        generateFood();
        updateScore();
    }
    
    draw();
}

// 移动蛇
function moveSnake() {
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    snake.unshift(head);
    
    // 如果没有吃到食物，移除尾部
    if (!checkFoodCollision()) {
        snake.pop();
    }
}

// 检查碰撞
function checkCollision() {
    const head = snake[0];
    
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= CANVAS_SIZE || head.y < 0 || head.y >= CANVAS_SIZE) {
        return true;
    }
    
    // 检查自身碰撞
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 检查食物碰撞
function checkFoodCollision() {
    const head = snake[0];
    return head.x === food.x && head.y === food.y;
}

// 吃食物
function eatFood() {
    score += 10;
    
    // 增加游戏速度
    if (score % 50 === 0) {
        clearInterval(gameLoop);
        const newSpeed = Math.max(80, INITIAL_SPEED - Math.floor(score / 50) * 10);
        gameLoop = setInterval(update, newSpeed);
    }
}

// 生成食物
function generateFood() {
    do {
        food = {
            x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)) * GRID_SIZE,
            y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)) * GRID_SIZE
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // 绘制蛇
    ctx.fillStyle = '#27ae60';
    snake.forEach((segment, index) => {
        if (index === 0) {
            // 蛇头
            ctx.fillStyle = '#2ecc71';
        } else {
            ctx.fillStyle = '#27ae60';
        }
        ctx.fillRect(segment.x, segment.y, GRID_SIZE - 2, GRID_SIZE - 2);
    });
    
    // 绘制食物
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(food.x, food.y, GRID_SIZE - 2, GRID_SIZE - 2);
}

// 更新分数
function updateScore() {
    document.getElementById('score').textContent = score;
}

// 更新最高分
function updateHighScore() {
    document.getElementById('highScore').textContent = highScore;
}

// 游戏结束
function gameOver() {
    clearInterval(gameLoop);
    gameRunning = false;
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        updateHighScore();
    }
    
    // 显示游戏结束界面
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
    
    // 重置按钮状态
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('pauseBtn').textContent = '暂停';
}

// 分享游戏功能
function shareGame() {
    const shareData = {
        title: '贪吃蛇游戏',
        text: `我在贪吃蛇游戏中得了 ${score} 分！快来挑战我的记录吧！`,
        url: window.location.href
    };
    
    // 检查是否支持原生分享API
    if (navigator.share) {
        navigator.share(shareData).catch(err => {
            console.log('分享失败:', err);
            fallbackShare();
        });
    } else {
        fallbackShare();
    }
}

// 备用分享方式
function fallbackShare() {
    const shareText = `我在贪吃蛇游戏中得了 ${score} 分！快来挑战我的记录吧！ ${window.location.href}`;
    
    // 尝试复制到剪贴板
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('链接已复制到剪贴板！');
        }).catch(() => {
            showShareModal(shareText);
        });
    } else {
        showShareModal(shareText);
    }
}

// 显示分享模态框
function showShareModal(shareText) {
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
        <div class="share-content">
            <h3>分享游戏</h3>
            <textarea readonly>${shareText}</textarea>
            <div class="share-buttons">
                <button onclick="copyToClipboard('${shareText.replace(/'/g, "\\'")}')">复制链接</button>
                <button onclick="closeShareModal()">关闭</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeShareModal();
        }
    });
}

// 关闭分享模态框
function closeShareModal() {
    const modal = document.querySelector('.share-modal');
    if (modal) {
        modal.remove();
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('链接已复制！');
    closeShareModal();
}

// 显示提示消息
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 2000);
}

// 检测设备类型
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 页面加载完成后初始化游戏
window.addEventListener('load', () => {
    initGame();
    
    // 根据设备类型调整界面
    if (isMobile()) {
        document.body.classList.add('mobile');
        // 防止页面滚动
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
});