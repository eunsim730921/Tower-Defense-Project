// map.js — 격자, 맵, 경로 데이터 관리

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 30;
const GRID_COLS = Math.floor(canvas.width / TILE_SIZE);
const GRID_ROWS = Math.floor(canvas.height / TILE_SIZE);

const path = [
  { x: 0, y: TILE_SIZE * 4 },
  { x: TILE_SIZE * 6, y: TILE_SIZE * 4 },
  { x: TILE_SIZE * 6, y: TILE_SIZE * 11 },
  { x: TILE_SIZE * 14, y: TILE_SIZE * 11 },
  { x: TILE_SIZE * 14, y: TILE_SIZE * 7 },
  { x: TILE_SIZE * 20, y: TILE_SIZE * 7 }
];

const pathCells = new Set();
const towerCells = new Set();

function buildPathCells(points) {
  const roundCell = (v) => Math.round(v / TILE_SIZE);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    let ax = roundCell(a.x), ay = roundCell(a.y);
    let bx = roundCell(b.x), by = roundCell(b.y);

    if (ay === by) {
      for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) pathCells.add(`${x},${ay}`);
    } else if (ax === bx) {
      for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) pathCells.add(`${ax},${y}`);
    }
  }
}
buildPathCells(path);

const cellKey = (cx, cy) => `${cx},${cy}`;
const isPathCell = (cx, cy) => pathCells.has(cellKey(cx, cy));
const isTowerCell = (cx, cy) => towerCells.has(cellKey(cx, cy));
