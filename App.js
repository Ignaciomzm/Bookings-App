import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, StatusBar, Modal, Switch,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import AuthGate from './AuthGate';
import { supabase } from './supabase';
import CalendarWeek from './CalendarWeek';
import { SettingsProvider, useSettings } from './SettingsContext';

/** ===== Helpers & constants ===== */
const POLAND_PREFIX = '+48 ';
const currency = (n) => `PLN ${Number(n || 0).toFixed(2)}`;
const timeLabel = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const dateLabel = (d) => d.toLocaleDateString();
const withPolandPrefix = (t) => (!t.startsWith('+48') ? POLAND_PREFIX + t.replace(/^[+\d\s]*/, '') : t);
const months = Array.from({ length: 12 }, (_, i) =>
  new Date(2025, i, 1).toLocaleString(undefined, { month: 'long' })
);

// Monday 00:00 for calendar
const weekStartOf = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();                  // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  d.setDate(d.getDate() + diff);
  return d;
};

// Foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export default function Root() {
  return (
    <SettingsProvider>
      <AuthGate>
        <AppContent />
      </AuthGate>
    </SettingsProvider>
  );
}

function AppContent() {
  const { t, lang } = useSettings();

  // Tabs
  const [screen, setScreen] = useState('BOOKINGS'); // 'BOOKINGS' | 'NEW' | 'SERVICES' | 'CAL'
  const [routeParams, setRouteParams] = useState(null);
  const go = (next, params = null) => { setRouteParams(params); setScreen(next); };

  // Current user id
  const [userId, setUserId] = useState(null);

  // Data
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Load & realtime
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUserId(u?.user?.id ?? null);

      const { data: staffRows } = await supabase.from('staff').select('*');
      const ordered = (staffRows || []).slice().sort((a, b) => {
        if (a.name === 'Lucyna') return -1;
        if (b.name === 'Lucyna') return 1;
        return a.name.localeCompare(b.name);
      });
      setStaff(ordered);

      const { data: svc } = await supabase.from('services').select('*').order('name');
      setServices(svc || []);

      const { data: bks } = await supabase.from('bookings').select('*').order('start_at', { ascending: true });
      setBookings(bks || []);
    })();

    const ch = supabase
      .channel('bookings-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        setBookings((prev) => {
          if (payload.eventType === 'INSERT') return [payload.new, ...prev];
          if (payload.eventType === 'UPDATE') return prev.map(b => (b.id === payload.new.id ? payload.new : b));
          if (payload.eventType === 'DELETE') return prev.filter(b => b.id !== payload.old.id);
          return prev;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  // Push: register token & upsert
  useEffect(() => {
    (async () => {
      try {
        if (!Device.isDevice) return;
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', { name: 'default', importance: Notifications.AndroidImportance.DEFAULT });
        }
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;
        const tokenResponse = await Notifications.getExpoPushTokenAsync();
        const token = tokenResponse.data;
        await supabase.from('device_tokens').upsert({
          token, user_id: userId, platform: Platform.OS, last_seen_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Push registration failed:', e);
      }
    })();
  }, [userId]);

  // Notify others
  const notifyOthers = async ({ title, body, data }) => {
    try {
      let query = supabase.from('device_tokens').select('token,user_id');
      if (userId) query = query.neq('user_id', userId);
      const { data: rows, error } = await query;
      if (error || !rows?.length) return;
      const messages = rows.map(r => ({ to: r.token, title, body, data, sound: null, channelId: 'default' }));
      const chunk = (arr, n) => arr.reduce((acc, _, i) => (i % n ? acc : [...acc, arr.slice(i, i + n)]), []);
      for (const batch of chunk(messages, 100)) {
        await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batch) });
      }
    } catch (e) { console.warn('Push send failed:', e); }
  };

  // Save / delete with double-booking protection + push
  const upsertBooking = async (payload) => {
    const start_at = new Date(payload.startISO).toISOString();
    const duration_min = Number(payload.durationMin || 60);
    const { data: clash } = await supabase
      .from('bookings').select('id')
      .eq('staff_id', payload.staffId).eq('start_at', start_at)
      .neq('id', payload.id ?? '00000000-0000-0000-0000-000000000000').limit(1);
    if (clash && clash.length) {
      Alert.alert(t('slotUnavailable'), t('slotTakenMsg'));
      await Notifications.scheduleNotificationAsync({ content: { title: t('slotUnavailable'), body: t('slotTakenMsg') }, trigger: null });
      return;
    }

    let op = 'created';
    if (payload.id) {
      op = 'updated';
      const { error } = await supabase.from('bookings').update({
        start_at, client_name: payload.clientName, client_phone: payload.clientPhone,
        client_email: payload.clientEmail || null, note: payload.title ?? null,
        staff_id: payload.staffId, service_id: payload.serviceId, duration_min,
      }).eq('id', payload.id);
      if (error) { Alert.alert('Update failed', error.message); return; }
    } else {
      const { error } = await supabase.from('bookings').insert({
        start_at, client_name: payload.clientName, client_phone: payload.clientPhone,
        client_email: payload.clientEmail || null, note: payload.title ?? null,
        staff_id: payload.staffId, service_id: payload.serviceId, duration_min,
      });
      if (error) { Alert.alert('Save failed', error.message); return; }
    }

    const staffName = staff.find(s => s.id === payload.staffId)?.name || 'Stylist';
    const when = new Date(start_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    await notifyOthers({ title: `Booking ${op}`, body: `${staffName} • ${when} • ${payload.clientName}`, data: { type: 'booking', op, staffId: payload.staffId, start_at } });

    go('BOOKINGS');
  };

  const deleteBooking = async (id) => {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) Alert.alert('Delete failed', error.message);
  };

  // Calendar: month/year pickers + current week
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [weekStart, setWeekStart] = useState(weekStartOf(today));
  useEffect(() => {
    // Jump to first Monday of selected month/year
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    setWeekStart(weekStartOf(firstDay));
  }, [selectedMonth, selectedYear]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* TOP BAR (title + profile button) */}
      <TopBar title="Salon" onProfile={() => setScreen(screen)} />

      {/* Tabs (lowered more; not hidden by profile modal) */}
      <View style={styles.topTabs}>
        <TabButton text={t('bookings')}    active={screen === 'BOOKINGS'} onPress={() => go('BOOKINGS')} />
        <TabButton text={t('newBooking')}  active={screen === 'NEW'}      onPress={() => go('NEW')} />
        <TabButton text={t('services')}    active={screen === 'SERVICES'} onPress={() => go('SERVICES')} />
        <TabButton text={t('calendar')}    active={screen === 'CAL'}      onPress={() => go('CAL')} />
      </View>

      {/* Centered header */}
      <Text style={styles.header}>
        {screen === 'BOOKINGS' && t('bookings')}
        {screen === 'NEW'      && (routeParams?.booking ? t('editBooking') : t('newSalonBooking'))}
        {screen === 'SERVICES' && t('services')}
        {screen === 'CAL'      && t('weeklyCalendar')}
      </Text>

      {screen === 'BOOKINGS' && (
        <BookingsScreen
          bookings={bookings}
          services={services}
          staff={staff}
          onEdit={(booking) => go('NEW', { booking })}
          onDelete={(id) => deleteBooking(id)}
        />
      )}

      {screen === 'NEW' && (
        <NewBookingScreen
          services={services}
          staff={staff}
          onSave={upsertBooking}
          initialBooking={routeParams?.booking || null}
        />
      )}

      {screen === 'SERVICES' && (
        <ServicesScreen
          services={services}
          refresh={async () => {
            const { data } = await supabase.from('services').select('*').order('name');
            setServices(data || []);
          }}
        />
      )}

      {screen === 'CAL' && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Month/Year dropdowns + nav controls */}
          <View style={styles.calControls}>
            <View style={styles.pickerGroup}>
              <View style={styles.pickerWrapSm}>
                <Picker selectedValue={selectedMonth} onValueChange={setSelectedMonth} style={styles.pickerSm}>
                  {months.map((m, i) => <Picker.Item key={i} label={`${t('month')}: ${m}`} value={i} />)}
                </Picker>
              </View>
              <View style={styles.pickerWrapSm}>
                <Picker selectedValue={selectedYear} onValueChange={setSelectedYear} style={styles.pickerSm}>
                  {Array.from({ length: 5 }, (_, k) => today.getFullYear() - 1 + k).map(y => (
                    <Picker.Item key={y} label={`${t('year')}: ${y}`} value={y} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.calHeader}>
              <SmallBtn text={t('prev')} onPress={() => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate()-7); return weekStartOf(d); })} />
              <SmallBtn text={t('today')} onPress={() => { setSelectedMonth(today.getMonth()); setSelectedYear(today.getFullYear()); setWeekStart(weekStartOf(today)); }} />
              <SmallBtn text={t('next')} onPress={() => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate()+7); return weekStartOf(d); })} />
            </View>
          </View>

          <CalendarWeek
            weekStart={weekStart}
            staff={staff}
            bookings={bookings.map(b => {
              const svc = services.find(s => s.id === b.service_id);
              return { ...b, service_name: svc?.name || null };
            })}
            onEdit={(b) => go('NEW', { booking: b })}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/** ====== TOP BAR with Profile modal (no overlap with tabs) ====== */
