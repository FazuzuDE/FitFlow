import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { moveWorkoutExercise, setCurrentExercise } from '@/lib/workout-engine';
import {
  isSetComplete,
  WorkoutExercise,
  WorkoutSession,
} from '@/lib/workout-model';
import { cardShadow, colors, radius, spacing, typography } from '@/lib/theme';
import type { ProgramScroll } from './useProgramScroll';

type Update = (transform: (session: WorkoutSession) => WorkoutSession) => void;
type Layout = { y: number; height: number; width: number };
type Drag = {
  id: string;
  from: number;
  target: number;
  translation: number;
  scroll: number;
  layouts: Layout[];
  order: string[];
};
type DragPosition = Pick<Drag, 'id' | 'from' | 'target'> & { height: number };
const lightHaptic = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

// Keyed by session/current snapshot in Workout: selecting/progressing collapses,
// but changing the same snapshot's index by reordering keeps the program open.
export function WorkoutProgram({
  session,
  busy,
  update,
  scroll,
}: {
  session: WorkoutSession;
  busy: boolean;
  update: Update;
  scroll: ProgramScroll;
}) {
  const [expanded, setExpanded] = useState(false);
  const suppressTapRef = useRef(0);
  const index = session.currentExerciseIndex;
  const exercise = session.exercises[index];
  return (
    <>
      <View style={s.top}>
        <Text style={s.position}>
          {exercise.muscle} · Exercise {index + 1} of {session.exercises.length}
        </Text>
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse exercises' : 'All exercises'}
          accessibilityState={{ expanded, disabled: busy }}
          onPress={() => setExpanded((value) => !value)}
          style={({ pressed }) => [s.toggle, (pressed || busy) && s.dim]}
        >
          <Text style={s.toggleText}>
            {expanded ? 'Collapse' : 'All exercises'}
          </Text>
        </Pressable>
      </View>
      {expanded && (
        <ProgramList
          key={String(busy)}
          session={session}
          busy={busy}
          update={update}
          scroll={scroll}
          suppressTapRef={suppressTapRef}
          onSelect={() => setExpanded(false)}
        />
      )}
    </>
  );
}

