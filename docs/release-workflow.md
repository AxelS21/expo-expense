# Flujo de desarrollo y entrega

La app se instala en el iPhone sin cuenta paga de Apple: GitHub Actions compila un `.ipa`, AltStore lo firma con un Apple ID gratuito y EAS Update entrega los cambios de JavaScript.

## Qué camino usar

| Cambio | Camino | Requiere build nueva |
| --- | --- | --- |
| Pantallas, lógica, estilos, textos, diseño del widget | EAS Update (OTA) | No |
| Paquete con código nativo, config de plugins (incluido `expo-widgets`), ícono, permisos, `app.config.ts` nativo | Build en GitHub Actions + AltStore | Sí |
| Vencimiento de la firma (7 días) | Refresh en AltStore | No |

El diseño del widget es JavaScript: la app lo guarda en el App Group al abrirse, así que también se actualiza por OTA.

## 1. Desarrollo diario

```bash
npx expo start
```

Probar en Expo Go. El widget no corre en Expo Go (`src/widgets/register.ts` lo omite); para probarlo hace falta la build instalada.

## 2. Publicar cambios de JavaScript (OTA)

```bash
npx eas-cli update --channel production --environment production --platform ios --message "Descripción del cambio"
```

En el iPhone: abrir la app, cerrarla del todo y volver a abrirla. La primera apertura descarga la actualización y la siguiente la aplica.

Para volver atrás, publicar otra actualización encima o usar `eas update:republish`.

## 3. Cambios nativos (build nueva)

1. Subir `version` en `app.config.ts`. `runtimeVersion` usa la política `appVersion`, así que las OTA viejas no se aplican a la build nueva y viceversa. **Si se omite este paso, una OTA puede pedir código nativo inexistente y romper la app al abrirla.** Subir también `ios.buildNumber` en cada build nativa: iOS cachea la lista de widgets según ese número, y si no cambia, los widgets nuevos no aparecen en la galería.
2. Ejecutar el workflow **iOS unsigned build** en GitHub Actions (`gh workflow run ios-unsigned.yml --ref main`).
3. Descargar el artifact `Expense-unsigned-ipa` y copiarlo al iPhone (por ejemplo, vía iCloud Drive).
4. En AltStore: **My Apps → "+"**, elegir el `.ipa` y responder **Keep App Extensions** (sin la extensión no hay widget).

## Por qué el workflow tiene pasos especiales

`.github/workflows/ios-unsigned.yml` compila sin certificado y agrega dos pasos para que el widget funcione con AltStore:

- **Firma ad-hoc con entitlements.** Las entitlements solo viajan dentro de una firma. Sin ellas, AltStore no registra el App Group y la app y el widget no comparten datos.
- **Sufijo del team en el App Group.** AltStore registra el grupo como `group.com.axelgere.expense.<TEAM_ID>` pero no modifica la clave `ExpoWidgetsAppGroupIdentifier` del `Info.plist`, que es la que lee `expo-widgets`. El workflow la ajusta con el input `team_id` (por defecto `LSLLT984X3`).

Si en el futuro se usa EAS Build con cuenta paga, estos dos pasos dejan de ser necesarios.

## Límites de la cuenta gratuita

- La firma vence a los 7 días. AltServer abierto en la PC y en la misma Wi-Fi la renueva solo.
- Hasta 10 App IDs por semana. Expense usa 2 (app y widget); reinstalar con el mismo bundle ID no gasta más.
- Hasta 3 apps sideloadeadas activas, contando AltStore.

## Diagnóstico del widget

**Ajustes → Diagnóstico del widget** (o `expense://diagnostics`) muestra:

- `widgetsDirectory`: `null` significa que la app no tiene acceso al App Group.
- `provisionedAppGroups`: los grupos que concedió el perfil de AltStore.
- `timeline` y `error`: qué escribió la app y si el registro falló.

Si el widget muestra un aviso que enlaza a la documentación de Apple, la extensión no encontró su diseño: revisar estos valores primero.
