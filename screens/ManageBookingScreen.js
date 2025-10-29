import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import BigBtn from '../components/BigBtn';
import Card from '../components/Card';
import Input from '../components/Input';
import TimeInput from '../components/TimeInput';
import { useSettings } from '../context/SettingsContext';
import { POLAND_PREFIX, withPolandPrefix } from '../utils/format';

function ManageBookingScreen({ booking, services, staff, onSave, onDelete, onBack, showAlert, styles }) {
  const { t, lang } = useSettings();

  const [title, setTitle] = useState(booking?.note ?? '');
  const [clientName, setClientName] = useState(booking?.client_name ?? '');
  const [clientPhone, setClientPhone] = useState(withPolandPrefix(booking?.client_phone ?? POLAND_PREFIX));
  const [serviceId, setServiceId] = useState(booking?.service_id ?? services[0]?.id);
  const [staffId, setStaffId] = useState(booking?.staff_id ?? staff[0]?.id);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const initialEmail = booking?.client_email ?? null;

  const today = new Date();
  const initDate = booking?.start_at
    ? new Date(booking.start_at)
    : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30, 0, 0);
  const [date, setDate] = useState(initDate);
  const [time, setTime] = useState(initDate);

  // Separate state for input text to allow proper editing
  const [hourText, setHourText] = useState(initDate.getHours().toString().padStart(2, '0'));
  const [minuteText, setMinuteText] = useState(initDate.getMinutes().toString().padStart(2, '0'));

  const [durationMin, setDurationMin] = useState(
    booking?.duration_min ?? (services.find((s) => s.id === serviceId)?.duration_min || 60)
  );

  // Update all form fields when booking prop changes
  useEffect(() => {
    if (booking) {
      setTitle(booking.note ?? '');
      setClientName(booking.client_name ?? '');
      setClientPhone(withPolandPrefix(booking.client_phone ?? POLAND_PREFIX));
      setServiceId(booking.service_id ?? services[0]?.id);
      setStaffId(booking.staff_id ?? staff[0]?.id);
      setDurationMin(booking.duration_min ?? (services.find((s) => s.id === booking.service_id)?.duration_min || 60));
      
      if (booking.start_at) {
        const bookingDate = new Date(booking.start_at);
        setDate(bookingDate);
        setTime(bookingDate);
        setHourText(bookingDate.getHours().toString().padStart(2, '0'));
        setMinuteText(bookingDate.getMinutes().toString().padStart(2, '0'));
      }
    }
  }, [booking, services, staff]);

  const onDateChange = (_e, d) => d && setDate(d);
  const onTimeChange = (_e, d) => d && setTime(d);

  const openAndroidDate = () => DateTimePickerAndroid.open({ value: date, mode: 'date', onChange: onDateChange });
  const openAndroidTime = () => DateTimePickerAndroid.open({ value: time, mode: 'time', is24Hour: true, onChange: onTimeChange });

  // Language-aware date formatting
  const formatDate = (date) => {
    const months = lang === 'pl' 
      ? ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paz', 'Lis', 'Gru']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  const formatTime = (time) => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const submit = async () => {
    if (!clientName.trim()) {
      showAlert(t('error'), t('clientNameRequired'), 'error');
      return;
    }

    if (!clientPhone.trim() || clientPhone === POLAND_PREFIX) {
      showAlert(t('error'), t('phoneRequired'), 'error');
      return;
    }

    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(parseInt(hourText, 10) || 0, parseInt(minuteText, 10) || 0, 0, 0);

    const payload = {
      id: booking.id, // Include the booking ID for update
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: initialEmail,
      staffId,
      serviceId,
      durationMin,
      startISO: combinedDateTime.toISOString(),
      title: title.trim() || null,
    };

    const success = await onSave(payload);
    if (success && onBack) {
      onBack();
    }
  };

  const handleDelete = () => {
    showAlert(
      t('delete'), 
      'Are you sure you want to delete this booking?', 
      'confirm', 
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive', 
          onPress: () => {
            onDelete(booking.id);
            if (onBack) onBack();
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 300 }]}>

        <Card title={t('client')}>
          <Text style={styles.label}>
            {t('clientName')} <Text style={styles.requiredMark}>*</Text>
          </Text>
          <Input
            baseStyle={styles.input}
            focusedStyle={styles.inputFocused}
            style={!clientName.trim() ? styles.inputRequired : null}
            value={clientName}
            onChangeText={setClientName}
            placeholder="Jane Doe"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.label}>{t('phone')}</Text>
          <Input
            baseStyle={styles.input}
            focusedStyle={styles.inputFocused}
            style={!clientPhone.trim() || clientPhone === POLAND_PREFIX ? styles.inputRequired : null}
            value={clientPhone}
            onChangeText={(value) => setClientPhone(withPolandPrefix(value))}
            placeholder={POLAND_PREFIX.trim()}
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
        </Card>

        <Card title={t('service')}>
          <Text style={styles.label}>{t('chooseService')}</Text>
          
          <View style={styles.customDropdownContainer}>
            <Pressable 
              style={styles.customDropdownButton} 
              onPress={() => setShowServiceDropdown(!showServiceDropdown)}
            >
              <View style={styles.customDropdownButtonContent}>
                <View style={{ flex: 1 }}>
                  {(() => {
                    const selectedService = services.find(s => s.id === serviceId);
                    if (!selectedService) return <Text style={styles.customDropdownPlaceholder}>Select a service</Text>;
                    
                    const hours = Math.floor(selectedService.duration_min / 60);
                    const minutes = selectedService.duration_min % 60;
                    const timeLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                    
                    return (
                      <View>
                        <Text style={styles.customDropdownSelectedName}>{selectedService.name}</Text>
                        <Text style={styles.customDropdownSelectedDuration}>{timeLabel}</Text>
                      </View>
                    );
                  })()}
                </View>
                <Ionicons name={showServiceDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={styles.customDropdownArrow?.color || '#111827'} />
              </View>
            </Pressable>
            
            {showServiceDropdown && (
              <ScrollView style={styles.customDropdownList} nestedScrollEnabled={true}>
                {services.map((service) => {
                  const hours = Math.floor(service.duration_min / 60);
                  const minutes = service.duration_min % 60;
                  const timeLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                  const isSelected = service.id === serviceId;
                  
                  return (
                    <Pressable
                      key={service.id}
                      style={[
                        styles.customDropdownItem,
                        isSelected && styles.customDropdownItemSelected
                      ]}
                      onPress={() => {
                        setServiceId(service.id);
                        setDurationMin(service.duration_min);
                        setShowServiceDropdown(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.customDropdownItemName,
                          isSelected && styles.customDropdownItemNameSelected
                        ]}>
                          {service.name}
                        </Text>
                        <Text style={[
                          styles.customDropdownItemDuration,
                          isSelected && styles.customDropdownItemDurationSelected
                        ]}>
                          {timeLabel}
                        </Text>
                      </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={styles.customDropdownCheckmark.color || '#1d342e'} />
                  )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </Card>

        <Card title={t('staff')}>
          <View style={styles.staffRow}>
            {staff.length === 0 && <Text>No staff found. Check database.</Text>}
            {staff.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setStaffId(s.id)}
                style={[
                  styles.staffChip,
                  {
                    borderColor: staffId === s.id ? (s.color || '#1d342e') : '#E5E7EB',
                    backgroundColor: staffId === s.id ? `${s.color || '#1d342e'}18` : '#fff',
                  },
                ]}
              >
                <View style={[styles.dot, { backgroundColor: s.color || '#1d342e' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.staffName, staffId === s.id && { color: s.color || '#1d342e' }]} numberOfLines={1}>
                    {s.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card title={t('apptTime')}>
          <Text style={styles.label}>{t('date')}</Text>
          <TouchableOpacity onPress={Platform.OS === 'android' ? openAndroidDate : () => setShowCalendar(true)} style={styles.input}>
            <Text style={styles.inputText}>{formatDate(date)}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>{t('time')}</Text>
          <View style={styles.timeInputContainer}>
            <TimeInput
              baseStyle={styles.timeInput}
              focusedStyle={styles.timeInputFocused || styles.inputFocused}
              value={hourText}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                setHourText(cleaned);
                const hour = parseInt(cleaned, 10);
                if (!Number.isNaN(hour) && hour >= 0 && hour <= 23) {
                  const newTime = new Date(time);
                  newTime.setHours(hour);
                  setTime(newTime);
                }
              }}
              placeholder="10"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={2}
              onBlur={() => {
                const hour = parseInt(hourText, 10) || 0;
                const validHour = Math.min(Math.max(hour, 0), 23);
                setHourText(validHour.toString().padStart(2, '0'));
                const newTime = new Date(time);
                newTime.setHours(validHour);
                setTime(newTime);
              }}
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TimeInput
              baseStyle={styles.timeInput}
              focusedStyle={styles.timeInputFocused || styles.inputFocused}
              value={minuteText}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                setMinuteText(cleaned);
                const minute = parseInt(cleaned, 10);
                if (!Number.isNaN(minute) && minute >= 0 && minute <= 59) {
                  const newTime = new Date(time);
                  newTime.setMinutes(minute);
                  setTime(newTime);
                }
              }}
              placeholder="30"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={2}
              onBlur={() => {
                const minute = parseInt(minuteText, 10) || 0;
                const validMinute = Math.min(Math.max(minute, 0), 59);
                setMinuteText(validMinute.toString().padStart(2, '0'));
                const newTime = new Date(time);
                newTime.setMinutes(validMinute);
                setTime(newTime);
              }}
            />
          </View>
        </Card>


        <Card title={t('notesOptional')}>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={title}
            onChangeText={setTitle}
            placeholder={t('notesPlaceholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />
        </Card>

        <View style={styles.manageBookingActions}>
          <BigBtn text={t('saveChanges')} onPress={submit} />
          <BigBtn text={t('delete')} kind="danger" onPress={handleDelete} />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default ManageBookingScreen;

