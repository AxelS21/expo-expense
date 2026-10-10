# PRD — Expense Mini App iOS

## 1. Resumen del producto

Expense es una mini-app personal para iPhone orientada a registrar gastos de la forma más rápida posible.

No busca competir con aplicaciones financieras completas ni convertirse inicialmente en un producto SaaS.

El objetivo principal es que el usuario pueda registrar un gasto en pocos segundos desde su iPhone, idealmente comenzando desde la pantalla de bloqueo.

La aplicación será utilizada inicialmente por dos personas y deberá funcionar de manera completamente local, privada y offline-first.

La aplicación deberá poder desarrollarse, modificarse, compilarse y mantenerse desde Windows o Linux sin requerir acceso local a macOS ni Xcode.

La plataforma tecnológica obligatoria será Expo + React Native + TypeScript.

---

# 2. Problema

Registrar gastos manualmente suele tener demasiada fricción.

El flujo habitual implica:

1. desbloquear el teléfono;
2. buscar la aplicación;
3. abrirla;
4. navegar a una pantalla;
5. ingresar el importe;
6. seleccionar una categoría;
7. confirmar.

Para gastos pequeños o frecuentes, esta fricción provoca que el usuario termine registrándolos tarde o directamente no los registre.

Expense busca reducir ese proceso al mínimo posible.

Flujo objetivo:

```text
Lock Screen
   ↓
+$
   ↓
Face ID / desbloqueo iOS
   ↓
Monto
   ↓
Categoría
   ↓
Guardar
   ↓
Fin
```

Objetivo de experiencia:

> Registrar un gasto habitual en menos de 5 segundos desde el acceso rápido.

---

# 3. Objetivos

## 3.1 Objetivo principal

Construir una mini-app iOS extremadamente rápida para registrar gastos personales.

Debe ser:

- local-first;
- privada;
- offline;
- simple;
- rápida;
- visualmente nativa de iOS;
- compatible con Liquid Glass;
- accesible desde Lock Screen;
- desbloqueada mediante los mecanismos normales de iOS al acceder desde Lock Screen;
- mantenible desde Windows/Linux;
- compilable mediante EAS Build;
- independiente de Xcode local.

---

## 3.2 Objetivos secundarios

La aplicación deberá permitir:

- consultar gastos recientes;
- consultar gastos del mes;
- editar y eliminar gastos;
- crear, editar, archivar y eliminar categorías personalizadas;
- exportar backups;
- importar backups;
- utilizar widgets de iOS;
- evolucionar posteriormente hacia sincronización opcional.

---

# 4. No objetivos

La primera versión NO deberá incluir:

- registro de usuarios;
- email/password;
- Supabase;
- Firebase;
- servidor propio;
- VPS;
- API externa;
- analytics;
- tracking;
- publicidad;
- suscripciones;
- monetización;
- cuentas bancarias conectadas;
- scraping bancario;
- Open Banking;
- inversiones;
- presupuestos complejos;
- multiempresa;
- multi-tenant;
- panel web;
- Android como prioridad.
- gráficos y analítica avanzada en el MVP;
- ingresos, balances o cuentas financieras.

No deberá agregarse infraestructura innecesaria.

---

# 5. Usuarios

Usuarios iniciales:

- usuario principal;
- segunda persona cercana al usuario.

Cada instalación mantiene sus propios datos.

No existe inicialmente una cuenta compartida.

No existe sincronización automática entre ambos usuarios.

---

# 6. Principios de producto

## 6.1 Velocidad primero

Cada interacción adicional debe justificarse.

Registrar un gasto debe ser la acción central de la aplicación.

---

## 6.2 Local-first

SQLite será la fuente de verdad.

La aplicación deberá funcionar completamente sin conexión.

---

## 6.3 Sin backend por defecto

No se deberá incorporar backend hasta que exista una necesidad concreta que no pueda resolverse localmente.

---

## 6.4 iOS-first

La experiencia se diseñará específicamente para iPhone.

No es necesario mantener paridad visual con Android.

---

## 6.5 Expo-first

Antes de incorporar cualquier dependencia deberá evaluarse:

1. si existe una solución oficial de Expo;
2. si funciona mediante Expo CNG;
3. si funciona mediante EAS Build;
4. si puede configurarse sin editar el proyecto Xcode;
5. si puede mantenerse desde Windows/Linux.

---

# 7. Restricción técnica fundamental

El proyecto MUST permanecer compatible con:

