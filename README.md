# Laser Focus — mobile app (frontend)

React Native (CLI, **not Expo**) + TypeScript app for the Laser Focus method:
_Life → Values → Goals → Milestones → Tasks → Focused Sessions._

This repo is the UI layer: screens, navigation, animations and the design
system. Native features (app blocking, permissions) and the backend will be
plugged in behind typed interfaces, so they can be built without touching the UI.

## Status

| Area                                                                              | State                                                |
| --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Sign in (language, phone, code — mocked in `src/services/auth.ts`)                | Done                                                 |
| Setup — Values, Goals, Circle, Milestones, This week, Rhythm, the vow, first plan | Done                                                 |
| Daily loop — Home, Plan, Start, In progress, Mark, Day done                       | Done                                                 |
| Weekly and sprint — Review, Goal done, Rest, Reassess                             | Done                                                 |
| Action Book, Settings                                                             | Done                                                 |
| English and Hindi (chosen at sign-in, changeable in Settings)                     | Done                                                 |
| Evening reminder (the only notification)                                          | Interface only — `src/services/reminders.ts`         |
| Printable pack, data export                                                       | Print is a note for now; export uses the share sheet |
| Persistence                                                                       | On device (`zustand` + AsyncStorage)                 |
| API                                                                               | Not started                                          |

## Stack

| Concern      | Library                                                            |
| ------------ | ------------------------------------------------------------------ |
| Framework    | React Native 0.87 (New Architecture), TypeScript `strict`          |
| Navigation   | `@react-navigation/native-stack`                                   |
| Animation    | `react-native-reanimated` 4 + `react-native-worklets`              |
| Gestures     | `react-native-gesture-handler` 3 (hook API)                        |
| Vector icons | `react-native-svg` + `react-native-svg-transformer`                |
| Haptics      | `react-native-haptic-feedback` (wrapped in `src/utils/haptics.ts`) |
| State        | `zustand`                                                          |
| Tests        | Jest + `react-test-renderer`                                       |

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
  core/             The book: model.ts (types, limits), store.ts (one
                    persisted store), days.ts (3 AM day, weeks), home.ts
                    (day marks and the Home state machine)
  flow/
    setup/          SignIn, Welcome, Setup (all sheets), SetupDone
    vow/            Pratigya, VowAsks, Permissions, ClearField, TakeVow, Lockout
    loop/           Home, Plan, Start, InProgress, Mark, DayDone
    sprint/         Review, GoalDone, Rest, Reassess
    book/           Book, BookSheet, Settings
    components/     Sheet editors, RhythmEditor, MarkBox (the boxes and the
                    hold/swipe pad), Calendar, FocusDial, pickers
  i18n/             en.ts, hi.ts (type-checked against en), date/time format
  components/       Shared UI: FlowFrame, PrimaryButton, HoldButton,
                    BottomSheet, ListField, TextField, Chip, AuroraSky,
                    shader, orb, …
  features/account/ Profile store: language, account, vow, mocked app list
  services/         auth (mocked), reminders (to be wired)
  navigation/       Root stack, typed params, resume on launch
  theme/ utils/ assets/
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

## The flow

Set up → Plan → Start → Mark → Review → Goal done → Rest → Reassess.

- **Home** is one button whose label and target come from `homeAction()` in
  `src/core/home.ts`, highest precedence first: continue setup, resting,
  reassess, session in progress, mark a past session, finish the goal,
  review, re-read after a week away, start, tomorrow's plan, plan. Under it:
  the last 7 days and a link to the Action Book. No streak counter.
- **Day** turns over at 3 AM. A **week** starts the day after the review day.
- **Day mark:** ● only if every session that day is ●; zig-zag if any session
  reached at least ten minutes; empty otherwise.
- **Plan:** today or tomorrow, up to 3 sessions; each needs what, outcome and
  time. Challenge, steps, risks and don't-do are optional under "More clarity".
- **Start:** three ticks; the full checklist and ritual are folded away.
- **Mark:** hold the box to fill it (●), swipe across for zig-zag, or "Didn't
  happen". Unmarked past sessions come back on Home.
- **Review:** milestones, last week's tasks (done / carry), next week's tasks.
  When every milestone is ticked, the goal is done.

All dates use the device's local calendar day; "now" comes from
`src/utils/clock.ts` so tests and the preview can move time.

## For the native / backend team

- **Data shapes:** `src/core/model.ts` (`BookData` is the payload to sync).
- **Reminder:** `src/services/reminders.ts` describes the one evening
  notification (we suggest `@notifee/react-native`).
- **Stand-ins:** search for `TODO(devs)`.
- **Native features** (app blocking, permissions, reinstall detection) are
  mocked: the app list and `grant()` in
  `src/features/account/store.ts`, `breakVow()` for reinstalls. Sign-in is
  mocked in `src/services/auth.ts` (any 6 digits pass).
- **iOS caveat:** iOS does not let apps list other installed apps. App blocking
  there has to go through the Screen Time APIs (FamilyControls /
  ManagedSettings / DeviceActivity), which need an Apple entitlement.
- **Loading orbs:** `src/components/orb` is the React Native port of
  [thinking-orbs](https://libraries.dev/orbs) (MIT), vendored because the
  port isn't on npm yet. It draws with `@shopify/react-native-skia`, so run
  `pod install` after pulling.
- **Motion:** spring and timing tokens follow Arc UI's motion system — see
  `src/theme/motion.ts` (`springs.snappy`, `smooth`, `morph`, `responsive`,
  `gentle`).
- **Fonts:** Google Sans (UI) and Young Serif (display), both under the SIL
  Open Font License.
