// mobile/components/BookingForm.js
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Pressable } from 'react-native';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { upsertLocalBooking } from '../services/sync';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function BookingForm({ currentUser, providers = [], onCreated }) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [service, setService] = useState('Consultation');

  const [startsAt, setStartsAt] = useState(dayjs().add(1, 'hour'));
  const [endsAt, setEndsAt] = useState(dayjs().add(2, 'hour'));

  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeField, setActiveField] = useState('start'); // 'start' | 'end'
  const [granularity, setGranularity] = useState('day');   // 'day' | 'month' | 'year'

  const [notes, setNotes] = useState('');
  const [providerId, setProviderId] = useState(currentUser?.id || '');

  const providerName = useMemo(() => {
    const p = providers.find(x => x.user_id === providerId);
    return p?.email || currentUser?.email || 'Staff';
  }, [providers, providerId, currentUser]);

  const openPicker = (field) => {
    setActiveField(field);
    setPickerVisible(true);
  };

  // unified change handler
  const onPick = (_e, date) => {
    if (date) {
      const d = dayjs(date);
      if (activeField === 'start') {
        setStartsAt(d);
        if (d.isAfter(endsAt)) setEndsAt(d.add(1, 'hour'));
      } else {
        setEndsAt(d);
        if (d.isBefore(startsAt)) setStartsAt(d.subtract(1, 'hour'));
      }
    }
    setPickerVisible(false);
  };

  const shift = (dir) => {
    const delta = dir === 'minus' ? -1 : 1;
    setStartsAt(startsAt.add(delta, granularity));
    setEndsAt(endsAt.add(delta, granularity));
  };

  const create = () => {
    const id = uid();
    upsertLocalBooking({
      id,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      service: service.trim(),
      provider_id: providerId || currentUser?.id,
      provider_name: providerName,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notes,
      status: 'confirmed',
      sync_status: 'pending'
    });
    onCreated && onCreated();
    setClientName(''); setClientPhone(''); setService('Consultation'); setNotes('');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>New Booking</Text>

      {/* Provider (both staff & admins can choose) */}
      <Text style={styles.label}>Provider</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={providerId} onValueChange={(v) => setProviderId(v)}>
          {providers.map(p => (
            <Picker.Item key={p.user_id} label={`${p.email} (${p.role})`} value={p.user_id} />
          ))}
        </Picker>
      </View>

      <TextInput
        placeholder="Client full name"
        style={styles.input}
        value={clientName}
        onChangeText={setClientName}
      />
      <TextInput
        placeholder="Client phone (+countrycode...)"
        style={styles.input}
        value={clientPhone}
        onChangeText={setClientPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        placeholder="Service"
        style={styles.input}
        value={service}
        onChangeText={setService}
      />

      {/* Granularity toggle */}
      <View style={styles.row}>
        <Text style={styles.label}>Granularity</Text>
        <View style={styles.toggleRow}>
          {['day','month','year'].map(g => (
            <Pressable
              key={g}
              onPress={() => setGranularity(g)}
              style={[styles.chip, granularity===g && styles.chipActive]}
            >
              <Text style={granularity===g ? styles.chipActiveText : styles.chipText}>
                {g.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Start / End with native picker */}
      <View style={styles.row}>
        <Text style={styles.when}>Start: {startsAt.format('YYYY-MM-DD HH:mm')}</Text>
        <Button title="Pick" onPress={() => openPicker('start')} />
      </View>
      <View style={styles.row}>
        <Text style={styles.when}>End:   {endsAt.format('YYYY-MM-DD HH:mm')}</Text>
        <Button title="Pick" onPress={() => openPicker('end')} />
      </View>

      {/* Shift controls */}
      <View style={styles.shiftRow}>
        <Button title="–" onPress={() => shift('minus')} />
        <Text style={{ marginHorizontal: 8 }}>Shift by {granularity}</Text>
        <Button title="+" onPress={() => shift('plus')} />
      </View>

      <TextInput
        placeholder="Notes (optional)"
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
      />

      <Button title="Create booking" onPress={create} />

      {pickerVisible && (
        <DateTimePicker
          value={(activeField === 'start' ? startsAt : endsAt).toDate()}
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: 1, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  label: { fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  toggleRow: { flexDirection: 'row', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 10, marginRight: 6 },
  chipActive: { backgroundColor: '#007bff' },
  chipText: { color: '#222' },
  chipActiveText: { color: 'white', fontWeight: '600' },
  when: { fontWeight: '600' },
  shiftRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  pickerWrap: { borderWidth: 1, borderRadius: 8, marginBottom: 10 }
});
