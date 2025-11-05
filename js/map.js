// map.js — 격자, 맵, 경로 데이터 관리

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 30;
const GRID_COLS = Math.floor(canvas.width / TILE_SIZE);
const GRID_ROWS = Math.floor(canvas.height / TILE_SIZE);

// ▼▼▼ 1. 스테이지별 경로 정의 ▼▼▼
const path1 = [
  { x: 0, y: TILE_SIZE * 4 },
  { x: TILE_SIZE * 6, y: TILE_SIZE * 4 },
  { x: TILE_SIZE * 6, y: TILE_SIZE * 11 },
  { x: TILE_SIZE * 14, y: TILE_SIZE * 11 },
  { x: TILE_SIZE * 14, y: TILE_SIZE * 7 },
  { x: TILE_SIZE * 20, y: TILE_SIZE * 7 }
];

// 2. (하드 모드) 맵 2 - 더 복잡한 경로
const path2 = [
    { x: 0, y: TILE_SIZE * 2 },
    { x: TILE_SIZE * 3, y: TILE_SIZE * 2 },
    { x: TILE_SIZE * 3, y: TILE_SIZE * 12 },
    { x: TILE_SIZE * 8, y: TILE_SIZE * 12 },
    { x: TILE_SIZE * 8, y: TILE_SIZE * 1 },
    { x: TILE_SIZE * 13, y: TILE_SIZE * 1 },
    { x: TILE_SIZE * 13, y: TILE_SIZE * 14 },
    { x: TILE_SIZE * 17, y: TILE_SIZE * 14 },
    { x: TILE_SIZE * 17, y: TILE_SIZE * 5 },
    { x: TILE_SIZE * 20, y: TILE_SIZE * 5 }
];

let currentPath = path1; // ▼ 현재 활성화된 경로
// ▲▲▲ 스테이지별 경로 정의 ▲▲▲

const pathCells = new Set();
const towerCells = new Set(); // 타워 위치 저장

// ▼▼▼ 맵 설정 함수 (main.js에서 호출) ▼▼▼
/**
 * 스테이지에 맞는 맵 경로를 설정하고, 타워를 초기화합니다.
 * @param {number} stageNumber - 1 또는 2
 */
function setMap(stageNumber) {
    if (stageNumber === 2) {
        currentPath = path2;
    } else {
        currentPath = path1;
    }
    
    // 맵이 바뀌면 타워와 길을 초기화
    towerCells.clear();
    pathCells.clear();
    buildPathCells(currentPath);
}
// ▲▲▲ 맵 설정 함수 ▲▲▲


function buildPathCells(points) {
  const roundCell = (v) => Math.round(v / TILE_SIZE);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    let ax = roundCell(a.x), ay = roundCell(a.y);
    let bx = roundCell(b.x), by = roundCell(b.y);

    const isHorizontal = ay === by;
    if (isHorizontal) {
      for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
        pathCells.add(cellKey(x, ay));
      }
    } else {
      for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
        pathCells.add(cellKey(ax, y));
      }
    }
  }
}

// 최초 맵 빌드
buildPathCells(currentPath);


function cellKey(col, row) { return `${col},${row}`; }
function isPathCell(col, row) { return pathCells.has(cellKey(col, row)); }
function isTowerCell(col, row) { return towerCells.has(cellKey(col, row)); }