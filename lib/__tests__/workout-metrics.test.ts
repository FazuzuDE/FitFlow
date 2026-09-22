import { completedSetMetrics, epley, volume } from '../workout-metrics';

const done = (weight: string, reps: string) => ({
  weight,
  reps,
  completedAt: 1,
});

describe('completed-set analytics boundary', () => {
  it.each([
    ['negative weight', '-1', '10'],
    ['zero reps', '50', '0'],
    ['negative reps', '50', '-2'],
    ['fractional reps', '50', '1.5'],
    ['NaN-like weight', 'not-a-number', '10'],
    ['Infinity', 'Infinity', '10'],
    ['scientific notation', '1e2', '10'],
    ['hexadecimal notation', '0x10', '10'],
    ['non-finite multiplication', `1${'0'.repeat(308)}`, '10'],
  ])('rejects %s', (_label, weight, reps) => {
    expect(completedSetMetrics(done(weight, reps))).toBeUndefined();
  });

  it('accepts zero weight and Workout Engine decimal syntax', () => {
    expect(completedSetMetrics(done('0', '10'))).toEqual({
      weight: 0,
      reps: 10,
      volume: 0,
      estimatedOneRepMax: 0,
    });
    expect(completedSetMetrics(done(' 60,5 ', '8'))).toEqual({
      weight: 60.5,
      reps: 8,
      volume: 484,
      estimatedOneRepMax: expect.closeTo(76.63333333333334),
    });
  });

  it('requires a completed set', () => {
    expect(completedSetMetrics({ weight: '50', reps: '10' })).toBeUndefined();
  });
});

describe('completed workout volume', () => {
  it('adds completed sets across exercises and excludes planned sets', () => {
    expect(
      volume({
        exercises: [
          {
            sets: [
              { weight: '80', reps: '10', done: true },
              { weight: '80', reps: '8', done: false },
            ],
          },
          { sets: [{ weight: '22.5', reps: '12', done: true }] },
        ],
      }),
    ).toBe(1070);
  });

  it('returns zero before any exercises are added', () => {
    expect(volume({ exercises: [] })).toBe(0);
  });

  it.each([
    ['', '10'],
    ['80', ''],
    ['invalid', '10'],
    ['80', 'invalid'],
  ])('keeps legacy incomplete inputs safe: %s × %s', (weight, reps) => {
    expect(
      volume({ exercises: [{ sets: [{ weight, reps, done: true }] }] }),
    ).toBe(0);
  });

  it('excludes invalid completed samples and never overflows the total', () => {
    const large = `1${'0'.repeat(307)}`;
    const total = volume({
      exercises: [
        {
          sets: [
            done('50', '10'),
            done('-50', '10'),
            done(large, '10'),
            done(large, '10'),
          ],
        },
      ],
    });

    expect(total).toBe(Number(large) * 10);
    expect(Number.isFinite(total)).toBe(true);
  });
});

describe('estimated 1RM', () => {
  it('uses the lifted weight for a single repetition', () => {
    expect(epley(100, 1)).toBe(100);
  });

  it('estimates 100 kg from 75 kg for 10 repetitions', () => {
    expect(epley(75, 10)).toBeCloseTo(100);
  });
});