- Expo;
- Continuous Native Generation;
- EAS Build;
- desarrollo en Windows/Linux.

El desarrollador NO dispone de:

- Mac;
- Xcode;
- entorno local macOS.

Por lo tanto:

> ninguna funcionalidad podrá depender de editar manualmente el proyecto iOS generado.

---

# 8. Stack tecnológico

## Core

```text
React Native
Expo
TypeScript
Expo Router
```

## Persistencia

```text
expo-sqlite
```

SQLite será la fuente de verdad local.

## Diseño iOS

Priorizar:

```text
expo-glass-effect
Expo UI
React Native
```

El diseño deberá adaptarse a Liquid Glass en versiones compatibles de iOS.

En versiones anteriores deberá existir un fallback visual razonable.

---

## Widgets

```text
expo-widgets
```

Se deberá priorizar la implementación mediante APIs oficiales de Expo.

---

## Archivos y backups

Usar cuando corresponda:

```text
expo-file-system
expo-sharing
expo-document-picker
```

---

## Builds

```text
EAS Build
```

---

## Actualizaciones

```text
EAS Update
```

para cambios compatibles con OTA.

---

# 9. Arquitectura

Arquitectura propuesta:

```text
src/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── expense/
│   │   ├── new.tsx
│   │   └── [id].tsx
│   ├── history.tsx
│   ├── analytics.tsx
│   └── settings.tsx
│
├── components/
│   ├── ui/
│   ├── expenses/
│   └── categories/
│
├── db/
│   ├── index.ts
│   ├── migrations/
│   ├── expenses.repository.ts
│   └── categories.repository.ts
│
├── services/
│   ├── backup.service.ts
│   └── deep-link.service.ts
│
├── hooks/
│
├── utils/
│
├── constants/
│
└── types/
```

Evitar arquitecturas excesivamente complejas.

No utilizar Clean Architecture, DDD u otras capas adicionales salvo necesidad real.

---

# 10. Modelo de datos

## expenses

```text
id
amount
category_id
note
expense_date
deleted_at
created_at
updated_at
```

### Reglas

`id`

UUID o identificador generado localmente.

`amount`

Guardar como entero positivo de pesos argentinos. El MVP no acepta decimales, cero ni valores negativos. Nunca usar coma flotante para persistencia o cálculos monetarios.

Ejemplo:

```text
$12.500
```

se almacena como:

```text
12500
```

`expense_date`

Por defecto es la fecha actual, pero debe poder modificarse para registrar gastos atrasados.

`deleted_at`

Es nulo para gastos activos. Al eliminar un gasto se completa esta fecha: el gasto pasa a la papelera durante 2 días y luego se elimina definitivamente.

---

## categories

```text
id
name
icon
color
sort_order
is_archived
created_at
updated_at
```

Categorías iniciales obligatorias:

- Comida
- Supermercado
- Transporte
- Otros

Las categorías son ilimitadas y todas pueden editarse. Al crear o editar una categoría el usuario puede usar un SF Symbol o un emoji para el ícono.

Reglas de categorías:

- el gasto siempre debe tener una categoría; `Otros` cubre los casos no clasificados;
- no permitir nombres duplicados ignorando mayúsculas y espacios;
- archivar una categoría la oculta del alta de gastos, sin alterar el historial;
- los cambios de nombre, ícono o color se reflejan en todos los gastos históricos;
- eliminar una categoría que tiene gastos exige reasignar todos sus gastos, incluidos los de la papelera, a una categoría activa;
- debe existir al menos una categoría activa.

---

## settings

Puede implementarse mediante tabla o almacenamiento de preferencias según corresponda.

Configuraciones previstas:

```text
currency
haptics_enabled
```

La moneda inicial y única del MVP es `ARS`.

---

# 11. Migraciones

La base de datos deberá utilizar migraciones versionadas.

Nunca depender de eliminar la base local para actualizar el esquema.

Ejemplo:

```text
001_initial_schema
002_add_category_icons
003_add_expense_notes
```

Cada nueva versión deberá poder actualizar instalaciones existentes.

---

# 12. Pantallas

## 12.1 Quick Add Expense

Pantalla más importante del producto.

Debe abrirse directamente mediante:

```text
expense://expense/new
```

Diseño aproximado:

```text
╭──────────────────────────────╮
│                              │
│          Nuevo gasto         │
│                              │
│          $ 12.500            │
│                              │
│    Categorías disponibles    │
│  🍔   🛒   🚗   •••         │
│                              │
│        Nota opcional         │
│                              │
│        Guardar gasto         │
│                              │
╰──────────────────────────────╯
```

