// draw.js — 시각적 렌더링 전담

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // =============================
  // 격자 표시
  // =============================
  ctx.strokeStyle = '#ddd';
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

  // =============================
  // 길 표시
  // =============================
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (isPathCell(x, y)) {
        ctx.fillStyle = '#bca27a';
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // =============================
  // 선택된 셀 표시
  // =============================
  if (selectedCell) {
    ctx.fillStyle = 'rgba(0,150,255,0.3)';
    ctx.fillRect(selectedCell.x * TILE_SIZE, selectedCell.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  // =============================
  // 타워 표시
  // =============================
  for (const t of towers) {
    ctx.fillStyle = t.color || 'blue';
    ctx.fillRect(t.x, t.y, TILE_SIZE, TILE_SIZE);
  }

  // =============================
  // 적 표시 + 상태 효과 시각화
  // =============================
  for (const e of enemies) {
    ctx.save();

    // 🔥 화상 상태: 붉은빛 오라
    if (e.isBurning) {
      const gradient = ctx.createRadialGradient(
        e.x + e.width / 2,
        e.y + e.height / 2,
        e.width * 0.2,
        e.x + e.width / 2,
        e.y + e.height / 2,
        e.width
      );
      gradient.addColorStop(0, 'rgba(255, 120, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // ❄️ 슬로우 상태: 푸른빛 오라
    if (e.slowed) {
      const gradient = ctx.createRadialGradient(
        e.x + e.width / 2,
        e.y + e.height / 2,
        e.width * 0.2,
        e.x + e.width / 2,
        e.y + e.height / 2,
        e.width
      );
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 본체(적) 그리기
    ctx.fillStyle = 'red';
    ctx.fillRect(e.x, e.y, e.width, e.height);
  }


  // =============================
  // 사거리 표시 (선택/호버 타워)
  // =============================
  for (const t of towers) {
    if (t === hoverTower || t === selectedTower) {
      ctx.beginPath();
      ctx.arc(t.x + TILE_SIZE / 2, t.y + TILE_SIZE / 2, t.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,255,0,0.1)';
      ctx.strokeStyle = 'rgba(0,255,0,0.4)';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    }
  }


  // =============================
  // 💥 투사체 표시
  // =============================
  for (const p of projectiles) {
    ctx.beginPath();

    // ✨ 타워 타입별 색상 효과
    if (p.color === 'cyan') {
      // ❄️ 슬로우 타워
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    }
    else if (p.color === 'orange') {
      // 💨 속사 타워
      ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
    }
    else if (p.color === 'limegreen') {
      // 💪 강타 타워
      ctx.fillStyle = 'rgba(50, 205, 50, 0.9)';
    }
    else {
      // 🔵 기본 타워
      ctx.fillStyle = p.color || 'blue';
    }

    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  // 💥 화염 폭발 이펙트
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    const gradient = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, ex.radius);
    gradient.addColorStop(0, `rgba(255, 120, 0, ${ex.alpha})`);
    gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
    ctx.fill();

    ex.radius += 3;       // 퍼지는 속도
    ex.alpha -= 0.05;     // 사라짐 속도
    if (ex.alpha <= 0) explosions.splice(i, 1);
  }

  // ❄ 슬로우 타워 얼음 파동 이펙트
for (let i = frosts.length - 1; i >= 0; i--) {
  const f = frosts[i];

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(150, 220, 255, 0.8)';

  // 그라데이션(중심은 밝고 바깥은 투명)
  const gradient = ctx.createRadialGradient(f.x, f.y, f.radius * 0.2, f.x, f.y, f.radius);
  gradient.addColorStop(0, `rgba(180, 240, 255, ${f.alpha * 0.8})`);
  gradient.addColorStop(1, `rgba(80, 180, 255, 0)`);

  ctx.beginPath();
  ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = `rgba(120, 200, 255, ${f.alpha})`;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  // 💫 퍼짐 속도
  f.radius += 3;

  // 💡 사거리만큼 퍼졌으면 점점 사라지기 시작
  if (f.radius >= f.maxRadius) {
    f.alpha -= 0.05; // 사거리 도달 시 서서히 사라짐
  } else {
    f.alpha -= 0.01; // 도중엔 천천히 감소
  }

  // 완전히 사라지면 배열에서 제거
  if (f.alpha <= 0) frosts.splice(i, 1);
}

}