import { useProfile, type Language } from '../features/account/store';
import { en, type Strings } from './en';
import { hi } from './hi';

const TABLES: Record<Language, Strings> = { en, hi };

/** The strings for the language chosen at sign-in. */
export function useT(): Strings {
  return TABLES[useProfile(s => s.language)];
}

/** Same, outside React. */
export function strings(): Strings {
  return TABLES[useProfile.getState().language];
}

export type { Strings };
