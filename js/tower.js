// tower.js — 타워 설치 및 공격 로직 (5종류 타워 적용 + UI 분리)

let towers = [];
let hoverTower = null;
let selectedTower = null;
let selectedCell = null;
let projectiles = [];
let explosions = []; 
let frosts = [];     

const towerName = document.getElementById('towerName');            
const upgradeDamageBtn = document.getElementById('upgradeDamageBtn');
const upgradeSpeedBtn  = document.getElementById('upgradeSpeedBtn');
const upgradeRangeBtn  = document.getElementById('upgradeRangeBtn');
const upgradeMoneyDisplay = document.getElementById('upgradeMoneyDisplay');
const sellTowerBtn = document.getElementById('sellTowerBtn');


// 패널 섹션
const selectSection = document.getElementById('towerSelectSection');
const detailSection = document.getElementById('towerDetailSection');

const UPGRADE_COST = 5;

function showSelectPanel() {
  towerInfoPanel.style.display = 'block';
  selectSection.style.display = 'block';
  detailSection.style.display = 'none';
}

function showDetailPanel(t) {
  towerInfoPanel.style.display = 'block';
  selectSection.style.display = 'none';
  detailSection.style.display = 'block';

  const dmgDiff = t.damage - (t.baseDamage ?? t.damage);
  const rateDiff = t.fireRate - (t.baseFireRate ?? t.fireRate);
  const rangeDiff = t.range - (t.baseRange ?? t.range);

  const dmgText = dmgDiff > 0 ? ` (+${dmgDiff.toFixed(1)})` : '';
  const rateText = rateDiff > 0 ? ` (+${rateDiff.toFixed(1)})` : '';
  const rangeText = rangeDiff > 0 ? ` (+${rangeDiff.toFixed(0)})` : '';

  towerName.textContent = t.name;
  towerRange.textContent = `사거리: ${t.range}${rangeText}`;
  towerDamage.textContent = `공격력: ${t.damage}${dmgText}`;
  towerFireRate.textContent = `공격속도: ${t.fireRate}${rateText}`;
  


}

function hidePanel() {
  towerInfoPanel.style.display = 'none';
  selectSection.style.display = 'none';
  detailSection.style.display = 'none';
}

/* ================================
   1️⃣ 빈 타일 클릭 → 선택 패널 표시
================================ */
canvas.addEventListener('click', (e) => {
  if (gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const cx = Math.floor(x / TILE_SIZE);
  const cy = Math.floor(y / TILE_SIZE);

  if (isPathCell(cx, cy) || isTowerCell(cx, cy)) return;

  // 같은 셀 재클릭 시 해제
  if (selectedCell && selectedCell.x === cx && selectedCell.y === cy) {
    selectedCell = null;
    hidePanel();
    return;
  }

  selectedCell = { x: cx, y: cy };
  selectedTower = null;
  showSelectPanel();
});

/* =====================================
   2️⃣ 타워 버튼 클릭 → 생성 + 정보 패널 전환
===================================== */
document.querySelectorAll('.towerBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!selectedCell) return;

    const cx = selectedCell.x;
    const cy = selectedCell.y;
    const type = btn.dataset.type;

    const towerData = {
      basic:  { name: '기본 타워', range: 100, damage: 1, fireRate: 3, color: 'blue', cost: 10 },
      fast:   { name: '속사 타워', range: 80, damage: 1, fireRate: 5, color: 'red', cost: 15 },
      strong: { name: '강타 타워', range: 120, damage: 7, fireRate: 1, color: 'green', cost: 20 },
      slow:   { name: '슬로우 타워', range: 90, damage: 0.5, fireRate: 2, color: 'cyan', cost: 20, slow: 0.7 },
      flame: { name: '화염 타워', range: 100, damage: 1.5, fireRate: 1.5, color: 'orange', cost: 25, burn: true }

    }[type];

    if (!towerData) return;
    if (money < towerData.cost) {
      alert(`돈이 부족합니다! (${towerData.cost} 필요)`);
      return;
    }

    towerCells.add(cellKey(cx, cy));
    const newTower = {
      ...towerData,
      type,
      x: cx * TILE_SIZE,
      y: cy * TILE_SIZE,
      fireCooldown: 0,
      target: null,

      baseDamage: towerData.damage,
      baseFireRate: towerData.fireRate,
      baseRange: towerData.range,

      investedMoney: towerData.cost
    };
    towers.push(newTower);

    money -= towerData.cost;
    updateUI();

    selectedCell = null;
    selectedTower = newTower;
    hoverTower = null;
    showDetailPanel(newTower);
  });
});