function TopBar({ title }) {
  const { t, lang, setLang, devAutoLogin, setDevAutoLogin } = useSettings();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setDisplayName(data?.user?.user_metadata?.full_name || '');
      setEmail(data?.user?.email || '');
    })();
  }, [open]);

  const saveDisplayName = async () => {
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
    if (error) Alert.alert('Save failed', error.message);
    else Alert.alert('OK', 'Display name updated');
  };

  const updateEmail = async () => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) Alert.alert('Save failed', error.message);
    else Alert.alert('Check inbox', 'Confirm your new email to complete the change.');
  };

  const updatePassword = async () => {
    if (!password?.trim()) return;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) Alert.alert('Save failed', error.message);
    else { Alert.alert('OK', 'Password updated'); setPassword(''); }
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>{title}</Text>
        <Pressable style={styles.profileBtn} onPress={() => setOpen(true)}>
          <Text style={{ color: '#111827', fontWeight: '800' }}>☰</Text>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('profile')}</Text>

            <Text style={styles.modalLabel}>{t('displayName')}</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor="#9AA3AF" />
            <SmallBtn text={t('save')} onPress={saveDisplayName} />

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>{t('changeEmail')}</Text>
            <TextInput style={styles.input} value={email} autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor="#9AA3AF" />
            <SmallBtn text={t('save')} onPress={updateEmail} />

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>{t('changePassword')}</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#9AA3AF" />
            <SmallBtn text={t('save')} onPress={updatePassword} />

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>{t('language')}</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={lang} onValueChange={setLang} style={styles.picker}>
                <Picker.Item label={t('english')} value="en" />
                <Picker.Item label={t('polish')} value="pl" />
              </Picker>
            </View>

            <View style={styles.devRow}>
              <Text style={{ color: '#111827', fontWeight: '700' }}>{t('autoLogin')}</Text>
              <Switch value={devAutoLogin} onValueChange={setDevAutoLogin} />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <SmallBtn text={t('cancel')} onPress={() => setOpen(false)} />
              <SmallBtn text={t('signOut')} onPress={signOut} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

