import { Link, Stack, router, useFocusEffect } from 'expo-router';
import { Fragment, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type ThemeColors, radius, spacing, useTheme } from '@/constants/theme';
import { listAllCategories } from '@/db/categories.repository';
import type { Category } from '@/types/models';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [categories, setCategories] = useState<Category[]>([]);

  useFocusEffect(
    useCallback(() => {
      listAllCategories().then(setCategories);
    }, [])
  );

  const active = categories.filter((category) => !category.isArchived);
  const archived = categories.filter((category) => category.isArchived);

  function renderGroup(items: Category[]) {
    return (
      <View style={styles.group}>
        {items.map((category, index) => (
          <Fragment key={category.id}>
            {index > 0 && <View style={styles.separator} />}
            <Link href={`/settings/categories/${category.id}`} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Editar ${category.name}`}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Text style={styles.icon}>{category.icon}</Text>
                <Text style={[styles.name, category.isArchived && styles.archivedName]} numberOfLines={1}>
                  {category.name}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Link>
          </Fragment>
        ))}
      </View>
    );
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="plus"
          accessibilityLabel="Nueva categoría"
          onPress={() => router.push('/settings/categories/new')}
        />
      </Stack.Toolbar>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.sectionHeader}>Activas</Text>
        {renderGroup(active)}
        {archived.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Archivadas</Text>
            {renderGroup(archived)}
          </>
        )}
      </ScrollView>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    sectionHeader: {
      fontSize: 13,
      color: colors.secondaryLabel,
      textTransform: 'uppercase',
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      marginHorizontal: spacing.lg,
    },
    group: { backgroundColor: colors.surface, borderRadius: radius.md },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 44,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    icon: { fontSize: 20 },
    name: { flex: 1, fontSize: 17, color: colors.label },
    archivedName: { color: colors.secondaryLabel },
    chevron: { fontSize: 17, color: colors.tertiaryLabel },
    pressed: { opacity: 0.6 },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.lg + 20 + spacing.md,
    },
  });
}