El teclado numérico deberá abrirse automáticamente. La nota es opcional y no tendrá un límite artificial de longitud. Se deben mostrar siempre las categorías activas: no existe categoría predeterminada ni se recuerda la última utilizada.

---

# 13. Flujo de registro rápido

Flujo ideal:

```text
Lock Screen
     ↓
+$ Widget
     ↓
Deep Link
     ↓
Expense /new
     ↓
Ingresar monto
     ↓
Seleccionar categoría
     ↓
Guardar
     ↓
Feedback háptico
     ↓
Confirmación breve
     ↓
Home
```

Objetivo:

```text
< 5 segundos
```

para gastos habituales. La métrica aplica al flujo con una categoría ya visible; el desbloqueo de iOS depende del dispositivo y no cuenta como tiempo controlado por la app.

---

# 14. Pantalla Home

Mostrar como mínimo:

```text
Este mes
$ XXX.XXX
```

y una lista de gastos recientes, con un acceso visible a `Ver todos los gastos`.

Ejemplo:

```text
Últimos gastos

🍔 Almuerzo            $12.500
🚗 Combustible         $40.000
🛒 Supermercado        $31.400
```

---

# 15. Historial

Debe permitir:

- mostrar gastos agrupados por día mediante separadores como `Hoy`, `Ayer` o una fecha completa;
- navegar por fecha;
- editar;
- enviar a papelera tras confirmación;
- filtrar por categoría;
- usar períodos rápidos: hoy, esta semana y este mes;
- elegir una fecha concreta o un rango personalizado.

Los gastos en papelera no aparecen en el historial principal, totales ni filtros normales.

## Papelera

Eliminar un gasto requiere confirmación explícita. Tras confirmar, el gasto permanece en papelera durante 2 días y puede restaurarse durante ese período. La limpieza definitiva debe ejecutarse de forma segura al iniciar la aplicación o al abrir la papelera; no requiere tareas en segundo plano.

---

# 16. Resumen mensual

Mostrar:

- total mensual;
- cantidad de gastos;
- gasto por categoría.

Los gráficos, comparaciones entre períodos y analítica avanzada quedan fuera del MVP y pasan a post-MVP.

---

# 17. Desbloqueo al acceder desde Lock Screen

No implementar un bloqueo biométrico propio de la aplicación en el MVP ni usar `expo-local-authentication` para ese fin.

Al tocar el widget desde Lock Screen, iOS solicita su desbloqueo normal mediante Face ID, PIN o el mecanismo configurado por el usuario y luego abre `expense://expense/new`. La app no debe solicitar una segunda autenticación.

---

# 18. Widget de Lock Screen

Objetivo visual:

```text
      ◯
     + $
```

Al tocar:

```text
expense://expense/new
```

La implementación deberá utilizar:

```text
expo-widgets
```

siempre que las APIs necesarias estén disponibles.

Priorizar:

```text
accessoryCircular
```

Como alternativas:

```text
accessoryRectangular
accessoryInline
```

---

# 19. Widgets adicionales

Posibles widgets posteriores:

## Total de hoy

```text
Hoy
$45.300
```

## Total del mes

```text
Septiembre
$312.500
```

Estos widgets son secundarios al botón Quick Add.

---

# 20. Control de Lock Screen / Control Center

Una integración tipo Control de WidgetKit puede evaluarse posteriormente.

Regla:

No implementar si requiere mantener manualmente código Swift/Xcode.

Sólo podrá agregarse si puede resolverse mediante:

- Expo;
- Expo Modules;
- config plugins;
- generación automática;
- EAS Build;

sin necesidad de abrir Xcode localmente.

---

# 21. Deep Linking

Definir scheme:

```text
expense
```

Rutas inicialmente necesarias:

```text
expense://expense/new
expense://history
expense://settings
```

---

# 22. Liquid Glass

En dispositivos compatibles deberá utilizarse Liquid Glass donde aporte valor.

Priorizar especialmente:

- botones;
- tarjetas flotantes;
- navegación;
- acciones primarias;
- controles superpuestos.

No sobreutilizar blur o transparencia.

La legibilidad siempre tiene prioridad sobre el efecto visual.

---

# 23. Backup

## V1

Backup manual.

Ajustes:

```text
Datos
├── Exportar backup
└── Restaurar backup
```

Formato recomendado:

```text
JSON
```

Ejemplo:

```text
expense-backup-2026-09-05.json
```

