import { Modal, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/lib/theme';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';

export function Confirmation({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <SafeAreaView style={s.root}>
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>{title}</Text>
          <GlassCard>
            <Text style={s.body}>{message}</Text>
          </GlassCard>
          {error ? (
            <Text accessibilityRole="alert" style={s.body}>
              {error}
            </Text>
          ) : null}
          <AppButton
            title={busy ? 'Saving…' : confirmLabel}
            disabled={busy}
            onPress={onConfirm}
          />
          <AppButton
            title={cancelLabel}
            disabled={busy}
            secondary
            onPress={onCancel}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.lg },
  title: { ...typography.title1, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textPrimary },
});
