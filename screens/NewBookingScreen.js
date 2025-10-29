import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import BigBtn from '../components/BigBtn';
import Input from '../components/Input';
import TimeInput from '../components/TimeInput';
import { useSettings } from '../context/SettingsContext';
import { POLAND_PREFIX, withPolandPrefix } from '../utils/format';

function NewBookingScreen({
  services,
  staff,
  onSave,
  initial,
  onSaved,
  showAlert,
  navigation,
  route,
  setEditBooking,
  styles,
}) {
  const { t, lang } = useSettings();

  const [title, setTitle] = useState(initial?.note ?? '');
  const [clientName, setClientName] = useState(initial?.client_name ?? '');
  const [clientPhone, setClientPhone] = useState(withPolandPrefix(initial?.client_phone ?? POLAND_PREFIX));
  const [serviceId, setServiceId] = useState(initial?.service_id ?? services[0]?.id);
  const [staffId, setStaffId] = useState(initial?.staff_id ?? staff[0]?.id);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const initialEmail = initial?.client_email ?? null;

  const initialDate = useMemo(() => {
    if (initial?.start_at) return new Date(initial.start_at);
    const today = new Date();
    today.setHours(10, 30, 0, 0);
    return today;
  }, [initial?.start_at]);

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialDate);
  const [hourText, setHourText] = useState(initialDate.getHours().toString().padStart(2, '0'));
  const [minuteText, setMinuteText] = useState(initialDate.getMinutes().toString().padStart(2, '0'));
  const [durationMin, setDurationMin] = useState(
    initial?.duration_min ?? (services.find((s) => s.id === serviceId)?.duration_min || 60)
  );

  const clientNameInputRef = useRef(null);
  const hourInputRef = useRef(null);
  const minuteInputRef = useRef(null);

  useEffect(() => {
    if (initial) {
      setTitle(initial.note ?? '');
      setClientName(initial.client_name ?? '');
      setClientPhone(withPolandPrefix(initial.client_phone ?? POLAND_PREFIX));
      setServiceId(initial.service_id ?? services[0]?.id);
      setStaffId(initial.staff_id ?? staff[0]?.id);
      setDurationMin(
        initial.duration_min ?? (services.find((s) => s.id === initial.service_id)?.duration_min || 60)
      );

      if (initial.start_at) {
        const start = new Date(initial.start_at);
        setDate(start);
        setTime(start);
        setHourText(start.getHours().toString().padStart(2, '0'));
        setMinuteText(start.getMinutes().toString().padStart(2, '0'));
      }
    } else {
      setTitle('');
      setClientName('');
      setClientPhone(POLAND_PREFIX);
      setServiceId(services[0]?.id);
      setStaffId(staff[0]?.id);
      setDurationMin(services.find((s) => s.id === services[0]?.id)?.duration_min || 60);
      const fresh = new Date();
      fresh.setHours(10, 30, 0, 0);
      setDate(fresh);
      setTime(fresh);
      setHourText('10');
      setMinuteText('30');
    }
  }, [initial, services, staff]);

  useEffect(() => {
    if (!initial) {
      const defaultDuration = services.find((s) => s.id === serviceId)?.duration_min || 60;
      setDurationMin(defaultDuration);
    }
  }, [serviceId, services, initial]);

  useEffect(() => {
    if (clientNameInputRef.current) {
      const timer = setTimeout(() => clientNameInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!route.params?.isEditing && setEditBooking) {
        setEditBooking(null);
      }
      if (route.params?.isEditing && navigation) {
        navigation.setParams({ isEditing: undefined });
      }
    }, [navigation, route.params?.isEditing, setEditBooking])
  );

  const onDateChange = (_event, nextDate) => {
    if (!nextDate) return;
    const adjusted = new Date(nextDate);
    adjusted.setHours(time.getHours(), time.getMinutes(), 0, 0);
    setDate(adjusted);
    setTime(adjusted);
  };

  const onTimeChange = (_event, nextTime) => {
    if (!nextTime) return;
    const adjusted = new Date(date);
    adjusted.setHours(nextTime.getHours(), nextTime.getMinutes(), 0, 0);
    setTime(adjusted);
    setHourText(adjusted.getHours().toString().padStart(2, '0'));
    setMinuteText(adjusted.getMinutes().toString().padStart(2, '0'));
  };

  const openAndroidDate = () =>
    DateTimePickerAndroid.open({ value: date, mode: 'date', onChange: onDateChange });

  const openAndroidTime = () =>
    DateTimePickerAndroid.open({ value: time, mode: 'time', is24Hour: true, onChange: onTimeChange });

  const formatDate = (value) => {
    const months =
      lang === 'pl'
        ? ['Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${value.getDate()} ${months[value.getMonth()]} ${value.getFullYear()}`;
  };

  const handleSave = async () => {
    if (!staffId) {
      showAlert(
        lang === 'pl' ? 'Blad' : 'Error',
        lang === 'pl' ? 'Wybierz personel' : 'Please select a staff member',
        'error'
      );
      return;
    }

    if (!clientName || !clientName.trim()) {
      showAlert('Error', t('clientNameRequired'), 'error');
      return;
    }

    if (!date) {
      showAlert('Error', t('dateRequired'), 'error');
      return;
    }

    const bookingStart = new Date(date);
    bookingStart.setHours(parseInt(hourText, 10) || 0, parseInt(minuteText, 10) || 0, 0, 0);

    if (bookingStart < new Date()) {
      showAlert('Error', t('pastTimeNotAllowed'), 'warning');
      return;
    }

    const success = await onSave({
      id: initial?.id,
      title,
      clientName: clientName.trim(),
      clientPhone,
      clientEmail: initialEmail,
      staffId,
      serviceId,
      durationMin: Number(durationMin || 60),
      startISO: bookingStart.toISOString(),
    });

    if (success) {
      onSaved?.();
    }
  };

  const selectedStaff = staff.find((s) => s.id === staffId);
  const staffColor = selectedStaff?.color || '#1d342e';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 240 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card title={t('client')}>
          <Text style={styles.label}>
            {t('clientName')} <Text style={styles.requiredMark}>*</Text>
          </Text>
          <Input
            ref={clientNameInputRef}
            baseStyle={styles.input}
            focusedStyle={styles.inputFocused}
            style={!clientName.trim() ? styles.inputRequired : null}
            value={clientName}
            onChangeText={setClientName}
            placeholder="Jane Doe"
            autoCapitalize="words"
          />

          <Text style={styles.label}>{t('phone')}</Text>
          <Input
            baseStyle={styles.input}
            focusedStyle={styles.inputFocused}
            value={clientPhone}
            onChangeText={(value) => setClientPhone(withPolandPrefix(value))}
            keyboardType="phone-pad"
            placeholder="+48 555 555 555"
          />
        </Card>

        <Card title={t('service')}>
          <Text style={styles.label}>{t('chooseService')}</Text>
          <View style={styles.customDropdownContainer}>
            <Pressable
              style={styles.customDropdownButton}
              onPress={() => setShowServiceDropdown((prev) => !prev)}
            >
              <View style={styles.customDropdownButtonContent}>
                <View style={{ flex: 1 }}>
                  {(() => {
                    const selected = services.find((s) => s.id === serviceId);
                    if (!selected) {
                      return <Text style={styles.customDropdownPlaceholder}>{t('chooseService')}</Text>;
                    }
                    const hours = Math.floor((selected.duration_min || 0) / 60);
                    const minutes = (selected.duration_min || 0) % 60;
                    const durationLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                    return (
                      <View>
                        <Text style={styles.customDropdownSelectedName}>{selected.name}</Text>
                        <Text style={styles.customDropdownSelectedDuration}>{durationLabel}</Text>
                      </View>
                    );
                  })()}
                </View>
                <Ionicons name={showServiceDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={styles.customDropdownArrow?.color || '#111827'} />
              </View>
            </Pressable>

            {showServiceDropdown && (
              <ScrollView style={styles.customDropdownList} nestedScrollEnabled>
                {services.map((service) => {
                  const hours = Math.floor((service.duration_min || 0) / 60);
                  const minutes = (service.duration_min || 0) % 60;
                  const timeLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                  const isSelected = service.id === serviceId;

                  return (
                    <Pressable
                      key={service.id}
                      style={[
                        styles.customDropdownItem,
                        isSelected && styles.customDropdownItemSelected,
                      ]}
                      onPress={() => {
                        setServiceId(service.id);
                        setDurationMin(service.duration_min || 60);
                        setShowServiceDropdown(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.customDropdownItemName,
                            isSelected && styles.customDropdownItemNameSelected,
                          ]}
                        >
                          {service.name}
                        </Text>
                        <Text
                          style={[
                            styles.customDropdownItemDuration,
                            isSelected && styles.customDropdownItemDurationSelected,
                          ]}
                        >
                          {timeLabel}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={styles.customDropdownCheckmark?.color || '#1d342e'}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </Card>

        <Card title={t('staff')}>
          <View style={styles.staffRow}>
            {staff.map((member) => {
              const isSelected = member.id === staffId;
              return (
                <Pressable
                  key={member.id}
                  onPress={() => setStaffId(member.id)}
                  style={[
                    styles.staffChip,
                    {
                      borderColor: isSelected ? member.color || '#1d342e' : '#E5E7EB',
                      backgroundColor: isSelected ? `${member.color || '#1d342e'}18` : '#fff',
                    },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: member.color || '#1d342e' }]} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.staffName,
                        isSelected && { color: member.color || '#1d342e' },
                      ]}
                      numberOfLines={1}
                    >
                      {member.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card title={t('apptTime')}>
          <Text style={styles.label}>
            {t('date')} <Text style={styles.requiredMark}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.input, !date && styles.inputRequired]}
            onPress={
              Platform.OS === 'android'
                ? openAndroidDate
                : () => setShowCalendar((prev) => !prev)
            }
          >
            <Text style={styles.inputText}>{formatDate(date)}</Text>
          </TouchableOpacity>

          {Platform.OS !== 'android' && showCalendar ? (
            <DateTimePicker
              mode="date"
              display="spinner"
              value={date}
              onChange={(_event, selectedDate) => {
                if (selectedDate) {
                  setDate(selectedDate);
                  setTime(selectedDate);
                  setShowCalendar(false);
                }
              }}
              style={{ marginTop: 12 }}
            />
          ) : null}

          <Text style={[styles.label, { marginTop: 16 }]}>
            {t('time')} <Text style={styles.requiredMark}>*</Text>
          </Text>
          <View style={styles.timeInputContainer}>
            <View style={styles.timeInputBox}>
              <Text style={styles.timeInputLabel}>{lang === 'pl' ? 'Godzina' : 'Hour'}</Text>
              <TimeInput
                ref={hourInputRef}
                baseStyle={styles.timeInput}
                focusedStyle={styles.timeInputFocused || styles.inputFocused}
                style={!time ? styles.inputRequired : null}
                value={hourText}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                  setHourText(cleaned);
                  const hour = parseInt(cleaned, 10);
                  if (!Number.isNaN(hour) && hour >= 0 && hour <= 23) {
                    const next = new Date(time);
                    next.setHours(hour);
                    setTime(next);
                  }
                }}
                onBlur={() => {
                  const hour = parseInt(hourText, 10) || 0;
                  const bounded = Math.min(Math.max(hour, 0), 23);
                  setHourText(bounded.toString().padStart(2, '0'));
                  const next = new Date(time);
                  next.setHours(bounded);
                  setTime(next);
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="09"
                placeholderTextColor="#9CA3AF"
                selectTextOnFocus
              />
            </View>

            <Text style={styles.timeInputSeparator}>:</Text>

            <View style={styles.timeInputBox}>
              <Text style={styles.timeInputLabel}>{lang === 'pl' ? 'Minuta' : 'Min'}</Text>
              <TimeInput
                ref={minuteInputRef}
                baseStyle={styles.timeInput}
                focusedStyle={styles.timeInputFocused || styles.inputFocused}
                style={!time ? styles.inputRequired : null}
                value={minuteText}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                  setMinuteText(cleaned);
                  const minute = parseInt(cleaned, 10);
                  if (!Number.isNaN(minute) && minute >= 0 && minute <= 59) {
                    const next = new Date(time);
                    next.setMinutes(minute);
                    setTime(next);
                  }
                }}
                onBlur={() => {
                  const minute = parseInt(minuteText, 10) || 0;
                  const bounded = Math.min(Math.max(minute, 0), 59);
                  setMinuteText(bounded.toString().padStart(2, '0'));
                  const next = new Date(time);
                  next.setMinutes(bounded);
                  setTime(next);
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="00"
                placeholderTextColor="#9CA3AF"
                selectTextOnFocus
              />
            </View>
          </View>
        </Card>

        <Card title={t('notesOptional')}>
          <Input
            baseStyle={styles.input}
            focusedStyle={styles.inputFocused}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., toner preferences, allergies"
            multiline
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </Card>

        <View style={{ marginTop: 16, paddingHorizontal: 32 }}>
          <BigBtn
            text={initial ? t('saveChanges') : t('saveBooking')}
            kind="primary"
            onPress={handleSave}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default NewBookingScreen;


