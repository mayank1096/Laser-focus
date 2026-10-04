import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Language = 'en' | 'hi';
export type SignInMethod = 'phone' | 'google' | 'apple';
/** Challenge mode climbs levels every day; Self Focus sits when it chooses. */
export type Path = 'challenge' | 'self';
/** The three vows, from gentlest to life-long. */
export type Pratigya = 'abhimanyu' | 'arjun' | 'bhishma';
export type Permission = 'screenTime' | 'focus' | 'notifications';

export interface Account {
  method: SignInMethod;
  /** E.164 without the plus, e.g. "919876543210", for phone sign-in. */
  phone?: string;
  email?: string;
  signedInAt: string;
}

export interface DistractingApp {
  name: string;
  deleted: boolean;
}

interface ProfileData {
  language: Language;
  name: string;
  account: Account | null;
  path: Path | null;
  pratigya: Pratigya | null;
  permissions: Record<Permission, boolean>;
  /** Apps the vow asks to remove. Detected natively; mocked for now. */
  apps: DistractingApp[];
  vowTakenAt: string | null;
  /** Set when a removed app comes back: the app stays closed until fixed. */
  brokenAt: string | null;
  sessionReminders: boolean;
}

interface ProfileActions {
  setLanguage: (language: Language) => void;
  setName: (name: string) => void;
  signIn: (account: Omit<Account, 'signedInAt'>, at: string) => void;
  setPath: (path: Path) => void;
  setPratigya: (pratigya: Pratigya) => void;
  grant: (permission: Permission) => void;
  markAppDeleted: (name: string) => void;
  takeVow: (at: string) => void;
  breakVow: (at: string) => void;
  restoreVow: () => void;
  setSessionReminders: (on: boolean) => void;
  reset: () => void;
}

export type ProfileState = ProfileData & ProfileActions;

/**
 * TODO(devs): replace with the apps actually installed (Android: package
 * manager query; iOS: Screen Time FamilyActivityPicker).
 */
export const MOCK_DISTRACTING_APPS: DistractingApp[] = [
  { name: 'Instagram', deleted: true },
  { name: 'BGMI', deleted: false },
  { name: 'YouTube', deleted: false },
];

const initial: ProfileData = {
  language: 'en',
  name: '',
  account: null,
  path: null,
  pratigya: null,
  permissions: { screenTime: false, focus: false, notifications: false },
  apps: MOCK_DISTRACTING_APPS,
  vowTakenAt: null,
  brokenAt: null,
  sessionReminders: true,
};

export const useProfile = create<ProfileState>()(
  persist(
    set => ({
      ...initial,
      setLanguage: language => set({ language }),
      setName: name => set({ name }),
      signIn: (account, at) => set({ account: { ...account, signedInAt: at } }),
      setPath: path => set({ path }),
      setPratigya: pratigya => set({ pratigya }),
      grant: permission =>
        set(s => ({ permissions: { ...s.permissions, [permission]: true } })),
      markAppDeleted: name =>
        set(s => ({
          apps: s.apps.map(a =>
            a.name === name ? { ...a, deleted: true } : a,
          ),
        })),
      takeVow: at => set({ vowTakenAt: at }),
      breakVow: at => set({ brokenAt: at }),
      restoreVow: () => set({ brokenAt: null }),
      setSessionReminders: sessionReminders => set({ sessionReminders }),
      reset: () => set(initial),
    }),
    {
      name: 'laser-focus/profile',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: s => ({
        language: s.language,
        name: s.name,
        account: s.account,
        path: s.path,
        pratigya: s.pratigya,
        permissions: s.permissions,
        apps: s.apps,
        vowTakenAt: s.vowTakenAt,
        brokenAt: s.brokenAt,
        sessionReminders: s.sessionReminders,
      }),
    },
  ),
);

export const PRATIGYAS: Record<
  Pratigya,
  { name: string; latin: string; tag: string; short: string; asks: string[] }
> = {
  abhimanyu: {
    name: 'अभिमन्यु',
    latin: 'Abhimanyu',
    tag: 'Begin here',
    short: 'Silence every distraction before each session.',
    asks: [
      'Silent mode on before every session',
      'Phone out of sight, in another room',
      'Never bring the phone into your focus corner',
    ],
  },
  arjun: {
    name: 'अर्जुन',
    latin: 'Arjun',
    tag: 'Serious',
    short: 'Delete social media and games. Reinstall one and the app locks.',
    asks: [
      'Delete every social media app',
      'Delete every game',
      'Remove news and entertainment',
      'Never reinstall until the goal is done',
    ],
  },
  bhishma: {
    name: 'भीष्म',
    latin: 'Bhishma',
    tag: 'For life',
    short: 'Browser-only, fixed hours. The vow that is never taken back.',
    asks: [
      'Smartphone off, kept for emergencies only',
      'Or move to a keypad phone',
      'Calls and messages only, at fixed hours',
      'The vow is never taken back',
    ],
  },
};

/** "Aarav Mehta" → "Aarav". */
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';
