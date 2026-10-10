# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Users

A single person (the developer) tracking their own spending on their own iPhone. The typical moment is at the point of payment: standing at a till or on the street, logging the expense in a few seconds.

## Product Purpose

A personal, local-first expense tracker. It has two equal jobs: logging an expense in seconds, and giving a clear picture of the month's totals and categories. Success means no expense goes unlogged because logging felt slow.

## Positioning

Intentionally small and private. No accounts, no backend, no bank sync, no analytics. Data stays on the device.

## Operating Context

- Used one-handed, in short sessions, often outdoors.
- Quick entry through a home screen widget that deep links to `expense://expense/new`.
- Distributed through GitHub Actions unsigned builds installed with AltStore, with OTA updates through EAS Update.

## Capabilities and Constraints

- Expo, React Native, TypeScript, Expo Router, expo-sqlite, expo-widgets, expo-glass-effect.
- Must stay Xcode-free and compatible with Expo Continuous Native Generation (see AGENTS.md).
- Current screens: home (index), expense create/edit, history, settings, widget diagnostics.
- Open: making the widget log expenses without opening the app (needs App Intents support research).

## Product Principles

1. Logging speed comes first at the point of payment.
2. The monthly summary must be readable at a glance.
3. Stay small: no feature that needs a backend or account.
4. Prefer native iOS behavior and controls over custom imitations.