/** ===== BOOKINGS SCREEN ===== */
function BookingsScreen({ bookings, services, staff, onEdit, onDelete }) {
  const { t } = useSettings();
  const now = Date.now();

  const withResolved = bookings.map((b) => {
    const start = new Date(b.start_at || b.startISO);
    const svc = services.find((s) => s.id === b.service_id) || null;
    const stf = staff.find((s) => s.id === b.staff_id) || null;
    return {
      ...b,
      start,
      serviceName: svc?.name ?? '—',
      servicePrice: svc?.price ?? 0,
      staffName: stf?.name ?? '—',
      clientName: b.client_name ?? b.clientName,
      clientPhone: b.client_phone ?? b.clientPhone,
      clientEmail: b.client_email ?? b.clientEmail,
      note: b.note ?? b.title,
      durationMin: b.duration_min ?? 60,
    };
  });

  const upcoming = withResolved.filter((b) => b.start.getTime() >= now).sort((a, b) => a.start - b.start);
  const past = withResolved.filter((b) => b.start.getTime() < now).sort((a, b) => b.start - a.start);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Card title={t('upcoming')}>
        {upcoming.length === 0 ? <Empty text="—" /> : (
          upcoming.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              canEdit
              onEdit={() => onEdit(b)}
              onDelete={() => onDelete(b.id)}
            />
          ))
        )}
      </Card>

      <Card title={t('past')}>
        {past.length === 0 ? <Empty text="—" /> : past.map((b) => <BookingCard key={b.id} booking={b} />)}
      </Card>
    </ScrollView>
  );
}

