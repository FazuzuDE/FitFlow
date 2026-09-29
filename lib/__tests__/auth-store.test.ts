import { AuthStore } from '../auth-store';
import type { AuthIdentity, AuthRepository } from '../auth-repository';

const person: AuthIdentity = { id: 'one', email: 'one@example.com' };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function fakeRepository() {
  let listener: ((identity: AuthIdentity | null) => void) | null = null;
  const unsubscribe = jest.fn();
  const repository: AuthRepository = {
    getIdentity: jest.fn(async () => null),
    onAuthChange: jest.fn((next) => {
      listener = next;
      return unsubscribe;
    }),
    sendEmailOtp: jest.fn(async () => {}),
    verifyEmailOtp: jest.fn(async () => person),
    signOut: jest.fn(async () => {}),
    dispose: jest.fn(),
  };
  return {
    repository,
    unsubscribe,
    emit: (value: AuthIdentity | null) => listener?.(value),
  };
}

it('keepsUnconfiguredCoreUsable', async () => {
  const store = new AuthStore(null);
  await store.initialize();
  expect(store.getSnapshot()).toMatchObject({
    status: 'signed_out',
    configured: false,
  });
  store.dispose();
});

it('defersClientCreationUntilMountedInitialization', async () => {
  const fake = fakeRepository();
  const factory = jest.fn(() => fake.repository);
  const abandoned = new AuthStore(factory);
  abandoned.dispose();
  expect(factory).not.toHaveBeenCalled();
  const mounted = new AuthStore(factory);
  await mounted.initialize();
  await mounted.initialize();
  expect(factory).toHaveBeenCalledTimes(1);
  mounted.dispose();
  expect(fake.repository.dispose).toHaveBeenCalledTimes(1);
});

it('restoresIdentityAndRespondsToSessionEvents', async () => {
  const fake = fakeRepository();
  jest.mocked(fake.repository.getIdentity).mockResolvedValue(person);
  const store = new AuthStore(fake.repository);
  expect(store.getSnapshot().status).toBe('initializing');
  await store.initialize();
  expect(store.getSnapshot()).toMatchObject({
    status: 'signed_in',
    identity: person,
  });
  fake.emit(null);
  expect(store.getSnapshot()).toMatchObject({
    status: 'signed_out',
    identity: null,
  });
  store.dispose();
});

it('sendDoesNotSignIn', async () => {
  const fake = fakeRepository();
  const store = new AuthStore(fake.repository);
  await store.initialize();
  await store.sendEmailOtp('one@example.com');
  expect(store.getSnapshot().status).toBe('signed_out');
  expect(store.getSnapshot().identity).toBeNull();
  await store.verifyEmailOtp('one@example.com', '123456');
  expect(store.getSnapshot()).toMatchObject({
    status: 'signed_in',
    identity: person,
  });
  store.dispose();
});

it('ignoresStaleSessionAfterSignOut', async () => {
  const fake = fakeRepository();
  const oldRead = deferred<AuthIdentity | null>();
  jest.mocked(fake.repository.getIdentity).mockReturnValue(oldRead.promise);
  const store = new AuthStore(fake.repository);
  const loading = store.initialize();
  fake.emit(person);
  await store.signOut();
  oldRead.resolve(person);
  await loading;
  expect(store.getSnapshot().identity).toBeNull();
  expect(store.getSnapshot().status).toBe('signed_out');
  store.dispose();
});

it('exposesRecoverableSafeErrorsWithoutFalseSuccess', async () => {
  const fake = fakeRepository();
  const store = new AuthStore(fake.repository);
  await store.initialize();
  jest
    .mocked(fake.repository.verifyEmailOtp)
    .mockRejectedValue(new Error('bad token secret=123456'));
  await expect(
    store.verifyEmailOtp('one@example.com', '123456'),
  ).rejects.toThrow();
  expect(store.getSnapshot().status).toBe('signed_out');
  expect(store.getSnapshot().error).toBeTruthy();
  expect(store.getSnapshot().error).not.toContain('123456');
  jest
    .mocked(fake.repository.sendEmailOtp)
    .mockRejectedValue(new Error('offline secret=123456'));
  await expect(store.sendEmailOtp('one@example.com')).rejects.toThrow();
  expect(store.getSnapshot().status).toBe('signed_out');
  expect(store.getSnapshot().error).not.toContain('123456');
  store.dispose();
});

it('disposesAuthSubscription', async () => {
  const fake = fakeRepository();
  const pending = deferred<AuthIdentity | null>();
  jest.mocked(fake.repository.getIdentity).mockReturnValue(pending.promise);
  const store = new AuthStore(fake.repository);
  const loading = store.initialize();
  store.dispose();
  store.dispose();
  pending.resolve(person);
  await loading;
  fake.emit(person);
  expect(store.getSnapshot().identity).toBeNull();
  expect(fake.unsubscribe).toHaveBeenCalledTimes(1);
  expect(fake.repository.dispose).toHaveBeenCalledTimes(1);
});

it('reflectsLocalSignOutEventEvenIfServerSignOutFails', async () => {
  const fake = fakeRepository();
  jest.mocked(fake.repository.getIdentity).mockResolvedValue(person);
  jest.mocked(fake.repository.signOut).mockImplementation(async () => {
    fake.emit(null);
    throw new Error('server error');
  });
  const store = new AuthStore(fake.repository);
  await store.initialize();
  await expect(store.signOut()).rejects.toThrow();
  expect(store.getSnapshot().status).toBe('signed_out');
  expect(store.getSnapshot().identity).toBeNull();
  expect(store.getSnapshot().error).toMatch(/sign out/i);
  store.dispose();
});