/* =============================
   3️⃣ 마우스 hover 감지
============================= */
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  hoverTower = towers.find(
    t => x >= t.x && x <= t.x + TILE_SIZE && y >= t.y && y <= t.y + TILE_SIZE
  ) || null;
});

/* =========================================
   4️⃣ 타워 클릭 시 → 정보 패널 표시
========================================= */
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clickedTower = towers.find(
    t => x >= t.x && x <= t.x + TILE_SIZE && y >= t.y && y <= t.y + TILE_SIZE
  );

  if (clickedTower) {
    if (selectedTower === clickedTower) {
      selectedTower = null;
      hidePanel();
      return;
    }
    selectedCell = null;
    selectedTower = clickedTower;
    showDetailPanel(clickedTower);
  } else if (!selectedCell) {
    selectedTower = null;
    hidePanel();
  }
});
// 업그레이드 버튼 이벤트 핸들러
function canAfford(cost) { return money >= cost; }

if (upgradeDamageBtn) {
  upgradeDamageBtn.addEventListener('click', () => {
    if (!selectedTower) return alert('강화할 타워를 선택하세요.');
    if (!canAfford(UPGRADE_COST)) return alert('돈이 부족합니다!');
    money -= UPGRADE_COST;
    selectedTower.investedMoney += UPGRADE_COST;

    // 데미지 소수점 2자리로 처리
    selectedTower.damage = Math.round((selectedTower.damage + 0.5) * 100) / 100;
    updateUI();
    showDetailPanel(selectedTower);
  });
}

if (upgradeSpeedBtn) {
  upgradeSpeedBtn.addEventListener('click', () => {
    if (!selectedTower) return alert('강화할 타워를 선택하세요.');
    if (!canAfford(UPGRADE_COST)) return alert('돈이 부족합니다!');
    money -= UPGRADE_COST;
    selectedTower.investedMoney += UPGRADE_COST;
    selectedTower.fireRate = Math.round((selectedTower.fireRate + 0.2) * 100) / 100;
    updateUI();
    showDetailPanel(selectedTower);
  });
}

if (upgradeRangeBtn) {
  upgradeRangeBtn.addEventListener('click', () => {
    if (!selectedTower) return alert('강화할 타워를 선택하세요.');
    if (!canAfford(UPGRADE_COST)) return alert('돈이 부족합니다!');
    money -= UPGRADE_COST;
    selectedTower.investedMoney += UPGRADE_COST;
    selectedTower.range = selectedTower.range + 10;
    updateUI();
    showDetailPanel(selectedTower);
  });
}

if (sellTowerBtn) {
  sellTowerBtn.addEventListener('click', () => {
    if (!selectedTower) return alert('판매할 타워를 선택하세요.');

    const refund = Math.floor(selectedTower.investedMoney * 0.7);
    money += refund;

    const cx = selectedTower.x / TILE_SIZE;
    const cy = selectedTower.y / TILE_SIZE;
    towerCells.delete(cellKey(cx, cy));

    towers = towers.filter(t => t !== selectedTower);
    selectedTower = null;

    updateUI();
    hidePanel();

    alert(`타워를 판매했습니다! +${refund}원 환급`);
  });
}


