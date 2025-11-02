const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const healthDisplay = document.getElementById('health');
const moneyDisplay = document.getElementById('money');
const waveDisplay = document.getElementById('wave');
const nextWaveButton = document.getElementById('nextWaveButton');
const gameOverDiv = document.getElementById('gameOver');
const restartButton = document.getElementById('restartButton');

let health, money, wave, towerCost, gameOver;
let enemies = [];
let towers = [];
let animationFrameId;

const TILE_SIZE = 30;

const path = [
    { x: 0, y: TILE_SIZE * 4 },
    { x: TILE_SIZE * 6, y: TILE_SIZE * 4 },
    { x: TILE_SIZE * 6, y: TILE_SIZE * 11 },
    { x: TILE_SIZE * 14, y: TILE_SIZE * 11 },
    { x: TILE_SIZE * 14, y: TILE_SIZE * 7 },
    { x: TILE_SIZE * 20, y: TILE_SIZE * 7 }
];

let towerSpots = [
    { x: TILE_SIZE * 3, y: TILE_SIZE * 3, occupied: false },
    { x: TILE_SIZE * 3, y: TILE_SIZE * 5, occupied: false },
    { x: TILE_SIZE * 7, y: TILE_SIZE * 6, occupied: false },
    { x: TILE_SIZE * 7, y: TILE_SIZE * 9, occupied: false },
    { x: TILE_SIZE * 13, y: TILE_SIZE * 9, occupied: false },
    { x: TILE_SIZE * 13, y: TILE_SIZE * 5, occupied: false },
];

function initGame() {
    health = 20;
    money = 50;
    wave = 0;
    towerCost = 10;
    gameOver = false;

    enemies = [];
    towers = [];
    towerSpots.forEach(spot => spot.occupied = false);

    updateUI();
    gameOverDiv.style.display = 'none';
    nextWaveButton.disabled = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    gameLoop();
}

function updateUI() {
    healthDisplay.textContent = health;
    moneyDisplay.textContent = money;
    waveDisplay.textContent = wave;
}

function spawnWave() {
    wave++;
    updateUI();
    nextWaveButton.disabled = true;

    const enemyCount = wave * 3;
    const enemyHp = 10 + wave * 2;

    for (let i = 0; i < enemyCount; i++) {
        setTimeout(() => {
            if (gameOver) return;
            enemies.push({
                x: path[0].x,
                y: path[0].y,
                width: TILE_SIZE * 0.8,
                height: TILE_SIZE * 0.8,
                speed: 1 + wave * 0.05,
                hp: enemyHp,
                waypointIndex: 0
            });
        }, i * 1000);
    }

    setTimeout(() => {
        checkWaveEnd();
    }, enemyCount * 1000 + 2000);
}

function checkWaveEnd() {
    if (gameOver) return;

    if (enemies.length === 0) {
        nextWaveButton.disabled = false;
    } else {
        setTimeout(checkWaveEnd, 1000);
    }
}

function endGame() {
    gameOver = true;
    gameOverDiv.style.display = 'block';
    nextWaveButton.disabled = true;
    cancelAnimationFrame(animationFrameId);
}

function getDistance(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = TILE_SIZE * 0.8;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.strokeStyle = 'green';
    for (const spot of towerSpots) {
        if (!spot.occupied) {
            ctx.fillRect(spot.x, spot.y, TILE_SIZE, TILE_SIZE);
            ctx.strokeRect(spot.x, spot.y, TILE_SIZE, TILE_SIZE);
        }
    }

    ctx.fillStyle = 'blue';
    for (const tower of towers) {
        ctx.fillRect(tower.x, tower.y, TILE_SIZE, TILE_SIZE);
    }

    ctx.fillStyle = 'red';
    for (const enemy of enemies) {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    for (const tower of towers) {
        if (tower.target) {
            ctx.beginPath();
            ctx.moveTo(tower.x + TILE_SIZE / 2, tower.y + TILE_SIZE / 2);
            ctx.lineTo(tower.target.x + tower.target.width / 2, tower.target.y + tower.target.height / 2);
            ctx.stroke();
        }
    }
}

function update() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const target = path[enemy.waypointIndex];
        if (!target) continue;

        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < enemy.speed) {
            enemy.waypointIndex++;
            if (enemy.waypointIndex >= path.length) {
                health--;
                updateUI();
                enemies.splice(i, 1);
                if (health <= 0) endGame();
            }
        } else {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
    }

    for (const tower of towers) {
        if (tower.fireCooldown > 0) {
            tower.fireCooldown--;
        }

        tower.target = null;

        let closestEnemy = null;
        let closestDist = tower.range;
        for (const enemy of enemies) {
            const dist = getDistance(tower, enemy);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }

        if (closestEnemy && tower.fireCooldown <= 0) {
            tower.target = closestEnemy;
            closestEnemy.hp -= tower.damage;
            tower.fireCooldown = tower.fireRate;

            if (closestEnemy.hp <= 0) {
                const enemyIndex = enemies.indexOf(closestEnemy);
                if (enemyIndex > -1) {
                    enemies.splice(enemyIndex, 1);
                    money++;
                    updateUI();
                }
            }
        }
    }
}

function gameLoop() {
    if (gameOver) return;

    update();
    draw();

    animationFrameId = requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', (e) => {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const spot of towerSpots) {
        if (!spot.occupied &&
            x >= spot.x && x <= spot.x + TILE_SIZE &&
            y >= spot.y && y <= spot.y + TILE_SIZE) {
            if (money >= towerCost) {
                money -= towerCost;
                updateUI();
                spot.occupied = true;
                towers.push({
                    x: spot.x,
                    y: spot.y,
                    range: 100,
                    damage: 1,
                    fireRate: 30,
                    fireCooldown: 0,
                    target: null
                });
            }
            return;
        }
    }
});

nextWaveButton.addEventListener('click', spawnWave);
restartButton.addEventListener('click', initGame);

initGame();