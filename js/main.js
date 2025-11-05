// main.js — 전체 게임 제어

let health, money, wave, towerCost, gameOver;
let animationFrameId;

let gameSpeed = 1; 
let bossSpawnCount = 0; 
let spawner = null; // 몹 스포너 객체

// 스테이지 변수 추가
let currentStage = 1;
let wave20BossActive = false; // 20웨이브 보스 전용 플래그

let keySequence = ""; // ▼▼▼ 치트키 입력열

const introScreen = document.getElementById('introScreen');
const startGameBtn = document.getElementById('startGameBtn');
const gameSpeedButton = document.getElementById('gameSpeedButton'); 

let gameMessages = []; 

function initGame() {
  document.getElementById('uiPanel').style.display = 'flex';
  health = 20;
  money = 50;
  wave = 0;
  towerCost = 10;
  gameOver = false;
  gameSpeed = 1; 
  bossSpawnCount = 0; 
  spawner = null; 
  currentStage = 1; // 스테이지 1로 초기화
  wave20BossActive = false; // 20웨이브 보스 리셋
  keySequence = ""; // ▼ 치트키 리셋

  enemies = [];
  towers = [];
  projectiles = [];
  explosions = [];
  frosts = [];
  gameMessages = []; 
  towerCells.clear();

  setMap(currentStage); // 스테이지 1 맵 설정 (map.js)

  hoverTower = null;
  selectedTower = null;
  selectedCell = null;
  hidePanel(); 

  updateUI();

  gameOverDiv.style.display = 'none';
  nextWaveButton.disabled = false;
  challengeBossButton.disabled = false; 
  bossActive = false; 

  gameSpeedButton.textContent = '1x Speed';
  gameSpeedButton.classList.remove('active');

  nextWaveComposition = generateNextWaveComposition(wave + 1); 
  updateNextWaveUI(nextWaveComposition, wave + 1); 


  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  gameLoop();
}

function resetGameState() {
  health = 20;
  money = 50;
  wave = 0;
  towerCost = 10;
  gameOver = false;
  towers = [];
  towerCells.clear();
  selectedTower = null;
  selectedCell = null;
  hoverTower = null;
  gameSpeed = 1; 
  bossSpawnCount = 0; 
  spawner = null; 
  currentStage = 1; // 스테이지 1로 초기화
  wave20BossActive = false; // 20웨이브 보스 리셋
  keySequence = ""; // ▼ 치트키 리셋

  enemies = [];
  towers = [];
  projectiles = [];
  explosions = [];
  frosts = [];
  gameMessages = []; 
  towerCells.clear();

  hoverTower = null;
  selectedTower = null;
  selectedCell = null;

  if (typeof hidePanel === 'function') hidePanel();

  updateUI();
  nextWaveButton.disabled = false;
  challengeBossButton.disabled = true; 

  if (nextWaveInfoDiv) nextWaveInfoDiv.style.visibility = 'hidden';
  
  if (gameSpeedButton) {
      gameSpeedButton.textContent = '1x Speed';
      gameSpeedButton.classList.remove('active');
  }

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw();
  document.getElementById('uiPanel').style.display = 'none';
}


function showGameMessage(text, color = '#dc3545', duration = 120) {
  gameMessages = [{
    text: text,
    color: color,
    timer: duration,
    maxTimer: duration
  }];
}

function updateGameMessages() {
  for (let i = gameMessages.length - 1; i >= 0; i--) {
    gameMessages[i].timer--;
    if (gameMessages[i].timer <= 0) {
      gameMessages.splice(i, 1);
    }
  }
}

function updateSpawner() {
  if (spawner && spawner.list.length > 0) {
    spawner.timer--;
    if (spawner.timer <= 0) {
      const enemyType = spawner.list.shift();
      spawnEnemy(enemyType, spawner.baseHp, spawner.baseSpeed); // (enemy.js)
      spawner.timer = spawner.interval;
    }
  }
}

function transitionToStage2() {
  showGameMessage('STAGE 2 - HARD MODE', '#28a745', 240);
  
  currentStage = 2;
  wave = 0; // 웨이브 1부터 다시 시작
  money = 100; // ★ 돈 100원으로 리셋
  bossActive = false;
  wave20BossActive = false;
  spawner = null;

  // 모든 게임 객체 초기화 (체력/돈 제외)
  enemies = [];
  towers = [];
  projectiles = [];
  explosions = [];
  frosts = [];
  
  // 맵 변경 (map.js)
  setMap(currentStage);
  
  // UI 갱신 (돈 100원 표시)
  updateUI();
  
  // 다음 웨이브 (하드 모드 1) 정보 생성
  nextWaveComposition = generateNextWaveComposition(wave + 1); 
  updateNextWaveUI(nextWaveComposition, wave + 1);

  // 버튼 활성화
  nextWaveButton.disabled = false;
  challengeBossButton.disabled = false;
}


