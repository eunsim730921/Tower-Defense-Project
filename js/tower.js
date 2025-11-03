// tower.js — 타워 설치 및 공격 로직

let towers = [];
let hoverTower = null;
let selectedTower = null;

canvas.addEventListener('click', (e) => {
  if (gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const cx = Math.floor(x / TILE_SIZE);
  const cy = Math.floor(y / TILE_SIZE);

  if (isPathCell(cx, cy) || isTowerCell(cx, cy)) return;

  if (money >= towerCost) {
    money -= towerCost;
    updateUI();
    towerCells.add(cellKey(cx, cy));

    towers.push({
      x: cx * TILE_SIZE,
      y: cy * TILE_SIZE,
      range: 100,
      damage: 1,
      fireRate: 30,
      fireCooldown: 0,
      target: null
    });
  }
});

// 마우스 이동 시 hoverTower 감지
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  hoverTower = towers.find(
    t => x >= t.x && x <= t.x + TILE_SIZE && y >= t.y && y <= t.y + TILE_SIZE
  ) || null;
});

// 타워 클릭 시 정보창 표시
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clickedTower = towers.find(
    t => x >= t.x && x <= t.x + TILE_SIZE && y >= t.y && y <= t.y + TILE_SIZE
  );

  if (clickedTower) {
    if (selectedTower === clickedTower) {
      towerInfoPanel.style.display = 'none';
      selectedTower = null;
    } else {
      selectedTower = clickedTower;
      towerInfoPanel.style.display = 'block';
      towerRange.textContent = `사거리: ${clickedTower.range}`;
      towerDamage.textContent = `공격력: ${clickedTower.damage}`;
      towerFireRate.textContent = `공격속도: ${clickedTower.fireRate}`;
    }
  }
});

function updateTowers() {
  for (const t of towers) {
    if (t.fireCooldown > 0) t.fireCooldown--;

    let target = null;
    let minDist = t.range;
    for (const e of enemies) {
      const dx = e.x - t.x;
      const dy = e.y - t.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        target = e;
      }
    }

    if (target && t.fireCooldown <= 0) {
      target.hp -= t.damage;
      t.fireCooldown = t.fireRate;
      t.target = target;
      if (target.hp <= 0) {
        enemies.splice(enemies.indexOf(target), 1);
        money++;
        updateUI();
      }
    } else {
      t.target = null;
    }
  }
}
