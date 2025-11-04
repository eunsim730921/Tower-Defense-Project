// main.js — 전체 게임 제어

let health, money, wave, towerCost, gameOver;
let animationFrameId;

const introScreen = document.getElementById('introScreen');
const startGameBtn = document.getElementById('startGameBtn');

function initGame() {
  document.getElementById('uiPanel').style.display = 'flex';
  // 기본 상태 초기화
  health = 20;
  money = 50;
  wave = 0;
  towerCost = 10;
  gameOver = false;

  // 적, 타워, 투사체 등 완전 초기화
  enemies = [];
  towers = [];
  projectiles = [];
  explosions = [];
  frosts = [];

  // 격자/타워 위치 데이터 초기화
  towerCells.clear();

  // UI 상태 리셋
  hoverTower = null;
  selectedTower = null;
  selectedCell = null;
  hidePanel(); // ← towerInfoPanel 숨기기

  updateUI();

  // 화면 버튼/패널 초기화
  gameOverDiv.style.display = 'none';
  nextWaveButton.disabled = false;

  // 기존 애니메이션 프레임 중단 후 새 루프 시작
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  gameLoop();
}

function resetGameState() {
  // 변수 초기화
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


  // 모든 게임 객체 초기화
  enemies = [];
  towers = [];
  projectiles = [];
  explosions = [];
  frosts = [];
  towerCells.clear();

  // UI 상태 초기화
  hoverTower = null;
  selectedTower = null;
  selectedCell = null;

  // 타워 정보창 숨기기 (tower.js 함수)
  if (typeof hidePanel === 'function') hidePanel();

  updateUI();
  nextWaveButton.disabled = false;

  // 애니메이션 중단
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw();
  document.getElementById('uiPanel').style.display = 'none';
}



function gameLoop() {
  if (gameOver) return;
  updateEnemies();
  updateTowers();
  updateProjectiles(); 
  draw();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animationFrameId);
  nextWaveButton.disabled = true;

  const finalWaveText = document.getElementById('finalWaveText');
  if (finalWaveText) {
    finalWaveText.textContent = `최종 웨이브: ${wave}`;
  }

  gameOverDiv.style.display = 'flex';
}



nextWaveButton.addEventListener('click', spawnWave);
restartButton.addEventListener('click', () => {
  resetGameState();
  gameOverDiv.style.display = 'none';
  introScreen.style.display = 'flex'; 
});

startGameBtn.addEventListener('click', () => {
  introScreen.style.display = 'none'; 
  initGame(); // 게임 시작
});