import * as Haptics from 'expo-haptics';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { type ThemeColors, radius, spacing, useTheme } from '@/constants/theme';
import {
  createCategory,
  deleteCategory,
  findCategoryByName,
  listAllCategories,
  setCategoryArchived,
  updateCategory,
} from '@/db/categories.repository';
import type { Category } from '@/types/models';
import { isValidCategoryIcon } from '@/utils/emoji';

const LAST_ACTIVE_MESSAGE = 'Necesitás al menos una categoría activa.';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

async function fail(title: string, message: string) {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  Alert.alert(title, message);
}

/** Lets the user choose which active category receives the deleted one's expenses. */
function pickReassignTarget(options: Category[], onPick: (category: Category) => void) {
  const title = '¿A qué categoría pasan sus gastos?';
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...options.map((c) => `${c.icon} ${c.name}`), 'Cancelar'],
        cancelButtonIndex: options.length,
      },
      (index) => {
        const picked = options[index];
        if (picked) onPick(picked);
      }
    );
    return;
  }
  // Android Alert supports at most three buttons, so offer the first two targets plus cancel.
  Alert.alert(title, undefined, [
    ...options.slice(0, 2).map((c) => ({ text: `${c.icon} ${c.name}`, onPress: () => onPick(c) })),
    { text: 'Cancelar', style: 'cancel' as const },
  ]);
}

export default function CategoryEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [all, setAll] = useState<Category[] | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listAllCategories().then((categories) => {
      setAll(categories);
      const current = categories.find((c) => c.id === id);
      if (current) {
        setName(current.name);
        setIcon(current.icon);
      }
    });
  }, [id]);

  const category = all?.find((c) => c.id === id) ?? null;
  const otherActive = (all ?? []).filter((c) => !c.isArchived && c.id !== id);
  const isLastActive = category !== null && !category.isArchived && otherActive.length === 0;

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedIcon = icon.trim();
    if (!trimmedName) return fail('Falta el nombre', 'Escribí un nombre para la categoría.');
    if (!isValidCategoryIcon(trimmedIcon)) return fail('Emoji inválido', 'Usá un solo emoji.');

    setSaving(true);
    try {
      const clash = await findCategoryByName(trimmedName);
      if (clash && clash.id !== id) {
        setSaving(false);
        return fail('Nombre repetido', 'Ya existe una categoría con ese nombre.');
      }
      if (isNew) {
        await createCategory({ name: trimmedName, icon: trimmedIcon });
      } else {
        await updateCategory(id, { name: trimmedName, icon: trimmedIcon });
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      setSaving(false);
      await fail('No se pudo guardar', errorMessage(error));
    }
  }

  async function handleToggleArchive() {
    if (!category) return;
    if (!category.isArchived && isLastActive) return fail('No se puede archivar', LAST_ACTIVE_MESSAGE);
    try {
      await setCategoryArchived(category.id, !category.isArchived);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      await fail('No se pudo actualizar', errorMessage(error));
    }
  }

  function handleDelete() {
    if (!category) return;
    if (isLastActive || otherActive.length === 0) {
      void fail('No se puede eliminar', LAST_ACTIVE_MESSAGE);
      return;
    }
    pickReassignTarget(otherActive, (target) => {
      Alert.alert(
        `Eliminar ${category.name}`,
        `Sus gastos pasarán a ${target.icon} ${target.name}. Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteCategory(category.id, target.id);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              } catch (error) {
                await fail('No se pudo eliminar', errorMessage(error));
              }
            },
          },
        ]
      );
    });
  }

  if (all === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isNew && !category) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Categoría no encontrada</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Nueva categoría' : 'Editar categoría' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.group}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Emoji</Text>
            <TextInput
              style={[styles.input, icon.length > 0 && styles.emojiInput]}
              value={icon}
              onChangeText={setIcon}
              placeholder="Elegí un emoji"
              placeholderTextColor={colors.tertiaryLabel}
              maxLength={16}
              accessibilityLabel="Emoji de la categoría"
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej.: Mascotas"
              placeholderTextColor={colors.tertiaryLabel}
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              accessibilityLabel="Nombre de la categoría"
            />
          </View>
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
        >
          {saving ? (
            <ActivityIndicator color={colors.onTint} />
          ) : (
            <Text style={styles.saveText}>Guardar</Text>
          )}
        </Pressable>

        {category && (
          <View style={styles.group}>
            <Pressable
              accessibilityRole="button"
              onPress={handleToggleArchive}
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
            >
              <Text style={styles.actionText}>{category.isArchived ? 'Desarchivar' : 'Archivar'}</Text>
            </Pressable>
            <View style={styles.separator} />
            <Pressable
              accessibilityRole="button"
              onPress={handleDelete}
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
            >
              <Text style={styles.destructiveText}>Eliminar</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    muted: { fontSize: 15, color: colors.secondaryLabel },
    content: { padding: spacing.lg, gap: spacing.xl },
    group: { backgroundColor: colors.surface, borderRadius: radius.md },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    fieldLabel: { width: 72, fontSize: 17, color: colors.label },
    input: { flex: 1, fontSize: 17, color: colors.label, paddingVertical: spacing.md },
    emojiInput: { fontSize: 22 },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.lg,
    },
    saveButton: {
      backgroundColor: colors.tint,
      borderRadius: radius.lg,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveText: { color: colors.onTint, fontSize: 17, fontWeight: '600' },
    disabled: { opacity: 0.4 },
    actionRow: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.lg },
    actionText: { fontSize: 17, color: colors.tint },
    destructiveText: { fontSize: 17, color: colors.destructive },
    pressed: { opacity: 0.6 },
  });
}
