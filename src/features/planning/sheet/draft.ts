import { createContext, useContext } from 'react';
import type { SessionSheet, SheetLine } from '../../../types/models';

export type ChallengeKind = NonNullable<SessionSheet['challengeKind']>;

export interface SheetDraft {
  outcome: string;
  challengeKind: ChallengeKind | null;
  challenge: string;
  steps: SheetLine[];
  minutes: number;
  failureModes: string[];
}

export interface SheetContext {
  draft: SheetDraft;
  update: (patch: Partial<SheetDraft>) => void;
  /** The sheet to beat: the last one for this task, or any last one. */
  last: SessionSheet | null;
  /** "2:00 PM · Mock 24 — Paper 2, Law" */
  tag: string;
}

export const SheetDraftContext = createContext<SheetContext | null>(null);

export function useSheetDraft(): SheetContext {
  const ctx = useContext(SheetDraftContext);
  if (!ctx) {
    throw new Error('useSheetDraft must be used inside a session sheet');
  }
  return ctx;
}

export function toSheet(d: SheetDraft): SessionSheet {
  return {
    outcome: d.outcome.trim(),
    challenge: d.challenge.trim(),
    challengeKind: d.challengeKind ?? undefined,
    steps: d.steps,
    minutes: d.minutes,
    failureModes: d.failureModes,
  };
}

export const MIN_TEXT = 3;
