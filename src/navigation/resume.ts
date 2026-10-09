import { inProgress } from '../core/home';
import { useBook } from '../core/store';
import { useProfile } from '../features/account/store';
import type { RootStackParamList } from './types';

type Resume = {
  [K in keyof RootStackParamList]: { name: K; params?: RootStackParamList[K] };
}[keyof RootStackParamList];

/**
 * Where someone should land when the app opens: a broken vow first, then
 * sign-in, a running session, and an unfinished setup. Everything else is
 * Home, which works out the one next thing itself.
 */
export function resumeRoute(): Resume {
  const profile = useProfile.getState();
  const book = useBook.getState();
  if (profile.brokenAt) {
    return { name: 'Lockout' };
  }
  if (!profile.account) {
    return { name: 'SignIn' };
  }
  const running = inProgress(book);
  if (running) {
    return { name: 'InProgress', params: { id: running.id } };
  }
  if (!book.welcomed) {
    return { name: 'Welcome' };
  }
  if (book.setup === 'vow') {
    return { name: 'Pratigya' };
  }
  if (book.setup === 'plan') {
    return { name: 'Plan', params: { first: true } };
  }
  if (book.setup !== 'done') {
    return { name: 'Setup', params: { step: book.setup } };
  }
  return { name: 'Home' };
}
