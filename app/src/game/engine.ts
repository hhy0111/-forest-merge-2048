export type Grid = number[][];
export type Direction = 'left' | 'right' | 'up' | 'down';

export interface MoveResult {
  grid: Grid;
  moved: boolean;
  scoreDelta: number;
}

export const GRID_SIZE = 4;

export function createEmptyGrid(size: number = GRID_SIZE): Grid {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

export function getEmptyCells(grid: Grid): Array<{ r: number; c: number }> {
  const cells: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 0) cells.push({ r, c });
    }
  }
  return cells;
}

export function addRandomTile(grid: Grid, rng: () => number = Math.random): Grid {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return grid;
  const idx = Math.floor(rng() * empty.length);
  const { r, c } = empty[idx];
  const value = rng() < 0.9 ? 2 : 4;
  const next = cloneGrid(grid);
  next[r][c] = value;
  return next;
}

function slideAndMerge(row: number[]): { row: number[]; score: number; moved: boolean } {
  const filtered = row.filter((v) => v !== 0);
  const merged: number[] = [];
  let score = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const v = filtered[i] * 2;
      merged.push(v);
      score += v;
      i++;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < row.length) merged.push(0);
  const moved = row.some((v, i) => v !== merged[i]);
  return { row: merged, score, moved };
}

export function moveGrid(grid: Grid, dir: Direction): MoveResult {
  const size = grid.length;
  let moved = false;
  let scoreDelta = 0;
  const next = createEmptyGrid(size);

  if (dir === 'left' || dir === 'right') {
    for (let r = 0; r < size; r++) {
      const row = dir === 'right' ? [...grid[r]].reverse() : grid[r].slice();
      const res = slideAndMerge(row);
      const outRow = dir === 'right' ? res.row.reverse() : res.row;
      next[r] = outRow;
      moved = moved || res.moved;
      scoreDelta += res.score;
    }
  } else {
    for (let c = 0; c < size; c++) {
      const col: number[] = [];
      for (let r = 0; r < size; r++) col.push(grid[r][c]);
      const colUse = dir === 'down' ? col.reverse() : col;
      const res = slideAndMerge(colUse);
      const outCol = dir === 'down' ? res.row.reverse() : res.row;
      for (let r = 0; r < size; r++) next[r][c] = outCol[r];
      moved = moved || res.moved;
      scoreDelta += res.score;
    }
  }

  return { grid: next, moved, scoreDelta };
}

export function canMove(grid: Grid): boolean {
  if (getEmptyCells(grid).length > 0) return true;
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if ((r + 1 < size && grid[r + 1][c] === v) || (c + 1 < size && grid[r][c + 1] === v)) {
        return true;
      }
    }
  }
  return false;
}
