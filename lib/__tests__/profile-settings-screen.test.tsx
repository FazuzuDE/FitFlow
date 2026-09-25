import App from '../../app/index';
import { ProfileSettings } from '../../components/ProfileSettings';
import { AppButton } from '../../components/AppButton';
import { Dock } from '../../components/Dock';
import { WorkoutTemplates } from '../../components/WorkoutTemplates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultTemplates } from '../workout-catalog';
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

it('shows a truthful Profile and About without fake account or preference controls', async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <ProfileSettings
        templates={defaultTemplates}
        busy={false}
        version="9.4.7"
        createTemplate={jest.fn()}
        updateTemplate={jest.fn()}
        deleteTemplate={jest.fn()}
      />,
    );
  });

  const text = view.root
    .findAllByType(Text)
    .map((node: { props: { children?: string | string[] } }) =>
      Array.isArray(node.props.children)
        ? node.props.children.join('')
        : String(node.props.children ?? ''),
    )
    .join(' ');
  expect(text).toContain('CRESUM');
  expect(text).toContain('Profile');
  expect(text).toContain('WORKOUT');
  expect(text).toContain('Your workouts');
  expect(text).toContain('ABOUT');
  expect(text).toContain('Version 9.4.7');
  expect(text).not.toContain('FitFlow');
  expect(text).not.toContain('Local MVP');
  expect(text).not.toContain('Sign in');
  expect(text).not.toContain('Sync now');
  expect(text).not.toContain('Customize Home');
  expect(view.root.findByType(WorkoutTemplates).props.templates).toEqual(
    defaultTemplates,
  );
  expect(
    view.root
      .findAllByType(AppButton)
      .some(
        (button: { props: { title: string } }) =>
          button.props.title === 'Create Workout',
      ),
  ).toBe(true);
  await act(async () => view.unmount());
});

it('keeps the Profile tab and navigation to Home functional', async () => {
  await AsyncStorage.clear();
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  expect(view.root.findByType(Dock).props.active).toBe('profile');
  expect(JSON.stringify(view.toJSON())).toContain('Your workouts');
  expect(view.root.findByType(WorkoutTemplates)).toBeDefined();
  act(() => view.root.findByType(Dock).props.onChange('home'));
  expect(view.root.findByType(Dock).props.active).toBe('home');
  expect(JSON.stringify(view.toJSON())).toContain('Ready to train?');
  await act(async () => view.unmount());
});
