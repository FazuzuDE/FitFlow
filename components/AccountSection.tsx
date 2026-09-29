import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import type { AuthSnapshot } from '@/lib/auth-store';
import { colors, radius, spacing, typography } from '@/lib/theme';

export type AccountSectionProps = {
  snapshot: AuthSnapshot;
  sendEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
};

export function AccountSection({
  snapshot,
  sendEmailOtp,
  verifyEmailOtp,
  signOut,
}: AccountSectionProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'email' | 'code'>('email');
  const [localBusy, setLocalBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState('');
  useEffect(() => {
    if (snapshot.status === 'signed_in') {
      setCode('');
      setMessage('');
      setLocalError('');
    }
  }, [snapshot.status]);

  const busy = localBusy || snapshot.busy !== null;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  async function send(resend: boolean) {
    if (!snapshot.configured || !validEmail || busy) return;
    setLocalBusy(true);
    setLocalError('');
    setMessage('');
    try {
      await sendEmailOtp(email.trim());
      setPhase('code');
      setCode('');
      setMessage(
        resend
          ? 'A new code was sent.'
          : 'Enter the six-digit code from your email.',
      );
    } catch {
      setLocalError(
        'Could not send the code. Check your connection and try again.',
      );
    } finally {
      setLocalBusy(false);
    }
  }
  async function verify() {
    if (code.length !== 6 || busy) return;
    setLocalBusy(true);
    setLocalError('');
    try {
      await verifyEmailOtp(email.trim(), code);
      setCode('');
    } catch {
      setLocalError('Code invalid or expired. Try again or resend it.');
    } finally {
      setLocalBusy(false);
    }
  }
  async function disconnect() {
    if (busy) return;
    setLocalBusy(true);
    setLocalError('');
    try {
      await signOut();
      setPhase('email');
      setCode('');
    } catch {
      setLocalError('Could not sign out. Check your connection and try again.');
    } finally {
      setLocalBusy(false);
    }
  }

  return (
    <GlassCard style={s.card}>
      <Text style={s.title} accessibilityRole="header">
        CRESUM Account
      </Text>
      {snapshot.status === 'initializing' ? (
        <Text style={s.copy}>
          Checking account session… Local workouts remain available.
        </Text>
      ) : null}
      {snapshot.status === 'signed_in' ? (
        <>
          <Text style={s.copy}>
            Connected as {snapshot.identity?.email ?? 'CRESUM user'}
          </Text>
          <Text style={s.copy}>Cloud workout backup is not enabled yet.</Text>
          <AppButton
            title="Sign Out"
            secondary
            disabled={busy}
            onPress={() => void disconnect()}
          />
        </>
      ) : (
        <>
          <Text style={s.copy}>
            An account is optional. Your workouts stay available offline.
          </Text>
          {!snapshot.configured ? (
            <Text style={s.copy}>
              Email account setup is not available in this build.
            </Text>
          ) : null}
          {snapshot.configured ? (
            <>
              <TextInput
                accessibilityLabel="Email address"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!busy && phase === 'email'}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setCode('');
                  setLocalError('');
                }}
                placeholder="Email address"
                placeholderTextColor={colors.textSecondary}
                style={s.input}
              />
              {phase === 'email' ? (
                <AppButton
                  title="Send code"
                  disabled={!validEmail || busy}
                  onPress={() => void send(false)}
                />
              ) : (
                <>
                  <Text style={s.copy}>
                    Enter the six-digit code sent to {email.trim()}.
                  </Text>
                  <TextInput
                    accessibilityLabel="Six-digit email code"
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    maxLength={6}
                    editable={!busy}
                    value={code}
                    onChangeText={(value) => {
                      setCode(value.replace(/\D/g, '').slice(0, 6));
                      setLocalError('');
                    }}
                    placeholder="6-digit code"
                    placeholderTextColor={colors.textSecondary}
                    style={s.input}
                  />
                  <AppButton
                    title="Verify code"
                    disabled={code.length !== 6 || busy}
                    onPress={() => void verify()}
                  />
                  <AppButton
                    title="Resend code"
                    secondary
                    disabled={busy}
                    onPress={() => void send(true)}
                  />
                  <AppButton
                    title="Change email"
                    secondary
                    disabled={busy}
                    onPress={() => {
                      setPhase('email');
                      setCode('');
                      setMessage('');
                    }}
                  />
                </>
              )}
            </>
          ) : null}
          <Text style={s.copy}>Apple sign-in is not configured yet.</Text>
          <AppButton
            title="Continue with Apple"
            secondary
            disabled
            onPress={() => {}}
          />
          <Text style={s.copy}>Google sign-in is not configured yet.</Text>
          <AppButton
            title="Continue with Google"
            secondary
            disabled
            onPress={() => {}}
          />
        </>
      )}
      {message ? (
        <Text accessibilityRole="alert" style={s.copy}>
          {message}
        </Text>
      ) : null}
      {localError || snapshot.error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {localError || snapshot.error}
        </Text>
      ) : null}
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { ...typography.title3, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
  },
});
