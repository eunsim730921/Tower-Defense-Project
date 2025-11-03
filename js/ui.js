// ui.js — 체력, 돈, 웨이브, 타워 정보 표시

const healthDisplay = document.getElementById('health');
const moneyDisplay = document.getElementById('money');
const waveDisplay = document.getElementById('wave');
const nextWaveButton = document.getElementById('nextWaveButton');
const gameOverDiv = document.getElementById('gameOver');
const restartButton = document.getElementById('restartButton');

const towerInfoPanel = document.getElementById('towerInfoPanel');
const towerRange = document.getElementById('towerRange');
const towerDamage = document.getElementById('towerDamage');
const towerFireRate = document.getElementById('towerFireRate');

function updateUI() {
  healthDisplay.textContent = health;
  moneyDisplay.textContent = money;
  waveDisplay.textContent = wave;
}
