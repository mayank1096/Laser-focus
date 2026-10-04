/**
 * Sign-in. Mocked so the flow can be walked end to end.
 *
 * TODO(devs): phone OTP (e.g. Firebase Auth / MSG91), Google Sign-In and
 * Sign in with Apple. Keep these signatures; screens only call these.
 * On Android, read the code automatically with the SMS Retriever API.
 */
const wait = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

export const auth = {
  /** Sends a 6-digit code. Resolves when the SMS is on its way. */
  async sendCode(_phone: string): Promise<void> {
    await wait(400);
  },
  /** True when the code matches. The mock accepts any 6 digits. */
  async verify(_phone: string, code: string): Promise<boolean> {
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
