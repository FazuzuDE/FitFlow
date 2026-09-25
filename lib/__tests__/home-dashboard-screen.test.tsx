import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Dock } from '../../components/Dock';
import { GlassCard } from '../../components/GlassCard';
import { DashboardGrid } from '../../components/DashboardGrid';
import { Workout } from '../../components/Workout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import { startWorkout } from '../workout-engine';
import type { WorkoutSession } from '../workout-model';
import { STATE_KEY } from '../workout-repository';
import { isPressable } from './pressable';
import { completeOnboardingForTest } from './onboarding-fixture';
import { Text } from 'react-native';

const { act, create } = jest.requireActual('react-test-renderer');

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));

const renderApp = async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  return view;
};
type RenderedNode = string | number | { children?: RenderedNode[] } | null;
const flattenText = (node: RenderedNode): string => {
  if (node === null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return (node.children ?? []).map(flattenText).join('');
};
const visibleText = (view: ReturnType<typeof create>) =>
  flattenText(view.toJSON());
const button = (view: ReturnType<typeof create>, title: string) =>
  view.root
    .findAllByType(AppButton)
    .find((node: { props: { title: string } }) => node.props.title === title);

const completed = (
  id: string,
  name: string,
  finishedAt: number,
  weight: string,
  reps: string,
): WorkoutSession => ({
  id,
  templateId: 'upper',
  name,
  startedAt: finishedAt - 60_000,
  finishedAt,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [
    {
      id: `${id}-exercise`,
      libraryId: 'barbell-bench-press',
      name: 'Barbell Bench Press',
      muscle: 'Chest',
      sets: [
        {
          id: `${id}-set`,
          weight,
          reps,
          completedAt: finishedAt - 1000,
        },
      ],
    },
  ],
});

it('renders the established Home modules in stable grid order', async () => {
  await AsyncStorage.clear();
  await completeOnboardingForTest();
  const view = await renderApp();
  const grid = view.root.findByType(DashboardGrid);
  expect(grid.props.items.map((item: { id: string }) => item.id)).toEqual([
    'primary',
    'summary',
    'latest',
    'templates',
  ]);
  expect(
    grid.props.items.every((item: { size: string }) => item.size === 'medium'),
  ).toBe(true);
  expect(visibleText(view)).toContain('Ready to train?');
  await act(async () => view.unmount());
});

it('shows CRESUM, a prominent template action, and truthful empty training stats', async () => {
  await AsyncStorage.clear();
  await completeOnboardingForTest();
  const view = await renderApp();

  expect(visibleText(view)).toContain('CRESUM');
  expect(visibleText(view)).not.toContain('FITFLOW CORE');
  expect(visibleText(view)).toContain('No completed workouts yet');
  expect(visibleText(view)).toContain('TOTAL VOLUME');
  expect(button(view, 'Start Upper Body')).toBeDefined();
  expect(view.root.findByType(Dock).props.active).toBe('home');

  await act(async () => button(view, 'Start Upper Body')!.props.onPress());
  expect(view.root.findByType(Workout).props.session.templateId).toBe('upper');
  act(() => view.unmount());
});

it('shows factual totals and the latest saved workout even when History is out of order', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [
        completed('older', 'Older workout', 1_700_000_000_000, '60', '8'),
        completed('newer', 'Latest workout', 1_700_000_100_000, '0', '8'),
      ],
      templates: defaultTemplates,
    }),
  );
  const view = await renderApp();
  const text = visibleText(view);

  expect(text).toContain('2 completed workouts');
  expect(text).toContain('480 kg');
  expect(text).toContain('Latest workout');
  expect(text).toContain('0 kg');
  act(() => view.unmount());
});

it('uses a truthful singular summary after the first completed workout', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [
        completed('first', 'First workout', 1_700_000_000_000, '60', '8'),
      ],
      templates: defaultTemplates,
    }),
  );
  const view = await renderApp();

  expect(visibleText(view)).toContain('1 completed workout · saved locally');
  expect(visibleText(view)).not.toContain('1 completed workouts');
  act(() => view.unmount());
});

it('keeps Resume dominant for an active workout without starting another session', async () => {
  await AsyncStorage.clear();
  const active = startWorkout(defaultTemplates[0], exerciseLibrary, 1000);
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: active,
      history: [],
      templates: defaultTemplates,
    }),
  );
  const view = await renderApp();
  const firstCard = view.root.findAllByType(GlassCard)[0];

  expect(firstCard.findAllByType(AppButton)[0].props.title).toBe(
    'Resume Upper Body',
  );
  expect(button(view, 'Start Upper Body')).toBeUndefined();
  const secondaryStart = view.root
    .findAll(isPressable)
    .find(
      (node: { props: { accessibilityLabel?: string } }) =>
        node.props.accessibilityLabel === 'Start Push Day',
    );
  expect(secondaryStart?.props.disabled).toBe(true);
  expect(secondaryStart?.props.accessibilityState.disabled).toBe(true);
  expect(secondaryStart?.props.onPress).toBeUndefined();
  expect(visibleText(view)).toContain(
    'Finish your current workout to start another.',
  );
  await act(async () => button(view, 'Resume Upper Body')!.props.onPress());
  expect(view.root.findByType(Workout).props.session.id).toBe(active.id);
  act(() => view.unmount());
});

it('keeps full long template names accessible in compact secondary actions', async () => {
  await AsyncStorage.clear();
  const longName = 'Full Body Strength and Conditioning Session for Thursday';
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [],
      templates: [
        defaultTemplates[0],
        { id: 'long', name: longName, exerciseIds: ['barbell-bench-press'] },
      ],
    }),
  );
  const view = await renderApp();

  expect(visibleText(view)).toContain(longName);
  const start = view.root
    .findAll(isPressable)
    .find(
      (node: { props: { accessibilityLabel?: string } }) =>
        node.props.accessibilityLabel === `Start ${longName}`,
    );
  expect(start?.props.accessibilityRole).toBe('button');
  expect(
    start
      ?.findAllByType(Text)
      .some((node: { props: { children: string } }) =>
        node.props.children.includes('Start'),
      ),
  ).toBe(true);
  act(() => view.unmount());
});

it('does not claim templates are missing when saved templates have unavailable exercises', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [],
      templates: [
        {
          id: 'stale',
          name: 'Old template',
          exerciseIds: ['missing-exercise'],
        },
      ],
    }),
  );
  const view = await renderApp();

  expect(visibleText(view)).toContain('No templates with available exercises');
  expect(visibleText(view)).not.toContain('No workout templates available');
  expect(visibleText(view)).toContain('0 available · 1 unavailable');
  const unavailableStart = view.root
    .findAll(isPressable)
    .find(
      (node: { props: { accessibilityLabel?: string } }) =>
        node.props.accessibilityLabel === 'Start Old template',
    );
  expect(unavailableStart?.props.disabled).toBe(true);
  expect(unavailableStart?.props.accessibilityState.disabled).toBe(true);
  expect(unavailableStart?.props.onPress).toBeUndefined();
  act(() => view.unmount());
});
