# App essentials

## Objective
Close the gaps left after the liquid glass redesign. All four items are user-approved.

## Scope
- [x] E1: Backup export and restore, following PRD sections 23 and 24.
  - Data is a JSON file holding expenses (including trashed ones), categories (including archived ones), settings and the schema version.
  - The file is shared through the iOS share sheet.
  - Restore validates the file, asks for confirmation, writes a preventive backup first, and then replaces all data.
  - Lives in Ajustes under a "Datos" section.
- [ ] E2: Category management in Ajustes.
  - Create, edit (name and emoji), archive and unarchive, and delete with reassignment, using the existing repository functions.
- [ ] E3: Replace the typed "AAAA-MM-DD" fields in the Historial "Rango" filter with a native date selection.
- [ ] E4: Write DESIGN.md (and `.impeccable/design.json`) describing the shipped visual system.

## Constraints
- OTA only, with no new packages. expo-file-system, expo-sharing and expo-document-picker have been in the native build since the scaffold.
- AGENTS.md iOS rules apply:
  - inset-adjusted scroll roots;
  - detail screens inside their tab stacks;
  - transparent headers;
  - `useTheme` palettes;
  - no hex values outside `theme.ts`.
- Bump RELEASE_LABEL before each OTA.

## Checks
- tsc, jest and expo export ios must pass.
- Device check by the user after each OTA.

## Progress
- Route: delegated writers, one at a time (each task touches 2+ non-trivial files).
- E1 done: backup.format (pure, 9 tests, RED 8 failing -> GREEN), backup.service (File/Paths API, share sheet, picker, preventive copy, exclusive transaction). jest 30, tsc OK, export OK. OTA 1.0.010. Note: older-schema backups not migrated (only v1 exists).
