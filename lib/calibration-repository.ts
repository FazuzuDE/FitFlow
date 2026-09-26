import { type CalibrationState, initialCalibrationState } from './calibration';
import type { KeyValueStorage } from './workout-repository';

export const CALIBRATION_KEY = 'cresum_calibration_v1';

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;
const timestamp = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function parseCalibration(raw: string): CalibrationState {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !object(value) ||
      value.version !== 1 ||
      !Array.isArray(value.paths) ||
      !Array.isArray(value.feedback)
    )
      return initialCalibrationState();
    if (
      !value.paths.every(
        (item: unknown) =>
          object(item) &&
          nonempty(item.sessionId) &&
          nonempty(item.exerciseId) &&
          (item.choice === 'known' ||
            item.choice === 'help' ||
            item.choice === 'use-today'),
      ) ||
      !value.feedback.every(
        (item: unknown) =>
          object(item) &&
          nonempty(item.sessionId) &&
          nonempty(item.exerciseId) &&
          nonempty(item.setId) &&
          ((timestamp(item.completedAt) && item.failedAt === undefined) ||
            (timestamp(item.failedAt) &&
              item.completedAt === undefined &&
              item.feedback === 'too-hard')) &&
          (item.feedback === 'too-easy' ||
            item.feedback === 'good' ||
            item.feedback === 'hard' ||
            item.feedback === 'too-hard'),
      )
    )
      return initialCalibrationState();
    return value as CalibrationState;
  } catch {
    return initialCalibrationState();
  }
}

export class CalibrationRepository {
  private pending: Promise<void> = Promise.resolve();
  constructor(private readonly storage: KeyValueStorage) {}

  async load(): Promise<CalibrationState> {
    try {
      const raw = await this.storage.getItem(CALIBRATION_KEY);
      return raw === null ? initialCalibrationState() : parseCalibration(raw);
    } catch {
      return initialCalibrationState();
    }
  }

  save(state: CalibrationState): Promise<void> {
    const payload = JSON.stringify(state);
    const write = this.pending
      .catch(() => undefined)
      .then(() => this.storage.setItem(CALIBRATION_KEY, payload));
    this.pending = write;
    return write;
  }

  async waitForWrites(): Promise<void> {
    await this.pending.catch(() => undefined);
  }
}