El usuario podrá guardar el archivo en:

- iCloud Drive;
- Files;
- almacenamiento compatible con el share sheet.

El backup incluye gastos activos y en papelera, categorías (incluso archivadas), ajustes y la versión de esquema. El JSON no se cifra ni se protege con contraseña: su privacidad depende de la ubicación que el usuario elija al compartirlo o guardarlo.

---

# 24. Restauración

Antes de restaurar:

- validar esquema;
- validar versión;
- validar estructura;
- confirmar acción.

La restauración reemplaza todos los datos actuales; no intenta fusionarlos. Antes de reemplazar la base se debe crear un backup preventivo de los datos locales actuales. Debe poder importarse un backup generado por versiones anteriores siempre que exista una migración compatible.

---

# 25. Sync futuro

NO implementar inicialmente.

Potenciales alternativas:

```text
CloudKit
iCloud
```

Si se implementa, deberá conservar la filosofía:

```text
SQLite local
      +
sincronización opcional
```

La aplicación nunca deberá depender permanentemente de una conexión.

---

# 26. Distribución

La aplicación estará inicialmente destinada a uso privado.

No es requisito publicarla en App Store ni distribuirla por TestFlight durante el MVP. La distribución por defecto es:

```text
EAS Internal Distribution
```

En iOS se utilizará provisioning Ad Hoc. Cada uno de los dos iPhone iniciales debe tener su UDID registrado y todo dispositivo adicional requerirá un build o re-firma que lo incluya.

Este flujo requiere una membresía paga del Apple Developer Program.

---

# 27. Desarrollo desde Windows/Linux

Workflow esperado:

```text
Windows/Linux
     ↓
VS Code
     ↓
Expo
     ↓
TypeScript
     ↓
Git
     ↓
EAS Build
     ↓
macOS runner remoto
     ↓
iPhone
```

El desarrollador nunca deberá necesitar:

```text
Xcode local
```

---

# 28. Continuous Native Generation

El proyecto utilizará Expo Continuous Native Generation.

Los directorios:

```text
/ios
/android
```

no deberán formar parte del código mantenido manualmente salvo una justificación técnica extraordinaria.

Preferencia:

```text
app.config.ts
```

como fuente de configuración nativa.

---

# 29. Política de dependencias

Antes de instalar una dependencia, verificar:

- compatibilidad con versión actual de Expo;
- soporte para EAS Build;
- soporte para CNG;
- soporte mediante autolinking;
- existencia de config plugin cuando sea necesario;
- mantenimiento activo;
- necesidad real.

Evitar dependencias que requieran instrucciones como:

```text
Open ios/App.xcworkspace in Xcode
```

o:

```text
Edit Info.plist manually
```

o:

```text
Add this file through Xcode
```

salvo que dichas modificaciones puedan generarse automáticamente mediante config plugins.

---

# 30. EAS Update

Configurar EAS Update.

Podrán distribuirse OTA cambios de:

- JavaScript;
- TypeScript;
- estilos;
- componentes;
- assets compatibles;
- lógica;
- consultas SQLite;
- pantallas.

Cambios que modifiquen runtime nativo requerirán una nueva EAS Build.

---

# 31. Git

Utilizar Git desde el inicio.

Branches sugeridas:

```text
main
develop
feature/*
fix/*
```

Para un proyecto tan pequeño, `develop` es opcional.

Puede utilizarse simplemente:

```text
main
feature/*
```

---

# 32. Calidad

Antes de considerar una funcionalidad terminada deberá pasar:

```text
npm run lint
npm run typecheck
npm test
```

cuando corresponda.

---

# 33. Testing

Priorizar tests sobre:

- cálculos monetarios;
- migraciones;
- repositories;
- serialización de backups;
- restauración;
- validación de importes.
- papelera y eliminación definitiva después de 2 días;
- reasignación de gastos al eliminar categorías.

No intentar cubrir visualmente cada componente simple.

---

# 34. Seguridad y privacidad

La aplicación no deberá enviar datos financieros a terceros.

Por defecto:

```text
0 analytics
0 trackers
0 ads
0 backend
```

Los gastos deberán permanecer en el dispositivo salvo acción explícita del usuario.

---

# 35. Performance

Objetivos:

- apertura rápida;
- navegación instantánea;
- consultas SQLite simples;
- mínimo uso de memoria;
- mínimo consumo de batería.

La aplicación deberá sentirse como una utility, no como una aplicación web embebida.

---

# 36. Accesibilidad

