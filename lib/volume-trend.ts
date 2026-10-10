import type { WorkoutVolume } from './progress-analytics';
import { volumeChartScale } from './training-volume-chart';

type Position = { x: number; y: number };
export const volumeTrendModel = (
  data: readonly WorkoutVolume[],
  start: number,
  end: number,
  width: number,
  height: number,
) => {
  const ordered = [...data].sort(
    (a, b) =>
      a.finishedAt - b.finishedAt || a.workoutId.localeCompare(b.workoutId),
  );
  const scale = volumeChartScale(ordered.map((p) => p.volume));
  const span = Math.max(1, end - start);
  const points = ordered.map((data) => ({
    data,
    x: Math.max(0, Math.min(1, (data.finishedAt - start) / span)) * width,
    y: (1 - data.volume / scale.upper) * height,
  }));
  const slopes = points
    .slice(1)
    .map((p, i) =>
      p.x === points[i].x ? 0 : (p.y - points[i].y) / (p.x - points[i].x),
    );
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0] ?? 0;
    if (i === points.length - 1) return slopes[i - 1] ?? 0;
    const left = slopes[i - 1],
      right = slopes[i];
    return left * right > 0 ? 2 / (1 / left + 1 / right) : 0;
  });
  const line: Position[] = points.length
    ? [{ x: points[0].x, y: points[0].y }]
    : [];
  points.slice(1).forEach((p, i) => {
    const a = points[i],
      dx = p.x - a.x;
    // Shape-preserving Hermite interpolation, sampled at native pixel scale.
    // No rest-day zeros, extrapolation, averaging, or estimated volume samples.
    const steps = Math.max(1, Math.ceil(dx / 2));
    for (let step = 1; step <= steps; step++) {
      const t = step / steps,
        t2 = t * t,
        t3 = t2 * t;
      const y =
        (2 * t3 - 3 * t2 + 1) * a.y +
        (t3 - 2 * t2 + t) * dx * tangents[i] +
        (-2 * t3 + 3 * t2) * p.y +
        (t3 - t2) * dx * tangents[i + 1];
      line.push({
        x: a.x + t * dx,
        y: Math.max(Math.min(a.y, p.y), Math.min(Math.max(a.y, p.y), y)),
      });
    }
  });
  return {
    points,
    line,
    scale,
    ticks: Array.from({ length: 4 }, (_, i) => start + ((end - start) * i) / 3),
  };
};

export const nearestTrendPoint = (
  points: readonly Position[],
  x: number,
  y: number,
) => {
  let nearest = 0,
    distance = Infinity;
  points.forEach((p, i) => {
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < distance) {
      distance = d;
      nearest = i;
    }
  });
  return nearest;
};
