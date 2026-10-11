---
name: Expense
description: Local-first iOS expense tracker. Native liquid glass chrome over soft tinted ground, content in rounded surface cards.
colors:
  tint: "#2F6BFF"
  tint-dark: "#5B8CFF"
  on-tint: "#FFFFFF"
  destructive: "#E5484D"
  destructive-dark: "#FF6369"
  ground: "#F3F4F8"
  ground-dark: "#0B0F17"
  surface: "#FFFFFF"
  surface-dark: "#161B26"
  fill: "#E8EBF2"
  fill-dark: "#222938"
  label: "#0B1220"
  label-dark: "#F4F6FA"
  secondary-label: "#5B6475"
  secondary-label-dark: "#A3ACBC"
  tertiary-label: "#8A93A3"
  tertiary-label-dark: "#7C8597"
  separator: "rgba(15,23,42,0.08)"
  separator-dark: "rgba(255,255,255,0.08)"
typography:
  display:
    fontFamily: "SF Pro, -apple-system, system-ui"
    fontSize: "56px"
    fontWeight: 700
    fontFeature: "tnum"
  headline:
    fontFamily: "SF Pro, -apple-system, system-ui"
    fontSize: "44px"
    fontWeight: 700
    fontFeature: "tnum"
  title:
    fontFamily: "SF Pro, -apple-system, system-ui"
    fontSize: "17px"
    fontWeight: 600
  body:
    fontFamily: "SF Pro, -apple-system, system-ui"
    fontSize: "17px"
    fontWeight: 400
  row:
    fontFamily: "SF Pro, -apple-system, system-ui"
    fontSize: "16px"
    fontWeight: 400
  callout:
    fontFamily: "SF Pro, -apple-system, system-ui"
    fontSize: "15px"
    fontWeight: 500
  footnote:
    fontFamily: "SF Pro, -apple-system, system-ui"
    fontSize: "13px"
    fontWeight: 400
rounded:
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "28px"
components:
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  expense-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.label}"
    typography: "{typography.row}"
    padding: "12px 16px"
  category-avatar:
    backgroundColor: "{colors.fill}"
    rounded: "{rounded.pill}"
    size: "40px"
  button-primary:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    typography: "{typography.title}"
    rounded: "{rounded.lg}"
    height: "54px"
  button-pill:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
  chip-category:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.label}"
    typography: "{typography.callout}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 14px"
  chip-category-selected:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
  keypad-key:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.label}"
    rounded: "{rounded.md}"
    height: "56px"
  settings-group:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.label}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: Expense

## Overview

**Creative North Star: "The Glass Ledger"**

Expense is a Monzo-inspired iOS 26 app. The system's own chrome does the glass work: a floating native tab bar, circular glass toolbar buttons, and transparent headers that float over a soft tinted ground. The app itself draws flat, opaque surface cards on that ground and fills them with money. Amounts are the loudest thing on every screen, set large, bold and tabular.

Color is restrained. Neutrals carry the whole interface and a single blue tint marks what is selected, actionable or in progress. Category identity comes from emoji in circular fills, not from color. Density is calm: 16px screen gutters, 28px between sections, generous row padding, 44px minimum touch height.

Every color token exists twice, light and dark, selected from the JS color scheme. Both palettes are explicit hex values; the code dropped `PlatformColor` because its native resolution did not follow the container appearance on iOS 26.

**Key Characteristics:**
- Native liquid glass comes from the system (NativeTabs, Stack.Toolbar, transparent headers). The app paints no glass of its own.
- Opaque surface cards on a tinted ground; no shadows anywhere.
- Large tabular amounts in SF Pro bold.
- One blue tint, used sparingly.
- Emoji category avatars in circular neutral fills.
- Native iOS controls for menus, alerts, date pickers and action sheets.

## Colors

Cool blue-grey neutrals with one saturated blue, each defined in a light and a dark variant.