Implementar:

- labels accesibles;
- botones con áreas táctiles adecuadas;
- Dynamic Type cuando sea posible;
- contraste suficiente;
- feedback háptico opcional.

---

# 37. Haptics

Al guardar un gasto correctamente:

```text
success haptic
```

Al producirse error:

```text
error haptic
```

Debe poder deshabilitarse desde ajustes si se considera necesario.

---

# 38. Manejo de moneda

V1:

```text
ARS
```

Pero no hardcodear la moneda en la lógica central.

Configurar:

```text
currency = ARS
```

para permitir posteriormente:

```text
USD
EUR
BRL
etc.
```

---

# 39. Criterios de éxito del MVP

El MVP se considera exitoso cuando:

1. puede instalarse en un iPhone mediante EAS;
2. no requiere Mac ni Xcode local;
3. permite registrar un gasto offline;
4. persiste el gasto en SQLite;
5. permite editarlo;
6. lo envía a papelera con restauración durante 2 días;
7. muestra el total mensual y gastos recientes en Home;
8. permite ver y filtrar todo el historial;
9. permite crear y editar categorías, y reasignar gastos al eliminar una;
10. posee acceso rápido desde Lock Screen mediante widget y el desbloqueo normal de iOS;
11. permite exportar backup;
12. permite una restauración validada que reemplaza los datos y crea backup preventivo;
13. funciona después de reiniciar la aplicación;
14. las migraciones funcionan correctamente.

---

# 40. MVP

## Must Have

- Expo + TypeScript.
- Expo Router.
- SQLite.
- Add Expense.
- Edit Expense.
- Delete Expense.
- Papelera de 2 días y restauración de gastos.
- Categorías.
- Home.
- Historial.
- Total mensual.
- Filtros de historial por categoría y fecha/rango.
- Deep link.
- Lock Screen widget.
- Backup.
- Restore.
- Liquid Glass cuando esté soportado.
- EAS Build.
- EAS Update.
- AGENTS.md.
- CLAUDE.md.

---

# 41. Post-MVP

## V1.1

- categorías favoritas;
- gasto recurrente;
- búsqueda;
- gráficos, comparaciones entre períodos y mejores estadísticas;
- widgets de totales.

## V1.2

- Siri Shortcuts;
- App Intents;
- Control Center;
- Action Button.

Siempre respetando la restricción Xcode-free.

## V2

Evaluar:

- iCloud;
- CloudKit;
- sincronización entre dispositivos;
- gastos compartidos entre dos usuarios.

---

# 42. AGENTS.md

El proyecto DEBE crear en la raíz:

```text
AGENTS.md
```

Este archivo será la fuente de verdad para cualquier agente de código que trabaje en el repositorio.

Contenido inicial obligatorio:

```markdown
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

`expense://expense/new`

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
```

---

# 43. CLAUDE.md

Crear también en la raíz:

```text
CLAUDE.md
```

Debe contener EXACTAMENTE una sola línea:

```markdown
See AGENTS.md
```

No duplicar las instrucciones de `AGENTS.md` dentro de `CLAUDE.md`.

La intención es:

```text
CLAUDE.md
    ↓
AGENTS.md
    ↓
fuente única de instrucciones
```

---

# 44. Estructura raíz esperada

El proyecto deberá terminar teniendo como mínimo:

```text
expense/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── app.config.ts
├── eas.json
├── package.json
├── tsconfig.json
├── assets/
├── src/
└── tests/
```

No mantener:

```text
ios/
android/
```

como código fuente manual salvo decisión explícita y documentada.

---

# 45. Regla para agentes

Si Claude Code, Codex u otro agente intenta resolver una funcionalidad realizando algo como:

```text
Open Xcode
Edit the Xcode project
Add a Swift file manually
Modify Info.plist inside /ios
Change Build Phases
Add a target manually
Configure signing manually
```

deberá considerarse incompatible con el proyecto.

El agente deberá buscar primero una alternativa Expo/CNG/EAS.

Si no existe alternativa viable, deberá documentarlo antes de continuar.

---

# 46. Filosofía final

Expense no debe convertirse en un proyecto grande.

Debe permanecer:

```text
pequeño
rápido
local
privado
mantenible
```

La prioridad no es incorporar más funcionalidades.

La prioridad es que las funcionalidades centrales sean absurdamente rápidas de utilizar.

La experiencia ideal continúa siendo:

```text
+$

12.500

🍔

Guardar

✓
```

Todo lo demás es secundario.
