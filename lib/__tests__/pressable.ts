// React Native 0.86 may expose a different Pressable function reference to
// Jest than the one used by the rendered tree. Match its component identity.
export const isPressable = (node: { type: unknown }) =>
  typeof node.type === 'function' && node.type.name === 'Pressable';
