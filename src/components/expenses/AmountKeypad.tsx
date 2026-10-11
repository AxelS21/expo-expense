import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { type ThemeColors, radius, spacing, useTheme } from '@/constants/theme';
import { CURRENCY_FRACTION_DIGITS, DEFAULT_CURRENCY } from '@/constants/currency';
import { KEYPAD_DECIMAL_SEPARATOR } from '@/utils/money';

const MAX_WHOLE_DIGITS = 9;
const BACKSPACE = 'backspace';

interface AmountKeypadProps {
  value: string;
  onChange: (next: string) => void;
}

/** Applies one key press to the keypad buffer, enforcing digit and decimal limits. */
export function applyKey(buffer: string, key: string, fractionDigits: number): string {
  if (key === BACKSPACE) return buffer.slice(0, -1);
  if (key === KEYPAD_DECIMAL_SEPARATOR) {
    if (fractionDigits === 0 || buffer.includes(KEYPAD_DECIMAL_SEPARATOR)) return buffer;
    return buffer.length === 0 ? `0${key}` : `${buffer}${key}`;
  }
  const [whole = '', fraction] = buffer.split(KEYPAD_DECIMAL_SEPARATOR);
  if (fraction !== undefined) {
    return fraction.length >= fractionDigits ? buffer : `${buffer}${key}`;
  }
  if (whole === '0') return key;
  if (whole.length >= MAX_WHOLE_DIGITS) return buffer;
  if (whole.length === 0 && key === '0') return buffer;
  return `${buffer}${key}`;
}

export function AmountKeypad({ value, onChange }: AmountKeypadProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fractionDigits = CURRENCY_FRACTION_DIGITS[DEFAULT_CURRENCY];
  const leftKey = fractionDigits > 0 ? KEYPAD_DECIMAL_SEPARATOR : null;
  const rows: (string | null)[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [leftKey, '0', BACKSPACE],
  ];

  function press(key: string) {
    void Haptics.selectionAsync();
    onChange(applyKey(value, key, fractionDigits));
  }

  function clear() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange('');
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key, keyIndex) => {
            if (key === null) return <View key={keyIndex} style={styles.keySpacer} />;
            const isBackspace = key === BACKSPACE;
            return (
              <Pressable
                key={key}
                onPress={() => press(key)}
                onLongPress={isBackspace ? clear : undefined}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                accessibilityRole="button"
                accessibilityLabel={isBackspace ? 'Borrar' : key === KEYPAD_DECIMAL_SEPARATOR ? 'Coma decimal' : key}
                accessibilityHint={isBackspace ? 'Mantén presionado para borrar todo' : undefined}
              >
                <Text style={styles.keyText}>{isBackspace ? '⌫' : key}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    grid: { gap: spacing.sm },
    row: { flexDirection: 'row', gap: spacing.sm },
    key: {
      flex: 1,
      minHeight: 56,
      borderRadius: radius.md,
      backgroundColor: colors.fill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyPressed: { opacity: 0.55 },
    keySpacer: { flex: 1, minHeight: 56 },
    keyText: { fontSize: 26, fontWeight: '500', color: colors.label, fontVariant: ['tabular-nums'] },
  });
}