function checkGameConditions() {
  // 1. 웨이브 스폰이 끝났는지 확인
  if (spawner && spawner.list.length === 0) {
    const nonBossEnemies = enemies.filter(e => e.type !== 'boss' && e.type !== 'wave20Boss');
    if (nonBossEnemies.length === 0) {
      spawner = null; // 웨이브 공식 종료
    }
  }
  
  // 2. "완전 대기" 상태인지 확인
  // (스포너=null, 일반보스=비활성, 20웨이브보스=비활성, 게임오버=X)
  if (spawner === null && !bossActive && !wave20BossActive && !gameOver) {
    nextWaveButton.disabled = false;
    challengeBossButton.disabled = false; 
    updateNextWaveUI(nextWaveComposition, wave + 1); 
  }
}


function gameLoop() {
  if (gameOver) return;

  for (let i = 0; i < gameSpeed; i++) {
    updateSpawner(); 
    updateEnemies(); 
    updateTowers();
    updateProjectiles(); 
    updateGameMessages(); 
    checkGameConditions(); 
  }

  draw(); 
  animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animationFrameId);
  nextWaveButton.disabled = true;
  challengeBossButton.disabled = true; 
  spawner = null; 

  if (nextWaveInfoDiv) nextWaveInfoDiv.style.visibility = 'hidden';

  const finalWaveText = document.getElementById('finalWaveText');
  if (finalWaveText) {
    // Stage 2일 경우 'Hard'로 표시하도록 수정
    let stageDisplay = `Stage ${currentStage}`;
    if (currentStage === 2) {
      stageDisplay = 'Hard';
    }
    
    finalWaveText.textContent = `최종 웨이브: ${wave} (${stageDisplay})`; // 스테이지 표시
  }

  gameOverDiv.style.display = 'flex';
}

// ▼▼▼ 20웨이브 스킵 치트키 (수정) ▼▼▼
function skipToWave20() {
  // 스테이지 1이고, 웨이브/보스가 진행 중이 아닐 때만
  if (currentStage !== 1 || wave20BossActive || spawner || bossActive) return; 

  showGameMessage('CHEAT: Skipping to Wave 19 Cleared', '#ffc107', 120);

  wave = 19; // 현재 웨이브를 19로 설정
  updateUI(); 
  
  // (spawnWave() 제거)

  // 맵과 상태를 강제로 "대기" 상태로 만듦
  enemies = []; // 몹 제거
  spawner = null;
  bossActive = false;
  wave20BossActive = false;

  // 다음 웨이브(20) 정보 갱신
  nextWaveComposition = generateNextWaveComposition(wave + 1); // wave + 1 = 20
  updateNextWaveUI(nextWaveComposition, wave + 1);

  // 버튼 활성화
  nextWaveButton.disabled = false;
  challengeBossButton.disabled = false;
}
// ▲▲▲ 20웨이브 스킵 치트키 (수정) ▲▲▲

// ▼▼▼ 치트키 핸들러 ▼▼▼
function handleCheatCodes(e) {
    if (gameOver) return; // 게임 오버 시 중지

    const key = e.key.toLowerCase();
    keySequence += key;

    // "hard" 치트키
    if (keySequence.endsWith("hard")) {
        showGameMessage('CHEAT: Skipping to Stage 2', '#ffc107', 120);
        transitionToStage2(); // 스테이지 2로 즉시 전환
        keySequence = ""; // 시퀀스 리셋
    }

    // "20" 치트키
    if (keySequence.endsWith("20")) {
        skipToWave20(); // 20 웨이브 보스 스폰
        keySequence = ""; // 시퀀스 리셋
    }

    // 입력열이 너무 길어지는 것 방지
    if (keySequence.length > 10) {
        keySequence = keySequence.substring(keySequence.length - 10);
    }
}
// ▲▲▲ 치트키 핸들러 ▲▲▲



nextWaveButton.addEventListener('click', spawnWave);

if (challengeBossButton) {
  challengeBossButton.addEventListener('click', spawnBoss);
}

if (gameSpeedButton) {
  gameSpeedButton.addEventListener('click', () => {
    if (gameSpeed === 1) {
      gameSpeed = 2;
      gameSpeedButton.textContent = '2x Speed';
      gameSpeedButton.classList.add('active');
    } else {
      gameSpeed = 1;
      gameSpeedButton.textContent = '1x Speed';
      gameSpeedButton.classList.remove('active');
    }
  });
}

restartButton.addEventListener('click', () => {
  resetGameState();
  gameOverDiv.style.display = 'none';
  introScreen.style.display = 'flex'; 
});

startGameBtn.addEventListener('click', () => {
  introScreen.style.display = 'none'; 
  initGame(); // 게임 시작
});

// ▼▼▼ 치트키 이벤트 리스너 등록 ▼▼▼
window.addEventListener('keydown', handleCheatCodes);
// ▲▲▲ 치트키 이벤트 리스너 등록 ▲▲▲