// draw.js — 시각적 렌더링 전담

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 격자
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

  // 길
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (isPathCell(x, y)) {
        ctx.fillStyle = '#bca27a';
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // 선택된 셀 표시
  if (selectedCell) {
    ctx.fillStyle = 'rgba(0,150,255,0.3)';
    ctx.fillRect(selectedCell.x * TILE_SIZE, selectedCell.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  // 타워 색상별 표시
  for (const t of towers) {
    ctx.fillStyle = t.color || 'blue';
    ctx.fillRect(t.x, t.y, TILE_SIZE, TILE_SIZE);
  }

  // 적
  ctx.fillStyle = 'red';
  for (const e of enemies)
    ctx.fillRect(e.x, e.y, e.width, e.height);

  // 타워 사거리 표시
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

  // 타워가 공격 중일 때 선 연결
  ctx.strokeStyle = 'black';
  for (const t of towers) {
    if (t.target) {
      ctx.beginPath();
      ctx.moveTo(t.x + TILE_SIZE / 2, t.y + TILE_SIZE / 2);
      ctx.lineTo(t.target.x + t.target.width / 2, t.target.y + t.target.height / 2);
      ctx.stroke();
    }
  }
}
