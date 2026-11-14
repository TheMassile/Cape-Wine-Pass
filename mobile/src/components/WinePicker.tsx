// A field that opens a searchable list of an estate's wines, with "add a new wine".
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, space } from '@/lib/theme';

export function WinePicker({
  label,
  value,
  options,
  onChange,
  onAdd,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (name: string | null) => void;
  onAdd: (name: string) => Promise<string>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typed = query.trim().replace(/\s+/g, ' ');
  const shown = useMemo(() => {
    const q = typed.toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, typed]);
  const exact = options.some((o) => o.toLowerCase() === typed.toLowerCase());

  function close() {
    setOpen(false);
    setQuery('');
    setError(null);
  }

  function pick(name: string | null) {
    onChange(name);
    close();
  }

  async function add() {
    setAdding(true);
    setError(null);
    try {
      pick(await onAdd(typed));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add that wine.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.field}
        accessibilityRole="button"
        accessibilityLabel={label}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, !value && { color: colors.muted }]} numberOfLines={1}>
          {value ?? 'Choose…'}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={close} transparent>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search or type a wine, e.g. Pinotage 2021"
              placeholderTextColor={colors.muted}
              style={styles.search}
              autoFocus
              maxLength={80}
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <FlatList
              data={shown}
              keyExtractor={(w) => w}
              keyboardShouldPersistTaps="handled"
              style={{ flexGrow: 0, maxHeight: 320 }}
              ListHeaderComponent={
                typed.length >= 2 && !exact ? (
                  <Pressable onPress={add} disabled={adding} style={styles.row}>
                    <Text style={[styles.rowText, { color: colors.goldLight }]}>
                      {adding ? 'Adding…' : `+ Add “${typed}”`}
                    </Text>
                  </Pressable>
                ) : undefined
              }
              ListEmptyComponent={
                typed.length < 2 ? (
                  <Text style={styles.empty}>No wines listed for this estate yet. Type one to add it.</Text>
                ) : undefined
              }
              renderItem={({ item }) => (
                <Pressable onPress={() => pick(item)} style={styles.row}>
                  <Text style={[styles.rowText, item === value && { color: colors.goldLight }]}>{item}</Text>
                </Pressable>
              )}
            />
            <View style={styles.actions}>
              {value && (
                <Pressable onPress={() => pick(null)} hitSlop={8}>
                  <Text style={styles.action}>Clear</Text>
                </Pressable>
              )}
              <Pressable onPress={close} hitSlop={8}>
                <Text style={styles.action}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { borderWidth: 1, borderColor: colors.border, padding: space.sm, gap: 2 },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  value: { fontFamily: fonts.sans, fontSize: 14, color: colors.text },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: colors.card, padding: space.lg, gap: space.sm, maxHeight: '85%' },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 14,
    padding: space.sm,
  },
  row: { paddingVertical: space.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontFamily: fonts.sans, fontSize: 15, color: colors.text },
  empty: { fontFamily: fonts.sansLight, fontSize: 13, color: colors.muted, paddingVertical: space.sm },
  error: { fontFamily: fonts.sans, fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.lg, paddingTop: space.sm },
  action: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
});
