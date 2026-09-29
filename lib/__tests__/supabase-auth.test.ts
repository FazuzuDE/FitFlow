import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import {
  AUTH_STORAGE_KEY,
  createSupabaseAuthRepository,
} from '../supabase-auth';

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);

const client = jest.mocked(createClient);
const config = {
  url: 'https://example.supabase.co',
  publishableKey: 'sb_publishable_test',
};

function mockClient() {
  const unsubscribe = jest.fn();
  const auth = {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'a@example.com' } } },
      error: null,
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe } },
    }),
    signInWithOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    verifyOtp: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-1', email: 'a@example.com' } },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
  };
  client.mockReturnValue({ auth } as unknown as ReturnType<
    typeof createClient
  >);
  return { auth, unsubscribe };
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('returnsNullWithoutCompletePublicConfig', () => {
  expect(createSupabaseAuthRepository({})).toBeNull();
  expect(createSupabaseAuthRepository({ url: config.url })).toBeNull();
  expect(
    createSupabaseAuthRepository({ publishableKey: config.publishableKey }),
  ).toBeNull();
  expect(
    createSupabaseAuthRepository({
      url: 'not-a-url',
      publishableKey: config.publishableKey,
    }),
  ).toBeNull();
  expect(client).not.toHaveBeenCalled();
});

it('usesIsolatedPersistentAuthStorage', () => {
  mockClient();
  const repository = createSupabaseAuthRepository(config);
  expect(repository).not.toBeNull();
  const options = client.mock.calls[0][2];
  expect(options?.auth?.persistSession).toBe(true);
  expect(options?.auth?.autoRefreshToken).toBe(true);
  expect(options?.auth?.detectSessionInUrl).toBe(false);
  expect(options?.auth?.storageKey).toBe(AUTH_STORAGE_KEY);
  expect(options?.auth?.storage).toBeDefined();
  expect(AUTH_STORAGE_KEY).not.toMatch(/fitflow|workout/i);
  repository?.dispose();
});

it('mapsEmailOtpAndSessionEvents', async () => {
  const { auth, unsubscribe } = mockClient();
  const repository = createSupabaseAuthRepository(config)!;
  expect(await repository.getIdentity()).toEqual({
    id: 'user-1',
    email: 'a@example.com',
  });
  const listener = jest.fn();
  const stop = repository.onAuthChange(listener);
  const callback = auth.onAuthStateChange.mock.calls[0][0];
  callback('SIGNED_OUT', null);
  expect(listener).toHaveBeenCalledWith(null);
  await repository.sendEmailOtp('a@example.com');
  expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: 'a@example.com' });
  expect(await repository.verifyEmailOtp('a@example.com', '123456')).toEqual({
    id: 'user-1',
    email: 'a@example.com',
  });
  expect(auth.verifyOtp).toHaveBeenCalledWith({
    email: 'a@example.com',
    token: '123456',
    type: 'email',
  });
  await repository.signOut();
  stop();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  repository.dispose();
});

it('autoRefreshFollowsAppStateAndDisposes', () => {
  const { auth } = mockClient();
  const remove = jest.fn();
  const spy = jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove });
  const repository = createSupabaseAuthRepository(config)!;
  expect(spy).toHaveBeenCalledTimes(1);
  const onChange = spy.mock.calls[0][1] as (state: string) => void;
  onChange('active');
  expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1);
  onChange('inactive');
  onChange('background');
  expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(2);
  repository.dispose();
  repository.dispose();
  expect(remove).toHaveBeenCalledTimes(1);
  spy.mockRestore();
});
