import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import {
  calibrationAttemptCount,
  calibrationPath,
  feedbackGuidance,
  latestCalibrationFeedback,
  needsCalibration,
  pendingCalibrationSet,
  startingBaseline,
  type CalibrationFeedback,
  type CalibrationPathChoice,
  type CalibrationState,
} from '@/lib/calibration';
import {
  isSetComplete,
  type WorkoutExercise,
  type WorkoutSession,
} from '@/lib/workout-model';
import { colors, spacing, typography } from '@/lib/theme';

export function WorkoutCalibration({
  session,
  exercise,
  history,
  state,
  busy,
  error,
  onChoose,
  onFeedback,
  onFailedAttempt,
  onContinue,
}: {
  session: WorkoutSession;
  exercise: WorkoutExercise;
  history: WorkoutSession[];
  state: CalibrationState;
  busy: boolean;
  error: string;
  onChoose: (choice: CalibrationPathChoice) => void;
  onFeedback: (setId: string, feedback: CalibrationFeedback) => void;
  onFailedAttempt: (setId: string) => void;
  onContinue: () => void;
}) {
  const [continuedAt, setContinuedAt] = useState<string>();
  const exerciseId = exercise.libraryId;
  const baseline = startingBaseline(state, history, exerciseId);
  if (baseline)
    return (
      <GlassCard>
        <Text style={s.title}>Starting baseline</Text>
        <Text style={s.body}>
          {baseline.weight} kg × {baseline.reps} reps
        </Text>
        <Text style={s.sub}>
          Based on your first workout. You can change this anytime.
        </Text>
      </GlassCard>
    );
  if (!needsCalibration(exerciseId, history)) return null;
  const path = calibrationPath(state, session.id, exerciseId);
  if (path === 'use-today') return null;
  const pending = pendingCalibrationSet(
    state,
    session,
    exerciseId,
    exercise.id,
  );
  const attempts = calibrationAttemptCount(state, session, exerciseId);
  const latest = latestCalibrationFeedback(
    state,
    session,
    exerciseId,
    exercise.id,
  );
  const failedSet = exercise.sets.find((set) => {
    const weight = set.weight.replace(',', '.').trim();
    return (
      !isSetComplete(set) &&
      /^\d+(\.\d+)?$/.test(weight) &&
      Number.isFinite(Number(weight)) &&
      Number(weight) > 0 &&
      !state.feedback.some(
        (item) =>
          item.sessionId === session.id &&
          item.setId === set.id &&
          item.failedAt !== undefined,
      )
    );
  });
  const repeated =
    attempts >= 3 && continuedAt !== `${session.id}:${exerciseId}:${attempts}`;

  return (
    <GlassCard>
      <Text style={s.title}>Find your starting weight</Text>
      {!path ? (
        <>
          <Text style={s.body}>Have you used {exercise.name} before?</Text>
          <AppButton
            title="I know my usual weight"
            secondary
            disabled={busy}
            onPress={() => onChoose('known')}
          />
          <AppButton
            title="Help me find a starting weight"
            secondary
            disabled={busy}
            onPress={() => onChoose('help')}
          />
        </>
      ) : (
        <>
          <Text style={s.body}>
            {path === 'help'
              ? 'Start light. Choose a weight you can comfortably control, then enter the actual value shown on your equipment. This is part of your normal workout.'
              : 'Enter your approximate usual weight in the set below. It is a starting reference, not a proven baseline. You can change it exactly.'}
          </Text>
          {pending ? (
            <>
              <Text style={s.title}>How did that feel?</Text>
              <Text style={s.sub}>
                Set{' '}
                {exercise.sets.findIndex((set) => set.id === pending.id) + 1} ·{' '}
                {pending.weight} kg × {pending.reps} reps
              </Text>
              <View style={s.choices}>
                {(['too-easy', 'good', 'hard', 'too-hard'] as const).map(
                  (feedback) => (
                    <AppButton
                      key={feedback}
                      title={
                        {
                          'too-easy': 'Too easy',
                          good: 'Good',
                          hard: 'Hard',
                          'too-hard': 'Too hard',
                        }[feedback]
                      }
                      secondary
                      disabled={busy}
                      onPress={() => onFeedback(pending.id, feedback)}
                    />
                  ),
                )}
              </View>
            </>
          ) : latest ? (
            <Text style={s.sub}>{feedbackGuidance(latest)}</Text>
          ) : (
            <Text style={s.sub}>
              Complete an actual set, then tell CRESUM how it felt.
            </Text>
          )}
          {failedSet && !pending ? (
            <>
              <Text style={s.sub}>
                Set{' '}
                {exercise.sets.findIndex((set) => set.id === failedSet.id) + 1}{' '}
                · {failedSet.weight} kg
              </Text>
              <AppButton
                title="Couldn't complete this load"
                secondary
                disabled={busy}
                onPress={() => onFailedAttempt(failedSet.id)}
              />
            </>
          ) : null}
          {repeated && !pending ? (
            <>
              <Text style={s.sub}>
                You can keep trying or use the current load for today. No
                increase is required.
              </Text>
              <AppButton
                title="Continue calibrating"
                secondary
                disabled={busy}
                onPress={() => {
                  setContinuedAt(`${session.id}:${exerciseId}:${attempts}`);
                  onContinue();
                }}
              />
              <AppButton
                title="Use current load for today"
                secondary
                disabled={busy}
                onPress={() => onChoose('use-today')}
              />
            </>
          ) : null}
        </>
      )}
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      ) : null}
    </GlassCard>
  );
}

const s = StyleSheet.create({
  title: { ...typography.headline, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textPrimary },
  sub: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
  choices: { gap: spacing.xs },
});
