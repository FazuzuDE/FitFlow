import { volumeTrendModel, nearestTrendPoint } from '../volume-trend';
import type { WorkoutVolume } from '../progress-analytics';

const point = (
  id: string,
  finishedAt: number,
  volume: number,
): WorkoutVolume => ({ workoutId: id, workoutName: id, finishedAt, volume });
it('retains every chronological workout and places gaps on a real time axis', () => {
  const data = Array.from({ length: 10 }, (_, i) =>
    point(String(i), 100 + i * 10, i * 100),
  );
  const model = volumeTrendModel(data.reverse(), 0, 200, 300, 96);
  expect(model.points).toHaveLength(10);
  expect(model.points.map((p) => p.data.workoutId)).toEqual(
    Array.from({ length: 10 }, (_, i) => String(i)),
  );
  expect(model.points[0].x).toBe(150);
  expect(model.points[1].x - model.points[0].x).toBeCloseTo(15);
  expect(model.ticks[0]).toBe(0);
  expect(model.ticks.at(-1)).toBe(200);
  expect(data[0].workoutId).toBe('9');
});
it('never invents peaks or negative volume when smoothing through workouts', () => {
  const model = volumeTrendModel(
    [point('a', 0, 100), point('b', 100, 800), point('c', 200, 200)],
    0,
    200,
    300,
    96,
  );
  expect(model.line.length).toBeGreaterThan(3);
  for (const p of model.line) {
    expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    expect(p.y).toBeGreaterThanOrEqual(model.points[1].y);
    expect(p.y).toBeLessThanOrEqual(
      Math.max(model.points[0].y, model.points[2].y),
    );
  }
});
it('preserves coincident workouts and sparse zero/tiny/huge data without fictitious rest-day points', () => {
  const duplicate = volumeTrendModel(
    [point('a', 100, 0), point('b', 100, 100)],
    0,
    200,
    300,
    96,
  );
  expect(duplicate.points).toHaveLength(2);
  expect(duplicate.line).toHaveLength(2);
  expect(nearestTrendPoint(duplicate.points, 150, duplicate.points[1].y)).toBe(
    1,
  );
  for (const value of [0, 0.0001, 1e308]) {
    const model = volumeTrendModel([point('one', 100, value)], 0, 200, 300, 96);
    expect(model.line).toHaveLength(1);
    expect(model.points[0].data.volume).toBe(value);
    expect(Number.isFinite(model.points[0].y)).toBe(true);
  }
  expect(volumeTrendModel([], 0, 200, 300, 96).line).toEqual([]);
});
