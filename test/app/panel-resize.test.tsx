import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { ResizeHandle } from '@ui/components/resize-handle';
import { usePanelWidth } from '@ui/hooks';
import {
  BIG_STEP,
  LEFT_MAX,
  LEFT_MIN,
  LEFT_WIDTH_KEY,
  STEP,
  clampWidth,
  maxWidthFor,
  parseStoredWidth,
  widthForDrag,
  widthForKey,
} from '@ui/panel-resize-logic';
import type { StorageLike } from '@ui/storage';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('panel width logic', () => {
  test('clamps to the allowed range and to whole pixels', () => {
    expect(clampWidth(100)).toBe(LEFT_MIN);
    expect(clampWidth(9999)).toBe(LEFT_MAX);
    expect(clampWidth(300.6)).toBe(301);
    expect(clampWidth(Number.NaN)).toBe(LEFT_MIN);
    expect(clampWidth(500, 400)).toBe(400);
    expect(clampWidth(500, 100)).toBe(LEFT_MIN);
  });

  test('never lets the panel take more than 45% of the viewport', () => {
    expect(maxWidthFor(1000)).toBe(450);
    expect(maxWidthFor(2000)).toBe(LEFT_MAX);
    expect(maxWidthFor(400)).toBe(LEFT_MIN);
    expect(maxWidthFor(Number.NaN)).toBe(LEFT_MAX);
  });

  test('reads a saved width only when it looks like one', () => {
    expect(parseStoredWidth('320')).toBe(320);
    expect(parseStoredWidth('9999')).toBe(LEFT_MAX);
    expect(parseStoredWidth('12')).toBe(LEFT_MIN);
    for (const bad of [null, '', 'abc', '-300', '3e2', '300px', '1'])
      expect(parseStoredWidth(bad)).toBeUndefined();
  });

  test('keys nudge, jump and are ignored when they mean nothing', () => {
    expect(widthForKey('ArrowRight', 300, LEFT_MAX)).toBe(300 + STEP);
    expect(widthForKey('ArrowLeft', 300, LEFT_MAX)).toBe(300 - STEP);
    expect(widthForKey('ArrowRight', 300, LEFT_MAX, true)).toBe(300 + BIG_STEP);
    expect(widthForKey('Home', 400, LEFT_MAX)).toBe(LEFT_MIN);
    expect(widthForKey('End', 300, 480)).toBe(480);
    expect(widthForKey('ArrowLeft', LEFT_MIN, LEFT_MAX)).toBe(LEFT_MIN);
    expect(widthForKey('ArrowRight', 550, 560)).toBe(560);
    expect(widthForKey('a', 300, LEFT_MAX)).toBeUndefined();
  });

  test('a drag moves the width by how far the pointer moved, within limits', () => {
    expect(widthForDrag(300, 50, LEFT_MAX)).toBe(350);
    expect(widthForDrag(300, -500, LEFT_MAX)).toBe(LEFT_MIN);
    expect(widthForDrag(300, 900, 420)).toBe(420);
  });
});

describe('usePanelWidth', () => {
  let host: HTMLDivElement;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });
  afterEach(() => {
    act(() => render(null, host));
    host.remove();
  });

  function mount(storage: StorageLike) {
    const seen: { current: ReturnType<typeof usePanelWidth> | undefined } = { current: undefined };
    const Probe = () => {
      seen.current = usePanelWidth(storage);
      return null;
    };
    act(() => render(<Probe />, host));
    return seen;
  }

  test('starts from the saved width, saves on commit, forgets on reset', () => {
    const storage = memoryStorage({ [LEFT_WIDTH_KEY]: '350' });
    const state = mount(storage);
    expect(state.current?.width).toBe(350);

    act(() => state.current?.setWidth(400, false));
    expect(state.current?.width).toBe(400);
    expect(storage.data.get(LEFT_WIDTH_KEY)).toBe('350'); // dragging does not save

    act(() => state.current?.setWidth(410, true));
    expect(storage.data.get(LEFT_WIDTH_KEY)).toBe('410');

    act(() => state.current?.reset());
    expect(state.current?.width).toBeUndefined();
    expect(storage.data.has(LEFT_WIDTH_KEY)).toBe(false);
  });

  test('has no width when nothing is saved, and survives blocked storage', () => {
    expect(mount(memoryStorage()).current?.width).toBeUndefined();
    const blocked: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const state = mount(blocked);
    expect(state.current?.width).toBeUndefined();
    act(() => state.current?.setWidth(300, true));
    expect(state.current?.width).toBe(300);
  });
});

describe('ResizeHandle', () => {
  let host: HTMLDivElement;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });
  afterEach(() => {
    act(() => render(null, host));
    host.remove();
  });

  test('is a labelled vertical separator that moves with the keyboard', () => {
    const changes: number[] = [];
    const commits: number[] = [];
    let resets = 0;
    act(() =>
      render(
        <ResizeHandle
          width={300}
          onChange={(w) => changes.push(w)}
          onCommit={(w) => commits.push(w)}
          onReset={() => resets++}
          label="Resize the birth data panel"
        />,
        host,
      ),
    );
    const sep = host.querySelector('[role=separator]');
    expect(sep?.getAttribute('aria-orientation')).toBe('vertical');
    expect(sep?.getAttribute('aria-label')).toBe('Resize the birth data panel');
    expect(sep?.getAttribute('aria-valuenow')).toBe('300');
    expect(sep?.getAttribute('aria-valuemin')).toBe(String(LEFT_MIN));
    expect(sep?.getAttribute('tabindex')).toBe('0');

    const press = (key: string, shiftKey = false): void => {
      act(() => {
        sep?.dispatchEvent(
          new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
        );
      });
    };
    press('ArrowRight');
    press('ArrowLeft', true);
    press('Home');
    press('x');
    expect(changes).toEqual([300 + STEP, 300 - BIG_STEP, LEFT_MIN]);
    expect(commits).toEqual(changes);

    press('Enter');
    act(() => {
      sep?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    });
    expect(resets).toBe(2);
  });
});
