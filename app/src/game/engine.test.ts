import { describe, expect, it } from 'vitest';
import { addRandomTile, canMove, createEmptyGrid, moveGrid } from './engine';

describe('engine', () => {
  it('creates an empty 4x4 grid', () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(4);
    grid.forEach((row) => {
      expect(row).toHaveLength(4);
      row.forEach((cell) => expect(cell).toBe(0));
    });
  });

  it('merges tiles when moving left', () => {
    const grid = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const result = moveGrid(grid, 'left');
    expect(result.grid[0]).toEqual([4, 0, 0, 0]);
    expect(result.scoreDelta).toBe(4);
  });

  it('does not double-merge in one move', () => {
    const grid = [
      [2, 2, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const result = moveGrid(grid, 'left');
    expect(result.grid[0]).toEqual([4, 2, 0, 0]);
    expect(result.scoreDelta).toBe(4);
  });

  it('detects when no moves are possible', () => {
    const grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(canMove(grid)).toBe(false);
  });

  it('adds a random tile to empty grid', () => {
    const grid = createEmptyGrid();
    const seeded = addRandomTile(grid, () => 0.1);
    const flat = seeded.flat();
    expect(flat.filter((v) => v !== 0).length).toBe(1);
  });
});
