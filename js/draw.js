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

    // 🔥 화상 상태
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

    // ❄️ 슬로우 상태
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
    
    // 💚 보스 체력 회복 오라
    if (e.isHealing) { 
      const gradient = ctx.createRadialGradient(
        e.x + e.width / 2,
        e.y + e.height / 2,
        e.width * 0.3, 
        e.x + e.width / 2,
        e.y + e.height / 2,
        e.width * 1.2 
      );
      gradient.addColorStop(0, 'rgba(40, 230, 80, 0.8)'); 
      gradient.addColorStop(1, 'rgba(40, 167, 69, 0)');  
      ctx.fillStyle = gradient;
      ctx.beginPath();
      const pulse = 1 + Math.sin(performance.now() / 150) * 0.1;
      ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width * 1.1 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    
    ctx.save(); 

    // ▼▼▼ 닌자/보스 무적 효과 (프레임 기반) ▼▼▼
    if (e.invulnerabilityTimer > 0) { 
      ctx.globalAlpha = 0.3 + (Math.sin(performance.now() / 100) + 1) * 0.3;
    }
    // ▲▲▲ 닌자/보스 무적 효과 (프레임 기반) ▲▲▲

    // ▼ 1. 피격 점멸 효과
    if (e.isHit && e.hitTimer > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; 
        ctx.fillRect(e.x, e.y, e.width, e.height);
        e.hitTimer--; 
    } else {
        e.isHit = false; 
        ctx.fillStyle = e.color || 'red'; 
        ctx.fillRect(e.x, e.y, e.width, e.height);
    }

    ctx.restore(); 
    
    // ▼ 2. 체력바
    const hpPercent = e.hp / e.maxHp;
    let hpColor;
    if (hpPercent > 0.75) hpColor = '#28a745'; 
    else if (hpPercent > 0.5) hpColor = '#ffc107'; 
    else if (hpPercent > 0.25) hpColor = '#fd7e14'; 
    else hpColor = '#dc3545'; 

    ctx.fillStyle = '#343a40';
    ctx.fillRect(e.x, e.y - 10, e.width, 5);
    ctx.fillStyle = hpColor;
    ctx.fillRect(e.x, e.y - 10, e.width * hpPercent, 5);


    // ▼ 3. 데미지 숫자 표시
    for (let i = e.damageNumbers.length - 1; i >= 0; i--) {
        const dn = e.damageNumbers[i];
        
        ctx.save();
        ctx.fillStyle = dn.color || 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 12px Arial';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.fillText(dn.value, dn.x, dn.y - 15);
        ctx.restore();
        
        dn.y -= 0.5;
        dn.timer--;
        
        if (dn.timer <= 0) {
            e.damageNumbers.splice(i, 1);
        }
    }
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

    if (p.color === 'cyan') {
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    }
    else if (p.color === 'orange') {
      ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
    }
    else if (p.color === 'limegreen') {
      ctx.fillStyle = 'rgba(50, 205, 50, 0.9)';
    }
    else {
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

    ex.radius += 3;
    ex.alpha -= 0.05;
    if (ex.alpha <= 0) explosions.splice(i, 1);
  }

  // ❄ 슬로우 타워 얼음 파동 이펙트
for (let i = frosts.length - 1; i >= 0; i--) {
  const f = frosts[i];

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(150, 220, 255, 0.8)';

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

  f.radius += 3;

  if (f.radius >= f.maxRadius) {
    f.alpha -= 0.05;
  } else {
    f.alpha -= 0.01;
  }

  if (f.alpha <= 0) frosts.splice(i, 1);
}

  // ▼ 게임 메시지 표시 (맨 마지막으로 이동)
  if (gameMessages.length > 0) {
    const msg = gameMessages[gameMessages.length - 1]; 
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 1.3rem Arial';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;

    const alpha = Math.min(1, msg.timer / (msg.maxTimer * 0.5)); 
    ctx.globalAlpha = alpha;
    
    ctx.fillStyle = msg.color;
    ctx.fillText(msg.text, canvas.width / 2, 40); 
    
    ctx.restore();
  }
}