function ProgramList({
  session,
  busy,
  update,
  scroll,
  suppressTapRef,
  onSelect,
}: {
  session: WorkoutSession;
  busy: boolean;
  update: Update;
  scroll: ProgramScroll;
  suppressTapRef: RefObject<number>;
  onSelect: () => void;
}) {
  const orderKey = JSON.stringify(session.exercises.map((item) => item.id));
  const ids = useMemo(() => JSON.parse(orderKey) as string[], [orderKey]);
  const latest = useRef({ update, onSelect });
  useLayoutEffect(() => {
    latest.current = { update, onSelect };
  }, [update, onSelect]);
  const layouts = useRef(new Map<string, Layout>());
  const drag = useRef<Drag | null>(null);
  const mountedRef = useRef(true);
  const [offset] = useState(() => new Animated.Value(0));
  const [position, setPosition] = useState<DragPosition | null>(null);
  const [reduceMotion, setReduceMotion] = useState(true);
  const cancel = useCallback(
    (owner?: string) => {
      if (!mountedRef.current || (owner && drag.current?.id !== owner)) return;
      if (drag.current) suppressTapRef.current = Date.now() + 200;
      drag.current = null;
      scroll.stop();
      offset.setValue(0);
      setPosition(null);
    },
    [offset, scroll, suppressTapRef],
  );
  useEffect(() => {
    mountedRef.current = true;
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduceMotion(value);
      })
      .catch(() => {});
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    const app = AppState.addEventListener('change', (state) => {
      if (state !== 'active') cancel();
    });
    return () => {
      mounted = false;
      mountedRef.current = false;
      motion.remove();
      app.remove();
      if (drag.current) suppressTapRef.current = Date.now() + 200;
      drag.current = null;
      scroll.stop();
      offset.setValue(0);
    };
  }, [cancel, offset, scroll, suppressTapRef]);
  const move = useCallback(() => {
    const held = drag.current;
    if (!held) return;
    const source = held.layouts[held.from];
    const first = held.layouts[0];
    const last = held.layouts.at(-1)!;
    const origin = source.y + source.height / 2;
    scroll.range(
      first.y + first.height / 2 - origin - held.translation,
      last.y + last.height / 2 - origin - held.translation,
    );
    const delta = Math.max(
      first.y + first.height / 2 - origin,
      Math.min(
        last.y + last.height / 2 - origin,
        held.translation + held.scroll,
      ),
    );
    const center = origin + delta;
    let target = held.from;
    held.layouts.forEach((layout, index) => {
      const middle = layout.y + layout.height / 2;
      if (index < held.from && center <= middle)
        target = Math.min(target, index);
      if (index > held.from && center >= middle)
        target = Math.max(target, index);
    });
    offset.setValue(delta);
    if (target !== held.target) {
      held.target = target;
      setPosition({
        id: held.id,
        from: held.from,
        target,
        height: source.height,
      });
    }
  }, [offset, scroll]);
  const start = useCallback(
    (id: string, absoluteY: number) => {
      if (
        !mountedRef.current ||
        busy ||
        drag.current ||
        AppState.currentState === 'background' ||
        AppState.currentState === 'inactive'
      )
        return;
      const measured = ids.map((item) => layouts.current.get(item));
      if (measured.some((item) => !item)) return;
      const from = ids.indexOf(id);
      suppressTapRef.current = Infinity;
      drag.current = {
        id,
        from,
        target: from,
        translation: 0,
        scroll: 0,
        layouts: measured as Layout[],
        order: ids,
      };
      setPosition({ id, from, target: from, height: measured[from]!.height });
      lightHaptic();
      scroll.start(
        absoluteY,
        (delta) => {
          if (drag.current) {
            drag.current.scroll = delta;
            move();
          }
        },
        cancel,
      );
      move();
      AccessibilityInfo.announceForAccessibility(
        'Move exercise up or down, then release.',
      );
    },
    [busy, cancel, ids, move, scroll, suppressTapRef],
  );
  const change = useCallback(
    (owner: string, translation: number, absoluteY: number) => {
      if (!mountedRef.current || drag.current?.id !== owner) return;
      drag.current.translation = translation;
      scroll.finger(absoluteY);
      move();
    },
    [move, scroll],
  );
  const commit = useCallback(
    (owner: string, success: boolean) => {
      const held = drag.current;
      if (!mountedRef.current || !held || held.id !== owner) return;
      if (success && !busy && held.from !== held.target) {
        latest.current.update((current) => {
          if (
            current.id !== session.id ||
            current.exercises.length !== held.order.length ||
            current.exercises.some(
              (item, index) => item.id !== held.order[index],
            )
          )
            return current;
          return moveWorkoutExercise(current, held.id, held.target);
        });
        AccessibilityInfo.announceForAccessibility(
          `Exercise moved to position ${held.target + 1} of ${ids.length}.`,
        );
      }
      cancel();
    },
    [busy, cancel, ids, session.id],
  );
  const select = useCallback(
    (id: string, nonPointer = false) => {
      if (
        !mountedRef.current ||
        busy ||
        drag.current ||
        (!nonPointer && suppressTapRef.current > Date.now())
      )
        return;
      latest.current.update((current) =>
        setCurrentExercise(
          current,
          current.exercises.findIndex((item) => item.id === id),
        ),
      );
      latest.current.onSelect();
    },
    [busy, suppressTapRef],
  );
  const accessibleMove = useCallback(
    (id: string, direction: number) => {
      if (!mountedRef.current || busy || drag.current) return;
      const target = ids.indexOf(id) + direction;
      if (target < 0 || target >= ids.length) return;
      latest.current.update((current) =>
        current.id === session.id
          ? moveWorkoutExercise(current, id, target)
          : current,
      );
      lightHaptic();
      AccessibilityInfo.announceForAccessibility(
        `Exercise moved to position ${target + 1} of ${ids.length}.`,
      );
    },
    [busy, ids, session.id],
  );
  const resetTap = useCallback(() => {
    if (!drag.current) suppressTapRef.current = 0;
  }, [suppressTapRef]);
  const measure = useCallback(
    (id: string, layout: Layout) => {
      const previous = layouts.current.get(id);
      if (
        drag.current &&
        previous &&
        (previous.width !== layout.width ||
          previous.height !== layout.height ||
          previous.y !== layout.y)
      )
        cancel();
      layouts.current.set(id, layout);
    },
    [cancel],
  );
  return (
    <View style={s.program}>
      {session.exercises.map((item, index) => {
        let shift = 0;
        if (position && position.id !== item.id) {
          const distance = position.height + spacing.xs;
          if (index > position.from && index <= position.target)
            shift = -distance;
          if (index < position.from && index >= position.target)
            shift = distance;
        }
        return (
          <ProgramRow
            key={item.id}
            item={item}
            index={index}
            count={ids.length}
            busy={busy}
            selected={
              session.exercises[session.currentExerciseIndex].id === item.id
            }
            held={position?.id === item.id}
            offset={offset}
            shift={shift}
            reduceMotion={reduceMotion}
            start={start}
            change={change}
            commit={commit}
            cancel={cancel}
            select={select}
            accessibleMove={accessibleMove}
            resetTap={resetTap}
            measure={measure}
          />
        );
      })}
    </View>
  );
}

