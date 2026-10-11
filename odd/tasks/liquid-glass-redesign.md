# Liquid glass redesign

## Objective
Redesign the app UI around iOS 26 liquid glass, using Monzo as the visual reference: a floating glass tab bar, circular glass header buttons, and a soft tinted background.

## Problem
- The app is a single Stack with no tabs, and Settings is unreachable.
- Colors are hardcoded hex values, so dark mode is broken.
- Adding an expense uses a long form with the system keyboard and a typed date.
- There are no shared components, and the create and edit forms are duplicated.

## Scope (user-approved)
- Use three NativeTabs: Inicio, Historial and Ajustes.
- Put a "+" glass button in the Inicio header that opens the add-expense sheet.
- Use semantic colors (PlatformColor), SF Symbols (expo-symbols) and one shared expense form.
- Out of scope: the widget (a separate feature, pending App Intents research).

## Constraints
- Must stay Xcode-free and CNG-compatible (AGENTS.md).
- There is no simulator. Visual verification happens on the user's device (GitHub Actions build or OTA).
- Adding a native package (expo-symbols) requires a new binary build. OTA alone is not enough.

## Tasks
- [x] T1 (cac6f34): Foundation and navigation.
  - Add a theme module with semantic colors and install expo-symbols.
  - Convert the root layout to NativeTabs (Inicio, Historial, Ajustes) and keep the expense routes as a stack/sheet.
  - Add the "+" header button on Inicio.
  - Replace the hex colors in all screens.
- [x] T2: Add/edit expense sheet.
  - Present it as a formSheet with detents.
  - Large amount, category chips, custom keypad and native date picker.
  - Shared form component used by new and [id].
- [x] T3: Inicio and Historial visual pass.
  - Monzo-like hierarchy, glass surfaces and SF Symbols.
  - Swipe-to-delete instead of the trash emoji.

## Acceptance and checks
- `npx tsc --noEmit` and `npx expo lint` (if configured) pass.
- `npx expo export --platform ios` bundles.
- `npx expo prebuild --platform ios --no-install --clean` in a temp clone is optional.
- Device check by the user.

## Progress
- T1 route: delegated (writer touches 2+ non-trivial files).
- T1 review: medium risk, consent granted, 1 lens (reliability) approved and acknowledged. Reviewed boundary advances to 4d25dfc.
- T1 done (cac6f34).
  - NativeTabs come from `expo-router/unstable-native-tabs`.
  - The "+" button uses `Stack.Toolbar.Button icon="plus"`.
  - `theme.ts` uses PlatformColor.
  - Removed expo-symbols: it was unused, because SF Symbol names are passed directly. T1 adds no native modules, so it can ship by OTA.
  - Checks: tsc and expo export ios passed (writer run), and the parent re-ran tsc and it passed. `expo install --check` fails on 12 pre-existing outdated packages, which are out of scope. Device check is pending.
- Palette fix + version in Ajustes: OTA 1.0.003 (12ce9e2f). Review: high (workflow shell), declined by user for this candidate.
- T2 done (delegated writer): shared ExpenseForm + AmountKeypad, date pill with day stepper + @expo/ui DatePicker (unverified on device), xmark/trash toolbar buttons. Checks: tsc, no hex lint, no package changes, expo export ios OK. OTA 1.0.004.
- Fix: edit and diagnostics moved into the history/settings tab stacks (back label was "(tabs)", header light). OTA 1.0.005.
- Fix: inline-title header rendered opaque white (glass buttons light). All stacks now headerTransparent; OTA 1.0.006.
- T3 done (delegated writer): home hero/category/recent cards, history day cards with totals, Link.Menu context menu delete (no gesture-handler), shared ExpenseRow, aggregate util + test. Checks: tsc, jest 14 passing, no hex, no package changes, export ios OK. OTA 1.0.007.
