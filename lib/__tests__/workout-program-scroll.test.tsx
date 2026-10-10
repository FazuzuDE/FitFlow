import { View, type ScrollView } from 'react-native';
import { useProgramScroll } from '../../components/useProgramScroll';
const { act, create } = jest.requireActual('react-test-renderer');

it('edge scrolling moves the viewport and reports its displacement, then stops on release', () => {
  jest.useFakeTimers();
  let program!: ReturnType<typeof useProgramScroll>;
  function Harness() {
    program = useProgramScroll();
    return <View />;
  }
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  const positions: number[] = [];
  const deltas: number[] = [];
  // The native viewport measurement/scroll methods are the test boundary.
  const viewport = {
    getNativeScrollRef: () => ({
      measureInWindow: (callback: (...args: number[]) => void) =>
        callback(0, 100, 280, 500),
    }),
    scrollTo: ({ y }: { y: number }) => positions.push(y),
  } as unknown as ScrollView;
  try {
    act(() => program.attachRef(viewport));
    act(() => program.onContentSizeChange(280, 1000));
    act(() =>
      program.control.start(
        590,
        (delta) => deltas.push(delta),
        () => {},
      ),
    );
    act(() => jest.advanceTimersByTime(96));
    expect(positions).toEqual([8, 16, 24]);
    expect(deltas).toEqual([8, 16, 24]);
    expect(program.dragging).toBe(true);
    act(() => program.control.finger(350));
    act(() => jest.advanceTimersByTime(96));
    expect(positions).toEqual([8, 16, 24]);
    act(() => program.control.finger(110));
    act(() => jest.advanceTimersByTime(320));
    expect(positions.at(-1)).toBe(0);
    expect(positions.every((value) => value >= 0)).toBe(true);
    act(() => program.control.stop());
    expect(program.dragging).toBe(false);
    const count = positions.length;
    act(() => jest.advanceTimersByTime(1000));
    expect(positions).toHaveLength(count);
  } finally {
    act(() => view.unmount());
    jest.useRealTimers();
  }
});

it('does not scroll past the content bottom and releases the timer on layout cancellation', () => {
  jest.useFakeTimers();
  let program!: ReturnType<typeof useProgramScroll>;
  function Harness() {
    program = useProgramScroll();
    return <View />;
  }
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  const positions: number[] = [];
  const viewport = {
    getNativeScrollRef: () => ({
      measureInWindow: (callback: (...args: number[]) => void) =>
        callback(0, 100, 280, 500),
    }),
    scrollTo: ({ y }: { y: number }) => positions.push(y),
  } as unknown as ScrollView;
  try {
    act(() => program.attachRef(viewport));
    act(() => program.onContentSizeChange(280, 515));
    act(() =>
      program.control.start(
        590,
        () => {},
        () => program.control.stop(),
      ),
    );
    act(() => jest.advanceTimersByTime(320));
    expect(positions).toEqual([8, 15]);
    act(() => program.onLayout());
    expect(program.dragging).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    act(() => view.unmount());
    jest.useRealTimers();
  }
});