type RowProps = {
  item: WorkoutExercise;
  index: number;
  count: number;
  busy: boolean;
  selected: boolean;
  held: boolean;
  offset: Animated.Value;
  shift: number;
  reduceMotion: boolean;
  start: (id: string, y: number) => void;
  change: (id: string, delta: number, y: number) => void;
  commit: (id: string, success: boolean) => void;
  cancel: (id?: string) => void;
  select: (id: string, nonPointer?: boolean) => void;
  accessibleMove: (id: string, direction: number) => void;
  resetTap: () => void;
  measure: (id: string, layout: Layout) => void;
};
function ProgramRow({
  item,
  index,
  count,
  busy,
  selected,
  held,
  offset,
  shift,
  reduceMotion,
  start,
  change,
  commit,
  cancel,
  select,
  accessibleMove,
  resetTap,
  measure,
}: RowProps) {
  const [rotation] = useState(() => new Animated.Value(0));
  const [displaced] = useState(() => new Animated.Value(0));
  useLayoutEffect(() => {
    displaced.stopAnimation();
    displaced.setValue(0);
  }, [displaced, index]);
  useEffect(() => {
    if (!held || reduceMotion) {
      rotation.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(rotation, {
          toValue: -1,
          duration: 110,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
      rotation.setValue(0);
    };
  }, [held, reduceMotion, rotation]);
  useEffect(() => {
    if (reduceMotion) {
      displaced.setValue(shift);
      return;
    }
    const animation = Animated.timing(displaced, {
      toValue: shift,
      duration: 140,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [displaced, reduceMotion, shift]);
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!busy && count > 1)
        .maxPointers(1)
        .activateAfterLongPress(450)
        .runOnJS(true)
        .onTouchesDown(resetTap)
        .onStart((event) => start(item.id, event.absoluteY))
        .onUpdate((event) =>
          change(item.id, event.translationY, event.absoluteY),
        )
        .onEnd((_event, success) => commit(item.id, success))
        .onFinalize(() => cancel(item.id)),
    [busy, cancel, change, commit, count, item.id, resetTap, start],
  );
  const complete = item.sets.length > 0 && item.sets.every(isSetComplete);
  return (
    <Animated.View
      testID={`program-row-${item.id}`}
      onLayout={(event) => measure(item.id, event.nativeEvent.layout)}
      style={[
        {
          transform: [{ translateY: held ? offset : displaced }],
          zIndex: held ? 1 : 0,
        },
        held && cardShadow,
      ]}
    >
      <GestureDetector gesture={gesture}>
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Select exercise ${index + 1}: ${item.name}${complete ? ', completed' : ''}`}
          accessibilityHint="Hold and drag to reorder, or use Move up and Move down actions."
          accessibilityState={{ selected, disabled: busy }}
          accessibilityActions={
            busy
              ? []
              : [
                  ...(index > 0 ? [{ name: 'moveUp', label: 'Move up' }] : []),
                  ...(index < count - 1
                    ? [{ name: 'moveDown', label: 'Move down' }]
                    : []),
                ]
          }
          onAccessibilityAction={(event) => {
            const action = event.nativeEvent.actionName;
            if (action === 'moveUp') accessibleMove(item.id, -1);
            if (action === 'moveDown') accessibleMove(item.id, 1);
            if (action === 'activate') select(item.id, true);
          }}
          onAccessibilityTap={() => select(item.id, true)}
          onPressIn={resetTap}
          onPress={() => select(item.id)}
          style={({ pressed }) => [
            s.item,
            selected && s.selected,
            (busy || (pressed && !held)) && s.dim,
          ]}
        >
          <Animated.View
            style={[
              s.row,
              {
                transform: [
                  {
                    rotate: rotation.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ['-0.6deg', '0.6deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={s.name}>
              {index + 1}. {item.name}
              {complete ? ' ✓' : ''}
            </Text>
            <Ionicons
              name="reorder-two-outline"
              size={20}
              color={colors.textSecondary}
              accessible={false}
            />
          </Animated.View>
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  top: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  position: {
    ...typography.footnote,
    flexShrink: 1,
    color: colors.textSecondary,
  },
  toggle: {
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
  },
  toggleText: { ...typography.footnote, color: colors.textPrimary },
  program: { gap: spacing.xs, marginVertical: spacing.xs },
  item: {
    padding: spacing.sm,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { ...typography.subheadline, color: colors.textPrimary, flex: 1 },
  selected: { backgroundColor: colors.primaryTint },
  dim: { opacity: 0.6 },
});
