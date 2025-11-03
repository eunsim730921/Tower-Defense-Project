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

// let towerSpots = [
//     { x: TILE_SIZE * 3, y: TILE_SIZE * 3, occupied: false },
//     { x: TILE_SIZE * 3, y: TILE_SIZE * 5, occupied: false },
//     { x: TILE_SIZE * 7, y: TILE_SIZE * 6, occupied: false },
//     { x: TILE_SIZE * 7, y: TILE_SIZE * 9, occupied: false },
//     { x: TILE_SIZE * 13, y: TILE_SIZE * 9, occupied: false },
//     { x: TILE_SIZE * 13, y: TILE_SIZE * 5, occupied: false },
// ];

// 격자 크기
const GRID_COLS = Math.floor(canvas.width / TILE_SIZE);
const GRID_ROWS = Math.floor(canvas.height / TILE_SIZE);

// 경로가 지나가는 "격자 셀들"을 집합으로 보관 (키: "cx,cy")
const pathCells = new Set();

// 이미 타워가 놓인 셀(중복 설치 방지)
const towerCells = new Set();

// 웨이포인트(픽셀)를 바탕으로 "격자 셀" 경로 생성(수평/수직 구간 가정)
function buildPathCells(points) {
  const roundCell = (v) => Math.round(v / TILE_SIZE); // 경계값 안전하게 처리
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    let ax = roundCell(a.x), ay = roundCell(a.y);
    let bx = roundCell(b.x), by = roundCell(b.y);

    if (ay === by) {
      // 수평 구간
      const y = ay;
      const [sx, ex] = ax <= bx ? [ax, bx] : [bx, ax];
      for (let x = sx; x <= ex; x++) pathCells.add(`${x},${y}`);
    } else if (ax === bx) {
      // 수직 구간
      const x = ax;
      const [sy, ey] = ay <= by ? [ay, by] : [by, ay];
      for (let y = sy; y <= ey; y++) pathCells.add(`${x},${y}`);
    } else {
      // 대각선은 없다고 가정(현재 웨이포인트는 수평/수직)
      // 필요하면 여기서 보간 로직을 추가
    }
  }
}
buildPathCells(path);

// 셀 헬퍼
const cellKey = (cx, cy) => `${cx},${cy}`;
const isPathCell = (cx, cy) => pathCells.has(cellKey(cx, cy));
const isTowerCell = (cx, cy) => towerCells.has(cellKey(cx, cy));

function initGame() {
    health = 20;
    money = 50;
    wave = 0;
    towerCost = 10;
    gameOver = false;

    enemies = [];
    towers = [];
    // towerSpots.forEach(spot => spot.occupied = false);
    towerCells.clear();

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

    // ctx.strokeStyle = '#aaa';
    // ctx.lineWidth = TILE_SIZE * 0.8;
    // ctx.beginPath();
    // ctx.moveTo(path[0].x, path[0].y);
    // for (let i = 1; i < path.length; i++) {
    //     ctx.lineTo(path[i].x, path[i].y);
    // }
    // ctx.stroke();

    // === (추가) 격자 그리기(옅은 회색 라인) ===
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  for (let x = 0; x <= GRID_COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * TILE_SIZE, 0);
    ctx.lineTo(x * TILE_SIZE, GRID_ROWS * TILE_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * TILE_SIZE);
    ctx.lineTo(GRID_COLS * TILE_SIZE, y * TILE_SIZE);
    ctx.stroke();
  }

  // === (추가) 경로 셀을 타일로 채우기 ===
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (isPathCell(x, y)) {
        ctx.fillStyle = '#bca27a'; // 길(진흙색 느낌)
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

    // ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    // ctx.strokeStyle = 'green';
    // for (const spot of towerSpots) {
    //     if (!spot.occupied) {
    //         ctx.fillRect(spot.x, spot.y, TILE_SIZE, TILE_SIZE);
    //         ctx.strokeRect(spot.x, spot.y, TILE_SIZE, TILE_SIZE);
    //     }
    // }

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

    for (const tower of towers) {
        if (tower === hoverTower || tower === selectedTower) {
            ctx.beginPath();
            ctx.arc(
                tower.x + TILE_SIZE / 2,
                tower.y + TILE_SIZE / 2,
                tower.range,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.fill();
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

// canvas.addEventListener('click', (e) => {
//     if (gameOver) return;
//     const rect = canvas.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     for (const spot of towerSpots) {
//         if (!spot.occupied &&
//             x >= spot.x && x <= spot.x + TILE_SIZE &&
//             y >= spot.y && y <= spot.y + TILE_SIZE) {
//             if (money >= towerCost) {
//                 money -= towerCost;
//                 updateUI();
//                 spot.occupied = true;
//                 towers.push({
//                     x: spot.x,
//                     y: spot.y,
//                     range: 100,
//                     damage: 1,
//                     fireRate: 30,
//                     fireCooldown: 0,
//                     target: null
//                 });
//             }
//             return;
//         }
//     }
// });

// === (변경) 클릭한 좌표를 "격자 셀"로 스냅 → 길/중복이면 설치 금지 ===
canvas.addEventListener('click', (e) => {
  if (gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const cx = Math.floor(x / TILE_SIZE);
  const cy = Math.floor(y / TILE_SIZE);

  // 격자 범위 밖 방지
  if (cx < 0 || cy < 0 || cx >= GRID_COLS || cy >= GRID_ROWS) return;

  // 길 위 or 이미 타워 있음 → 금지
  if (isPathCell(cx, cy) || isTowerCell(cx, cy)) return;

  if (money >= towerCost) {
    money -= towerCost;
    updateUI();

    towerCells.add(cellKey(cx, cy));
    const px = cx * TILE_SIZE;
    const py = cy * TILE_SIZE;

    towers.push({
      x: px,
      y: py,
      range: 100,
      damage: 1,
      fireRate: 30,
      fireCooldown: 0,
      target: null
    });
  }
});

nextWaveButton.addEventListener('click', spawnWave);
restartButton.addEventListener('click', initGame);

initGame();