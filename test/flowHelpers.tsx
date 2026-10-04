import { act, type ReactTestRenderer } from 'react-test-renderer';

export const textContent = (tree: ReactTestRenderer) =>
  JSON.stringify(tree.toJSON());

/** The host node with a testID; screens lower in the stack stay mounted. */
export const host = (tree: ReactTestRenderer, id: string) =>
  tree.root
    .findAll(n => n.props.testID === id && typeof n.type === 'string')
    .at(-1)!;

/** Presses the pressable itself, so disabled states are respected. */
export async function press(tree: ReactTestRenderer, id: string) {
  await act(async () => {
    const target = tree.root
      .findAll(
        n =>
          n.props.testID === id &&
          typeof n.props.onPress === 'function' &&
          n.props.accessibilityRole !== undefined,
      )
      .at(-1);
    if (!target) {
      throw new Error(`Nothing pressable with testID "${id}"`);
    }
    target.props.onPress();
    jest.runOnlyPendingTimers();
  });
}

export async function type(tree: ReactTestRenderer, id: string, text: string) {
  await act(async () => {
    host(tree, id).props.onChangeText(text);
  });
}

/** Completes a HoldButton the way a screen reader would. */
export async function hold(tree: ReactTestRenderer, id: string) {
  await act(async () => {
    tree.root
      .findAll(
        n =>
          n.props.testID === id &&
          typeof n.props.onAccessibilityAction === 'function',
      )
      .at(-1)!
      .props.onAccessibilityAction();
    jest.runOnlyPendingTimers();
  });
}

export async function tick(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}