/* =============================
   5️⃣ 타워 공격 로직 (슬로우/스플래시 반영)
============================= */
function updateTowers() {
  for (const t of towers) {
    if (t.fireCooldown > 0) t.fireCooldown -= 1;

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

      if (t.type !== 'slow') {
        projectiles.push({
          x: t.x + TILE_SIZE / 2,
          y: t.y + TILE_SIZE / 2,
          target: target,
          damage: t.damage,
          speed: 3,
          color: t.color,
          radius: 5
        });
      }



      // 🔥 화염 타워 지속 피해 효과 (갱신형)
if (t.burn) {
  for (const e2 of enemies) {
    const dx = (e2.x + e2.width / 2) - (target.x + target.width / 2);
    const dy = (e2.y + e2.height / 2) - (target.y + target.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 40) { // 🔥 폭발 범위 내 적
            if (!e2.isBurning) {
              // 🔥 새로 화상 상태 진입
              e2.isBurning = true;
              e2.burnEndTime = performance.now() + 2000; // 2초 지속
            } else {
              // ⏰ 이미 불타는 중이면 지속시간 갱신
              e2.burnEndTime = performance.now() + 2000;
            }
          }
        }

        // 💥 폭발 이펙트도 추가
        explosions.push({
          x: target.x + target.width / 2,
          y: target.y + target.height / 2,
          radius: 10,
          maxRadius: 50,
          alpha: 1
        });
      }


      // 🧊 광역 슬로우 (지속시간 갱신 + 이펙트)
      if (t.slow) {
        let affected = false;
        for (const e2 of enemies) {
          const dx = (e2.x + e2.width / 2) - (t.x + TILE_SIZE / 2);
          const dy = (e2.y + e2.height / 2) - (t.y + TILE_SIZE / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < t.range) {
            // 슬로우 적용
            if (!e2.slowed) {
              e2.originalSpeed = e2.speed;
              e2.speed *= t.slow;
              e2.slowed = true;
            }

            // 지속시간 갱신
            e2.lastSlowedTime = performance.now();
            affected = true;
          }
        }

        // ❄️ 슬로우 타워 이펙트 (한 번이라도 적이 느려졌다면)
        if (affected) {
          frosts.push({
            x: t.x + TILE_SIZE / 2,
            y: t.y + TILE_SIZE / 2,
            radius: 10,
            maxRadius: t.range,
            alpha: 0.6
          });
        }
      }

      // 공격 쿨타임
      t.fireCooldown = 60 / t.fireRate;
      t.target = target;
    } else {
      t.target = null;
    }
  }

  // 💰 죽은 적 처리 및 보상 지급
  const beforeCount = enemies.length;
  const deadEnemies = enemies.filter(e => e.hp <= 0);
  const aliveEnemies = enemies.filter(e => e.hp > 0);

  // 죽은 적마다 보상금 지급 (적당히 5원씩 예시)
  if (deadEnemies.length > 0) {
    money += deadEnemies.length * 2;
    updateUI();
  }

  enemies = aliveEnemies;
  const now = performance.now();

  // 🧊 슬로우 해제 (2초 동안 새로 맞지 않으면 원래 속도로 복구)
  for (const e2 of enemies) {
    if (e2.slowed && e2.lastSlowedTime && now - e2.lastSlowedTime > 2000) {
      e2.speed = e2.originalSpeed;
      e2.slowed = false;
    }
  }

  // 🔥 화상 상태 갱신 (지속 피해)
  for (const e of enemies) {
    if (e.isBurning) {
      e.hp -= 0.05; // 프레임당 화상 피해
      if (now > e.burnEndTime) {
        e.isBurning = false; // 🔚 지속시간 종료 시 해제
      }
    }
  }

}






function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    const e = p.target;

    if (!e || e.hp <= 0) {
      projectiles.splice(i, 1);
      continue;
    }

    const dx = (e.x + e.width / 2) - p.x;
    const dy = (e.y + e.height / 2) - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < p.speed) {
      // 💥 충돌 시 데미지 적용
      e.hp -= p.damage;
      projectiles.splice(i, 1);
      continue;
    }

    // 이동
    p.x += (dx / dist) * p.speed;
    p.y += (dy / dist) * p.speed;
  }
}
