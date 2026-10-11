# Quick log widget

## Objective
Log an expense from the lock screen without opening the app. The widget offers preset buttons (category + amount) configured in Ajustes. This is a native batch, so it also updates the 12 outdated Expo packages.

## Design (user-approved; research verified in node_modules/expo-widgets/ios)
- A new widget, `QuickLogWidget`, in the families accessoryRectangular, systemSmall and systemMedium.
  - It shows preset buttons whose `onPress` returns `{ pending: [...props.pending, entry], lastLogged }`. The tap runs in the widget extension's JSContext. It never opens the app and never touches SQLite.
  - Props are stored in App Group UserDefaults.
- On launch and on foreground, the app runs `getTimeline()`:
  1. Read the `pending` entries.
  2. Insert them into SQLite in one transaction, with an idempotent key so the same entry is never inserted twice.
  3. Write the snapshot again, removing only the ids that were ingested.
- The presets are configured in Ajustes. The app pushes them into the snapshot.
- The existing QuickAddWidget (a URL that opens the app) stays unchanged.
- The design targets the `vibrant` and `accented` rendering modes: monochrome text and icons, no flat color backgrounds.

## Not possible (documented)
- Typing an amount without opening the app.
- Control Center or ControlWidget controls.
- Writing to SQLite from the widget.

## Tasks
- [x] W1: Update the outdated Expo packages to their SDK 57 bundled versions. `npx expo install` fails with EALLOWSCRIPTS, so install the versions listed in `expo/bundledNativeModules.json` with npm.
- [x] W2: Build QuickLogWidget, the presets storage and the Ajustes UI, the ingestion queue with tests, and bump `version` to 1.1.0.
- [ ] W3: Run the GitHub Actions unsigned build and the iOS preview screenshots. The user installs the build with AltStore and answers "Keep App Extensions".

## Checks
- tsc and jest pass.
- `expo export` for ios succeeds.
- `npx expo prebuild` runs in CI.
- The unsigned build succeeds.
- The simulator screenshots come back.

## Progress
- W1+W2 done (delegated writer). expo install --check OK, expo-doctor 21/21, jest 56, tsc OK, export ios OK. Lockfile: expo-modules-core entry hoisted by hand (npm nested it). Version 1.1.0.
- W3: unsigned build success (run 38106460541), preview run success (38106462200). Screenshots: app launches in light and dark and Home renders correctly. Other routes are blocked by the iOS "Open in Expense?" dialog that simctl openurl triggers (workflow limitation). The widget cannot be checked in screenshots. Pending: user installs the .ipa with AltStore.
