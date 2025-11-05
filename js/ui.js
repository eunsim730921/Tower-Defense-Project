// ui.js — 체력, 돈, 웨이브, 타워 정보 표시

const healthDisplay = document.getElementById('health');
const moneyDisplay = document.getElementById('money');
const waveDisplay = document.getElementById('wave');
const nextWaveButton = document.getElementById('nextWaveButton');
const gameOverDiv = document.getElementById('gameOver');
const restartButton = document.getElementById('restartButton');
const challengeBossButton = document.getElementById('challengeBossButton');

const towerInfoPanel = document.getElementById('towerInfoPanel');
const towerRange = document.getElementById('towerRange');
const towerDamage = document.getElementById('towerDamage');
const towerFireRate = document.getElementById('towerFireRate');

const nextWaveInfoDiv = document.getElementById('nextWaveInfo');
const nextWaveNumSpan = document.getElementById('nextWaveNum');
const nextWaveListUL = document.getElementById('nextWaveList');


function updateUI() {
  healthDisplay.textContent = health;
  moneyDisplay.textContent = money;
  waveDisplay.textContent = wave;
}

/**
 * 다음 웨이브 몬스터 정보를 UI에 표시합니다.
 * @param {object} waveComp - {basic, fast, tank, ninja} 몬스터 개수 객체
 * @param {number} nextWaveNumber - 다음 웨이브 숫자
 */
function updateNextWaveUI(waveComp, nextWaveNumber) {
  if (!nextWaveInfoDiv) return;

  // ▼▼▼ display 대신 visibility로 변경 (UI 뒤틀림 방지) ▼▼▼
  if (bossActive || !waveComp) {
      nextWaveInfoDiv.style.visibility = 'hidden';
      return;
  }

  nextWaveInfoDiv.style.visibility = 'visible';
  // ▲▲▲ display 대신 visibility로 변경 (UI 뒤틀림 방지) ▲▲▲

  nextWaveNumSpan.textContent = nextWaveNumber;
  nextWaveListUL.innerHTML = ''; // 기존 목록 초기화

  // 몬스터 종류별로 리스트 아이템 추가
  if (waveComp.basic > 0) {
    nextWaveListUL.innerHTML += `<li><span class="enemy-basic"></span>기본 (Basic): ${waveComp.basic}</li>`;
  }
  if (waveComp.fast > 0) {
    nextWaveListUL.innerHTML += `<li><span class="enemy-fast"></span>빠름 (Fast): ${waveComp.fast}</li>`;
  }
  if (waveComp.tank > 0) {
    nextWaveListUL.innerHTML += `<li><span class="enemy-tank"></span>탱커 (Tank): ${waveComp.tank}</li>`;
  }
  if (waveComp.ninja > 0) {
    nextWaveListUL.innerHTML += `<li><span class="enemy-ninja"></span>닌자 (Ninja): ${waveComp.ninja}</li>`;
  }
}