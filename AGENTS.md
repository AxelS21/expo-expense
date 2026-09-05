# AGENTS.md

## Project

Expense is a personal iOS-first expense tracking mini-app built with Expo, React Native and TypeScript.

The application is local-first, offline-first and intentionally small.

Do not introduce unnecessary backend infrastructure, authentication systems, analytics or architectural complexity.

---

## Critical Native Development Constraint

This project MUST remain compatible with Expo Continuous Native Generation and EAS Build.

The primary development environment is Windows/Linux.

The developer does NOT have access to a local macOS development environment or Xcode.

Therefore:

- NEVER require Xcode for development.
- NEVER require manual Xcode configuration.
- NEVER manually maintain `/ios`.
- NEVER manually maintain `/android`.
- NEVER introduce a dependency that requires manually editing an Xcode project.
- NEVER require manual edits to native generated files.
- Prefer Expo SDK packages whenever possible.
- Native dependencies must support Expo autolinking, config plugins or automatic configuration.
- All native configuration should live in `app.config.ts` or Expo config plugins.
- iOS builds must work through EAS Build.
- The repository must remain compatible with Expo Continuous Native Generation.

If a feature appears to require custom native iOS code, first investigate whether it can be implemented using:

1. Expo SDK;
2. Expo UI;
3. Expo Modules;
4. Expo config plugins;
5. EAS Build generated native code.

If it cannot be implemented without requiring the developer to open Xcode, STOP and document the limitation instead of introducing the dependency.

---

## Native Folders

The `/ios` and `/android` directories should not be treated as source-of-truth directories.

Do not commit manually modified generated native files unless explicitly required by a documented architectural decision.

Prefer regenerating native projects through Expo CNG.

---

## Technology

Primary stack:

- Expo
- React Native
- TypeScript
- Expo Router
- expo-sqlite
- expo-widgets
- expo-glass-effect
- EAS Build
- EAS Update

Prefer official Expo packages over third-party alternatives.

---

## Architecture

Keep the architecture simple.

Prefer:

- screens;
- components;
- repositories;
- services;
- hooks;
- utilities.

Do not introduce unnecessary:

- Clean Architecture;
- CQRS;
- MediatR-like patterns;
- dependency injection frameworks;
- domain layers;
- backend services.

This is intentionally a small personal application.

---

## Local First

SQLite is the primary source of truth.

The application must work offline.

Do not introduce a backend unless explicitly requested.

Do not introduce Supabase, Firebase or another cloud database by default.

---

## Privacy

Financial data must remain local by default.

Do not introduce:

- analytics;
- trackers;
- advertising SDKs;
- telemetry containing financial information.

---

## Money

Never use floating-point arithmetic for persisted monetary values.

For the MVP, store only positive whole ARS amounts as integers.

Centralize formatting and parsing.

---

## Database

Database schema changes must use versioned migrations.

Never solve schema changes by deleting the user's database.

Migrations must preserve existing user data.

Deleted expenses must remain recoverable in a trash state for 2 days before permanent deletion.

---

## Dependencies

Before adding a dependency verify:

- it supports the current Expo SDK;
- it works with EAS Build;
- it supports Expo CNG;
- it does not require manual Xcode changes;
- it is actively maintained;
- the feature cannot reasonably be implemented with an existing dependency.

Avoid unnecessary dependencies.

---

## UX

The primary product metric is speed of expense entry.

The target flow is:

Lock Screen → Add Expense → Amount → Category → Save.

Optimize for the fewest possible taps.

Do not add confirmation dialogs for reversible low-risk actions unless necessary. Deleting an expense is the explicit exception: it requires confirmation and sends the expense to the 2-day trash.

Use haptic feedback appropriately.

---

## iOS

The app is iOS-first.

Prefer native-feeling iOS interaction patterns.

Use Liquid Glass where supported and appropriate.

Always provide sensible fallbacks for unsupported iOS versions.

Do not add an in-app biometric lock in the MVP. The system's normal Face ID/PIN unlock is sufficient when entering through the Lock Screen widget.

---

## Widgets

Lock Screen and Home Screen widgets must use Expo-supported approaches whenever possible.

Deep linking should be used to open focused app actions.

Preferred quick-add route:

`expense://new`

---

## Scope Discipline

Before implementing a feature, ask whether it improves the core personal expense tracking workflow.

Avoid turning the application into:

- accounting software;
- banking software;
- a budgeting SaaS;
- a social application;
- a multi-tenant platform.

Prefer deleting unnecessary complexity over expanding scope.

---

## Verification

Before finishing a change:

- run lint;
- run TypeScript checks;
- run relevant tests;
- verify migrations if the database changed;
- verify that Expo configuration remains valid;
- verify that no manual native changes are required.

Any change that breaks the Xcode-free development requirement is considered a regression.

---

## Commands

```bash
npm run start       # expo start
npm run lint        # expo lint (eslint-config-expo, flat config)
npm run typecheck   # tsc --noEmit
npm test            # jest (preset jest-expo)
```

Path alias: `@/*` apunta a `src/*`.

Configuracion nativa: unicamente en `app.config.ts` y config plugins. `ios/` y `android/` estan en `.gitignore`.
