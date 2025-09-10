// mobile/components/BookingList.js
import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Button, Modal } from 'react-native';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { upsertLocalBooking } from '../services/sync';

export default function BookingList({ bookings = [], providers = [], onUpdated }) {
  // Ensure static providers are always available in the editor too
  const ensureStatic = (list) => {
    const base = [...(list || [])];
    const staticProviders = [
      { user_id: 'lucyna', email: 'Lucyna', role: 'staff' },
      { user_id: 'magda',  email: 'Magda',  role: 'staff' },
      { user_id: 'ewa',    email: 'Ewa',    role: 'staff' },
    ];
    staticProviders.forEach(sp => {
      if (!base.find(p => p.user_id === sp.user_id)) base.push(sp);
    });
    return base;
  };

  const providerOptions = ensureStatic(providers);

  const [editing, setEditing] = useState(null); // booking object
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeField, setActiveField] = useState('start');

  const openEdit = (b) => setEditing({ ...b });
  const closeEdit = () => setEditing(null);

  const save = () => {
    const bk = {
      ...editing,
      starts_at: dayjs(editing.starts_at).toISOString(),
      ends_at: dayjs(editing.ends_at).toISOString(),
      sync_status: 'pending' // mark to sync again
    };
    upsertLocalBooking(bk);
    setEditing(null);
    onUpdated && onUpdated();
  };

  const onPick = (_e, date) => {
    if (!date) { setPickerVisible(false); return; }
    const d = dayjs(date).toISOString();
    setEditing(prev => prev ? { ...prev, [activeField === 'start' ? 'starts_at' : 'ends_at']: d } : prev);
    setPickerVisible(false);
  };

  return (
    <>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.when}>{dayjs(item.starts_at).format('MMM D, HH:mm')} → {dayjs(item.ends_at).format('HH:mm')}</Text>
            <Text style={styles.client}>{item.client_name} • {item.service}</Text>
            <Text style={styles.meta}>With {item.provider_name} • {item.sync_status?.toUpperCase?.() || ''}</Text>
            <View style={{ marginTop: 6 }}>
              <Button title="Edit" onPress={() => openEdit(item)} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ padding: 16 }}>No bookings yet.</Text>}
      />

      <Modal visible={!!editing} animationType="slide" transparent={false} onRequestClose={closeEdit}>
        {editing && (
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Edit booking</Text>

            <TextInput
              style={styles.input}
              value={editing.client_name}
              onChangeText={(t) => setEditing({ ...editing, client_name: t })}
              placeholder="Client name"
            />
            <TextInput
              style={styles.input}
              value={editing.client_phone}
              onChangeText={(t) => setEditing({ ...editing, client_phone: t })}
              placeholder="Client phone"
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              value={editing.service}
              onChangeText={(t) => setEditing({ ...editing, service: t })}
              placeholder="Service"
            />

            <Text style={{ fontWeight: '600', marginTop: 8 }}>Provider</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={editing.provider_id}
                onValueChange={(v) => {
                  const p = providerOptions.find(x => x.user_id === v);
                  setEditing({ ...editing, provider_id: v, provider_name: p?.email || editing.provider_name });
                }}
              >
                {providerOptions.map(p => (
                  <Picker.Item key={p.user_id} label={`${p.email} (${p.role})`} value={p.user_id} />
                ))}
              </Picker>
            </View>

            <Text style={{ marginTop: 8, fontWeight: '600' }}>
              Start: {dayjs(editing.starts_at).format('YYYY-MM-DD HH:mm')}
            </Text>
            <Button title="Pick start" onPress={() => { setActiveField('start'); setPickerVisible(true); }} />

            <Text style={{ marginTop: 8, fontWeight: '600' }}>
              End: {dayjs(editing.ends_at).format('YYYY-MM-DD HH:mm')}
            </Text>
            <Button title="Pick end" onPress={() => { setActiveField('end'); setPickerVisible(true); }} />

            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              value={editing.notes || ''}
              onChangeText={(t) => setEditing({ ...editing, notes: t })}
              placeholder="Notes"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Button title="Save" onPress={save} />
              <Button title="Cancel" onPress={closeEdit} />
            </View>
          </View>
        )}

        {pickerVisible && (
          <DateTimePicker
            value={new Date(editing ? (activeField === 'start' ? editing.starts_at : editing.ends_at) : Date.now())}
            mode="datetime"
            is24Hour
            onChange={(event, date) => {
              if (event.type === 'dismissed') {
                setPickerVisible(false);
                return;
              }
              onPick(event, date);
            }}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { padding: 16, borderBottomWidth: 1, gap: 4 },
  when: { fontWeight: '600' },
  client: {},
  meta: { color: '#666' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 8 },
  pickerWrap: { borderWidth: 1, borderRadius: 8, marginTop: 6 }
});
