// components/ClientsAutocomplete.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, TextInput, FlatList, Text, Pressable, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import { useSettings } from '../SettingsContext';

export default function ClientsAutocomplete({ value, onChangeText, onPick }) {
  const { t } = useSettings();
  const [query, setQuery] = useState(value || '');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => setQuery(value || ''), [value]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const q = query.trim();
      if (q.length < 2) { setItems([]); setOpen(false); return; }
      const { data, error } = await supabase
        .from('clients')
        .select('id,name,phone,email')
        .ilike('name', `${q}%`)
        .limit(8);
      if (!ignore) {
        setItems(error ? [] : data || []);
        setOpen(true);
      }
    })();
    return () => (ignore = true);
  }, [query]);

  const renderItem = ({ item }) => (
    <Pressable style={s.row} onPress={() => { onPick?.(item); setOpen(false); }}>
      <Text style={s.name}>{item.name}</Text>
      <Text style={s.sub}>{[item.phone, item.email].filter(Boolean).join(' • ')}</Text>
    </Pressable>
  );

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={(txt) => { setQuery(txt); onChangeText?.(txt); }}
        placeholder={t('searchClient')}
        placeholderTextColor="#9AA3AF"
        style={s.input}
      />
      {open && items.length > 0 && (
        <View style={s.dropdown}>
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  input: {
    backgroundColor: '#FAFBFC', borderColor: '#E5E7EB', borderWidth: 1,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: '#111827', fontSize: 16,
  },
  dropdown: {
    borderColor: '#E5E7EB', borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14, backgroundColor: '#fff', maxHeight: 220, overflow: 'hidden',
  },
  row: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  name: { fontWeight: '800', color: '#111827' },
  sub: { color: '#6B7280', marginTop: 2 },
});
