// enemy.js — 적 관련 로직

let enemies = [];

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

  setTimeout(checkWaveEnd, enemyCount * 1000 + 2000);
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const target = path[e.waypointIndex];
    if (!target) continue;

    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < e.speed) {
      e.waypointIndex++;
      if (e.waypointIndex >= path.length) {
        enemies.splice(i, 1);
        health--;
        updateUI();
        if (health <= 0) endGame();
      }
    } else {
      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;
    }
  }
}

function checkWaveEnd() {
  if (gameOver) return;
  if (enemies.length === 0) nextWaveButton.disabled = false;
  else setTimeout(checkWaveEnd, 1000);
}