function BookingCard({ booking, canEdit, onEdit, onDelete }) {
  const { t } = useSettings();
  return (
    <View style={styles.bookingCard}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.bookingTitle}>{booking.serviceName} • {currency(booking.servicePrice)}</Text>
        <Text style={styles.bookingSub}>{dateLabel(booking.start)} {timeLabel(booking.start)} • {booking.durationMin} min</Text>
        <Text style={styles.bookingSub}>
          {booking.clientName} • {booking.clientPhone}{booking.clientEmail ? ` • ${booking.clientEmail}` : ''}
        </Text>
        <Text style={styles.bookingSub}>Staff: {booking.staffName}</Text>
        {booking.note ? <Text style={styles.bookingNote}>“{booking.note}”</Text> : null}
      </View>
      {canEdit ? (
        <View style={styles.bookingActions}>
          <SmallBtn text={t('edit')} onPress={onEdit} />
          <SmallBtn text={t('delete')} kind="danger" onPress={() => {
            Alert.alert(t('delete'), 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: t('delete'), style: 'destructive', onPress: onDelete },
            ]);
          }} />
        </View>
      ) : null}
    </View>
  );
}

/** ===== NEW BOOKING SCREEN ===== */
function NewBookingScreen({ services, staff, onSave, initialBooking }) {
  const { t } = useSettings();
  const [title, setTitle] = useState(initialBooking?.note ?? initialBooking?.title ?? '');
  const [clientName, setClientName] = useState(initialBooking?.client_name ?? initialBooking?.clientName ?? '');
  const [clientPhone, setClientPhone] = useState(initialBooking?.client_phone ?? initialBooking?.clientPhone ?? POLAND_PREFIX);
  const [clientEmail, setClientEmail] = useState(initialBooking?.client_email ?? initialBooking?.clientEmail ?? '');

  const [selectedStaffId, setSelectedStaffId] = useState(initialBooking?.staff_id ?? initialBooking?.staffId ?? (staff[0]?.id ?? null));
  const [selectedServiceId, setSelectedServiceId] = useState(initialBooking?.service_id ?? initialBooking?.serviceId ?? services[0]?.id);

  const initDate = initialBooking?.start_at ? new Date(initialBooking.start_at) :
                   initialBooking?.startISO ? new Date(initialBooking.startISO) : new Date();
  const [date, setDate] = useState(initDate);
  const [time, setTime] = useState(initDate);

  const defaultServiceDuration = useMemo(() => {
    const svc = services.find(s => s.id === selectedServiceId);
    return Number(svc?.duration_min || 60);
  }, [selectedServiceId, services]);
  const [durationMin, setDurationMin] = useState(initialBooking?.duration_min ?? defaultServiceDuration);
  useEffect(() => { if (!initialBooking) setDurationMin(defaultServiceDuration); }, [defaultServiceDuration]);

  const [showIOSDate, setShowIOSDate] = useState(false);
  const [showIOSTime, setShowIOSTime] = useState(false);

  const selectedService = useMemo(() => services.find(s => s.id === selectedServiceId) || services[0], [selectedServiceId, services]);
  const selectedStaff   = useMemo(() => staff.find(s => s.id === selectedStaffId) || null, [selectedStaffId, staff]);

  const onDateChange = (_e, d) => d && setDate(d);
  const onTimeChange = (_e, d) => d && setTime(d);
  const openAndroidDate = () => DateTimePickerAndroid.open({ value: date, mode: 'date', onChange: onDateChange });
  const openAndroidTime = () => DateTimePickerAndroid.open({ value: time, mode: 'time', is24Hour: true, onChange: onTimeChange });

  const handleSave = () => {
    const start = new Date(date);
    start.setHours(time.getHours(), time.getMinutes(), 0, 0);
    if (!clientName.trim()) return Alert.alert(t('missingName'), t('missingNameMsg'));
    if (!clientPhone.trim()) return Alert.alert(t('missingPhone'), t('missingPhoneMsg'));
    if (!selectedStaff) return Alert.alert(t('slotUnavailable'), t('selectStaffMsg'));
    if (!selectedService) return Alert.alert(t('slotUnavailable'), t('selectServiceMsg'));
    onSave({
      id: initialBooking?.id,
      title, clientName, clientPhone, clientEmail: clientEmail || null,
      staffId: selectedStaff.id, staffName: selectedStaff.name,
      serviceId: selectedService.id, price: selectedService.price,
      durationMin: Number(durationMin || 60),
      startISO: start.toISOString(),
      createdAt: initialBooking?.created_at ?? new Date().toISOString(),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Card title={t('client')}>
        <Label>{t('clientName')}</Label>
        <Input placeholder="Full name" value={clientName} onChangeText={setClientName} />

        <Label>{t('phone')}</Label>
        <Input placeholder="+48 555 555 555" keyboardType="phone-pad" value={clientPhone} onChangeText={(t) => setClientPhone(withPolandPrefix(t))} />

        <Label>{t('emailOptional')}</Label>
        <Input placeholder="client@example.com" keyboardType="email-address" autoCapitalize="none" value={clientEmail} onChangeText={setClientEmail} />
      </Card>

      <Card title={t('service')}>
        <Label>{t('chooseService')}</Label>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={selectedServiceId} onValueChange={setSelectedServiceId} style={styles.picker}>
            {services.map(s => <Picker.Item key={s.id} label={`${s.name} • ${currency(s.price)}`} value={s.id} />)}
          </Picker>
        </View>

        <View style={styles.serviceSummary}>
          <Stat label={t('price')} value={currency(selectedService?.price || 0)} />
          <Stat label={t('defaultDuration')} value={`${selectedService?.duration_min ?? 60} min`} />
        </View>

        <Label style={{ marginTop: 8 }}>{t('durationMin')}</Label>
        <Input placeholder="60" keyboardType="number-pad" value={String(durationMin)} onChangeText={(t) => setDurationMin(t.replace(/[^\d]/g, ''))} />
      </Card>

      <Card title={t('staff')}>
        <Label>{t('selectStylist')}</Label>
        <View style={styles.staffRow}>
          {staff.map(s => (
            <StaffChip
              key={s.id}
              name={s.name}
              role={s.role || 'Senior Stylist'}
              color={s.color || '#5C6BC0'}
              selected={selectedStaffId === s.id}
              onPress={() => setSelectedStaffId(prev => (prev === s.id ? null : s.id))}
            />
          ))}
        </View>
      </Card>

      <Card title={t('apptTime')}>
        <View style={styles.row}>
          <View style={styles.col}>
            <Label>{t('date')}</Label>
            <PrimaryButton text={dateLabel(date)} onPress={() => (Platform.OS === 'android' ? openAndroidDate() : setShowIOSDate(true))} />
          </View>
          <View style={styles.col}>
            <Label>{t('time')}</Label>
            <PrimaryButton text={timeLabel(time)} onPress={() => (Platform.OS === 'android' ? openAndroidTime() : setShowIOSTime(true))} />
          </View>
        </View>

        {Platform.OS === 'ios' && showIOSDate && (
          <View style={styles.iosPickerCard}>
            <DateTimePicker value={date} mode="date" display="inline" onChange={(e, d) => onDateChange(e, d)} />
            <Pressable style={styles.closeBtn} onPress={() => setShowIOSDate(false)}><Text style={styles.closeBtnText}>Done</Text></Pressable>
          </View>
        )}
        {Platform.OS === 'ios' && showIOSTime && (
          <View style={styles.iosPickerCard}>
            <DateTimePicker value={time} mode="time" display="spinner" is24Hour onChange={(e, d) => onTimeChange(e, d)} />
            <Pressable style={styles.closeBtn} onPress={() => setShowIOSTime(false)}><Text style={styles.closeBtnText}>Done</Text></Pressable>
          </View>
        )}
      </Card>

      <Card title={t('notesOptional')}>
        <Input placeholder="e.g., toner preference, allergies" value={title} onChangeText={setTitle} multiline />
      </Card>

      <View style={styles.saveWrap}>
        <CTA text={initialBooking ? t('saveChanges') : t('saveBooking')} onPress={handleSave} />
      </View>
    </ScrollView>
  );
}

/** ===== SERVICES (neat columns, names visible) ===== */
function ServicesScreen({ services, refresh }) {
  const { t } = useSettings();
  const [items, setItems] = useState(services);
  useEffect(() => setItems(services), [services]);

  const addService = async () => {
    const { error } = await supabase.from('services').insert({ name: 'New service', price: 0, duration_min: 60 });
    if (error) Alert.alert('Add failed', error.message); else refresh();
  };
  const updateLocal = (id, patch) => setItems(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  const saveOne = async (s) => {
    const { error } = await supabase.from('services').update({
      name: s.name, price: Number(s.price || 0), duration_min: Number(s.duration_min || 60),
    }).eq('id', s.id);
    if (error) Alert.alert('Save failed', error.message); else refresh();
  };
  const remove = async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) Alert.alert('Delete failed', error.message); else refresh();
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Card title={t('editServicesPrices')}>
        {/* Header row */}
        <View style={styles.svcHeaderRow}>
          <Text style={[styles.svcHeaderCell, { flex: 1 }]}>{t('servicesHeaderName')}</Text>
          <Text style={[styles.svcHeaderCell, { width: 110, textAlign: 'center' }]}>{t('servicesHeaderPrice')}</Text>
          <Text style={[styles.svcHeaderCell, { width: 130, textAlign: 'center' }]}>{t('servicesHeaderDuration')}</Text>
          <Text style={[styles.svcHeaderCell, { width: 120 }]} />
        </View>

        {items.map(s => (
          <View key={s.id} style={styles.serviceRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={s.name}
              onChangeText={(t) => updateLocal(s.id, { name: t })}
              placeholder="Service name"
              placeholderTextColor="#9AA3AF"
            />
            <TextInput
              style={[styles.input, styles.priceInput, { marginBottom: 0, textAlign: 'center' }]}
              value={String(s.price ?? 0)}
              keyboardType="decimal-pad"
              onChangeText={(t) => updateLocal(s.id, { price: t.replace(',', '.') })}
              placeholder="0"
              placeholderTextColor="#9AA3AF"
            />
            <TextInput
              style={[styles.input, styles.durationInput, { marginBottom: 0, textAlign: 'center' }]}
              value={String(s.duration_min ?? 60)}
              keyboardType="number-pad"
              onChangeText={(t) => updateLocal(s.id, { duration_min: t.replace(/[^\d]/g, '') })}
              placeholder="60"
              placeholderTextColor="#9AA3AF"
            />
            <View style={{ flexDirection: 'row', gap: 8, width: 120, justifyContent: 'flex-end' }}>
              <SmallBtn text="Save" onPress={() => saveOne(s)} />
              <SmallBtn text="✕" kind="danger" onPress={() => remove(s.id)} />
            </View>
          </View>
        ))}
        <View style={{ marginTop: 12 }}>
          <SmallBtn text={t('addService')} onPress={addService} />
        </View>
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

/** ===== UI bits ===== */
function TabButton({ text, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{text}</Text>
    </Pressable>
  );
}
function Card({ title, children }) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}
function Label({ children }) { return <Text style={styles.label}>{children}</Text>; }

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Input(props) { return <TextInput {...props} style={[styles.input, props.style]} placeholderTextColor="#9AA3AF" />; }
function PrimaryButton({ text, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.primary, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.primaryText}>{text}</Text>
    </Pressable>
  );
}
function CTA({ text, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={onPress}>
      <Text style={styles.ctaText}>{text}</Text>
    </Pressable>
  );
}
function SmallBtn({ text, onPress, kind = 'default' }) {
  return (
    <Pressable onPress={onPress} style={[styles.smallBtn, kind === 'danger' ? styles.smallDanger : styles.smallDefault]}>
      <Text style={kind === 'danger' ? styles.smallDangerText : styles.smallDefaultText}>{text}</Text>
    </Pressable>
  );
}
function StaffChip({ name, role, color, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.staffChip,
        { borderColor: selected ? color : '#E5E7EB', backgroundColor: selected ? `${color}15` : '#fff' },
        selected && { shadowOpacity: 0.18, shadowRadius: 6, shadowColor: color, shadowOffset: { width: 0, height: 3 } },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.staffName, selected && { color }]}>{name}</Text>
        <Text style={styles.staffRole}>{role || 'Senior Stylist'}</Text>
      </View>
    </Pressable>
  );
}
function Empty({ text }) { return <Text style={{ color: '#6B7280' }}>{text}</Text>; }

