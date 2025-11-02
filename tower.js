// tower.js — 타워 클릭 및 사거리 표시 기능 전용

const towerInfoPanel = document.getElementById('towerInfoPanel');
const towerRange = document.getElementById('towerRange');
const towerDamage = document.getElementById('towerDamage');
const towerFireRate = document.getElementById('towerFireRate');

let selectedTower = null;
let hoverTower = null;

// 마우스 이동 시 hoverTower 감지
canvas.addEventListener('mousemove', (e) => {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    hoverTower = null;
    for (const tower of towers) {
        if (x >= tower.x && x <= tower.x + TILE_SIZE &&
            y >= tower.y && y <= tower.y + TILE_SIZE) {
            hoverTower = tower;
            break;
        }
    }
});

// 타워 클릭 시 UI 토글 + 선택된 타워 표시
canvas.addEventListener('click', (e) => {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let clickedTower = null;
    for (const tower of towers) {
        if (x >= tower.x && x <= tower.x + TILE_SIZE &&
            y >= tower.y && y <= tower.y + TILE_SIZE) {
            clickedTower = tower;
            break;
        }
    }

    if (clickedTower) {
        if (selectedTower === clickedTower) {
            towerInfoPanel.style.display = 'none';
            selectedTower = null;
        } else {
            selectedTower = clickedTower;
            towerInfoPanel.style.display = 'block';
            towerRange.textContent = `사거리: ${clickedTower.range}`;
            towerDamage.textContent = `공격력: ${clickedTower.damage}`;
            towerFireRate.textContent = `공격속도: ${clickedTower.fireRate}`;
        }
        return;
    }
});
