import { epley, volume } from '../workout-metrics';

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
});

describe('estimated 1RM', () => {
  it('uses the lifted weight for a single repetition', () => {
    expect(epley(100, 1)).toBe(100);
  });

  it('estimates 100 kg from 75 kg for 10 repetitions', () => {
    expect(epley(75, 10)).toBeCloseTo(100);
  });
});
