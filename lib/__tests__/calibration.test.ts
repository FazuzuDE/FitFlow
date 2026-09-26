import {
  calibrationAttemptCount,
  calibrationLoadKind,
  chooseCalibrationPath,
  feedbackGuidance,
  initialCalibrationState,
  needsCalibration,
  pendingCalibrationSet,
  recordCalibrationFeedback,
  recordFailedCalibrationAttempt,
  startingBaseline,
} from '../calibration';
import {
  appendExercise,
  finishWorkout,
  startWorkout,
  toggleSet,
  updateSet,
} from '../workout-engine';
import { exerciseLibrary } from '../workout-catalog';

const template = {
  id: 'first',
  name: 'First workout',
  exerciseIds: ['barbell-bench-press'],
};
const started = () =>
  startWorkout(
    template,
    exerciseLibrary,
    1000,
    (() => {
      let id = 0;
      return () => `id-${++id}`;
    })(),
  );
const completed = (
  weight: string,
  setIndex = 0,
  session = started(),
  at = 2000,
) =>
  toggleSet(
    updateSet(session, 0, setIndex, { weight, reps: '8' }),
    0,
    setIndex,
    at,
  ).session;

describe('First Workout Calibration v1', () => {
  it('calibrates only exercises with supported external kilograms and no valid exercise history', () => {
    expect(calibrationLoadKind('barbell-bench-press')).toBe('external');
    expect(calibrationLoadKind('push-up')).toBe('bodyweight');
    expect(calibrationLoadKind('assisted-pull-up')).toBe('assistance');
    expect(calibrationLoadKind('assisted-dip-machine')).toBe('assistance');
    expect(needsCalibration('barbell-bench-press', [])).toBe(true);
    expect(needsCalibration('push-up', [])).toBe(false);
    expect(needsCalibration('assisted-pull-up', [])).toBe(false);
    expect(
      needsCalibration('barbell-bench-press', [
        finishWorkout(completed('60'), 3000),
      ]),
    ).toBe(false);
    expect(
      needsCalibration('seated-cable-row', [
        finishWorkout(completed('60'), 3000),
      ]),
    ).toBe(true);
  });

  it('keeps known weight and help-me-find as paths, never as inferred kilograms', () => {
    const known = chooseCalibrationPath(
      initialCalibrationState(),
      'session',
      'barbell-bench-press',
      'known',
    );
    const help = chooseCalibrationPath(
      initialCalibrationState(),
      'session',
      'barbell-bench-press',
      'help',
    );
    expect(known.paths[0]).toMatchObject({ choice: 'known' });
    expect(help.paths[0]).toMatchObject({ choice: 'help' });
    expect(JSON.stringify(known) + JSON.stringify(help)).not.toMatch(
      /"weight"/,
    );
  });

  it.each([
    ['too-easy', 'increase'],
    ['good', 'Starting baseline'],
    ['hard', 'keep or reduce'],
    ['too-hard', 'reduction'],
  ] as const)(
    'gives %s feedback without a calculated weight',
    (feedback, phrase) => {
      const session = completed('57.5');
      const state = recordCalibrationFeedback(
        initialCalibrationState(),
        session,
        'barbell-bench-press',
        session.exercises[0].sets[0].id,
        feedback,
      );
      expect(state.feedback[0]).toMatchObject({ feedback, completedAt: 2000 });
      expect(feedbackGuidance(feedback)).toContain(phrase);
      expect(feedbackGuidance(feedback)).not.toMatch(/\d+\s*(kg|%)/);
    },
  );

  it('uses the actual manually overridden completed set, not planned or previous weight', () => {
    const session = completed('57.5');
    const set = session.exercises[0].sets[0];
    const state = recordCalibrationFeedback(
      initialCalibrationState(),
      session,
      'barbell-bench-press',
      set.id,
      'good',
    );
    expect(
      startingBaseline(
        state,
        [finishWorkout(session, 3000)],
        'barbell-bench-press',
      ),
    ).toMatchObject({ weight: 57.5, reps: 8, setId: set.id });
    expect(startingBaseline(state, [], 'barbell-bench-press')).toBeUndefined();
  });

  it('does not reuse feedback when a set is unmarked and completed again', () => {
    const first = completed('50');
    const setId = first.exercises[0].sets[0].id;
    const state = recordCalibrationFeedback(
      initialCalibrationState(),
      first,
      'barbell-bench-press',
      setId,
      'good',
    );
    const reopened = toggleSet(first, 0, 0, 2500).session;
    const changed = completed('55', 0, reopened, 4000);
    expect(
      pendingCalibrationSet(
        state,
        changed,
        'barbell-bench-press',
        changed.exercises[0].id,
      )?.id,
    ).toBe(setId);
    expect(
      startingBaseline(
        state,
        [finishWorkout(changed, 5000)],
        'barbell-bench-press',
      ),
    ).toBeUndefined();
  });

  it('permits repeated attempts without a forced increase or attempt cap', () => {
    let session = started();
    let state = initialCalibrationState();
    for (let index = 0; index < 3; index += 1) {
      session = completed('40', index, session, 2000 + index);
      state = recordCalibrationFeedback(
        state,
        session,
        'barbell-bench-press',
        session.exercises[0].sets[index].id,
        'hard',
      );
    }
    expect(state.feedback).toHaveLength(3);
    expect(feedbackGuidance('hard')).toContain('Do not increase');
    expect(
      chooseCalibrationPath(
        state,
        session.id,
        'barbell-bench-press',
        'use-today',
      ).paths[0].choice,
    ).toBe('use-today');
    expect(
      startingBaseline(
        state,
        [finishWorkout(session, 6000)],
        'barbell-bench-press',
      ),
    ).toBeUndefined();
  });

  it('never records assistance or bodyweight as an external-load baseline', () => {
    const session = completed('60');
    const set = session.exercises[0].sets[0];
    const state = recordCalibrationFeedback(
      initialCalibrationState(),
      session,
      'assisted-pull-up',
      set.id,
      'good',
    );
    expect(state.feedback).toEqual([]);
    expect(
      startingBaseline(
        state,
        [finishWorkout(session, 3000)],
        'assisted-pull-up',
      ),
    ).toBeUndefined();
  });

  it('attributes a repeated exercise occurrence to its own completed set', () => {
    let serial = 0;
    const repeated = appendExercise(
      started(),
      exerciseLibrary.find((item) => item.id === 'barbell-bench-press')!,
      () => `extra-${++serial}`,
    );
    const second = toggleSet(
      updateSet(repeated, 1, 0, { weight: '62.5', reps: '6' }),
      1,
      0,
      2500,
    ).session;
    const secondSet = second.exercises[1].sets[0];
    expect(
      pendingCalibrationSet(
        initialCalibrationState(),
        second,
        'barbell-bench-press',
        second.exercises[0].id,
      ),
    ).toBeUndefined();
    expect(
      pendingCalibrationSet(
        initialCalibrationState(),
        second,
        'barbell-bench-press',
        second.exercises[1].id,
      )?.id,
    ).toBe(secondSet.id);
    const feedback = recordCalibrationFeedback(
      initialCalibrationState(),
      second,
      'barbell-bench-press',
      secondSet.id,
      'good',
    );
    expect(feedback.feedback).toHaveLength(1);
    expect(
      startingBaseline(
        feedback,
        [finishWorkout(second, 3000)],
        'barbell-bench-press',
      ),
    ).toMatchObject({ weight: 62.5, setId: secondSet.id });
  });

  it('does not silently fall back to an older unreviewed set after the latest set receives feedback', () => {
    const first = completed('40');
    const second = completed('45', 1, first, 3000);
    const exercise = second.exercises[0];
    expect(
      pendingCalibrationSet(
        initialCalibrationState(),
        second,
        exercise.libraryId,
        exercise.id,
      )?.id,
    ).toBe(exercise.sets[1].id);
    const state = recordCalibrationFeedback(
      initialCalibrationState(),
      second,
      exercise.libraryId,
      exercise.sets[1].id,
      'good',
    );
    expect(
      pendingCalibrationSet(state, second, exercise.libraryId, exercise.id),
    ).toBeUndefined();
    expect(
      startingBaseline(state, [finishWorkout(second, 4000)], exercise.libraryId)
        ?.weight,
    ).toBe(45);
  });

  it('asks about the most recently performed set even when rows are completed out of order', () => {
    const second = completed('45', 1, started(), 2000);
    const first = completed('40', 0, second, 3000);
    const exercise = first.exercises[0];
    expect(
      pendingCalibrationSet(
        initialCalibrationState(),
        first,
        exercise.libraryId,
        exercise.id,
      )?.id,
    ).toBe(exercise.sets[0].id);
  });

  it('records a failed real-load attempt without fabricating a completed workout set or baseline', () => {
    const session = updateSet(started(), 0, 0, { weight: '55', reps: '8' });
    const set = session.exercises[0].sets[0];
    const state = recordFailedCalibrationAttempt(
      initialCalibrationState(),
      session,
      'barbell-bench-press',
      set.id,
      2000,
    );
    expect(state.feedback[0]).toMatchObject({
      setId: set.id,
      feedback: 'too-hard',
      failedAt: 2000,
    });
    expect(session.exercises[0].sets[0].completedAt).toBeUndefined();
    expect(startingBaseline(state, [], 'barbell-bench-press')).toBeUndefined();
    expect(calibrationAttemptCount(state, session, 'barbell-bench-press')).toBe(
      1,
    );
    expect(
      recordFailedCalibrationAttempt(
        state,
        session,
        'barbell-bench-press',
        set.id,
        2100,
      ),
    ).toBe(state);
    expect(
      recordFailedCalibrationAttempt(
        initialCalibrationState(),
        updateSet(session, 0, 0, { weight: '' }),
        'barbell-bench-press',
        set.id,
        2000,
      ).feedback,
    ).toEqual([]);
  });
});
