import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

// Owns only the outer viewport during an active drag. Native scrolling remains
// available before the hold activates; the list has no nested scroll container.
export function useProgramScroll() {
  const ref = useRef<ScrollView>(null);
  const metrics = useRef({
    offset: 0,
    height: 0,
    content: 0,
    top: 0,
    finger: 0,
  });
  const active = useRef<{
    origin: number;
    minimum: number;
    maximum: number;
    moved: (delta: number) => void;
    cancel: () => void;
    timer: ReturnType<typeof setInterval>;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const attachRef = useCallback((instance: ScrollView | null) => {
    ref.current = instance;
  }, []);
  const control = useMemo(() => {
    const stop = () => {
      if (active.current) clearInterval(active.current.timer);
      active.current = null;
      setDragging(false);
    };
    return {
      stop,
      start(y: number, moved: (delta: number) => void, cancel: () => void) {
        stop();
        metrics.current.finger = y;
        setDragging(true);
        const current = {
          origin: metrics.current.offset,
          minimum: -Infinity,
          maximum: Infinity,
          moved,
          cancel,
          timer: setInterval(() => {
            if (active.current !== current) return;
            const m = metrics.current;
            if (!m.height) return;
            const edge = Math.min(64, m.height / 4);
            const local = m.finger - m.top;
            const direction =
              local < edge ? -1 : local > m.height - edge ? 1 : 0;
            if (!direction) return;
            const minimum = Math.max(0, current.origin + current.minimum);
            const maximum = Math.min(
              Math.max(0, m.content - m.height),
              current.origin + current.maximum,
            );
            const proposal =
              direction > 0
                ? Math.min(m.offset + 8, Math.max(m.offset, maximum))
                : Math.max(m.offset - 8, Math.min(m.offset, minimum));
            const next = Math.max(
              0,
              Math.min(Math.max(0, m.content - m.height), proposal),
            );
            if (next === m.offset) return;
            m.offset = next;
            ref.current?.scrollTo({ y: next, animated: false });
            current.moved(next - current.origin);
          }, 32),
        };
        active.current = current;
        ref.current
          ?.getNativeScrollRef()
          ?.measureInWindow((_x, top, _width, height) => {
            if (active.current !== current) return;
            metrics.current.top = top;
            metrics.current.height = height;
          });
      },
      finger(y: number) {
        metrics.current.finger = y;
      },
      range(minimum: number, maximum: number) {
        if (active.current) {
          active.current.minimum = minimum;
          active.current.maximum = maximum;
        }
      },
    };
  }, []);
  useEffect(
    () => () => {
      if (active.current) clearInterval(active.current.timer);
      active.current = null;
    },
    [],
  );
  return {
    attachRef,
    control,
    dragging,
    onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
      metrics.current.offset = event.nativeEvent.contentOffset.y;
      active.current?.moved(metrics.current.offset - active.current.origin);
    },
    onLayout() {
      active.current?.cancel();
    },
    onContentSizeChange(_width: number, height: number) {
      metrics.current.content = height;
    },
  };
}
export type ProgramScroll = ReturnType<typeof useProgramScroll>['control'];