### Primary
- **Signal Blue** (tint / tint-dark): selected chips, the save button, progress bar fills, links, header tint, the tab bar's selected state. It is never a background for large areas.
- **On Tint** (on-tint): text and spinners drawn on Signal Blue fills, in both schemes.

### Tertiary
- **Alarm Red** (destructive / destructive-dark): defined for destructive meaning. Destructive actions currently go through native alerts and menus with the system destructive style, so the token is reserved, not painted.

### Neutral
- **Mist Ground** (ground / ground-dark): the screen background under every Stack and behind transparent headers. Slightly blue so white cards lift off it without shadow.
- **Card White / Night Card** (surface / surface-dark): every content card, row, pill field and unselected chip.
- **Quiet Fill** (fill / fill-dark): keypad keys, avatar circles, progress tracks, pressed-row background, active pill state.
- **Ink** (label / label-dark): primary text and amounts.
- **Slate** (secondary-label / secondary-label-dark): subtitles, section totals, hero labels, muted placeholders.
- **Haze** (tertiary-label / tertiary-label-dark): input placeholders and the empty-amount state on the form.
- **Hairline** (separator / separator-dark): hairline row dividers inset after the avatar, and the update banner outline.

### Named Rules
**The One Blue Rule.** Signal Blue is the only chromatic color the app paints. Selection, primary action and progress share it; nothing else gets a hue.

**The Twin Palette Rule.** Every new color is added to both `lightColors` and `darkColors` in `src/constants/theme.ts`, and components read it through `useTheme()`. No hex literals in screens or components.

## Typography

**Display Font:** SF Pro (system font, no custom faces loaded)
**Body Font:** SF Pro

**Character:** One family, contrast through size and weight only. Amounts jump to 44-56px bold while everything else sits in the 13-17px iOS text range.

### Hierarchy
- **Display** (700, 56px, tabular): the amount on the new/edit expense sheet, shrinks to fit one line.
- **Headline** (700, 44px, tabular): the month total in the Inicio hero card.
- **Title** (600, 17px): section titles, empty-state titles, primary button labels.
- **Body** (400, 17px): settings rows and settings actions.
- **Row** (400, 16px): expense name in rows; row amounts use the same size at 600 with tabular figures.
- **Callout** (500-600, 15px): chips, pill fields, category amounts, hero labels, links.
- **Footnote** (400, 13px): row subtitles, day-section totals, settings captions.

### Named Rules
**The Tabular Money Rule.** Every rendered amount uses `fontVariant: ['tabular-nums']`, from the 56px display down to 13px section totals.

**The System Voice Rule.** SF Pro only. Hierarchy comes from the weights 400, 500, 600 and 700, never from a second family.

## Layout

Single-column scroll screens. Every screen inside a Stack has a `ScrollView`, `FlatList` or `SectionList` root with `contentInsetAdjustmentBehavior="automatic"`, so content starts below the transparent large-title header and ends above the floating tab bar. Filters and totals live inside the scroll content, never pinned above it.

Navigation is three NativeTabs (Inicio, Historial, Ajustes), each with its own Stack using large titles and transparent headers. Detail screens (edit expense, category, diagnostics) push inside their tab's Stack with `headerLargeTitle: false`. Only the new-expense form lives in the root Stack, as a full-height `formSheet` with a grabber.

Spacing runs on a 4-based scale (4, 8, 12, 16, 20, 28). Screen gutters are 16px (lg); cards pad 16-20px; sections are separated by 28px (xxl) with 8px between a section title and its card. Interactive elements hold a 44px minimum height; keypad keys are 56px and the save button 54px.

## Elevation & Depth

Flat by construction. No component sets a shadow or elevation. Depth comes from two sources: tonal layering (white or night cards on the tinted ground, quiet fills inside cards) and the system's own liquid glass chrome floating above the scroll content.

