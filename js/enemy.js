// enemy.js — 적 관련 로직

let enemies = [];
let bossActive = false; 
let nextWaveComposition = {}; 

/**
 * 다음 웨이브(nextWave)에 스폰될 몬스터 구성을 미리 계산합니다.
 */
function generateNextWaveComposition(nextWave) {
  // 20웨이브 보스전 직전(19웨이브)에는 다음 웨이브 계산 안 함
  if (nextWave === 20 && currentStage === 1) {
    return { basic: 0, fast: 0, tank: 0, ninja: 0 };
  }

  const composition = { basic: 0, fast: 0, tank: 0, ninja: 0 };
  let totalEnemies = 5 + nextWave * 3; 

  // 하드 모드 몹 숫자 1.5배
  if (currentStage === 2) {
      totalEnemies = Math.floor(totalEnemies * 1.5);
  }

  let probs = { basic: 1, fast: 0, tank: 0, ninja: 0 }; 

  if (nextWave >= 4 && nextWave < 7) {
    const specialRatio = Math.min(0.4, (nextWave - 3) * 0.1); 
    probs = {
      basic: 1 - specialRatio,
      fast: specialRatio * 0.6, 
      tank: specialRatio * 0.4, 
      ninja: 0
    };
  } else if (nextWave >= 7) {
    const specialRatio = Math.min(0.8, 0.3 + (nextWave - 7) * 0.05);
    probs = {
      basic: 1 - specialRatio,
      fast: specialRatio * 0.5,
      tank: specialRatio * 0.3,
      ninja: specialRatio * 0.2
    };
  }

  for (let i = 0; i < totalEnemies; i++) {
     const rand = Math.random();
     if (rand < probs.basic) {
       composition.basic++;
     } else if (rand < probs.basic + probs.fast) {
       composition.fast++;
     } else if (rand < probs.basic + probs.fast + probs.tank) {
       composition.tank++;
     } else {
       composition.ninja++;
     }
  }

  if (nextWave <= 3) {
     composition.basic = totalEnemies;
     composition.fast = 0;
     composition.tank = 0;
     composition.ninja = 0;
  }
  else if (nextWave >= 4 && nextWave < 7 && composition.ninja > 0) {
     composition.basic += composition.ninja; 
     composition.ninja = 0;
  }

  return composition;
}

/**
 * 몹 1마리를 스폰합니다.
 */
function spawnEnemy(enemyType, baseHp, baseSpeed) {
    let enemyData;

    switch (enemyType) {
    case 'fast':
        enemyData = { hp: baseHp * 0.6, speed: baseSpeed * 1.5, color: '#f0ad4e', reward: 2 };
        break;
    case 'tank':
        enemyData = { hp: baseHp * 2.5, speed: baseSpeed * 0.7, color: '#5bc0de', reward: 3 };
        break;
    case 'ninja':
        enemyData = { 
        hp: baseHp * 0.8, speed: baseSpeed * 1.5, color: '#444444', reward: 4,
        invulnerabilityTimer: 120 // 2초 (프레임)
        };
        break;
    case 'basic':
    default:
        enemyData = { hp: baseHp, speed: baseSpeed, color: '#d9534f', reward: 2 };
        break;
    }
    
    enemies.push({
    x: currentPath[0].x, y: currentPath[0].y, // currentPath 사용
    width: TILE_SIZE * 0.8, height: TILE_SIZE * 0.8,
    waypointIndex: 0,
    ...enemyData,
    originalSpeed: enemyData.speed,
    maxHp: enemyData.hp,
    type: enemyType, 
    isHit: false,
    hitTimer: 0,
    damageNumbers: []
    });
}


function spawnWave() {
  wave++; 
  updateUI();
  nextWaveButton.disabled = true;
  challengeBossButton.disabled = true; 

  // 20 웨이브 보스 스폰
  if (wave === 20 && currentStage === 1) {
    spawnWave20Boss();
    // 다음 웨이브 정보 (스테이지 2, 1웨이브) 미리 계산
    nextWaveComposition = generateNextWaveComposition(1); 
    updateNextWaveUI(nextWaveComposition, 1);
    return; // 일반 스포너 실행 안 함
  }

  // 하드 모드 스케일링
  const stageHpMultiplier = (currentStage === 2) ? 2.5 : 1;
  const stageIntervalMultiplier = (currentStage === 2) ? 0.6 : 1; // 40% 더 빠름

  const baseHp = (10 + wave * 2.5) * stageHpMultiplier;
  const baseSpeed = 1 + wave * 0.05;

  const composition = nextWaveComposition; 
  
  let enemiesToSpawn = [];
  for (let i = 0; i < composition.basic; i++) enemiesToSpawn.push('basic');
  for (let i = 0; i < composition.fast; i++) enemiesToSpawn.push('fast');
  for (let i = 0; i < composition.tank; i++) enemiesToSpawn.push('tank');
  for (let i = 0; i < composition.ninja; i++) enemiesToSpawn.push('ninja');

  for (let i = enemiesToSpawn.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [enemiesToSpawn[i], enemiesToSpawn[j]] = [enemiesToSpawn[j], enemiesToSpawn[i]];
  }
  
  const nextWave = wave + 1;
  nextWaveComposition = generateNextWaveComposition(nextWave);

  const baseInterval = 60; 
  const scaledInterval = Math.max(10, baseInterval / (1 + (wave - 1) * 0.05) * stageIntervalMultiplier); 

  spawner = {
      list: enemiesToSpawn,
      timer: 0, 
      interval: scaledInterval,
      baseHp: baseHp,
      baseSpeed: baseSpeed
  };
}


