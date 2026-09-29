import { Text } from 'react-native';
import type { ReactElement } from 'react';
import { AppButton } from '../../components/AppButton';
import { WorkoutCalibration } from '../../components/WorkoutCalibration';
import {
  chooseCalibrationPath,
  initialCalibrationState,
  recordCalibrationFeedback,
} from '../calibration';
import { exerciseLibrary } from '../workout-catalog';
import {
  finishWorkout,
  startWorkout,
  toggleSet,
  updateSet,
} from '../workout-engine';

const { act, create } = jest.requireActual('react-test-renderer');
const render = (element: ReactElement): ReturnType<typeof create> => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(element);
  });
  return view;
};
const makeSession = (exerciseId = 'barbell-bench-press') =>
  startWorkout(
    { id: 't', name: 'First', exerciseIds: [exerciseId] },
    exerciseLibrary,
    1000,
    (() => {
      let id = 0;
      return () => `id-${++id}`;
    })(),
  );
const props = (session = makeSession()) => ({
  session,
  exercise: session.exercises[0],
  history: [],
  state: initialCalibrationState(),
  busy: false,
  error: '',
  onChoose: jest.fn(),
  onFeedback: jest.fn(),
  onFailedAttempt: jest.fn(),
  onContinue: jest.fn(),
});
const titles = (view: ReturnType<typeof create>) =>
  view.root
    .findAllByType(AppButton)
    .map((item: { props: { title: string } }) => item.props.title);
const childText = (value: unknown): string =>
  Array.isArray(value)
    ? value.map(childText).join('')
    : typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';
const text = (view: ReturnType<typeof create>) =>
  view.root
    .findAllByType(Text)
    .map((item: { props: { children: unknown } }) =>
      childText(item.props.children),
    )
    .join(' ');

it('offers known weight and help without fabricating a kilogram target', () => {
  const input = props();
  const view = render(<WorkoutCalibration {...input} />);
  expect(titles(view)).toContain('I know my usual weight');
  expect(titles(view)).toContain('Help me find a starting weight');
  expect(text(view)).not.toMatch(/\d+\s*kg/);
  act(() =>
    view.root
      .findAllByType(AppButton)
      .find(
        (item: { props: { title: string } }) =>
          item.props.title === 'Help me find a starting weight',
      )!
      .props.onPress(),
  );
  expect(input.onChoose).toHaveBeenCalledWith('help');
});

it('guides a light controllable actual weight and asks feedback only after a completed set', () => {
  const input = props();
  input.state = chooseCalibrationPath(
    input.state,
    input.session.id,
    input.exercise.libraryId,
    'help',
  );
  const view = render(<WorkoutCalibration {...input} />);
  expect(text(view)).toContain('Start light');
  expect(titles(view)).not.toContain('Too easy');
  const logged = toggleSet(
    updateSet(input.session, 0, 0, { weight: '32.5', reps: '8' }),
    0,
    0,
    2000,
  ).session;
  act(() =>
    view.update(
      <WorkoutCalibration
        {...input}
        session={logged}
        exercise={logged.exercises[0]}
      />,
    ),
  );
  expect(titles(view)).toEqual(
    expect.arrayContaining(['Too easy', 'Good', 'Hard', 'Too hard']),
  );
  expect(text(view)).toContain('Set 1 · 32.5 kg × 8 reps');
  act(() =>
    view.root
      .findAllByType(AppButton)
      .find(
        (item: { props: { title: string } }) => item.props.title === 'Good',
      )!
      .props.onPress(),
  );
  expect(input.onFeedback).toHaveBeenCalledWith(
    logged.exercises[0].sets[0].id,
    'good',
  );
});

it('shows a saved Good baseline from actual History, not an active unfinished workout', () => {
  const session = toggleSet(
    updateSet(makeSession(), 0, 0, { weight: '45', reps: '8' }),
    0,
    0,
    2000,
  ).session;
  const state = recordCalibrationFeedback(
    initialCalibrationState(),
    session,
    session.exercises[0].libraryId,
    session.exercises[0].sets[0].id,
    'good',
  );
  const active = props(session);
  active.state = state;
  const view = render(<WorkoutCalibration {...active} />);
  expect(text(view)).not.toContain('45 kg');
  act(() =>
    view.update(
      <WorkoutCalibration
        {...active}
        history={[finishWorkout(session, 3000)]}
      />,
    ),
  );
  expect(text(view)).toContain('45 kg');
  expect(text(view)).toContain('Starting baseline');
});

it('lets a user report a failed attempt at an entered load without marking a set complete', () => {
  const session = updateSet(makeSession(), 0, 0, { weight: '55' });
  const input = props(session);
  input.state = chooseCalibrationPath(
    input.state,
    session.id,
    session.exercises[0].libraryId,
    'help',
  );
  const view = render(<WorkoutCalibration {...input} />);
  expect(titles(view)).toContain("Couldn't complete this load");
  expect(text(view)).toContain('Set 1 · 55 kg');
  act(() =>
    view.root
      .findAllByType(AppButton)
      .find(
        (item: { props: { title: string } }) =>
          item.props.title === "Couldn't complete this load",
      )!
      .props.onPress(),
  );
  expect(input.onFailedAttempt).toHaveBeenCalledWith(
    session.exercises[0].sets[0].id,
  );
  expect(session.exercises[0].sets[0].completedAt).toBeUndefined();
});

it('offers continued calibration or the current load for today after three attempts without a hard cap', () => {
  let session = makeSession();
  let state = chooseCalibrationPath(
    initialCalibrationState(),
    session.id,
    session.exercises[0].libraryId,
    'known',
  );
  for (let index = 0; index < 3; index += 1) {
    session = toggleSet(
      updateSet(session, 0, index, { weight: '40', reps: '8' }),
      0,
      index,
      2000 + index,
    ).session;
    state = recordCalibrationFeedback(
      state,
      session,
      session.exercises[0].libraryId,
      session.exercises[0].sets[index].id,
      'hard',
    );
  }
  const input = { ...props(session), state };
  const view = render(<WorkoutCalibration {...input} />);
  expect(titles(view)).toContain('Continue calibrating');
  expect(titles(view)).toContain('Use current load for today');
  act(() =>
    view.root
      .findAllByType(AppButton)
      .find(
        (item: { props: { title: string } }) =>
          item.props.title === 'Use current load for today',
      )!
      .props.onPress(),
  );
  expect(input.onChoose).toHaveBeenCalledWith('use-today');
});

it.each(['push-up', 'assisted-pull-up'])(
  'does not show kilogram calibration for %s',
  (exerciseId) => {
    const view = render(
      <WorkoutCalibration {...props(makeSession(exerciseId))} />,
    );
    expect(titles(view)).toEqual([]);
  },
);
