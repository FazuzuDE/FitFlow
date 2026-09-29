import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type User } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import type { AuthIdentity, AuthRepository } from './auth-repository';

export const AUTH_STORAGE_KEY = 'cresum_auth_v1';

function identity(user: User | null | undefined): AuthIdentity | null {
  return user ? { id: user.id, email: user.email ?? null } : null;
}

export function createSupabaseAuthRepository(
  config: {
    url?: string;
    publishableKey?: string;
  } = {},
): AuthRepository | null {
  const url = config.url?.trim();
  const publishableKey = config.publishableKey?.trim();
  if (!url || !publishableKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname) return null;
  } catch {
    return null;
  }

  const supabase = createClient(url, publishableKey, {
    auth: {
      storage: AsyncStorage,
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  const appStateSubscription =
    Platform.OS === 'web'
      ? null
      : AppState.addEventListener('change', (state) => {
          if (state === 'active') supabase.auth.startAutoRefresh();
          else supabase.auth.stopAutoRefresh();
        });
  let disposed = false;
  return {
    async getIdentity() {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return identity(data.session?.user);
    },
    onAuthChange(listener) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!disposed) listener(identity(session?.user));
      });
      return () => data.subscription.unsubscribe();
    },
    async sendEmailOtp(email) {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    },
    async verifyEmailOtp(email, code) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });
      if (error) throw error;
      const verified = identity(data.user ?? data.session?.user);
      if (!verified) throw new Error('No verified session');
      return verified;
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      appStateSubscription?.remove();
      supabase.auth.stopAutoRefresh();
    },
  };
}
