import { useProfile } from '../features/account/store';
import { useGoalSetup } from '../features/onboarding/store';
import { usePlanning } from '../features/planning/store';
import { useSessions } from '../features/session/store';
import type { RootStackParamList } from './types';

/**
 * Where someone should be, from what they have finished. Used when the app
 * opens and whenever a flow ends, so every path converges on the same order:
 * goals → account → vow → week → home.
 */
export function resumeRoute(): keyof RootStackParamList {
  const profile = useProfile.getState();
  const goals = useGoalSetup.getState();
  if (profile.brokenAt) {
    return 'Lockout';
  }
  if (useSessions.getState().active) {
    return 'InSession';
  }
  if (!goals.completed) {
    return goals.stepId ? 'GoalSetup' : 'Welcome';
  }
  if (!profile.account) {
    return 'SaveSheets';
  }
  if (!profile.vowTakenAt) {
    return 'Path';
  }
  if (!usePlanning.getState().setupDone) {
    return 'WeekSetup';
  }
  return 'Main';
}
