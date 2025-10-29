// screens/AdminScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { supabase } from '../supabase';
import { useSettings } from '../SettingsContext';

export default function AdminScreen() {
  const { t } = useSettings();
  const [profiles, setProfiles] = useState([]);
  const [counts, setCounts] = useState({ bookings: 0, clients: 0, services: 0 });

  const load = async () => {
    const { data: p } = await supabase.from('profiles').select('user_id,full_name,role').order('full_name', { ascending: true });
    setProfiles(p || []);
    const [{ data: b }, { data: c }, { data: s }] = await Promise.all([
      supabase.rpc('count_table', { table_name: 'bookings' }),
      supabase.rpc('count_table', { table_name: 'clients' }),
      supabase.rpc('count_table', { table_name: 'services' }),
    ]);
    setCounts({
      bookings: b?.count ?? 0,
      clients: c?.count ?? 0,
      services: s?.count ?? 0,
    });
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (user_id, role) => {
    const next = role === 'admin' ? 'staff' : 'admin';
    await supabase.from('profiles').update({ role: next }).eq('user_id', user_id);
    load();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={s.card}>
        <Text style={s.title}>{t('counts')}</Text>
        <Text style={s.row}>{t('bookingsCount')}: {counts.bookings}</Text>
        <Text style={s.row}>{t('clients')}: {counts.clients}</Text>
        <Text style={s.row}>{t('servicesCount')}: {counts.services}</Text>
        <Pressable style={s.btn} onPress={load}><Text style={s.btnText}>{t('refresh')}</Text></Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.title}>{t('users')}</Text>
        {profiles.map((p) => (
          <View key={p.user_id} style={s.userRow}>
            <Text style={s.name}>{p.full_name || p.user_id.slice(0,8)}</Text>
            <Text style={s.role}>{p.role}</Text>
            <Pressable style={s.action} onPress={() => toggleRole(p.user_id, p.role)}>
              <Text style={s.actionText}>{p.role === 'admin' ? t('makeStaff') : t('makeAdmin')}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 8 },
  row: { color: '#111827', marginBottom: 6 },
  btn: { backgroundColor: '#111827', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '800' },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingVertical: 10 },
  name: { fontWeight: '800', color: '#111827' },
  role: { color: '#6B7280' },
  action: { backgroundColor: '#11182710', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  actionText: { color: '#111827', fontWeight: '800' },
});