### Named Rules
**The Borrowed Glass Rule.** Glass belongs to floating chrome: NativeTabs, `Stack.Toolbar` buttons, transparent headers, and anything else that floats over scrolling content. Content cards, rows and fields stay opaque and shadowless.

## Shapes

Soft rounded rectangles and full pills. Content cards and grouped expense lists round at 16px (lg). Settings grouped lists and keypad keys use 12px (md). Every chip, pill field, progress bar, banner and small CTA is a full pill (999). Avatars are perfect circles (40px in expense rows, 36px in the home category card).

Grouped lists are built from their rows: the first row rounds its top corners, the last its bottom corners, and every row except the last draws a hairline separator inset past the avatar.

## Components

### Buttons
- **Shape:** primary button at 16px radius, 54px tall, full width. Secondary CTAs are pills.
- **Primary:** Signal Blue fill, On Tint label at Title weight. Disabled at 40% opacity; shows an On Tint spinner while saving.
- **Pill CTA:** Signal Blue pill with 12px x 20px padding, used for the empty-state call to action. Pressed at 85% opacity.
- **Header actions:** native `Stack.Toolbar.Button` with SF Symbols (`plus`, `xmark`, `trash`), rendered by iOS as circular glass buttons.

### Chips
- **Category chip:** 44px pill, Card White fill, emoji plus Callout label. Selected turns Signal Blue with On Tint text. Scrolls horizontally.
- **Filter chip (Historial):** pill with 14px horizontal padding, same selected treatment.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Card White / Night Card on Mist Ground.
- **Shadow Strategy:** none, see Elevation & Depth.
- **Border:** none.
- **Internal Padding:** 20px for hero and empty cards, 16px for the category breakdown card.

### Inputs / Fields
- **Pill field:** 44px pill in Card White holding an icon and a 15px value (date, note). Active state switches to Quiet Fill. The note pill swaps in place for a `TextInput` with Haze placeholder.
- **Date picker:** native SwiftUI graphical `DatePicker` (via `@expo/ui`) inside a 16px-radius surface panel.

### Navigation
- Native floating glass tab bar with SF Symbol icons (filled variant when selected) and Signal Blue tint.
- Large transparent titles on tab roots; small titles on pushed details. Back buttons and header controls use Signal Blue.

### Expense Row
The repeated unit of the app. Card White row, 40px emoji avatar in a Quiet Fill circle, name over an optional footnote subtitle, tabular 600 amount trailing. Pressed rows switch to Quiet Fill. On iOS, long press opens a native context menu (`Link.Menu`) with Editar and a destructive trash action; tap pushes the detail screen.

### Amount Keypad
A 3x4 grid of 56px keys with 8px gaps, 12px radius, Quiet Fill keys, 26px medium tabular digits. Each press fires a selection haptic; long-press on backspace clears with a medium impact haptic. It sits under the 56px display amount in the new-expense sheet.

### Update Banner
Floating pill above content with Card White fill and a hairline outline. It shows a 4px Signal Blue progress bar while an OTA update downloads, then a Signal Blue pill button to restart.

## Do's and Don'ts

### Do:
- **Do** root every Stack screen in a scroll container with `contentInsetAdjustmentBehavior="automatic"`.
- **Do** push detail screens inside their tab's Stack, and keep only modal sheets in the root Stack.
- **Do** read colors through `useTheme()` and add every new color to both palettes.
- **Do** set every amount with tabular figures.
- **Do** use native controls for header actions, row menus, alerts and date picking.
- **Do** keep interactive elements at least 44px tall.

### Don't:
- **Don't** put glass, blur or shadows on content cards, rows or fields; glass is for chrome that floats over content.
- **Don't** introduce a second accent hue; category identity is emoji, not color.
- **Don't** load custom fonts; SF Pro carries the whole hierarchy.
- **Don't** use `PlatformColor` for theme colors; it resolved the wrong appearance on iOS 26.
