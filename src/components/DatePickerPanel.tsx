import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle } from '@expo/ui/swift-ui/modifiers';
import { type ThemeColors, radius, spacing, useTheme } from '@/constants/theme';
import {
  dateFromDayKey,
  dayKeyFromDate,
  formatDayLabel,
  shiftDayKey,
  todayKey,
} from '@/components/expenses/expenseDate';

interface DatePickerPanelProps {
  /** Selected local day, 'YYYY-MM-DD'. */
  dayKey: string;
  onChange: (dayKey: string) => void;
  /** Latest selectable day; defaults to today. */
  maxDayKey?: string;
}

function endOfDay(dayKey: string): Date {
  const date = dateFromDayKey(dayKey);
  date.setHours(23, 59, 59, 999);
  return date;
}

/** Day stepper plus, on iOS, the native graphical SwiftUI calendar. */
export function DatePickerPanel({ dayKey, onChange, maxDayKey }: DatePickerPanelProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const max = maxDayKey ?? todayKey();
  const atMax = dayKey >= max;

  return (
    <View style={styles.panel}>
      <View style={styles.stepperRow}>
        <Pressable
          style={styles.stepperButton}
          onPress={() => onChange(shiftDayKey(dayKey, -1))}
          accessibilityRole="button"
          accessibilityLabel="Día anterior"
        >
          <Text style={styles.stepperGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.stepperLabel}>{formatDayLabel(dayKey)}</Text>
        <Pressable
          style={[styles.stepperButton, atMax && styles.disabled]}
          onPress={() => onChange(shiftDayKey(dayKey, 1))}
          disabled={atMax}
          accessibilityRole="button"
          accessibilityLabel="Día siguiente"
          accessibilityState={{ disabled: atMax }}
        >
          <Text style={styles.stepperGlyph}>›</Text>
        </Pressable>
      </View>
      {Platform.OS === 'ios' && (
        <Host matchContents>
          <DatePicker
            selection={dateFromDayKey(dayKey)}
            range={{ end: endOfDay(max) }}
            displayedComponents={['date']}
            onDateChange={(date) => onChange(dayKeyFromDate(date))}
            modifiers={[datePickerStyle('graphical')]}
          />
        </Host>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    panel: { borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.sm },
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stepperButton: {
      minWidth: 44,
      minHeight: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.fill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperGlyph: { fontSize: 24, color: colors.tint, fontWeight: '600' },
    stepperLabel: { fontSize: 17, fontWeight: '600', color: colors.label },
    disabled: { opacity: 0.4 },
  });
}
