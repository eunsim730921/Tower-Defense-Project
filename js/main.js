// main.js — 전체 게임 제어

let health, money, wave, towerCost, gameOver;
let animationFrameId;

function initGame() {
  health = 20;
  money = 50;
  wave = 0;
  towerCost = 10;
  gameOver = false;

  enemies = [];
  towers = [];
  towerCells.clear();

  updateUI();
  gameOverDiv.style.display = 'none';
  nextWaveButton.disabled = false;

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  gameLoop();
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
  gameOverDiv.style.display = 'block';
  nextWaveButton.disabled = true;
  cancelAnimationFrame(animationFrameId);
}

nextWaveButton.addEventListener('click', spawnWave);
restartButton.addEventListener('click', initGame);

initGame();
