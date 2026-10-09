import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Language = 'en' | 'hi';
export type SignInMethod = 'phone' | 'email' | 'google' | 'apple';
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
  /** Kept because the user's work needs it, e.g. Instagram for a reel editor. */
  forWork?: boolean;
}

interface ProfileData {
  language: Language;
  /** What the app calls you: "Hey, Mayank". */
  name: string;
  account: Account | null;
  pratigya: Pratigya | null;
  permissions: Record<Permission, boolean>;
  /** Apps the vow asks to remove. Detected natively; mocked for now. */
  apps: DistractingApp[];
  vowTakenAt: string | null;
  /** Set when a removed app comes back: the app stays closed until fixed. */
  brokenAt: string | null;
}

interface ProfileActions {
  setLanguage: (language: Language) => void;
  setName: (name: string) => void;
  signIn: (account: Omit<Account, 'signedInAt'>, at: string) => void;
  setPratigya: (pratigya: Pratigya) => void;
  grant: (permission: Permission) => void;
  markAppDeleted: (name: string) => void;
  setAppForWork: (name: string, forWork: boolean) => void;
  takeVow: (at: string) => void;
  breakVow: (at: string) => void;
  restoreVow: () => void;
  reset: () => void;
}

export type ProfileState = ProfileData & ProfileActions;

/**
 * TODO(devs): replace with the apps actually installed (Android: package
 * manager query; iOS: Screen Time FamilyActivityPicker).
 */
const MOCK_DISTRACTING_APPS: DistractingApp[] = [
  { name: 'Instagram', deleted: true },
  { name: 'BGMI', deleted: false },
  { name: 'YouTube', deleted: false },
];

const initial: ProfileData = {
  language: 'en',
  name: '',
  account: null,
  pratigya: null,
  permissions: { screenTime: false, focus: false, notifications: false },
  apps: MOCK_DISTRACTING_APPS,
  vowTakenAt: null,
  brokenAt: null,
};

export const useProfile = create<ProfileState>()(
  persist(
    set => ({
      ...initial,
      setLanguage: language => set({ language }),
      setName: name => set({ name }),
      signIn: (account, at) => set({ account: { ...account, signedInAt: at } }),
      setPratigya: pratigya => set({ pratigya }),
      grant: permission =>
        set(s => ({ permissions: { ...s.permissions, [permission]: true } })),
      markAppDeleted: name =>
        set(s => ({
          apps: s.apps.map(a =>
            a.name === name ? { ...a, deleted: true } : a,
          ),
        })),
      setAppForWork: (name, forWork) =>
        set(s => ({
          apps: s.apps.map(a => (a.name === name ? { ...a, forWork } : a)),
        })),
      takeVow: at => set({ vowTakenAt: at }),
      breakVow: at => set({ brokenAt: at }),
      restoreVow: () => set({ brokenAt: null }),
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
        pratigya: s.pratigya,
        permissions: s.permissions,
        apps: s.apps,
        vowTakenAt: s.vowTakenAt,
        brokenAt: s.brokenAt,
      }),
    },
  ),
);

/** Each vow's warrior, in Devanagari and in Latin script. */
export const PRATIGYAS: Record<Pratigya, { name: string; latin: string }> = {
  abhimanyu: { name: 'अभिमन्यु', latin: 'Abhimanyu' },
  arjun: { name: 'अर्जुन', latin: 'Arjun' },
  bhishma: { name: 'भीष्म', latin: 'Bhishma' },
};

/** "Mayank Sharma" → "Mayank". */
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';
