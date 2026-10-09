/**
 * Sign-in. Mocked so the flow can be walked end to end.
 *
 * TODO(devs): phone OTP (e.g. Firebase Auth / MSG91), email OTP, Google
 * Sign-In and Sign in with Apple (required on iOS once Google is offered). Keep these signatures; screens only call these.
 * On Android, read the code automatically with the SMS Retriever API.
 */
const wait = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

export const auth = {
  /**
   * Sends a 6-digit code to a phone number ("91…", by SMS) or an email
   * address. Resolves when it is on its way.
   */
  async sendCode(_to: string): Promise<void> {
    await wait(400);
  },
  /** True when the code matches. The mock accepts any 6 digits. */
  async verify(_to: string, code: string): Promise<boolean> {
    await wait(400);
    return /^\d{6}$/.test(code);
  },
  async google(): Promise<{ email: string }> {
    await wait(400);
    return { email: 'you@gmail.com' };
  },
  async apple(): Promise<{ email: string }> {
    await wait(400);
    return { email: 'you@privaterelay.appleid.com' };
  },
};
