// tower.js — 타워 설치 및 공격 로직 (3종류 타워 적용)

let towers = [];
let hoverTower = null;
let selectedTower = null;
let selectedCell = null;

// 섹션 캐시
const selectSection = document.getElementById('towerSelectSection');
const detailSection = document.getElementById('towerDetailSection');

function showSelectPanel() {
  towerInfoPanel.style.display = 'block';
  selectSection.style.display = 'block';
  detailSection.style.display = 'none';
}

function showDetailPanel(t) {
  towerInfoPanel.style.display = 'block';
  selectSection.style.display = 'none';
  detailSection.style.display = 'block';

  if (t) {
    towerRange.textContent = `사거리: ${t.range}`;
    towerDamage.textContent = `공격력: ${t.damage}`;
    towerFireRate.textContent = `공격속도: ${t.fireRate}`;
  } else {
    towerRange.textContent = '사거리: -';
    towerDamage.textContent = '공격력: -';
    towerFireRate.textContent = '공격속도: -';
  }
}

function hidePanel() {
  towerInfoPanel.style.display = 'none';
}

/* ================================
   1) 빈 타일 클릭 → 선택 패널 표시
================================ */
canvas.addEventListener('click', (e) => {
  if (gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const cx = Math.floor(x / TILE_SIZE);
  const cy = Math.floor(y / TILE_SIZE);

  // 길/기존 타워 셀은 "건설 선택" 불가
  if (isPathCell(cx, cy) || isTowerCell(cx, cy)) return;

  // 같은 셀 다시 클릭 시 해제
  if (selectedCell && selectedCell.x === cx && selectedCell.y === cy) {
    selectedCell = null;
    hidePanel();
    return;
  }

  // ✅ 새 셀 선택 시: 이전 타워 선택 해제해서 사거리 제거
  selectedCell = { x: cx, y: cy };
  selectedTower = null;
  showSelectPanel();
});

/* =======================================
   2) 타워 버튼 클릭 → 배치하고 정보 패널로
======================================= */
document.querySelectorAll('.towerBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!selectedCell) return;

    const cx = selectedCell.x;
    const cy = selectedCell.y;
    const type = btn.dataset.type;

    const towerData = {
      basic:  { name: '기본 타워', range: 100, damage: 1,   fireRate: 30, color: 'blue',  cost: 10 },
      fast:   { name: '속사 타워', range: 80,  damage: 0.5, fireRate: 10, color: 'red',   cost: 15 },
      strong: { name: '강타 타워', range: 120, damage: 4,   fireRate: 60, color: 'green', cost: 20 }
    }[type];

    if (!towerData) return;

    if (money < towerData.cost) {
      alert(`돈이 부족합니다! (${towerData.cost} 필요)`);
      return;
    }

    towerCells.add(cellKey(cx, cy));
    const newTower = {
      type,
      x: cx * TILE_SIZE,
      y: cy * TILE_SIZE,
      range: towerData.range,
      damage: towerData.damage,
      fireRate: towerData.fireRate,
      fireCooldown: 0,
      color: towerData.color,
      target: null
    };
    towers.push(newTower);

    money -= towerData.cost;
    updateUI();

    // ✅ 방금 배치한 타워를 선택 상태로 전환 + 정보 패널 표시
    selectedCell = null;
    selectedTower = newTower;
    hoverTower = null;
    showDetailPanel(newTower);
  });
});

/* ========================
   3) 마우스 hover 감지
======================== */
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  hoverTower = towers.find(
    t => x >= t.x && x <= t.x + TILE_SIZE && y >= t.y && y <= t.y + TILE_SIZE
  ) || null;
});

/* =========================================
   4) 캔버스 클릭 → 타워 정보 패널 토글
========================================= */
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clickedTower = towers.find(
    t => x >= t.x && x <= t.x + TILE_SIZE && y >= t.y && y <= t.y + TILE_SIZE
  );

  if (clickedTower) {
    // ✅ 같은 타워 다시 클릭 시 선택 해제 + 사거리 숨김
    if (selectedTower === clickedTower) {
      selectedTower = null;
      hidePanel();
      return;
    }

    // ✅ 새로운 타워 선택
    selectedCell = null;
    selectedTower = clickedTower;
    showDetailPanel(clickedTower);
  } else {
    // ✅ 아무 타워도 클릭 안했을 때
    if (!selectedCell) {
      selectedTower = null;
      hidePanel();
    }
  }
});

/* ========================
   5) 타워 공격 로직
======================== */
function updateTowers() {
  for (const t of towers) {
    if (t.fireCooldown > 0) t.fireCooldown--;

    let target = null;
    let minDist = t.range;
    for (const e of enemies) {
      const dx = (e.x + e.width / 2) - (t.x + TILE_SIZE / 2);
      const dy = (e.y + e.height / 2) - (t.y + TILE_SIZE / 2);
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
