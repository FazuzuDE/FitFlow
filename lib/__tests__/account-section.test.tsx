import { AccountSection } from '../../components/AccountSection';
import { AppButton } from '../../components/AppButton';
import type { AuthSnapshot } from '../auth-store';
import { Text, TextInput } from 'react-native';

const { act, create } = jest.requireActual('react-test-renderer');
const signedOut: AuthSnapshot = {
  status: 'signed_out',
  configured: true,
  identity: null,
  error: null,
  busy: null,
};
const textOf = (view: ReturnType<typeof create>) =>
  view.root
    .findAllByType(Text)
    .map((node: { props: { children?: unknown } }) =>
      String(node.props.children ?? ''),
    )
    .join(' ');
const button = (view: ReturnType<typeof create>, title: string) =>
  view.root
    .findAllByType(AppButton)
    .find((node: { props: { title: string } }) => node.props.title === title);

it('signedOutAccountIsOptional and providersAreDisabled', async () => {
  const send = jest.fn(async () => {});
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <AccountSection
        snapshot={signedOut}
        sendEmailOtp={send}
        verifyEmailOtp={jest.fn()}
        signOut={jest.fn()}
      />,
    );
  });
  expect(textOf(view)).toContain('optional');
  expect(button(view, 'Continue with Apple')?.props.disabled).toBe(true);
  expect(button(view, 'Continue with Google')?.props.disabled).toBe(true);
  expect(button(view, 'Send code')?.props.disabled).toBe(true);
  act(() =>
    view.root.findByType(TextInput).props.onChangeText('person@example.com'),
  );
  await act(async () => button(view, 'Send code')?.props.onPress());
  expect(send).toHaveBeenCalledWith('person@example.com');
  expect(textOf(view)).toContain('Enter the six-digit code');
  expect(textOf(view)).not.toContain('Connected');
  await act(async () => view.unmount());
});

it('otpSendIsNotAuthentication and invalidCodeKeepsResend', async () => {
  const send = jest.fn(async () => {});
  const verify = jest.fn(async () => {
    throw new Error('Invalid code');
  });
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <AccountSection
        snapshot={signedOut}
        sendEmailOtp={send}
        verifyEmailOtp={verify}
        signOut={jest.fn()}
      />,
    );
  });
  act(() =>
    view.root.findByType(TextInput).props.onChangeText('person@example.com'),
  );
  await act(async () => button(view, 'Send code')?.props.onPress());
  expect(button(view, 'Verify code')?.props.disabled).toBe(true);
  act(() => view.root.findAllByType(TextInput)[1].props.onChangeText('123456'));
  await act(async () => button(view, 'Verify code')?.props.onPress());
  expect(verify).toHaveBeenCalledWith('person@example.com', '123456');
  expect(button(view, 'Resend code')).toBeDefined();
  expect(textOf(view)).not.toContain('Connected');
  await act(async () => button(view, 'Resend code')?.props.onPress());
  expect(send).toHaveBeenCalledTimes(2);
  await act(async () => view.unmount());
});

it('signedInNeverClaimsSync', async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <AccountSection
        snapshot={{
          ...signedOut,
          status: 'signed_in',
          identity: { id: '1', email: 'person@example.com' },
        }}
        sendEmailOtp={jest.fn()}
        verifyEmailOtp={jest.fn()}
        signOut={jest.fn()}
      />,
    );
  });
  expect(textOf(view)).toContain('person@example.com');
  expect(textOf(view)).toContain('Cloud workout backup is not enabled yet');
  expect(textOf(view)).not.toContain('Synced');
  expect(button(view, 'Sign Out')).toBeDefined();
  await act(async () => view.unmount());
});
