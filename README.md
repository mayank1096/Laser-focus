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
| Path & Pratigya onboarding (Figma `B2-01…07`) | Next — placeholder screen for now |
| Session flow, Action Book, tracking | Not started |
| Persistence / API | Not started — state is in memory |

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
  components/       Reusable UI: PrimaryButton, ListField, OptionCard,
                    RulerPicker, ProgressSegments, AppText
  features/
    onboarding/
      screens/      WelcomeScreen, GoalSetupScreen (hosts the 9 steps),
                    SetupCompleteScreen (placeholder)
      steps/        One file per question + steps/index.ts (order, rules, art)
      components/   QuestionHeader, StepArt
      store.ts      Goal-setup draft state and limits
  navigation/       Root stack + typed route params
  types/models.ts   Domain types — the backend should mirror these
  utils/            haptics, time formatting, ids, text helpers
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

## For the native / backend team

- **Data shapes:** `src/types/models.ts`.
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
