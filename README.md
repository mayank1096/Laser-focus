# Laser Focus — mobile app (frontend)

React Native (CLI, **not Expo**) + TypeScript app for the Laser Focus method:
*Life → Values → Goals → Milestones → Tasks → Focused Sessions.*

This repo is the UI layer: screens, navigation, animations and the design
system. Native features (app blocking, permissions) and the backend will be
plugged in behind typed interfaces, so they can be built without touching the UI.

## Status

| Area | State |
| --- | --- |
| Welcome screen | Done |
| Goal setup — 9 questions (Values → Anti-goal) | Done |
| Planning — week setup, Tasks tab, plan tomorrow, session sheet, seal, Sacrifice, morning gate (Figma row 6) | Done |
| Account & goal switching (Figma row 5) | Designed, not built |
| Path & Pratigya onboarding (Figma 3.01–3.07) | Designed, not built |
| Session itself, Home, Action Book, Account (Figma rows 2 and 4) | Designed, not built — simple stand-ins for now |
| Reminders (nightly / weekly) | Interface only — see `src/services/reminders.ts` |
| Persistence | On device (`zustand` + AsyncStorage) |
| API | Not started |

## Stack

| Concern | Library |
| --- | --- |
| Framework | React Native 0.87 (New Architecture), TypeScript `strict` |
| Navigation | `@react-navigation/native-stack` |
| Animation | `react-native-reanimated` 4 + `react-native-worklets` |
| Gestures | `react-native-gesture-handler` 3 (hook API) |
| Vector icons | `react-native-svg` + `react-native-svg-transformer` |
| Haptics | `react-native-haptic-feedback` (wrapped in `src/utils/haptics.ts`) |
| State | `zustand` |
| Tests | Jest + `react-test-renderer` |

## Getting started

```sh
npm install
cd ios && bundle install && bundle exec pod install && cd ..   # iOS only

npm start          # Metro
npm run android    # or: npm run ios
```

Before pushing:

```sh
npm run check      # typecheck + lint + tests
```

Fonts live in `src/assets/fonts` and are already linked into both native
projects. If you add a font, run `npm run link-assets`.

## Project structure

```
src/
  theme/            Design tokens: colors, typography, spacing, motion
  components/       Reusable UI: FlowFrame (every step-by-step flow),
                    PrimaryButton/OutlineButton, HoldButton, BottomSheet,
                    ListField, TextField, SelectField, OptionCard, Chip,
                    Stepper, RulerPicker, ProgressSegments, TabBar,
                    QuestionHeader, StepArt, AppText
  features/
    onboarding/
      screens/      WelcomeScreen, GoalSetupScreen (hosts the 9 steps),
                    SetupCompleteScreen
      steps/        One file per question + steps/index.ts (order, rules, art)
      store.ts      Goal-setup draft state and limits
    planning/
      setup/        WeekSetupScreen: session times, shallow window, rhythm
      screens/      MainScreen (tabs), TasksScreen, TodayScreen, PlanDayScreen,
                    SealDayScreen, SacrificeScreen, MorningGateScreen,
                    SessionStartScreen (stand-in until the session is built)
      sheet/        SessionSheetScreen + its 4 steps and draft context
      components/   TaskSheet, TaskPickerSheet, SlotSheet, ClockSheet, rows
      store.ts      Planning state, limits and selectors
  services/         reminders (to be wired to a notification library)
  navigation/       Root stack + typed route params
  types/models.ts   Domain types — the backend should mirror these
  utils/            date & clock, haptics, time formatting, ids, text helpers
  assets/           images, icons (svg), fonts
```

## Conventions

- **No raw colours, font sizes or spacing in components.** Use `src/theme`.
  Values come from the Figma file.
- **Text** goes through `AppText` or a `typography` token.
- **Haptics** only through `src/utils/haptics.ts`.
- **Animations** run on the UI thread (Reanimated worklets). Timings come from
  `motion` in the theme, so the whole app shares one rhythm.
- One component per file, named exports, `PascalCase` files for components.
- Prettier + ESLint (`@react-native` config) are the source of truth for style.

## Goal-setup flow

`src/features/onboarding/steps/index.ts` lists the steps in order. Each step has
the illustration to show, a `canContinue` rule (the Next button stays locked
until it passes) and an optional `skip` rule.

1. Values (1–3 lines)
2. Goals (1–3)
3. Magic Circle: pick the primary goal (auto-picked if there is only one)
4. Action: the controllable action behind the goal
5. Shape of the work: repeated vs. stages
6. How many (repeated work only — skipped for stages)
7. By when (months)
8. Milestones, each dated automatically up to the deadline; for repeated work
   they are pre-filled as even batches ("Mock tests 1–8", …)
9. Anti-goal

The finished result is available as a typed `GoalPlan` from
`useGoalSetup.getState().toPlan()` — that is the payload to send to the API.

### Interaction details

- Steps slide forward and back, and the illustration cross-fades between them.
- The progress bar fills segment by segment; tapping a completed segment
  jumps back to that question. Android's back button steps back too.
- A locked Next button shakes and gives a warning haptic instead of doing nothing.
- Lists: tap the dashed row to add a line; pressing return saves it and opens
  the next one. Tap a line to edit it; clear it to delete it.
- Rulers: drag or fling; they snap to whole values, ticks swell under the
  centre line, and each value change gives a haptic tick.

## Planning flow

All rules live in `src/features/planning/store.ts` (`PLANNING_LIMITS` and the
selectors below it), so screens stay thin and the rules are unit-tested.

1. **Week setup** (once, after goal setup): up to **3** deep-work sessions a
   day at fixed times (clashing times block Next), one shallow-work hour, and
   the planning rhythm — weekly plan day and time, nightly sheet time.
2. **Tasks tab**: this week's tasks. Deep tasks have a priority (●●● / ●●○ /
   ●○○) and a number of sessions; shallow tasks are a tick list for the
   shallow window. Unfinished work carries into the next week.
3. **Plan tomorrow**: each session gets one task, then a **session sheet**.
4. **Session sheet** — 4 short screens: outcome, one step harder than last
   time (with the last sheet shown), how + how long, and what would guarantee
   failure. A new sheet starts from the last one's steps and failure modes.
5. **Seal**: once every planned session has a sheet, hold to seal the day.
   Changing anything afterwards opens it again.
6. **Morning gate**: a session without a sheet cannot start; a two-minute
   sheet on one screen unlocks it.
7. **Sacrifice sheet**: offered once the first week is over — what you give
   up, what you keep, then the twist ("whoever beats you is giving up what
   you kept"), with the choice to redo it or keep it.

All dates use the device's local calendar day (`src/utils/date.ts`); "now"
comes from `src/utils/clock.ts` so tests can move time.

## For the native / backend team

- **Data shapes:** `src/types/models.ts`.
- **Reminders:** `src/services/reminders.ts` says exactly which notifications
  to schedule and when to cancel them (we suggest `@notifee/react-native`).
- **Stand-ins:** search for `TODO(devs)` — each one names the Figma frames
  that replace it.
- **Native features** (app blocking, permissions, reinstall detection) are not
  in this part yet. They will be added as a typed interface with a mock
  implementation, which you can then implement natively.
- **iOS caveat:** iOS does not let apps list other installed apps. App blocking
  there has to go through the Screen Time APIs (FamilyControls /
  ManagedSettings / DeviceActivity), which need an Apple entitlement.
- **Satoshi font licence:** Satoshi is under the ITF Free Font License, which
  allows embedding in apps but not handing the font files to third parties.
  Whoever owns the app should download their own copy from fontshare.com.
  Young Serif is under the OFL.
