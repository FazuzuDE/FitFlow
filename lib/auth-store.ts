import type { AuthIdentity, AuthRepository } from './auth-repository';

export type AuthSnapshot = {
  status: 'initializing' | 'signed_out' | 'signed_in' | 'error';
  configured: boolean;
  identity: AuthIdentity | null;
  error: string | null;
  busy: 'send' | 'verify' | 'sign_out' | null;
};

export class AuthActionError extends Error {}

function safeError(
  action: 'send' | 'verify' | 'sign_out',
  cause?: unknown,
): string {
  const details =
    cause && typeof cause === 'object'
      ? (cause as { status?: unknown; code?: unknown; name?: unknown })
      : null;
  if (details?.status === 429 || details?.code === 'over_request_rate_limit')
    return 'Too many requests. Please wait before trying again.';
  if (
    details?.name === 'AuthRetryableFetchError' ||
    details?.name === 'TypeError' ||
    (typeof details?.status === 'number' && details.status >= 500)
  )
    return 'Could not connect to sign-in service. Check your connection and try again.';
  if (action === 'verify')
    return 'Code invalid or expired. Try again or resend it.';
  if (action === 'send') return 'Could not send the code. Try again.';
  return 'Could not sign out. Check your connection and try again.';
}

export class AuthStore {
  private snapshot: AuthSnapshot;
  private listeners = new Set<() => void>();
  private unsubscribe: (() => void) | null = null;
  private disposed = false;
  private revision = 0;
  private signedOutDuringRequest = false;
  private repository: AuthRepository | null;
  private factoryResolved = false;

  constructor(
    private readonly source:
      AuthRepository | null | (() => AuthRepository | null),
  ) {
    this.repository = typeof source === 'function' ? null : source;
    this.snapshot = {
      status: source ? 'initializing' : 'signed_out',
      configured: !!this.repository,
      identity: null,
      error: null,
      busy: null,
    };
  }

  getSnapshot = (): AuthSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private publish(next: AuthSnapshot): void {
    if (this.disposed) return;
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }

  async initialize(): Promise<void> {
    if (this.disposed) return;
    if (typeof this.source === 'function' && !this.factoryResolved) {
      this.factoryResolved = true;
      try {
        this.repository = this.source();
      } catch {
        this.publish({
          ...this.snapshot,
          status: 'error',
          error:
            'Account setup is unavailable. Local workouts remain available.',
        });
        return;
      }
      this.publish({
        ...this.snapshot,
        configured: !!this.repository,
        status: this.repository ? 'initializing' : 'signed_out',
      });
    }
    if (!this.repository) return;
    if (!this.unsubscribe) {
      this.unsubscribe = this.repository.onAuthChange((identity) => {
        if (this.disposed) return;
        if (this.snapshot.busy === 'sign_out') {
          if (!identity) this.signedOutDuringRequest = true;
          return;
        }
        this.revision++;
        this.publish({
          ...this.snapshot,
          status: identity ? 'signed_in' : 'signed_out',
          identity,
          error: null,
        });
      });
    }
    const revision = this.revision;
    try {
      const identity = await this.repository.getIdentity();
      if (this.revision === revision) {
        this.publish({
          ...this.snapshot,
          status: identity ? 'signed_in' : 'signed_out',
          identity,
          error: null,
        });
      }
    } catch {
      if (this.revision === revision) {
        this.publish({
          ...this.snapshot,
          status: 'error',
          error:
            'Could not restore account session. Local workouts remain available.',
        });
      }
    }
  }

  async sendEmailOtp(email: string): Promise<void> {
    if (!this.repository || this.snapshot.busy || this.disposed) return;
    this.publish({ ...this.snapshot, busy: 'send', error: null });
    try {
      await this.repository.sendEmailOtp(email);
      this.publish({ ...this.snapshot, busy: null, error: null });
    } catch (cause) {
      const message = safeError('send', cause);
      this.publish({ ...this.snapshot, busy: null, error: message });
      throw new AuthActionError(message);
    }
  }

  async verifyEmailOtp(email: string, code: string): Promise<void> {
    if (!this.repository || this.snapshot.busy || this.disposed) return;
    this.publish({ ...this.snapshot, busy: 'verify', error: null });
    try {
      const identity = await this.repository.verifyEmailOtp(email, code);
      this.revision++;
      this.publish({
        ...this.snapshot,
        status: 'signed_in',
        identity,
        busy: null,
        error: null,
      });
    } catch (cause) {
      const message = safeError('verify', cause);
      this.publish({ ...this.snapshot, busy: null, error: message });
      throw new AuthActionError(message);
    }
  }

  async signOut(): Promise<void> {
    if (!this.repository || this.snapshot.busy || this.disposed) return;
    this.signedOutDuringRequest = false;
    this.revision++;
    this.publish({ ...this.snapshot, busy: 'sign_out', error: null });
    try {
      await this.repository.signOut();
      this.revision++;
      this.publish({
        ...this.snapshot,
        status: 'signed_out',
        identity: null,
        busy: null,
        error: null,
      });
    } catch {
      const message = this.signedOutDuringRequest
        ? 'Sign out completed on this device, but could not confirm it on other devices.'
        : safeError('sign_out');
      this.publish({
        ...this.snapshot,
        status: this.signedOutDuringRequest
          ? 'signed_out'
          : this.snapshot.status,
        identity: this.signedOutDuringRequest ? null : this.snapshot.identity,
        busy: null,
        error: message,
      });
      throw new AuthActionError(message);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe?.();
    this.repository?.dispose();
    this.listeners.clear();
  }
}
