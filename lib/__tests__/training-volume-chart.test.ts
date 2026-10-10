import { volumeChartScale, volumeChartTick } from '../training-volume-chart';

it('gives the selected reference volumes a zero-based readable kg scale', () => {
  const scale = volumeChartScale([5200, 6200, 5600, 7000, 6000, 7400, 6600]);
  expect(scale.upper).toBe(10000);
  expect(scale.ticks).toEqual([10000, 7500, 5000, 2500, 0]);
  expect(7400 / scale.upper).toBeCloseTo(0.74);
});

it('keeps axis labels readable for fractional and extreme scales', () => {
  expect(volumeChartTick(10000)).toBe('10,000');
  expect(volumeChartTick(0.25)).toBe('0.25');
  expect(volumeChartTick(0.0001)).toBe('1e-4');
  expect(volumeChartTick(1e308)).toBe('1e+308');
  expect(volumeChartTick(0)).toBe('0');
});

it('retains fractional volumes and a usable zero scale', () => {
  expect(volumeChartScale([0, 0]).upper).toBeGreaterThan(0);
  const scale = volumeChartScale([0.0001, 0.00025]);
  expect(scale.upper).toBeGreaterThanOrEqual(0.00025);
  expect(scale.ticks.at(-1)).toBe(0);
  expect(scale.ticks[0]).toBe(scale.upper);
  expect(scale.ticks.every(Number.isFinite)).toBe(true);
  expect(0.0001 / scale.upper).toBeGreaterThan(0);
});

it('keeps scale bounds and relative heights finite at numeric extremes', () => {
  for (const values of [
    [1e307, 1e308],
    [Number.MAX_VALUE],
    [Number.MIN_VALUE],
  ]) {
    const scale = volumeChartScale(values);
    expect(Number.isFinite(scale.upper)).toBe(true);
    expect(scale.upper).toBeGreaterThanOrEqual(Math.max(...values));
    expect(scale.ticks.every(Number.isFinite)).toBe(true);
    expect(scale.ticks.at(-1)).toBe(0);
    expect(values.every((value) => value / scale.upper <= 1)).toBe(true);
  }
  const scale = volumeChartScale([1e307, 1e308]);
  expect(1e307 / scale.upper / (1e308 / scale.upper)).toBeCloseTo(0.1);
});
