import type { AuthIdentity, AuthRepository } from './auth-repository';

export type AuthSnapshot = {
  status: 'initializing' | 'signed_out' | 'signed_in' | 'error';
  configured: boolean;
  identity: AuthIdentity | null;
  error: string | null;
  busy: 'send' | 'verify' | 'sign_out' | null;
};

function safeError(action: 'send' | 'verify' | 'sign_out'): string {
  if (action === 'verify')
    return 'Code invalid or expired. Try again or resend it.';
  if (action === 'send')
    return 'Could not send the code. Check your connection and try again.';
  return 'Could not sign out. Check your connection and try again.';
}

export class AuthStore {
  private snapshot: AuthSnapshot;
  private listeners = new Set<() => void>();
  private unsubscribe: (() => void) | null = null;
  private disposed = false;
  private revision = 0;

  constructor(private readonly repository: AuthRepository | null) {
    this.snapshot = {
      status: repository ? 'initializing' : 'signed_out',
      configured: !!repository,
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
    if (!this.repository || this.disposed) return;
    if (!this.unsubscribe) {
      this.unsubscribe = this.repository.onAuthChange((identity) => {
        if (this.disposed || this.snapshot.busy === 'sign_out') return;
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
    } catch {
      const message = safeError('send');
      this.publish({ ...this.snapshot, busy: null, error: message });
      throw new Error(message);
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
    } catch {
      const message = safeError('verify');
      this.publish({ ...this.snapshot, busy: null, error: message });
      throw new Error(message);
    }
  }

  async signOut(): Promise<void> {
    if (!this.repository || this.snapshot.busy || this.disposed) return;
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
      const message = safeError('sign_out');
      this.publish({ ...this.snapshot, busy: null, error: message });
      throw new Error(message);
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
