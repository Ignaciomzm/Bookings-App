import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import BigBtn from '../components/BigBtn';
import Card from '../components/Card';
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView';
import BaseInput from '../components/Input';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../supabase';
import { makeLink, dateLabel, timeLabel } from '../utils/format';

function AdminScreen({ reloadAll, onPreviewRole, currentEmail, showAlert, styles }) {
  const { t } = useSettings();
  const [profiles, setProfiles] = useState([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState({ open: false, title: '', items: [] });
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '', role: 'staff' });

  const Input = (props) => (
    <BaseInput baseStyle={styles.input} focusedStyle={styles.inputFocused} {...props} />
  );

  const load = async () => {
    // Attempt with email; if schema doesn't have it, retry without.
    let data;
    let error;
    ({ data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, phone, email')
      .order('full_name', { ascending: true }));

    if (error?.code === '42703') {
      const retry = await supabase
        .from('profiles')
        .select('user_id, full_name, role, phone')
        .order('full_name', { ascending: true });
      data = retry.data;
    } else if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setProfiles(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const setRole = async (user_id, nextRole) => {
    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('user_id', user_id);
    if (error) {
      showAlert('Error', error.message, 'error');
      return;
    }
    load();
  };

  const saveRow = async (p) => {
    const patch = {
      full_name: (p.full_name || '').trim(),
      phone: (p.phone || '').trim() || null,
      ...(p.email !== undefined ? { email: (p.email || '').trim() || null } : {}),
      role: p.role || 'staff',
    };

    const { error } = await supabase.from('profiles').update(patch).eq('user_id', p.user_id);
    if (error?.code === '42703') {
      const { error: e2 } = await supabase
        .from('profiles')
        .update({ full_name: patch.full_name, phone: patch.phone })
        .eq('user_id', p.user_id);
      if (e2) {
        showAlert('Error', e2.message, 'error');
        return;
      }
    } else if (error) {
      showAlert('Error', error.message, 'error');
      return;
    }
    showAlert('Success', 'Profile updated successfully', 'success');
    load();
  };

  const deleteProfileRow = async (user_id) => {
    showAlert(
      t('delete'),
      `${t('deleteProfile')}?`,
      'confirm',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('profiles').delete().eq('user_id', user_id);
            if (error) {
              showAlert('Error', error.message, 'error');
              return;
            }
            load();
          },
        },
      ],
    );
  };

  const sendReset = async (email) => {
    if (!email) {
      Alert.alert('Error', 'No email for this user.');
      return;
    }
    const redirectTo = makeLink('/password-reset');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) {
      Alert.alert('Failed', error.message);
      return;
    }
    Alert.alert('OK', 'Reset email sent');
  };

  const fetchBookingsForUser = async (p) => {
    const tryCreatedBy = async () =>
      supabase.from('bookings').select('*').eq('created_by', p.user_id).order('start_at', { ascending: false });

    const tryClientEmail = async () =>
      p.email
        ? supabase.from('bookings').select('*').eq('client_email', p.email).order('start_at', { ascending: false })
        : { data: [], error: null };

    const tryClientName = async () =>
      p.full_name
        ? supabase.from('bookings').select('*').ilike('client_name', `%${p.full_name}%`).order('start_at', { ascending: false })
        : { data: [], error: null };

    let res = await tryCreatedBy();
    if (res.error?.code === '42703') res = { data: [], error: null };
    if ((res.data || []).length === 0) {
      const res2 = await tryClientEmail();
      if ((res2.data || []).length) res = res2;
      else {
        const res3 = await tryClientName();
        if ((res3.data || []).length) res = res3;
      }
    }

    if (res.error) {
      Alert.alert('Error', res.error.message);
      return;
    }
    const items = (res.data || []).map((b) => ({
      id: b.id,
      when: `${dateLabel(new Date(b.start_at))} ${timeLabel(new Date(b.start_at))}`,
      client: b.client_name,
      email: b.client_email,
      phone: b.client_phone,
      note: b.note,
      duration_min: b.duration_min,
    }));

    setModal({
      open: true,
      title: `${t('viewBookings')}  ${p.full_name || p.email || p.user_id}`,
      items,
    });
  };

  const toCSV = (rows) => {
    if (!rows?.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  };

  const exportAllBookings = async () => {
    const { data, error } = await supabase.from('bookings').select('*').order('start_at', { ascending: true });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    const rows = (data || []).map((b) => ({
      id: b.id,
      start_at: b.start_at,
      client_name: b.client_name,
      client_phone: b.client_phone,
      client_email: b.client_email,
      duration_min: b.duration_min,
      note: b.note,
    }));
    const csv = toCSV(rows);
    if (!csv) {
      Alert.alert('Info', t('noBookings'));
      return;
    }
    await Share.share({ message: csv });
  };

  const exportUserBookings = async (p) => {
    const { data: all } = await supabase.from('bookings').select('*').order('start_at', { ascending: true });
    const rows = (all || [])
      .filter(
        (b) =>
          (b.created_by && b.created_by === p.user_id) ||
          (p.email && b.client_email === p.email) ||
          (p.full_name && (b.client_name || '').toLowerCase().includes((p.full_name || '').toLowerCase())),
      )
      .map((b) => ({
        id: b.id,
        start_at: b.start_at,
        client_name: b.client_name,
        client_phone: b.client_phone,
        client_email: b.client_email,
        duration_min: b.duration_min,
        note: b.note,
      }));
    const csv = toCSV(rows);
    if (!csv) {
      Alert.alert('Info', t('noBookings'));
      return;
    }
    await Share.share({ message: csv });
  };

  const previewAsUser = (p) => {
    const label = p.full_name || p.email || p.user_id.slice(0, 8);
    onPreviewRole?.({ role: p.role || 'staff', label });
    Alert.alert('Preview', `Now previewing as ${label}`);
  };

  const createTempPassword = () =>
    Math.random().toString(36).slice(-8) + 'A!' + Math.random().toString(36).slice(-4);

  const addUser = async () => {
    const full_name = (addForm.full_name || '').trim();
    const email = (addForm.email || '').trim();
    const phone = (addForm.phone || '').trim() || null;
    const role = addForm.role || 'staff';
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Enter a valid email.');
      return;
    }
    const tempPass = createTempPassword();
    const redirectTo = makeLink('/auth-callback');

    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPass,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    const uid = data?.user?.id;
    if (uid) {
      const patch = { user_id: uid, full_name, phone, role };
      let up = await supabase.from('profiles').upsert({ ...patch, email });
      if (up.error?.code === '42703') up = await supabase.from('profiles').upsert(patch);
      if (up.error) {
        Alert.alert('Error', up.error.message);
        return;
      }
    }

    setAddOpen(false);
    setAddForm({ full_name: '', email: '', phone: '', role: 'staff' });
    Alert.alert('User created', 'A confirmation email has been sent.');
    load();
  };

  const filtered = profiles.filter((p) => {
    const hay = `${p.full_name || ''} ${p.email || ''} ${p.role || ''}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <>
      <KeyboardAwareScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 300 }]}>
        <Card title={t('users')}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Input placeholder={t('searchUsers')} value={q} onChangeText={setQ} style={{ flex: 1 }} />
            <BigBtn text={t('addUser')} onPress={() => setAddOpen(true)} />
          </View>

          {filtered.length === 0 ? (
            <Text style={styles.empty}></Text>
          ) : (
            filtered.map((p) => (
              <View key={p.user_id} style={styles.adminRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{p.user_id}</Text>

                  <Text style={styles.label}>{t('name')}</Text>
                  <Input
                    value={p.full_name || ''}
                    onChangeText={(txt) =>
                      setProfiles((prev) => prev.map((x) => (x.user_id === p.user_id ? { ...x, full_name: txt } : x)))
                    }
                    placeholder="Full name"
                  />

                  {p.email !== undefined ? (
                    <>
                      <Text style={styles.label}>{t('emailProfiles')}</Text>
                      <Input
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={p.email || ''}
                        onChangeText={(txt) =>
                          setProfiles((prev) => prev.map((x) => (x.user_id === p.user_id ? { ...x, email: txt } : x)))
                        }
                        placeholder="user@example.com"
                      />
                    </>
                  ) : null}

                  <Text style={styles.label}>{t('phoneProfiles')}</Text>
                  <Input
                    keyboardType="phone-pad"
                    value={p.phone || ''}
                    onChangeText={(txt) =>
                      setProfiles((prev) => prev.map((x) => (x.user_id === p.user_id ? { ...x, phone: txt } : x)))
                    }
                    placeholder="+48 ..."
                  />

                  <Text style={styles.label}>{t('role')}</Text>
                  <View style={styles.pickerWrapTight}>
                    <Picker
                      selectedValue={p.role || 'staff'}
                      onValueChange={(val) =>
                        setProfiles((prev) =>
                          prev.map((x) => (x.user_id === p.user_id ? { ...x, role: val } : x)),
                        )
                      }
                      style={styles.yearPickerResponsive}
                    >
                      <Picker.Item label="staff" value="staff" />
                      <Picker.Item label="admin" value="admin" />
                      <Picker.Item label="disabled" value="disabled" />
                    </Picker>
                  </View>
                </View>

                <View style={{ gap: 6, width: 208 }}>
                  <BigBtn text={t('save')} onPress={() => saveRow(p)} />
                  <BigBtn
                    text={p.role === 'admin' ? t('makeStaff') : t('makeAdmin')}
                    onPress={() => setRole(p.user_id, p.role === 'admin' ? 'staff' : 'admin')}
                  />
                  <BigBtn
                    text={p.role === 'disabled' ? t('enable') : t('disable')}
                    kind={p.role === 'disabled' ? 'default' : 'danger'}
                    onPress={() => setRole(p.user_id, p.role === 'disabled' ? 'staff' : 'disabled')}
                  />
                  <BigBtn text={t('viewBookings')} onPress={() => fetchBookingsForUser(p)} />
                  <BigBtn text={t('exportUser')} onPress={() => exportUserBookings(p)} />
                  {p.email !== undefined ? <BigBtn text={t('sendReset')} onPress={() => sendReset(p.email)} /> : null}
                  <BigBtn text={t('deleteProfile')} kind="danger" onPress={() => deleteProfileRow(p.user_id)} />
                  <BigBtn text={t('previewAs')} onPress={() => previewAsUser(p)} />
                </View>
              </View>
            ))
          )}
        </Card>

        <View style={{ height: 12 }} />
        <View style={{ paddingHorizontal: 32 }}>
          <BigBtn text={t('exportAll')} onPress={exportAllBookings} />
        </View>
        <View style={{ height: 24 }} />
      </KeyboardAwareScrollView>

      <Modal
        visible={modal.open}
        transparent
        onRequestClose={() => setModal((m) => ({ ...m, open: false }))}
        animationType="fade"
      >
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modal.title}</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {modal.items.length === 0 ? (
                <Text style={styles.empty}></Text>
              ) : (
                modal.items.map((it) => (
                  <View key={it.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#EEE' }}>
                    <Text style={{ fontWeight: '800' }}>{it.when}</Text>
                    <Text>{it.client}</Text>
                    <Text style={{ color: '#6B7280' }}>{it.email || ''}</Text>
                    <Text style={{ color: '#6B7280' }}>{it.phone || ''}</Text>
                    <Text style={{ color: '#6B7280' }}>{it.note || ''}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={{ marginTop: 10, alignItems: 'flex-end' }}>
              <BigBtn text={t('close')} onPress={() => setModal((m) => ({ ...m, open: false }))} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <Pressable style={styles.modalBack} onPress={() => setAddOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('addUser')}</Text>
            <Text style={styles.label}>{t('name')}</Text>
            <Input
              value={addForm.full_name}
              onChangeText={(v) => setAddForm((f) => ({ ...f, full_name: v }))}
              placeholder="Jane Doe"
            />
            <Text style={styles.label}>Email</Text>
            <Input
              value={addForm.email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(v) => setAddForm((f) => ({ ...f, email: v }))}
              placeholder="user@example.com"
            />
            <Text style={styles.label}>{t('phoneProfiles')}</Text>
            <Input
              value={addForm.phone}
              keyboardType="phone-pad"
              onChangeText={(v) => setAddForm((f) => ({ ...f, phone: v }))}
              placeholder="+48 ..."
            />
            <Text style={styles.label}>{t('role')}</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={addForm.role}
                onValueChange={(v) => setAddForm((f) => ({ ...f, role: v }))}
                style={styles.pickerBig}
              >
                <Picker.Item label="staff" value="staff" />
                <Picker.Item label="admin" value="admin" />
                <Picker.Item label="disabled" value="disabled" />
              </Picker>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <BigBtn text={t('cancel')} onPress={() => setAddOpen(false)} />
              <BigBtn text={t('addUser')} kind="primary" onPress={addUser} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default AdminScreen;