function spawnBoss() {
  if (bossActive || gameOver || wave20BossActive) return; // 20웨이브 중 스폰 X

  bossActive = true;
  bossSpawnCount++; 
  challengeBossButton.disabled = true; 
  nextWaveButton.disabled = true; 
  
  showGameMessage('보스가 출현했습니다!', '#d9534f', 120);

  const baseBossHp = 150 + wave * 30;
  // ▼▼▼ 2. 보스 체력 스케일링 (25% -> 75%) ▼▼▼
  const bossHp = baseBossHp * (1 + (bossSpawnCount - 1) * 0.75);
  // ▲▲▲ 2. 보스 체력 스케일링 (25% -> 75%) ▲▲▲
  const bossSpeed = 0.7 + wave * 0.02;

  enemies.push({
    x: currentPath[0].x, y: currentPath[0].y, // currentPath 사용
    width: TILE_SIZE * 1.5, 
    height: TILE_SIZE * 1.5,
    speed: bossSpeed,
    originalSpeed: bossSpeed,
    hp: bossHp,
    maxHp: bossHp,
    waypointIndex: 0,
    type: 'boss',
    color: '#340a4a',
    reward: 50 + wave * 3, 
    isHit: false,
    hitTimer: 0,
    damageNumbers: [],
    hasHealed: false,
    invulnerabilityTimer: 0 // 무적 타이머 추가
  });
}

// 20 웨이브 보스 스폰 함수
function spawnWave20Boss() {
  bossActive = true;
  wave20BossActive = true; // ★ 20웨이브 보스 플래그
  challengeBossButton.disabled = true;
  nextWaveButton.disabled = true;
  
  showGameMessage('FINAL BOSS', '#d9534f', 180);

  const bossHp = 400 + wave * 40; // 500 + wave * 50 에서 하향
  const bossSpeed = 1.0 + wave * 0.03;

  enemies.push({
    x: currentPath[0].x, y: currentPath[0].y, // currentPath 사용
    width: TILE_SIZE * 2, // 크기 2배
    height: TILE_SIZE * 2,
    speed: bossSpeed,
    originalSpeed: bossSpeed,
    hp: bossHp,
    maxHp: bossHp,
    waypointIndex: 0,
    type: 'wave20Boss', // ★ 타입 구분
    color: '#000000', // 검은색
    reward: 500, 
    isHit: false,
    hitTimer: 0,
    damageNumbers: [],
    hasHealed: false,
    
    // 보스 패턴 변수
    patternTimer: 180, // ★ 첫 쿨타임 3초 (60fps * 3)
    isDashing: false,
    invulnerabilityTimer: 0 
  });
}


function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    // 닌자/보스 무적 타이머 (공통)
    if (e.invulnerabilityTimer > 0) {
      e.invulnerabilityTimer--;
    }
    
    // 보스 회복 (A. 회복 중)
    if (e.isHealing) {
        e.healTimer--;
        if (e.healTimer <= 0) {
            e.isHealing = false;
            e.speed = e.storedSpeed; 
        }
        continue; 
    }
    
    // 보스 회복 (B. 회복 발동) (일반/20웨이브 보스 공통)
    if ((e.type === 'boss' || e.type === 'wave20Boss') && !e.hasHealed && e.hp > 0 && e.hp < e.maxHp * 0.2) {
        e.hasHealed = true;
        e.isHealing = true;
        e.healTimer = 120; 
        e.storedSpeed = e.speed; 
        e.speed = 0; 
        
        const healAmount = e.maxHp * 0.4; 
        e.hp += healAmount;
        e.hp = Math.min(e.hp, e.maxHp); 
        
        showGameMessage('보스가 체력을 회복합니다!', '#28a745', 120); 
        
        e.damageNumbers.push({
            value: `+${healAmount.toFixed(0)}`,
            x: e.x + e.width / 2 + (Math.random() - 0.5) * e.width,
            y: e.y,
            timer: 60,
            color: '#28a745'
        });
        
        continue; 
    }

    // 20 웨이브 보스 패턴 (쿨타임 수정)
    if (e.type === 'wave20Boss') {
        // 1. Dashing state logic (대시 중)
        if (e.isDashing) {
            // 대시(무적) 타이머가 끝나면
            if (e.invulnerabilityTimer <= 0) {
                e.isDashing = false;
                e.speed = e.originalSpeed; // 속도 복구
                // (이때 patternTimer는 15초(900)로 이미 설정되어 있음)
            }
        } 
        // 2. Waiting state logic (대기 중)
        else {
            e.patternTimer--; // 다음 대시까지 쿨타임 감소
            
            if (e.patternTimer <= 0) {
                // 대시 발동
                e.isDashing = true;
                e.invulnerabilityTimer = 30; // 0.5초(30프레임) 무적
                e.speed = e.originalSpeed * 5; // 5배 빠른 속도
                
                // ★ 다음 쿨타임을 15초(900프레임)로 설정
                e.patternTimer = 900; 
            }
        }
    }


    // ▼ 이동 로직
    const target = currentPath[e.waypointIndex]; // currentPath 사용
    if (!target) continue;

    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < e.speed) {
      e.waypointIndex++;
      if (e.waypointIndex >= currentPath.length) { // currentPath 사용
        
        if (e.type === 'wave20Boss') {
            health -= 20; // ★ 20 데미지
            bossActive = false; 
            wave20BossActive = false;
        } else if (e.type === 'boss') {
            health -= 5; // ★ 일반 보스 5 데미지
            bossActive = false; 
        } else {
            health--;
        }

        enemies.splice(i, 1);
        updateUI();
        if (health <= 0) endGame();
      }
    } else {
      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;
    }
  }
}