/** ===== Styles ===== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7FA' },

  // Top brand bar (prevents overlap with tabs)
  topBar: {
    paddingTop: (StatusBar.currentHeight || 0) + 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#F7F7FA',
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: '#111827' },
  profileBtn: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5E7EB' },

  // Tabs now clearly below the top bar
  topTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: '#F7F7FA',
  },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#E5E7EB', alignItems: 'center' },
  tabActive: { backgroundColor: '#111827' },
  tabText: { color: '#111827', fontWeight: '700' },
  tabTextActive: { color: '#fff' },

  // Centered header
  header: { fontSize: 26, fontWeight: '800', marginBottom: 6, color: '#111827', marginTop: 6, paddingHorizontal: 16, textAlign: 'center' },

  scroll: { padding: 16, paddingBottom: 40, paddingTop: 8 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },

  label: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  input: {
    backgroundColor: '#FAFBFC',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 16,
    marginBottom: 12,
  },

  priceInput: { width: 110 },
  durationInput: { width: 130 },

  pickerWrap: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', backgroundColor: '#FAFBFC', marginBottom: 8 },
  picker: { height: 52 },

  pickerGroup: { flexDirection: 'row', gap: 8 },
  pickerWrapSm: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden', backgroundColor: '#FAFBFC' },
  pickerSm: { height: 40, width: 200 },

  serviceSummary: { marginTop: 6, flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  stat: { backgroundColor: '#F3F4F6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  statLabel: { fontSize: 11, color: '#6B7280' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#111827' },

  staffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  staffChip: { borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: '46%' },
  staffName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  staffRole: { fontSize: 12, color: '#6B7280' },
  dot: { width: 10, height: 10, borderRadius: 10 },

  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  iosPickerCard: { marginTop: 10, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  closeBtn: { padding: 12, alignItems: 'flex-end' },
  closeBtnText: { fontWeight: '700', color: '#2563EB' },

  primary: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 12, alignItems: 'center', elevation: 2, shadowColor: '#111827', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  pressed: { opacity: 0.85 },

  saveWrap: { marginTop: 18 },
  cta: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  ctaPressed: { opacity: 0.9 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

  bookingCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 12, marginBottom: 10, backgroundColor: '#fff', flexDirection: 'row', gap: 10 },
  bookingTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  bookingSub: { fontSize: 13, color: '#4B5563' },
  bookingNote: { marginTop: 4, fontStyle: 'italic', color: '#6B7280' },
  bookingActions: { justifyContent: 'center', gap: 6 },

  smallBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center' },
  smallDefault: { backgroundColor: '#11182710' },
  smallDefaultText: { color: '#111827', fontWeight: '700' },
  smallDanger: { backgroundColor: '#EF444420' },
  smallDangerText: { color: '#B91C1C', fontWeight: '700' },

  serviceRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 },
  svcHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  svcHeaderCell: { color: '#6B7280', fontSize: 12, fontWeight: '800' },

  calControls: { gap: 10, marginBottom: 10 },
  calHeader: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  modalBack: { flex: 1, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalLabel: { color: '#6B7280', fontWeight: '600' },
});
