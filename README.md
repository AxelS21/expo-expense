# Expense

Mini-app iOS para registrar gastos en menos de 5 segundos. Local-first, offline, sin backend.

Ver [PRD](./PRD%20—%20Expense%20Mini%20App%20iOS%20(Expo-First,%20Xcode-Free).md) para el alcance completo y [AGENTS.md](./AGENTS.md) para las reglas de trabajo.

## Stack

Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router · expo-sqlite · EAS Build / EAS Update.

## Requisitos

Node 22+, npm. No hace falta Mac ni Xcode: los builds de iOS corren en EAS.

## Puesta en marcha

```bash
npm install
npm run start
```

## Verificacion

```bash
npm run lint
npm run typecheck
npm test
```

## Builds

La app se instala sin cuenta paga de Apple: GitHub Actions compila un `.ipa`, AltStore lo firma con un Apple ID gratuito y EAS Update entrega los cambios de JavaScript.

```bash
# Cambios de JavaScript (OTA)
npx eas-cli update --channel production --environment production --platform ios --message "..."

# Cambios nativos: subir version en app.config.ts y compilar
gh workflow run ios-unsigned.yml --ref main
```

Detalle completo, límites y diagnóstico del widget: [docs/release-workflow.md](docs/release-workflow.md).

## Estructura

```text
src/
├── app/          # rutas (Expo Router)
├── components/   # ui, expenses, categories
├── db/           # cliente SQLite, migraciones, repositories
├── services/     # backup, deep links
├── hooks/
├── utils/        # money, fechas
├── constants/
└── types/
tests/            # jest (jest-expo)
```

`ios/` y `android/` se generan con Expo CNG y no se versionan.
