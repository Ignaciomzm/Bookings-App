// mobile/App.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, useFocusEffect, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from './supabase';
import CalendarWeekGrid from './CalendarWeekGrid';
import { lightenColor } from './utils/color';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import BigBtn from './components/BigBtn';
import Card from './components/Card';
import CustomAlert from './components/CustomAlert';
import SettingsModal from './components/SettingsModal';
import ScreenScaffold from './components/ScreenScaffold';
import BaseInput from './components/Input';
import BaseTimeInput from './components/TimeInput';
import KeyboardAwareScrollView from './components/KeyboardAwareScrollView';
import BookingsScreen from './screens/BookingsScreen';
import ManageBookingScreen from './screens/ManageBookingScreen';
import NewBookingScreen from './screens/NewBookingScreen';
import ServicesScreen from './screens/ServicesScreen';
import AdminScreen from './screens/AdminScreen';
import { useCustomAlert } from './hooks/useCustomAlert';
import { useSchedulerData } from './hooks/useSchedulerData';
import { usePasswordVisibility } from './hooks/usePasswordVisibility';
import {
  makeLink,
  POLAND_PREFIX,
  currency,
  dateLabel,
  timeLabel,
  withPolandPrefix,
} from './utils/format';
// Helps KeyboardAvoidingView clear the top bar/safe area
const KEYBOARD_OFFSET = Platform.select({ ios: 120, android: 60 });
const FALLBACK_STAFF_COLORS = ['#1d342e', '#c7a864', '#7b8277', '#b18190', '#567d8a', '#d67c5d'];

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const Input = React.forwardRef((props, ref) => (
  <BaseInput ref={ref} baseStyle={styles.input} focusedStyle={styles.inputFocused} {...props} />
));

const TimeInput = React.forwardRef((props, ref) => (
  <BaseTimeInput ref={ref} baseStyle={styles.timeInput} focusedStyle={styles.timeInputFocused} {...props} />
));


// Horizontal Week Navigation Component
function WeekNavigator({ selectedDate, onDateSelect, t }) {
  const { lang } = useSettings();
  const [weekDates, setWeekDates] = useState([]);

  useEffect(() => {
    generateWeekDates();
  }, [selectedDate]);

  const generateWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(selectedDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday start
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    setWeekDates(dates);
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const dayLabels = useMemo(() => {
    const locale = lang === 'pl' ? 'pl-PL' : 'en-US';
    const monday = new Date(selectedDate);
    const dayOfWeek = monday.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(monday.getDate() + diff);

    return Array.from({ length: 7 }, (_, idx) => {
      const labelDate = new Date(monday);
      labelDate.setDate(monday.getDate() + idx);
      return labelDate
        .toLocaleDateString(locale, { weekday: 'short' })
        .replace(/\.$/, '')
        .toUpperCase();
    });
  }, [lang, selectedDate]);

  return (
    <View style={styles.weekNavigator}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekScrollContent}>
        {weekDates.map((date, index) => {
          const today = isToday(date);
          const selected = isSelected(date);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.weekDayItem,
                today && styles.weekDayItemToday,
                selected && styles.weekDayItemSelected,
              ]}
              onPress={() => onDateSelect(date)}
            >
              <Text style={[
                styles.weekDayLabel,
                (today || selected) && styles.weekDayLabelActive,
              ]}>
                {dayLabels[index]}
              </Text>
              <Text style={[
                styles.weekDayNumber,
                (today || selected) && styles.weekDayNumberActive,
              ]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Enhanced wrapper for better keyboard handling
const notify = (title, msg = '') => {
  try {
    Alert.alert(title, msg);
  } catch {}
};

const TAB_ICONS = {
  Bookings: 'list',
  NewBooking: 'add-circle',
  Services: 'cut',
  Calendar: 'calendar',
  Admin: 'settings',
};

const APP_NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#faf7f2',
  },
};

function UserAvatarButton({ user, staff, onPress, accessibilityLabel }) {
  // Get user's full name from profile or email
  const fullName = user?.user_metadata?.full_name || user?.email || 'Guest';
  
  // Extract first letter of first name
  const initial = fullName.charAt(0).toUpperCase();
  
  // Find user's staff record to get their color
  const userStaff = staff?.find(s => s.user_id === user?.id);
  const staffColor = userStaff?.color || '#1d342e'; // Default to dark teal if no color found
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerAvatarButton}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <View style={[styles.userAvatarCircle, { backgroundColor: staffColor }]}>
        <Text style={styles.userAvatarText}>{initial}</Text>
      </View>
    </TouchableOpacity>
  );
}

function AuthScreen({ onLoggedIn }) {
  const { t, lang, setLang } = useSettings();
  const [mode, setMode] = useState('signin');

  const redirectTo = makeLink('/auth-callback');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordVisibility = usePasswordVisibility();

  const signIn = async () => {
    if (!email || !password) return Alert.alert('Error', 'Enter email and password.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return Alert.alert('Sign In failed', error.message);
    onLoggedIn && onLoggedIn();
  };

  const signUp = async () => {
    if (!email || !password) return Alert.alert('Error', 'Enter email and password.');
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setBusy(false);
      return Alert.alert('Sign Up failed', error.message);
    }
    const uid = data?.user?.id;
    if (uid) {
      await supabase.from('profiles').upsert({ user_id: uid, full_name: fullName || null, role: 'staff' });
    }
    setBusy(false);
    Alert.alert('Account created', "Check your email to confirm. After confirming, you'll bounce back into the app.");
  };

  const handleForgot = async () => {
    if (!email) return Alert.alert('Forgot password', 'Enter your email first.');
    const resetLink = makeLink('/password-reset');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: resetLink });
    if (error) return Alert.alert('Failed to send reset link', error.message);
    Alert.alert('Email sent', 'Open the link from your email? it will return you here to set a new password.');
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#F7F7FA' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.authScrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authCard}>
            <View style={styles.authLangRow}>
            <Text style={{ fontWeight: '800', color: '#111827' }}>{t('language')}:</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <BigBtn text="PL" onPress={() => setLang('pl')} />
              <BigBtn text="EN" onPress={() => setLang('en')} />
            </View>
          </View>

          <Text style={styles.authTitle}>{mode === 'signin' ? t('signIn') : t('signUp')}</Text>

          <View style={styles.authTabs}>
            <Pressable onPress={() => setMode('signin')} style={[styles.authTab, mode === 'signin' && styles.authTabActive]}>
              <Text style={[styles.authTabText, mode === 'signin' && styles.authTabTextActive]} numberOfLines={1}>{t('signIn')}</Text>
            </Pressable>
            <Pressable onPress={() => setMode('signup')} style={[styles.authTab, mode === 'signup' && styles.authTabActive]}>
              <Text style={[styles.authTabText, mode === 'signup' && styles.authTabTextActive]} numberOfLines={1}>{t('signUp')}</Text>
            </Pressable>
          </View>

          {mode === 'signup' && (
            <>
              <Text style={styles.label}>{t('fullName')}</Text>
              <Input value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
            </>
          )}

          <Text style={styles.label}>{t('email')}</Text>
          <Input autoCapitalize="none" keyboardType="email-address" placeholder="name@example.com" value={email} onChangeText={setEmail} />

          <Text style={styles.label}>{t('password')}</Text>
          <View style={styles.passwordContainer}>
            <Input
              style={styles.passwordInput}
              placeholder="********"
              secureTextEntry={passwordVisibility.secure}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={mode === 'signin' ? signIn : signUp}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={passwordVisibility.toggle}
            >
              <Text style={styles.eyeIcon}>{passwordVisibility.visible ? 'HIDE' : 'SHOW'}</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 12 }}>
            {mode === 'signin' ? (
              <BigBtn text={busy ? '...' : t('signIn')} kind="primary" onPress={signIn} />
            ) : (
              <BigBtn text={busy ? '...' : t('signUp')} kind="primary" onPress={signUp} />
            )}
          </View>

          {mode === 'signin' && (
            <Pressable onPress={handleForgot} style={{ marginTop: 10, alignSelf: 'center' }}>
              <Text style={{ color: '#2563EB', fontWeight: '700' }}>{t('forgotPassword')}</Text>
            </Pressable>
          )}

          {busy ? <View style={{ marginTop: 12 }}><ActivityIndicator /></View> : null}
        </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/* ============================== Reset Password Screen ============================== */
function ResetPasswordScreen({ onResetDone }) {
  const { t, lang } = useSettings();
  const [newPass, setNewPass] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordVisibility = usePasswordVisibility();

  const submit = async () => {
    if (!newPass || newPass.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setBusy(false);
    if (error) return Alert.alert('Failed', error.message);
    Alert.alert('Success', 'Password updated. You can continue.');
    onResetDone && onResetDone();
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#F7F7FA' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.authScrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>{t('resetPassword')}</Text>
            <Text style={styles.label}>{t('newPassword')}</Text>
            <View style={styles.passwordContainer}>
              <Input
                style={styles.passwordInput}
                placeholder="********"
                secureTextEntry={passwordVisibility.secure}
                value={newPass}
                onChangeText={setNewPass}
                onSubmitEditing={submit}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={passwordVisibility.toggle}
              >
                <Text style={styles.eyeIcon}>{passwordVisibility.visible ? 'HIDE' : 'SHOW'}</Text>
              </Pressable>
            </View>
            <View style={{ marginTop: 12 }}>
              <BigBtn text={busy ? '...' : t('confirm')} kind="primary" onPress={submit} />
            </View>
            {busy ? <View style={{ marginTop: 12 }}><ActivityIndicator /></View> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/* ============== Admin (power tools) ============== */
/* ============================== Complete Calendar Implementation ============================== */

// Helper function for Monday-based weeks
function startOfWeekMonday(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun, 1=Mon, etc
  const diff = day === 0 ? 6 : day - 1; // Adjust so Monday is start
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

const SHOW_SCHEDULE_VIEW = false;
const SHOW_WEEK_NAV = true;

// Main Calendar Screen with dropdown menu
function CalendarScreen({
  bookings,
  services,
  staff,
  weekStart,
  setWeekStart,
  onPressBooking,
  onCreateBooking,
  onOpenSettings,
}) {
  const { t, lang } = useSettings();
  
  // View mode state - Daily is now default
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [showViewMenu, setShowViewMenu] = useState(false);

const [selectedDate, setSelectedDate] = useState(() => new Date());
const [currentTime, setCurrentTime] = useState(new Date());
const [monthlyViewDate, setMonthlyViewDate] = useState(() => new Date());
const prevViewModeRef = useRef('daily');

useEffect(() => {
    if (!weekStart) return;
    const incoming = new Date(weekStart);
    if (Number.isNaN(incoming.getTime())) return;
    const incomingWeek = startOfWeekMonday(incoming);
    const currentWeek = startOfWeekMonday(selectedDate);
    if (incomingWeek.getTime() !== currentWeek.getTime()) {
      setSelectedDate((prev) => {
        const base = startOfWeekMonday(incomingWeek);
        if (!(prev instanceof Date)) return base;
        const dayOffset = (prev.getDay() + 6) % 7; // Monday -> 0, Sunday -> 6
        const next = new Date(base);
        next.setDate(next.getDate() + dayOffset);
        return next;
      });
    }
  }, [weekStart, selectedDate]);

  useEffect(() => {
    if (!SHOW_SCHEDULE_VIEW && viewMode === 'weekly') {
      setViewMode('daily');
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'monthly' && prevViewModeRef.current !== 'monthly') {
      setMonthlyViewDate(selectedDate);
    }
    prevViewModeRef.current = viewMode;
  }, [viewMode, selectedDate]);

  useEffect(() => {
    if (!SHOW_SCHEDULE_VIEW && viewMode === 'weekly') {
      setViewMode('daily');
    }
  }, [viewMode]);

  // Add this entire useEffect block:
  useEffect(() => {
    // Update current time every minute to move the red line
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const startOfSelectedWeek = useMemo(() => startOfWeekMonday(selectedDate), [selectedDate]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfSelectedWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  }, [startOfSelectedWeek]);
  const bookingsForDay = useMemo(() => {
    return bookings
      .filter((bk) => !bk.status || bk.status === 'active' || bk.status === 'scheduled')
      .filter((bk) => {
        const start = new Date(bk.start_at);
        return start.toDateString() === selectedDate.toDateString();
      })
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  }, [bookings, selectedDate]);

  const handleDayPress = (day) => {
    setSelectedDate(day);
    const monday = startOfWeekMonday(day);
    if (!weekStart || monday.getTime() !== new Date(weekStart).getTime()) {
      setWeekStart(monday);
    }
  };

  const shiftWeek = (delta) => {
    const monday = new Date(startOfSelectedWeek);
    monday.setDate(monday.getDate() + delta * 7);
    const offset = selectedDate.getDay();
    const nextSelected = new Date(monday);
    nextSelected.setDate(nextSelected.getDate() + offset);
    setWeekStart(monday);
    setSelectedDate(nextSelected);
  };

  
  const shiftMonth = (delta) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
    const newMonday = startOfWeekMonday(newDate);
    setWeekStart(newMonday);
  };

  const handleCreateBooking = () => {
    const candidate = new Date(selectedDate);
    candidate.setHours(9, 0, 0, 0);
    if (onCreateBooking) onCreateBooking(candidate);
  };

  const weekdayShort = lang === 'pl' 
    ? ['PN', 'WT', 'SR', 'CZ', 'PT', 'SB', 'ND']
    : ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  
  const dayHeadline = selectedDate.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', { month: 'long', day: 'numeric' });

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours > 12) {
      hours = hours - 12;
    }
    return `${hours}.${minutes.toString().padStart(2, '0')}`;
  };

  const TIMELINE_START_HOUR = 8;
  const TIMELINE_END_HOUR = 20;
  const HOUR_BLOCK_HEIGHT = 92;
  const HALF_HOUR_HEIGHT = HOUR_BLOCK_HEIGHT / 2;
  const MIN_CARD_HEIGHT = 96;
  const OVERLAP_CARD_SPACING = 18;
  const timelineHours = useMemo(
    () => Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, idx) => TIMELINE_START_HOUR + idx),
    []
  );

  const timelineStart = useMemo(() => {
    const base = new Date(selectedDate);
    base.setHours(TIMELINE_START_HOUR, 0, 0, 0);
    return base;
  }, [selectedDate]);

  const timelineTotalMinutes = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
  const timelineHeight = timelineTotalMinutes / 60 * HOUR_BLOCK_HEIGHT;

  const positionedBookings = useMemo(() => {
    const baseEntries = bookingsForDay.map((booking) => {
      const start = new Date(booking.start_at);
      const duration = Math.max(booking.duration_min || 60, 30);
      const minutesFromStart = (start.getTime() - timelineStart.getTime()) / 60000;
      const rawEnd = minutesFromStart + duration;
      const clampedStart = Math.max(0, minutesFromStart);
      const clampedEnd = Math.min(timelineTotalMinutes, rawEnd);
      const visibleDuration = Math.max(30, clampedEnd - clampedStart);
      const top = (clampedStart / 60) * HOUR_BLOCK_HEIGHT;
      const height = Math.max(MIN_CARD_HEIGHT, (visibleDuration / 60) * HOUR_BLOCK_HEIGHT - 8);
      const staffMember = staff.find((s) => s.id === booking.staff_id);
      const service = services.find((s) => s.id === booking.service_id);

      return {
        booking,
        top,
        height,
        start,
        duration,
        staffMember,
        service,
        color: staffMember?.color || '#1d342e',
        startMinutes: clampedStart,
        endMinutes: clampedEnd,
        laneIndex: 0,
        laneCount: 1,
      };
    });

    if (baseEntries.length === 0) return [];

    const entriesByStaff = new Map();
    baseEntries.forEach((entry) => {
      const key = entry.booking.staff_id || 'unknown';
      if (!entriesByStaff.has(key)) entriesByStaff.set(key, []);
      entriesByStaff.get(key).push(entry);
    });

    const positioned = [];

    const flushGroup = (group) => {
      if (!group.length) return;
      const laneEnds = [];
      const active = [];

      group.forEach((item) => {
        for (let i = active.length - 1; i >= 0; i -= 1) {
          if (active[i].endMinutes <= item.startMinutes) {
            active.splice(i, 1);
          }
        }

        let laneIdx = laneEnds.findIndex((end) => item.startMinutes >= end);
        if (laneIdx === -1) {
          laneIdx = laneEnds.length;
          laneEnds.push(item.endMinutes);
        } else {
          laneEnds[laneIdx] = item.endMinutes;
        }

        item.laneIndex = laneIdx;
        item.laneCount = Math.max(item.laneCount, laneEnds.length);
        active.forEach((activeItem) => {
          activeItem.laneCount = Math.max(activeItem.laneCount, laneEnds.length);
        });
        active.push(item);
      });

      positioned.push(...group);
    };

    entriesByStaff.forEach((entries) => {
      const sorted = [...entries].sort((a, b) => {
        if (a.startMinutes === b.startMinutes) return a.endMinutes - b.endMinutes;
        return a.startMinutes - b.startMinutes;
      });

      let group = [];
      let groupEnd = -Infinity;

      sorted.forEach((item) => {
        if (!group.length || item.startMinutes < groupEnd) {
          group.push(item);
          groupEnd = Math.max(groupEnd, item.endMinutes);
        } else {
          flushGroup(group);
          group = [item];
          groupEnd = item.endMinutes;
        }
      });

      flushGroup(group);
    });

    return positioned
      .sort((a, b) => {
        if (a.startMinutes === b.startMinutes) return a.laneIndex - b.laneIndex;
        return a.startMinutes - b.startMinutes;
      })
      .map((entry) => entry);
  }, [bookingsForDay, staff, services, timelineStart, timelineTotalMinutes]);

const currentIndicatorTop = useMemo(() => {
  if (selectedDate.toDateString() === currentTime.toDateString()) {
    const minutesFromStart = (currentTime.getTime() - timelineStart.getTime()) / 60000;
    if (minutesFromStart >= 0 && minutesFromStart <= timelineTotalMinutes) {
      return (minutesFromStart / 60) * HOUR_BLOCK_HEIGHT;
    }
  }
  return null;
}, [selectedDate, currentTime, timelineStart, timelineTotalMinutes]);

  const formatRange = (start, durationMinutes) => {
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <View style={styles.calendarWrapper}>
      <View style={styles.calendarHeaderMinimal}>
        <TouchableOpacity
          style={styles.calendarHeaderIconButton}
          onPress={() => {}}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="notifications-outline" size={22} color="#1d342e" />
        </TouchableOpacity>

        <View style={styles.calendarHeaderCenterWrapper}>
          <Pressable
            style={styles.calendarHeaderCenterBlock}
            onPress={() => setShowViewMenu(prev => !prev)}
          >
            <Text style={styles.calendarHeaderDayText}>
              {selectedDate.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
            <View style={styles.calendarHeaderTimeRow}>
              <Text style={styles.calendarHeaderTimeText}>09:00 - 20:00</Text>
              <Ionicons name={showViewMenu ? 'chevron-up' : 'chevron-down'} size={14} color="#1d342e" />
            </View>
          </Pressable>

          {showViewMenu && (
            <View style={styles.calendarCleanDropdown}>
              <Pressable 
                style={[styles.calendarCleanOption, viewMode === 'daily' && styles.calendarCleanOptionActive]}
                onPress={() => { 
                  setViewMode('daily'); 
                  setShowViewMenu(false); 
                  const today = new Date();
                  setSelectedDate(today);
                  setWeekStart(startOfWeekMonday(today));
                }}
              >
                <Ionicons name="today" size={20} color={viewMode === 'daily' ? '#c7a864' : '#7b8277'} />
                <Text style={[styles.calendarCleanOptionText, viewMode === 'daily' && styles.calendarCleanOptionTextActive]}>
                  Daily
                </Text>
              </Pressable>

              {SHOW_SCHEDULE_VIEW && (
                <Pressable 
                  style={[styles.calendarCleanOption, viewMode === 'weekly' && styles.calendarCleanOptionActive]}
                  onPress={() => { setViewMode('weekly'); setShowViewMenu(false); }}
                >
                  <Ionicons name="calendar" size={20} color={viewMode === 'weekly' ? '#c7a864' : '#7b8277'} />
                  <Text style={[styles.calendarCleanOptionText, viewMode === 'weekly' && styles.calendarCleanOptionTextActive]}>
                    Schedule
                  </Text>
                </Pressable>
              )}

              <Pressable 
                style={[styles.calendarCleanOption, viewMode === 'monthly' && styles.calendarCleanOptionActive]}
                onPress={() => { 
                  setViewMode('monthly'); 
                  setShowViewMenu(false); 
                  setMonthlyViewDate(selectedDate);
                }}
              >
                <Ionicons name="calendar-outline" size={20} color={viewMode === 'monthly' ? '#c7a864' : '#7b8277'} />
                <Text style={[styles.calendarCleanOptionText, viewMode === 'monthly' && styles.calendarCleanOptionTextActive]}>
                  Monthly
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.calendarHeaderEndActions}>
          <TouchableOpacity
            style={styles.calendarHeaderIconButton}
            onPress={() => {}}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="funnel-outline" size={22} color="#1d342e" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.calendarHeaderIconButton}
            onPress={onOpenSettings}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#1d342e" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Month navigation header - only show in monthly view */}
{/* Month navigation header - only show in monthly view */}
{/* Month navigation header - only show in monthly view */}
      {viewMode === 'monthly' && (
        <View style={styles.monthNavigationHeader}>
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(monthlyViewDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setMonthlyViewDate(newDate);
            }}
            style={styles.monthNavButton}
          >
            <Ionicons name="chevron-back" size={24} color="#1d342e" />
          </TouchableOpacity>
          
          <Text style={styles.monthYearText}>
            {monthlyViewDate.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </Text>
          
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(monthlyViewDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setMonthlyViewDate(newDate);
            }}
            style={styles.monthNavButton}
          >
            <Ionicons name="chevron-forward" size={24} color="#1d342e" />
          </TouchableOpacity>
        </View>
      )}

      {SHOW_WEEK_NAV ? (
        <WeekNavigator selectedDate={selectedDate} onDateSelect={handleDayPress} t={t} />
      ) : null}

      {/* Render based on view mode */}
      {SHOW_SCHEDULE_VIEW && viewMode === 'weekly' && (
        <>
          <TouchableOpacity
            onPress={() => shiftWeek(-1)}
            style={styles.hiddenNavButton}
          />
          
          <View style={styles.calendarWeekHeaderClean}>
            <View style={styles.calendarDayStripClean}>
              {(() => {
                const todayString = new Date().toDateString();
                return weekDays.map((day, idx) => {
                  const isActive = day.toDateString() === selectedDate.toDateString();
                  const isToday = day.toDateString() === todayString;
                  const dayIndex = (day.getDay() + 6) % 7;
                  return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => handleDayPress(day)}
                    style={[
                      styles.calendarDayItemClean,
                      isToday && styles.calendarDayItemTodayClean,
                      isActive && styles.calendarDayItemActiveClean
                    ]}
                  >
                      <Text
                        style={[
                          styles.calendarDayLabelClean,
                          isToday && styles.calendarDayLabelTodayClean,
                          isActive && styles.calendarDayLabelActiveClean
                        ]}
                      >
                        {weekdayShort[dayIndex]}
                      </Text>
                      <View
                        style={[
                          styles.calendarDayCircleClean,
                          isToday && styles.calendarDayCircleTodayClean,
                          isActive && styles.calendarDayCircleActiveClean
                        ]}
                      >
                        <Text
                          style={[
                            styles.calendarDayNumberClean,
                            isToday && styles.calendarDayNumberTodayClean,
                            isActive && styles.calendarDayNumberActiveClean
                          ]}
                        >
                          {day.getDate()}
                        </Text>
                      </View>
                    </Pressable>
                  );
                });
              })()}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => shiftWeek(1)}
            style={styles.hiddenNavButton}
          />

          <ScrollView contentContainerStyle={styles.calendarListContentMockup} showsVerticalScrollIndicator={false}>
            {bookingsForDay.length === 0 ? (
              <View style={styles.calendarEmptyState}>
                <Ionicons name="calendar-outline" size={22} color="#8a9a92" />
                <Text style={styles.calendarEmptyStateText}>{t('noBookings')}</Text>
                <TouchableOpacity style={styles.calendarEmptyButton} onPress={handleCreateBooking}>
                  <Text style={styles.calendarEmptyButtonText}>{t('newBooking')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              bookingsForDay.map((booking) => {
                const start = new Date(booking.start_at);
                const timeFormatted = formatTime(start);
                const service = services.find((s) => s.id === booking.service_id);
                return (
                  <Pressable
                    key={booking.id}
                    onPress={() => onPressBooking?.(booking)}
                    style={styles.scheduleCardMockup}
                  >
                    <View style={styles.scheduleCardTimeMockup}>
                      <Text style={styles.scheduleCardTimeTextMockup}>{timeFormatted}</Text>
                      <Ionicons name="time-outline" size={16} color="#888" style={{ marginTop: 2 }} />
                    </View>
                    <View style={styles.scheduleCardBodyMockup}>
                      <Text style={styles.scheduleCardServiceMockup}>{service?.name || t('service')}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </>
      )}

      {/* Daily view with modern timeline */}
      {viewMode === 'daily' && (
        <>
{false && <View style={styles.dailyNavigation}>
            <TouchableOpacity
              onPress={() => {
                const prevDay = new Date(selectedDate);
                prevDay.setDate(prevDay.getDate() - 1);
                setSelectedDate(prevDay);
              }}
              style={styles.dailyNavButton}
            >
              <Ionicons name="chevron-back" size={22} color="#1d342e" />
            </TouchableOpacity>

            <View style={styles.dailyDateDisplay}>
              <Text style={[
                styles.dailyDateText,
                selectedDate.toDateString() === new Date().toDateString() && styles.dailyDateTextToday
              ]}>
                {selectedDate.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                const nextDay = new Date(selectedDate);
                nextDay.setDate(nextDay.getDate() + 1);
                setSelectedDate(nextDay);
              }}
              style={styles.dailyNavButton}
            >
              <Ionicons name="chevron-forward" size={22} color="#1d342e" />
            </TouchableOpacity>
          </View>}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.dailyTimelineWrapper}>
<View style={styles.dailyTimelineHours}>
                {timelineHours.map((hour) => (
                  <View key={hour} style={{ height: HOUR_BLOCK_HEIGHT }}>
                    {/* Main hour label */}
                    <View style={[styles.dailyHourRow, { height: HOUR_BLOCK_HEIGHT / 4 }]}>
                      <Text style={styles.dailyHourLabel}>
                        {hour.toString().padStart(2, '0')}
                        <Text style={styles.dailyHourLabelSuffix}>:00</Text>
                      </Text>
                    </View>
                    
                    {/* :15 mark */}
                    <View style={[styles.dailyHourRow, { height: HOUR_BLOCK_HEIGHT / 4 }]}>
                      <Text style={styles.dailyMinuteLabel}>:15</Text>
                    </View>
                    
                    {/* :30 mark */}
                    <View style={[styles.dailyHourRow, { height: HOUR_BLOCK_HEIGHT / 4 }]}>
                      <Text style={styles.dailyMinuteLabel}>:30</Text>
                    </View>
                    
                    {/* :45 mark */}
                    <View style={[styles.dailyHourRow, { height: HOUR_BLOCK_HEIGHT / 4 }]}>
                      <Text style={styles.dailyMinuteLabel}>:45</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.dailyTimelineBody}>
                <View style={[styles.dailyTimelineGrid, { height: timelineHeight }]}>
                  {Array.from({ length: (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 2 + 1 }, (_, idx) => {
                    const isHour = idx % 2 === 0;
                    return (
                      <View
                        key={`line-${idx}`}
                        style={[
                          styles.dailyTimelineLine,
                          isHour && styles.dailyTimelineLineHour,
                          { top: idx * HALF_HOUR_HEIGHT },
                        ]}
                      />
                    );
                  })}

                  {currentIndicatorTop !== null && (
                    <View style={[styles.dailyCurrentTimeIndicator, { top: currentIndicatorTop }]}>
                      <View style={styles.dailyCurrentTimeDot} />
                      <View style={styles.dailyCurrentTimeLine} />
                    </View>
                  )}

        {positionedBookings.length === 0 && (
                    <View style={styles.dailyTimelineEmpty}>
                      <Ionicons name="calendar-clear-outline" size={48} color="#c7a864" />
                      <Text style={styles.dailyEmptyStateTitle}>{t('noBookings')}</Text>
                      <TouchableOpacity 
                        style={styles.emptyStateButton}
                        onPress={handleCreateBooking}
                      >
                        <Text style={styles.emptyStateButtonText}>{t('addBooking')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {positionedBookings.map(({ booking, top, height, start, duration, staffMember, service, color, laneIndex, laneCount }) => {
                    const readableRange = formatRange(start, duration);
                    const offset = 8;
                    const cardLeft = offset + laneIndex * OVERLAP_CARD_SPACING;
                    const cardRight = offset + Math.max(0, (laneCount - laneIndex - 1) * OVERLAP_CARD_SPACING);
                    const cardStyle = { top, height, left: cardLeft, right: cardRight, zIndex: 2 + laneIndex };
                    const baseColor = color || '#1d342e';
                    const cardBg = lightenColor(baseColor, 0.94);
                    const cardBorder = lightenColor(baseColor, 0.74);
                    const accentColor = lightenColor(baseColor, 0.52);
                    const durationChipBg = lightenColor(baseColor, 0.96);
                    const durationChipBorder = lightenColor(baseColor, 0.82);
                    const infoTextColor = lightenColor(baseColor, 0.28);
                    const shadowColor = lightenColor(baseColor, 0.65);
                    const durationLabel = `${Math.max(duration || 0, 15)} min`;
                    const clientName = (booking.client_name || '').trim() || t('client');
                    const serviceName = (service?.name || '').trim() || t('service');
                    const staffLabel = staffMember?.name ? staffMember.name : t('staff');
                    const primaryLine = `${clientName} \u2022 ${serviceName}`;
                    const secondaryLine = `${t('staff')}: ${staffLabel}`;
                    return (
                      <Pressable
                        key={booking.id}
                        onPress={() => onPressBooking?.(booking)}
                        style={[
                          styles.dailyTimelineCard,
                          cardStyle,
                          { backgroundColor: cardBg, borderColor: cardBorder, shadowColor }
                        ]}
                      >
                        <View style={[styles.dailyTimelineCardAccent, { backgroundColor: accentColor }]} />
                        <View style={styles.dailyTimelineCardContent}>
                          <View style={styles.dailyTimelineCardHeader}>
                            <Text style={[styles.dailyTimelineCardTime, { color: baseColor }]}>{readableRange}</Text>
                            <View
                              style={[
                                styles.dailyTimelineDurationChip,
                                { backgroundColor: durationChipBg, borderColor: durationChipBorder }
                              ]}
                            >
                              <Ionicons name="time-outline" size={12} color={baseColor} />
                              <Text style={[styles.dailyTimelineDurationText, { color: baseColor }]}>{durationLabel}</Text>
                            </View>
                          </View>
                          <Text style={styles.dailyTimelineCardPrimary}>{primaryLine}</Text>
                          <Text style={[styles.dailyTimelineCardSecondary, { color: infoTextColor }]}>{secondaryLine}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>
        </>
      )}

      {/* Monthly view placeholder */}
      {/* Monthly view placeholder */}
      {viewMode === 'monthly' && (
        <>
          

          {/* Monthly calendar grid */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {/* Day headers */}
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                {(lang === 'pl' 
                  ? ['Pn', 'Wt', 'Sr', 'Cz', 'Pt', 'Sb', 'Nd']
                  : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
                ).map((day, index) => (
                  <View key={index} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar days */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {(() => {
                  const firstDay = new Date(monthlyViewDate.getFullYear(), monthlyViewDate.getMonth(), 1);
                  const lastDay = new Date(monthlyViewDate.getFullYear(), monthlyViewDate.getMonth() + 1, 0);
                  const startDate = new Date(firstDay);
                  
                  const dayOfWeek = firstDay.getDay();
                  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                  startDate.setDate(startDate.getDate() - mondayOffset);
                  
                  const days = [];
                  for (let i = 0; i < 42; i++) {
                    const day = new Date(startDate);
                    day.setDate(startDate.getDate() + i);
                    days.push(day);
                  }
                  
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  return days.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === monthlyViewDate.getMonth();
                    const isToday = day.toDateString() === today.toDateString();
                    const dayBookings = bookings.filter(b => {
                      const bookingDate = new Date(b.start_at);
                      return bookingDate.toDateString() === day.toDateString();
                    });
                    
                    return (
                      <Pressable
                        key={index}
                        onPress={() => {
                          if (isCurrentMonth) {
                            setSelectedDate(day);
                            setViewMode('daily');
                          }
                        }}
                        style={{
                          width: '14.28%',
                          aspectRatio: 1,
                          padding: 4,
                        }}
                      >
                        <View style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 8,
                          backgroundColor: isToday ? '#c7a86420' : 'transparent',
                          borderWidth: isToday ? 2 : 0,
                          borderColor: '#c7a864',
                        }}>
                          <Text style={{
                            fontSize: 14,
                            fontWeight: isToday ? '700' : '500',
                            color: !isCurrentMonth ? '#D1D5DB' : isToday ? '#c7a864' : '#111827',
                            marginBottom: 2,
                          }}>
                            {day.getDate()}
                          </Text>
                          {dayBookings.length > 0 && (
                            <View style={{
                              width: 8,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#c7a864',
                            }} />
                          )}
                        </View>
                      </Pressable>
                    );
                  });
                })()}
              </View>
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
}

/* ============================== Daily Screen ============================== */
// Keep your existing DailyScreen function here if you have one

/* ============================== Daily Screen ============================== */
function DailyScreen({ bookings, services, staff, onPressBooking, onCreateBooking }) {
  // ... all the DailyScreen code ...
}

function ScheduleView({ weekStart, bookings, services, staff, onPressBooking, onPressTimeSlot }) {
  const { t, lang } = useSettings();
  
  const daysOfWeek = lang === 'pl' 
    ? ['Pn', 'Wt', 'Sr', 'Cz', 'Pt', 'Sb', 'Nd']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Working hours from 8 AM to 8 PM (20:00)
  const workingHours = Array.from({ length: 13 }, (_, i) => i + 8); // 8, 9, 10... 20

  // Generate week days
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    weekDays.push(day);
  }

  const getBookingsForSlot = (date, hour) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.start_at);
      return (
        bookingDate.toDateString() === date.toDateString() &&
        bookingDate.getHours() === hour
      );
    });
  };

  const isCurrentTimeSlot = (date, hour) => {
    const now = new Date();
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);
    const nextHour = new Date(slotTime);
    nextHour.setHours(hour + 1, 0, 0, 0);
    
    return now >= slotTime && now < nextHour && date.toDateString() === now.toDateString();
  };

return (
  <View style={styles.calendarWrapper}>
    {/* View Mode Dropdown */}
{/* Clean Header with Menu */}
<View style={styles.calendarCleanHeader}>
  <Pressable 
    style={styles.calendarMenuButton}
    onPress={() => setShowViewMenu(!showViewMenu)}
  >
    <Ionicons name="menu" size={24} color="#1d342e" />
  </Pressable>
  
  <Text style={styles.calendarHeaderTitle}>
    {viewMode === 'daily' ? 'Daily' : 
     viewMode === 'weekly' ? 'Schedule' : 
     'Monthly'}
  </Text>
  
  {showViewMenu && (
    <View style={styles.calendarCleanDropdown}>
      <Pressable 
        style={[styles.calendarCleanOption, viewMode === 'daily' && styles.calendarCleanOptionActive]}
        onPress={() => { 
              setViewMode('daily'); 
              setShowViewMenu(false); 
              const today = new Date();
              setSelectedDate(today);
              setWeekStart(startOfWeekMonday(today));
            }}
      >
        <Ionicons name="today" size={20} color={viewMode === 'daily' ? '#c7a864' : '#7b8277'} />
        <Text style={[styles.calendarCleanOptionText, viewMode === 'daily' && styles.calendarCleanOptionTextActive]}>
          Daily
        </Text>
      </Pressable>

      {SHOW_SCHEDULE_VIEW && (
        <Pressable 
          style={[styles.calendarCleanOption, viewMode === 'weekly' && styles.calendarCleanOptionActive]}
          onPress={() => { setViewMode('weekly'); setShowViewMenu(false); }}
        >
          <Ionicons name="calendar" size={20} color={viewMode === 'weekly' ? '#c7a864' : '#7b8277'} />
          <Text style={[styles.calendarCleanOptionText, viewMode === 'weekly' && styles.calendarCleanOptionTextActive]}>
            Schedule
          </Text>
        </Pressable>
      )}

      <Pressable 
        style={[styles.calendarCleanOption, viewMode === 'monthly' && styles.calendarCleanOptionActive]}
        onPress={() => { 
              setViewMode('monthly'); 
              setShowViewMenu(false); 
              const today = new Date();
              setSelectedDate(today);
              setMonthlyViewDate(today);
              setWeekStart(startOfWeekMonday(today));
            }}
      >
        <Ionicons name="calendar-outline" size={20} color={viewMode === 'monthly' ? '#c7a864' : '#7b8277'} />
        <Text style={[styles.calendarCleanOptionText, viewMode === 'monthly' && styles.calendarCleanOptionTextActive]}>
          Monthly
        </Text>
      </Pressable>
    </View>
  )}
</View>

    {/* Render based on view mode */}
    {viewMode === 'daily' && (
      <DailyScreen
        bookings={bookings}
        services={services}
        staff={staff}
        onPressBooking={onPressBooking}
        onCreateBooking={onCreateBooking}
      />
    )}

    {SHOW_SCHEDULE_VIEW && viewMode === 'weekly' && (
      <>
        <TouchableOpacity
          onPress={() => shiftWeek(-1)}
          style={styles.hiddenNavButton}
        />
        
        <View style={styles.calendarWeekHeaderClean}>
          <View style={styles.calendarDayStripClean}>
            {(() => {
              const todayString = new Date().toDateString();
              return weekDays.map((day, idx) => {
                const isActive = day.toDateString() === selectedDate.toDateString();
                const isToday = day.toDateString() === todayString;
                const dayIndex = (day.getDay() + 6) % 7;
                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => handleDayPress(day)}
                    style={[
                      styles.calendarDayItemClean,
                      isToday && styles.calendarDayItemTodayClean,
                      isActive && styles.calendarDayItemActiveClean
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayLabelClean,
                        isToday && styles.calendarDayLabelTodayClean,
                        isActive && styles.calendarDayLabelActiveClean
                      ]}
                    >
                      {weekdayShort[dayIndex]}
                    </Text>
                    <View
                      style={[
                        styles.calendarDayCircleClean,
                        isToday && styles.calendarDayCircleTodayClean,
                        isActive && styles.calendarDayCircleActiveClean
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayNumberClean,
                          isToday && styles.calendarDayNumberTodayClean,
                          isActive && styles.calendarDayNumberActiveClean
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              });
            })()}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => shiftWeek(1)}
          style={styles.hiddenNavButton}
        />

        <ScrollView contentContainerStyle={styles.calendarListContentMockup} showsVerticalScrollIndicator={false}>
          {bookingsForDay.length === 0 ? (
            <View style={styles.calendarEmptyState}>
              <Ionicons name="calendar-outline" size={22} color="#8a9a92" />
              <Text style={styles.calendarEmptyStateText}>{t('noBookings')}</Text>
              <TouchableOpacity style={styles.calendarEmptyButton} onPress={handleCreateBooking}>
                <Text style={styles.calendarEmptyButtonText}>{t('newBooking')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookingsForDay.map((booking) => {
              const start = new Date(booking.start_at);
              const timeFormatted = formatTime(start);
              const service = services.find((s) => s.id === booking.service_id);
              return (
                <Pressable
                  key={booking.id}
                  onPress={() => onPressBooking?.(booking)}
                  style={styles.scheduleCardMockup}
                >
                  <View style={styles.scheduleCardTimeMockup}>
                    <Text style={styles.scheduleCardTimeTextMockup}>{timeFormatted}</Text>
                    <Ionicons name="time-outline" size={16} color="#888" style={{ marginTop: 2 }} />
                  </View>
                  <View style={styles.scheduleCardBodyMockup}>
                    <Text style={styles.scheduleCardServiceMockup}>{service?.name || t('service')}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </>
    )}

    {viewMode === 'monthly' && (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>
          {lang === 'pl' ? 'Widok miesieczny - wkr?tce' : 'Monthly view - coming soon'}
        </Text>
      </View>
    )}
  </View>
);
}

/* ============================== Root App ============================== */
function RootApp() {
  const { t, lang } = useSettings();
  const [route, setRoute] = useState('boot');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

// TEMPORARY: Mock user for testing - REMOVE THIS WHEN RE-ENABLING AUTH
// TEMPORARY: Mock user for testing - REMOVE THIS WHEN RE-ENABLING AUTH
useEffect(() => {
  setUser({ 
    id: 'jose-admin-123', 
    email: 'josemunoz@outlook.com.au',
    user_metadata: { full_name: 'Jose Munoz' }
  });
  setProfile({ 
    user_id: 'jose-admin-123', 
    full_name: 'Jose Munoz', 
    role: 'admin' 
  });
}, []);

  const {
    services,
    staff,
    bookings,
    syncing,
    setSyncing,
    loadServices,
    reloadAll,
  } = useSchedulerData(user, profile);

  const [editBooking, setEditBooking] = useState(null);
  const [manageBooking, setManageBooking] = useState(null);

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));

  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    customAlert,
    showAlert: showCustomAlert,
    hideAlert: hideCustomAlert,
  } = useCustomAlert();

  /* Deep link routing */
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      const p = Linking.parse(url);
      if (p?.path === 'password-reset') setRoute('reset');
      if (p?.path === 'auth-callback') setRoute('main');
    });
    Linking.getInitialURL().then((url) => {
      const p = url ? Linking.parse(url) : null;
      if (p?.path === 'password-reset') setRoute('reset');
      else setRoute('main');
    });
    return () => sub.remove();
  }, []);

  // Keep user signed in across app switches
  useEffect(() => {
    let unsub = () => {};
    const boot = async () => {
      const { data: sess } = await supabase.auth.getSession();
      setUser(sess.session?.user || null);

      const sub = supabase.auth.onAuthStateChange((_evt, session) => {
        setUser(session?.user || null);
        if (session?.user) setRoute('main');
      });
      unsub = () => sub.data.subscription.unsubscribe();
    };
    boot();

    const appSub = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        const { data: sess } = await supabase.auth.getSession();
        setUser(sess.session?.user || null);
      }
    });

    return () => { unsub(); appSub.remove(); };
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) { setProfile(null); return; }
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      setProfile(data || null);
    };
    loadProfile();
  }, [user?.id]);

  // Data fetching and realtime syncing handled via useSchedulerData hook

  const effectiveRole = profile?.role || 'staff';
  // Force-admin override for Jose's account, while keeping role-based for others
  const userEmail = (user?.email || '').toLowerCase();
  const isAdmin = userEmail === 'josemunoz@outlook.com.au' || effectiveRole === 'admin';
  const displayName =
    (profile?.full_name || '').trim() ||
    (user?.user_metadata?.full_name || '').trim() ||
    (userEmail ? userEmail.split('@')[0] : '');

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); };

  const onRequestEmailChange = async (newEmail) => {
    if (!newEmail?.includes('@')) return Alert.alert('Error', 'Invalid email');
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) return Alert.alert('Error', error.message);
    Alert.alert('Check your inbox', 'Confirm the change via email.');
  };

  const checkTimeConflict = async (staffId, startTime, duration = 60, excludeId = null) => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    const { data: overlaps } = await supabase
      .from('bookings')
      .select('id, start_at, duration_min, staff_id, client_name, status')
      .eq('staff_id', staffId);

    const filteredOverlaps = (overlaps || []).filter((b) => !b.status || b.status === 'active' || b.status === 'scheduled');

    let directConflict = false;
    let proximityWarning = null;

    for (const b of filteredOverlaps) {
      if (excludeId && b.id === excludeId) continue;
      
      const s = new Date(b.start_at);
      const e = new Date(s.getTime() + (b.duration_min || 60) * 60000);
      
      // Allow bookings that end exactly when another starts (back-to-back)
      // Allow bookings that start exactly when another ends (back-to-back)
      if (end.getTime() === s.getTime()) {
        // New booking ends exactly when existing starts - allow with warning
        proximityWarning = {
          booking: b,
          timeDiff: 0
        };
        continue;
      }
      
      if (start.getTime() === e.getTime()) {
        // New booking starts exactly when existing ends - allow with warning
        proximityWarning = {
          booking: b,
          timeDiff: 0
        };
        continue;
      }
      
      // Check for actual overlap (blocking)
      if (start < e && end > s) {
        directConflict = true;
        break;
      }
      
      // Check gaps for non-touching bookings
      let gapMinutes = 0;
      
      if (end < s) {
        // New booking ends before existing booking starts
        gapMinutes = (s.getTime() - end.getTime()) / (1000 * 60);
        if (gapMinutes < 30) {
          directConflict = true;
          break;
        } else if (gapMinutes === 30) {
          proximityWarning = {
            booking: b,
            timeDiff: gapMinutes
          };
        }
      } else if (start > e) {
        // New booking starts after existing booking ends  
        gapMinutes = (start.getTime() - e.getTime()) / (1000 * 60);
        if (gapMinutes < 30) {
          directConflict = true;
          break;
        } else if (gapMinutes === 30) {
          proximityWarning = {
            booking: b,
            timeDiff: gapMinutes
          };
        }
      }
    }

    return {
      hasDirectConflict: directConflict,
      proximityWarning: proximityWarning
    };
  };

  const saveBooking = async (payload) => {
    // Check for conflicts using the helper function
    const conflictResult = await checkTimeConflict(
      payload.staffId, 
      payload.startISO, 
      payload.durationMin || 60, 
      payload.id
    );
    
    // Block direct conflicts and insufficient gaps
    if (conflictResult.hasDirectConflict) {
      showCustomAlert(
        lang === 'pl' ? 'Konflikt rezerwacji' : 'Booking Conflict', 
        lang === 'pl' ? 'Wymagane jest minimum 30 minut przerwy miedzy rezerwacjami.' : 'Minimum 30 minutes gap required between bookings.',
        'warning'
      );
      return false;
    }

    // Show proximity warning but allow booking
    if (conflictResult.proximityWarning) {
      const warningBooking = conflictResult.proximityWarning.booking;
      const timeDiff = Math.round(conflictResult.proximityWarning.timeDiff);
      const warningTime = new Date(warningBooking.start_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return new Promise((resolve) => {
        showCustomAlert(
          lang === 'pl' ? 'Nadchodzaca rezerwacja' : 'Upcoming Booking',
          lang === 'pl' 
            ? `Istnieje nadchodzaca rezerwacja o ${warningTime}.`
            : `There is an upcoming booking at ${warningTime}.`,
          'warning',
          [
            { 
              text: t('cancel'), 
              style: 'cancel', 
              onPress: () => resolve(false) 
            },
            { 
              text: t('save'), 
              onPress: () => {
                // Continue with saving
                proceedWithSave(payload, resolve);
              }
            }
          ]
        );
      });
    }

    // No conflicts, proceed normally
    return proceedWithSave(payload);
  };

  const proceedWithSave = async (payload, resolve = null) => {
    setSyncing(true);
const row = {
  client_name: payload.clientName,
  client_phone: payload.clientPhone,
  client_email: payload.clientEmail,
  staff_id: payload.staffId,
  service_id: payload.serviceId,
  duration_min: payload.durationMin,
  start_at: payload.startISO,
  note: payload.title || null,
  created_by: user?.id || null,
  status: 'active', // Ensure new/updated bookings are marked as active
  modified_at: new Date().toISOString(), // Track modification time
};

    let error;
    if (payload.id) {
      ({ error } = await supabase.from('bookings').update(row).eq('id', payload.id));
    } else {
      ({ error } = await supabase.from('bookings').insert(row));
    }
    
    setSyncing(false);
    
    if (error) {
      showCustomAlert('Error', error.message, 'error');
      const result = false;
      if (resolve) resolve(result);
      return result;
    }
    showCustomAlert(
      lang === 'pl' ? 'Sukces' : 'Success', 
      payload.id 
        ? (lang === 'pl' ? 'Rezerwacja zaktualizowana!' : 'Booking updated successfully!')
        : (lang === 'pl' ? 'Rezerwacja utworzona!' : 'Booking created successfully!'),
      'success'
    );
    setEditBooking(null);
    // Data will be automatically refreshed by real-time subscription
    const result = true;
    if (resolve) resolve(result);
    return result;
  };

const deleteBooking = async (id) => {
  setSyncing(true);
  
  // Soft delete: mark as deleted instead of removing from database
  const { error } = await supabase
    .from('bookings')
    .update({ 
      status: 'deleted',
      modified_at: new Date().toISOString()
    })
    .eq('id', id);
    
  setSyncing(false);
  
  if (error) {
    showCustomAlert('Error', error.message, 'error');
    return false;
  }
  showCustomAlert(
    'Success', 
    lang === 'pl' ? 'Rezerwacja usunieta!' : 'Booking deleted successfully!', 
    'success'
  );
  // Data will be automatically refreshed by real-time subscription
  return true;
};

  if (route === 'boot') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7FA', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (route === 'reset') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7FA' }}>
        <ResetPasswordScreen onResetDone={() => setRoute('main')} />
      </SafeAreaView>
    );
  }

  // TEMPORARY: Bypass login for testing
// Uncomment the lines below to re-enable authentication
// if (!user) {
//   return <AuthScreen onLoggedIn={() => reloadAll()} />;
// }

  const greeting = displayName ? `, ${displayName.split(' ')[0] || displayName}` : '';
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const calendarSubtitle = greeting ? `${todayLabel} ${'\u00B7'} ${greeting}` : todayLabel;

  const MainTabs = () => (
    <Tab.Navigator
      initialRouteName="Calendar"
      sceneContainerStyle={styles.tabSceneContainer}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1d342e',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarHideOnKeyboard: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={TAB_ICONS[route.name] || 'ellipse'}
            size={route.name === 'NewBooking' ? size + 6 : size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Calendar"
        options={{ tabBarLabel: t('calendar') }}
      >
        {({ navigation }) => (
          <ScreenScaffold
            styles={styles}
            title={t('calendar')}
            subtitle=""
            onOpenSettings={() => setSettingsOpen(true)}
            user={user}
            staff={staff}
            isSyncing={syncing}
            showSettingsButton={false}
            showTitle={false}
            headerPaddingBottom={16}
          >
            <CalendarScreen
              bookings={bookings}
              services={services}
              staff={staff}
              weekStart={weekStart}
              setWeekStart={setWeekStart}
              onPressBooking={(bk) => {
                setEditBooking(bk);
                navigation.navigate('NewBooking');
              }}
              onCreateBooking={(dateTime) => {
                setEditBooking({
                  start_at: dateTime.toISOString(),
                  client_name: '',
                  client_phone: '',
                  client_email: '',
                  service_id: services[0]?.id,
                  staff_id: staff[0]?.id,
                  duration_min: 30,
                });
                navigation.navigate('NewBooking');
              }}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </ScreenScaffold>
        )}
      </Tab.Screen>

      <Tab.Screen
        name="NewBooking"
        options={{ tabBarLabel: t('newBooking') }}
      >
        {({ navigation, route }) => (
          <ScreenScaffold
            styles={styles}
            title={t('newBooking')}
            subtitle={greeting}
            onOpenSettings={() => setSettingsOpen(true)}
            user={user}
            staff={staff}
            isSyncing={syncing}
          >
            <NewBookingScreen
              services={services}
              staff={staff}
              onSave={saveBooking}
              initial={editBooking}
              onSaved={() => navigation.navigate('Bookings')}
              showAlert={showCustomAlert}
              navigation={navigation}
              route={route}
              setEditBooking={setEditBooking}
              styles={styles}
            />
          </ScreenScaffold>
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Bookings"
        options={{ tabBarLabel: t('bookings') }}
      >
        {({ navigation }) => (
          <ScreenScaffold
            styles={styles}
            title={t('bookings')}
            subtitle={greeting}
            onOpenSettings={() => setSettingsOpen(true)}
            user={user}
            staff={staff}
            isSyncing={syncing}
          >
            <BookingsScreen
              bookings={bookings}
              services={services}
              staff={staff}
              onEdit={(bk) => {
                setManageBooking(bk);
                navigation.getParent()?.navigate('ManageBooking');
              }}
              onDelete={deleteBooking}
              showAlert={showCustomAlert}
              styles={styles}
            />
          </ScreenScaffold>
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Services"
        options={{ tabBarLabel: t('services') }}
      >
        {() => (
          <ScreenScaffold
            styles={styles}
            title={t('services')}
            subtitle={greeting}
            onOpenSettings={() => setSettingsOpen(true)}
            user={user}
            staff={staff}
            isSyncing={syncing}
          >
            <ServicesScreen
              services={services}
              reload={loadServices}
              showAlert={showCustomAlert}
              styles={styles}
            />
          </ScreenScaffold>
        )}
      </Tab.Screen>

      {isAdmin ? (
        <Tab.Screen
          name="Admin"
          options={{ tabBarLabel: t('admin') }}
        >
          {() => (
            <ScreenScaffold
              styles={styles}
              title={t('admin')}
              subtitle={greeting}
              onOpenSettings={() => setSettingsOpen(true)}
              user={user}
              staff={staff}
              isSyncing={syncing}
            >
              <AdminScreen
                reloadAll={reloadAll}
                currentEmail={(user?.email || '').toLowerCase()}
                onPreviewRole={({ role, label }) => showCustomAlert('Preview', `${role} - ${label}`, 'info')}
                showAlert={showCustomAlert}
                styles={styles}
              />
            </ScreenScaffold>
          )}
        </Tab.Screen>
      ) : null}
    </Tab.Navigator>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />
      <NavigationContainer theme={APP_NAV_THEME}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="ManageBooking"
            options={{ presentation: 'modal' }}
          >
            {({ navigation }) => (
              <ManageBookingScreen
                booking={manageBooking}
                services={services}
                staff={staff}
                onSave={saveBooking}
                onDelete={deleteBooking}
                onBack={() => {
                  setManageBooking(null);
                  navigation.goBack();
                }}
                showAlert={showCustomAlert}
                styles={styles}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>

<SettingsModal
  open={settingsOpen}
  onClose={() => setSettingsOpen(false)}
  onSignOut={signOut}
  onRequestEmailChange={onRequestEmailChange}
  user={user}
  currentUserRole={profile?.role || 'staff'}
  styles={styles}
/>
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        type={customAlert.type}
        buttons={customAlert.buttons}
        onClose={hideCustomAlert}
      />
    </>
  );
}

/* ====== BELOW THIS: The export should be here ====== */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <RootApp />
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}

/* ============================== Styles ============================== */
const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#faf7f2',
    position: 'relative',
  },
screenHeaderWrapper: {
  paddingTop: Platform.select({ ios: 24, android: 36 }),
  paddingBottom: 42,
  paddingHorizontal: 24,
  backgroundColor: '#faf7f2',
},
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  screenHeading: {
    flex: 1,
    gap: 6,
  },
screenTitle: {
  fontSize: 30,
  fontWeight: '700',
  color: '#1d342e',
  letterSpacing: 0.3,
},
  screenSubtitle: {
    fontSize: 15,
    color: '#7b8277',
    fontWeight: '500',
  },
  screenHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  headerCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: '#ede3d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarButton: {
    marginLeft: 4,
  },
screenContent: {
  flex: 1,
  marginTop: 0,
  backgroundColor: '#faf7f2',
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  paddingHorizontal: 0,
  paddingTop: 0,
  paddingBottom: 1,
},
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  tabBarIcon: {
    marginBottom: -2,
  },
  tabSceneContainer: {
    backgroundColor: '#faf7f2',
  },
  headerQuickAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9c894d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9c894d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5f2ed',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  syncBadgeText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#9c894d',
  },
calendarWrapper: {
  flex: 1,
  backgroundColor: '#fff',
  paddingHorizontal: 0,
},
calendarWeekHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 20,
  marginTop: 12,
},
  weekArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ede3d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
calendarDayStrip: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  paddingHorizontal: 4,
},
 calendarDayItem: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 8,
  paddingVertical: 10,
  borderRadius: 20,
  backgroundColor: 'transparent',
  minWidth: 40,
  gap: 4,
},
calendarDayItemActive: {
  backgroundColor: '#A08A4A',
  width: 44,
  height: 44,
  borderRadius: 22,
},
calendarDayLabel: {
  fontSize: 10,
  fontWeight: '700',
  color: '#9CA3AF',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
},
  calendarDayLabelActive: {
    color: '#fff',
  },
 calendarDayNumber: {
  fontSize: 18,
  fontWeight: '600',
  color: '#1F2937',
},
  calendarDayNumberActive: {
    color: '#fff',
  },
calendarListContent: {
  paddingBottom: 20,
  paddingTop: 16,
},
calendarSectionHeader: {
  marginBottom: 14,
  paddingHorizontal: 4,
},
  calendarSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7b8277',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  calendarSectionHeadline: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: '700',
    color: '#9c894d',
  },
  calendarEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#efe2cf',
    backgroundColor: '#f9f3ec',
  },
  calendarEmptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7b8277',
    textAlign: 'center',
    fontWeight: '600',
  },
  calendarEmptyButton: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#9c894d',
  },
  calendarEmptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
scheduleCard: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 0,
  backgroundColor: '#F9FAFB',
  borderRadius: 16,
  paddingVertical: 16,
  paddingHorizontal: 18,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 1,
},
  scheduleCardNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f0',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e0',
  },
  scheduleCardTimeNew: {
    alignItems: 'center',
    minWidth: 70,
    marginRight: 16,
  },
  scheduleCardTimeTextNew: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  scheduleCardBodyNew: {
    flex: 1,
    gap: 6,
  },
  scheduleCardNameNew: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scheduleCardServiceNew: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
calendarDateHeader: {
  paddingVertical: 12,
  paddingHorizontal: 4,
  marginBottom: 12,
  marginTop: 4,
},
  calendarDateHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scheduleCardTime: {
    alignItems: 'center',
    justifyContent: 'center',
  minWidth: 70,
  marginRight: 0,
  },
  scheduleCardTimeText: {
    fontSize: 18,
    fontWeight: '700',
  color: '#1d342e',
  },
  scheduleCardBody: {
    flex: 1,
    gap: 6,
  },
  scheduleCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9c894d',
  },
  scheduleCardService: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7b8277',
  },
  scheduleCardStaffPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#d9e4dd',
  },
  scheduleCardStaffText: {
    fontSize: 12,
    fontWeight: '700',
  color: '#1d342e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
calendarFab: {
  position: 'absolute',
  right: 24,
  bottom: 24,
  width: 54,
  height: 54,
  borderRadius: 27,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#9c894d',
  shadowColor: '#9c894d',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 8,
  display: 'none',
},
  mainTitleContainer: {
    backgroundColor: '#c7a864',
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d342e',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.7,
    shadowRadius: 35,
    elevation: 25,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
    position: 'relative',
    overflow: 'visible',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  titleUnderline: {
    width: 80,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    borderRadius: 1,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleInnerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  bottomAccent: {
    position: 'absolute',
    bottom: -4,
    left: 30,
    right: 30,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 24,
    shadowColor: 'rgba(255, 255, 255, 0.8)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTitleContainer: {
    backgroundColor: '#c7a864',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 18,
    marginBottom: 4,
    shadowColor: '#1d342e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerMainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  drawerScroll: {
    flexGrow: 1,
    paddingTop: 48,
    paddingBottom: 32,
    backgroundColor: '#F8FAFC',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginBottom: 28,
  },
  drawerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#c7a864',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#1d342e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  drawerAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  drawerName: {
    fontWeight: '900',
    fontSize: 20,
    color: '#111827',
  },
  drawerSecondary: {
    color: '#64748B',
    fontSize: 16,
    marginTop: 2,
  },
  drawerRole: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  drawerItems: {
    paddingHorizontal: 18,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: '#EFF4FF',
  },
  drawerItemActive: {
    backgroundColor: '#c7a864',
  },
  drawerLabel: {
    fontWeight: '800',
    color: '#111827',
    fontSize: 18,
  },
  drawerLabelActive: {
    color: '#fff',
    fontSize: 18,
  },
  drawerFooter: {
    marginTop: 32,
    paddingHorizontal: 18,
  },
  serviceBlock: {
    marginBottom: 20,
  },
  serviceLabel: { fontSize: 18, marginBottom: 6 },
  serviceInput: { fontSize: 18, paddingVertical: Platform.OS === 'android' ? 14 : 12, marginTop: 12 },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'android' ? 12 : 10,
    marginTop: 6,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
  },
  inputDuration: {
    fontSize: 13,
    color: '#8B8B8B',
    fontWeight: '400',
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: '#1d342e',
    borderWidth: 2,
    backgroundColor: '#FEFEFE',
  },

  label: { marginTop: 10, color: '#374151', fontWeight: '800', fontSize: 18 },
  requiredMark: { color: '#EF4444', fontWeight: '700' },
  inputRequired: { borderColor: '#EF4444', borderWidth: 2 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginTop: 12 },

  staffRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  staffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderRadius: 12,
    gap: 10,
    minWidth: '46%',
    backgroundColor: '#fff',
  },
  dot: { width: 10, height: 10, borderRadius: 10, marginRight: 4 },
  staffName: { fontWeight: '900', fontSize: 20 },

  iosPicker: { marginTop: 6, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10 },

  scroll: { paddingBottom: 300 },

  bookingCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  bookingClient: { fontWeight: '900', fontSize: 20 },
  bookingSubBig: { color: '#111827', fontWeight: '800', fontSize: 16 },
  bookingService: { color: '#6B7280', fontWeight: '500', fontSize: 16 },
  bookingSub: { color: '#6B7280', fontSize: 15 },
  bookingNote: { color: '#374151', fontStyle: 'italic', marginTop: 4, fontSize: 15 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeDeleted: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  statusBadgeModified: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  statusBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadgeLabelDeleted: {
    color: '#B91C1C',
  },
  statusBadgeLabelModified: {
    color: '#92400E',
  },

  /* Calendar header with month/year pickers */
/* Calendar header with month/year pickers */
/* Calendar header */
/* --- Calendar header layout --- */
calendarHeader: {
  paddingHorizontal: 12,
  paddingTop: 6,
  paddingBottom: 6,
  gap: 10,
},
calTopRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',     // wraps on very small screensno overlap
  rowGap: 8,
  columnGap: 8,
},
navFixed: {
  width: 120,           // equal fixed widths keep Month perfectly centered
  alignItems: 'center',
},
navBtn: {
  marginTop: 0,         // cancel BigBtn's default top margin (prevents "overlay" look)
},
monthCenterWrap: {
  flexGrow: 1,
  flexShrink: 1,
  minWidth: 180,        // long month names fit
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 6, // breathing room from buttons
},
calBottomRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
yearLeftWrap: {
  flexGrow: 1,
  flexShrink: 1,
  maxWidth: 240,
},
todayBtn: {
  marginTop: 0,
},

/* Pickers (responsive sizing) */
pickerWrapTight: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  overflow: 'hidden',
},
monthPickerResponsive: {
  width: '100%',
  minWidth: 160,
  maxWidth: 280,
  height: 48,
},
yearPickerResponsive: {
  width: '100%',
  minWidth: 100,
  maxWidth: 180,
  height: 48,
},

/* Custom Dropdown */
customDropdownContainer: {
  position: 'relative',
  zIndex: 10000,
  marginBottom: 8,
},
customDropdownButton: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  backgroundColor: '#fff',
  minHeight: 56,
  justifyContent: 'center',
},
customDropdownButtonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
},
customDropdownSelectedName: {
  fontSize: 16,
  fontWeight: '600',
  color: '#111827',
  marginBottom: 2,
},
customDropdownSelectedDuration: {
  fontSize: 14,
  color: '#6B7280',
},
customDropdownPlaceholder: {
  fontSize: 16,
  color: '#9CA3AF',
},
customDropdownArrow: {
  fontSize: 12,
  color: '#6B7280',
  marginLeft: 8,
},
customDropdownList: {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  marginTop: 4,
  maxHeight: 300,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 9999,
  zIndex: 9999,
},
customDropdownItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
},
customDropdownItemSelected: {
  backgroundColor: '#F8FAFC',
},
customDropdownItemName: {
  fontSize: 16,
  fontWeight: '500',
  color: '#111827',
  marginBottom: 2,
},
customDropdownItemNameSelected: {
  color: '#111827',
  fontWeight: '600',
},
customDropdownItemDuration: {
  fontSize: 14,
  color: '#6B7280',
},
customDropdownItemDurationSelected: {
  color: '#1d342e',
},
customDropdownCheckmark: {
  color: '#1d342e',
},

/* Custom Calendar */
dateTimeButton: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  backgroundColor: '#fff',
  padding: 16,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
dateTimeButtonText: {
  fontSize: 16,
  fontWeight: '500',
  color: '#111827',
},
dateTimeButtonArrow: {
  fontSize: 12,
  color: '#6B7280',
},
calendarContainer: {
  backgroundColor: '#F9FAFB',
  borderRadius: 12,
  padding: 16,
  marginTop: 8,
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
calendarHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
},
calendarHeaderText: {
  fontSize: 18,
  fontWeight: '600',
  color: '#111827',
},
calendarNavButton: {
  fontSize: 24,
  color: '#1d342e',
  fontWeight: 'bold',
  paddingHorizontal: 12,
  paddingVertical: 4,
},
calendarHeaderNew: {
  marginBottom: 16,
},
dateSelectorsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 8,
},
monthYearSelector: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#fff',
  borderWidth: 2,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
monthYearSelectorText: {
  fontSize: 16,
  fontWeight: '700',
  color: '#111827',
},
monthYearSelectorArrow: {
  fontSize: 14,
  fontWeight: '600',
  color: '#1d342e',
},
dropdownContainer: {
  backgroundColor: '#fff',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  maxHeight: 200,
  marginBottom: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
},
dropdownScroll: {
  maxHeight: 200,
},
dropdownOption: {
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
},
dropdownOptionSelected: {
  backgroundColor: '#EEF2FF',
},
dropdownOptionText: {
  fontSize: 16,
  fontWeight: '500',
  color: '#111827',
  textAlign: 'center',
},
dropdownOptionTextSelected: {
  color: '#1d342e',
  fontWeight: '700',
},
dropdownOptionDuration: {
  fontSize: 12,
  color: '#8B8B8B',
  fontWeight: '400',
  marginLeft: 6,
  paddingHorizontal: 6,
  paddingVertical: 2,
  backgroundColor: '#F5F5F5',
  borderRadius: 8,
  overflow: 'hidden',
},
calendarWeekDays: {
  flexDirection: 'row',
  marginBottom: 8,
},
calendarWeekDay: {
  flex: 1,
  textAlign: 'center',
  fontSize: 14,
  fontWeight: '600',
  color: '#6B7280',
  paddingVertical: 8,
},
calendarDays: {
  flexDirection: 'row',
  flexWrap: 'wrap',
},
calendarDay: {
  width: '14.28%',
  aspectRatio: 1,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 4,
},
calendarDaySelected: {
  backgroundColor: '#1d342e',
  borderRadius: 8,
},
calendarDayToday: {
  backgroundColor: '#EEF2FF',
  borderRadius: 8,
},
calendarDayText: {
  fontSize: 16,
  color: '#111827',
},
calendarDayTextSelected: {
  color: '#fff',
  fontWeight: '600',
},
calendarDayTextToday: {
  color: '#1d342e',
  fontWeight: '600',
},
calendarDayTextInactive: {
  color: '#D1D5DB',
},
timeSlotContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
},
timeSlot: {
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  backgroundColor: '#fff',
  minWidth: 70,
  alignItems: 'center',
},
timeSlotSelected: {
  backgroundColor: '#1d342e',
  borderColor: '#1d342e',
},
timeSlotText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#111827',
},
timeSlotTextSelected: {
  color: '#fff',
  fontWeight: '600',
},

/* Time Picker */
timePickerContainer: {
  flexDirection: 'row',
  gap: 16,
  marginTop: 8,
},
timePickerSection: {
  flex: 1,
},
timePickerLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: '#374151',
  marginBottom: 8,
  textAlign: 'center',
},
timePicker: {
  height: 60,
  fontSize: 18,
},

/* Simple Time Input Boxes */
timeInputContainer: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  justifyContent: 'center',
  marginTop: 16,
  marginBottom: 24,
  paddingHorizontal: 16,
  gap: 12,
},
timeInputBox: {
  alignItems: 'center',
  flex: 1,
  marginBottom: 16,
},
timeInputLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: '#6B7280',
  marginBottom: 8,
},
timeInput: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  backgroundColor: '#fff',
  padding: 20,
  fontSize: 24,
  fontWeight: '700',
  color: '#111827',
  textAlign: 'center',
  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  letterSpacing: 2,
  minWidth: 90,
  marginBottom: 20,
},
timeInputFocused: {
  borderColor: '#1d342e',
  borderWidth: 2,
  backgroundColor: '#FEFEFE',
  shadowColor: '#1d342e',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
},
timeInputSeparator: {
  fontSize: 32,
  fontWeight: '700',
  color: '#111827',
  marginBottom: 8,
  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
},

  /* Auth */
  authCenterWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  authScrollContainer: { 
    flexGrow: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 20,
    minHeight: '100%'
  },
  authCard: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  authLangRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  authTitle: { fontWeight: '900', fontSize: 22, textAlign: 'center', marginBottom: 10 },
  authTabs: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 8 },
  authTab: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#F3F4F6' },
  authTabActive: { backgroundColor: '#1d342e' },
  authTabText: { fontWeight: '900', color: '#111827' },
  authTabTextActive: { color: '#fff' },

  /* Password Input with Eye */
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50, // Make room for eye button
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  eyeIcon: {
    fontSize: 20,
  },

  modalBack: { flex: 1, backgroundColor: '#0006', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', width: '92%', borderRadius: 16, padding: 16 },
  modalTitle: { fontWeight: '900', fontSize: 18, marginBottom: 10 },
  modalOverlay: { flex: 1, backgroundColor: '#0006', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', width: '92%', borderRadius: 16, padding: 16 },

  adminRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    backgroundColor: '#fff',
  },

  empty: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 12 },

  // New Calendar Styles
  calendarContainer: {
    flex: 1,
    backgroundColor: '#F7F7FA',
  },
  calendarHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  viewSelector: {
    marginBottom: 20,
  },
  viewSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  viewButtons: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 8,
    gap: 8,
  },
  viewButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  viewButtonIcon: {
    fontSize: 16,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewButtonTextActive: {
    color: '#111827',
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F1EB',
    borderWidth: 2,
    borderColor: '#E5D3B3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B46C1',
  },
  periodDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  periodText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  todayButton: {
    alignSelf: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B8860B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  todayButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
  },
  calendarContent: {
    flex: 1,
  },

  // Daily View Styles
  dailyView: {
    flex: 1,
    backgroundColor: '#F7F7FA',
  },
  dailyHeader: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dailyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  dailySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  dailyTimeGrid: {
    padding: 16,
  },
  dailyTimeSlot: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dailyTimeLabel: {
    width: 60,
    paddingTop: 8,
  },
  dailyTimeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: '#6B7280',
    textAlign: 'right',
  },
  dailyBookingsColumn: {
    flex: 1,
    paddingLeft: 12,
    gap: 8,
    paddingVertical: 4,
  },
  dailyBooking: {
    backgroundColor: '#c7a864',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  dailyBookingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  dailyBookingService: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  dailyBookingTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Monthly View Styles
  monthlyView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  monthlyHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthlyDayHeader: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  monthlyDayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  monthlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthlyDay: {
    width: '14.285%', // 100% / 7 days
    minHeight: 80,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    padding: 8,
    backgroundColor: '#fff',
  },
  monthlyDayInactive: {
    backgroundColor: '#FAFAFA',
  },
  monthlyDayToday: {
    backgroundColor: '#EEF2FF',
  },
  monthlyDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  monthlyDayTextInactive: {
    color: '#D1D5DB',
  },
  monthlyDayTextToday: {
    color: '#1d342e',
  },
  monthlyBookingIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  monthlyBookingDot: {
    width: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c7a864',
  },
  monthlyBookingMore: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Header Dropdown Styles
  calendarHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleWithNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 350,
  },
  navButtonInTitle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 4,
    borderColor: '#1d342e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonTextInTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    textShadowColor: '#666666',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  headerDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'flex-start',
  },
  headerDropdownText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  headerDropdownHamburger: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 12,
  },
  headerDropdownArrow: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  headerDropdownMenu: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownSection: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 2,
  },
  dropdownOptionActive: {
    backgroundColor: '#EEF2FF',
  },
  dropdownOptionIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  dropdownOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  dropdownOptionTextActive: {
    color: '#1d342e',
    fontWeight: '600',
  },
  todayButtonDropdown: {
    backgroundColor: '#c7a864',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  todayButtonTextDropdown: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Schedule View Styles
  scheduleView: {
    flex: 1,
    backgroundColor: '#F7F7FA',
  },
  scheduleHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleTimeColumn: {
    width: 60,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  scheduleHeaderTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  scheduleDayColumn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#D1D5DB',
  },
  scheduleDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  scheduleDayNameToday: {
    color: '#1d342e',
  },
  scheduleDayDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  scheduleDayDateToday: {
    color: '#1d342e',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    minHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  scheduleTimeLabel: {
    width: 60,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  scheduleTimeLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scheduleTimeSlotContainer: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#D1D5DB',
  },
  scheduleTimeSlot: {
    flex: 1,
    padding: 4,
    minHeight: 80,
  },
  scheduleTimeSlotCurrent: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  scheduleTimeSlotPast: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  scheduleTimeSlotOccupied: {
    backgroundColor: '#F0F9FF',
  },
  scheduleEmptySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  scheduleEmptySlotText: {
    fontSize: 20,
    color: '#D1D5DB',
    fontWeight: '300',
  },
  scheduleBookingsContainer: {
    flex: 1,
    gap: 2,
  },
  scheduleBooking: {
    backgroundColor: '#c7a864',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleBookingClient: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  scheduleBookingService: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  scheduleBookingTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scheduleMoreBookings: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 2,
  },

  // Daily View New Styles (matching schedule view)
  dailyViewNew: {
    flex: 1,
    backgroundColor: '#F7F7FA',
  },
  dailyHeaderNew: {
    backgroundColor: '#fff',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyTitleNew: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  dailySubtitleNew: {
    fontSize: 16,
    color: '#1d342e',
    fontWeight: '700',
    textAlign: 'center',
  },
  dailyContentNew: {
    flex: 1,
  },
  dailyTimeRowNew: {
    flexDirection: 'row',
    minHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  dailyTimeLabelNew: {
    width: 80,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  dailyTimeLabelTextNew: {
    fontSize: 16,
    fontWeight: '900',
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dailyTimeSlotContainerNew: {
    flex: 1,
  },
  dailyTimeSlotNew: {
    flex: 1,
    padding: 8,
    minHeight: 80,
    backgroundColor: '#fff',
  },
  dailyTimeSlotCurrentNew: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  dailyTimeSlotPastNew: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  dailyTimeSlotOccupiedNew: {
    backgroundColor: '#F0F9FF',
  },
  dailyEmptySlotNew: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
  },
  dailyEmptySlotTextNew: {
    fontSize: 24,
    color: '#D1D5DB',
    fontWeight: '300',
  },
  dailyBookingsContainerNew: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyBookingsListNew: {
    flex: 1,
    gap: 8,
  },
  dailyBookingNew: {
    backgroundColor: '#c7a864',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
    flex: 1,
  },
  dailyBookingClientNew: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  dailyBookingServiceNew: {
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  dailyBookingTimeNew: {
    fontSize: 18,
    color: '#555',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },
  dailyBookingRowNew: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dailySmallAddButtonNew: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(60, 91, 80, 0.1)',
    borderWidth: 2,
    borderColor: '#1d342e',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  dailySmallAddIconNew: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1d342e',
  },

  /* Manage Booking Styles */
  manageBookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  manageBookingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  manageBookingActions: {
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },

  /* Mockup-specific Calendar Styles */
  calendarWeekHeaderMockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  weekArrowMockup: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekArrowTextMockup: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  calendarDayStripMockup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 4,
  },
  calendarDayItemMockup: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  calendarDayLabelMockup: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  calendarDayCircleMockup: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  calendarDayCircleActiveMockup: {
    backgroundColor: '#D4AF37',
  },
  calendarDayNumberMockup: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  calendarDayNumberActiveMockup: {
    color: '#fff',
    fontWeight: '800',
  },
  calendarListContentMockup: {
    paddingBottom: 140,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  dailyNavigation: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingVertical: 8,
  backgroundColor: '#faf7f2',
},
dailyNavButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#fff',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
dailyDateDisplay: {
  flex: 1,
  alignItems: 'center',
  paddingHorizontal: 16,
},
dailyDateText: {
  fontSize: 20,
  fontWeight: '700',
  color: '#1F2937',
  textAlign: 'center',
},
dailyDateTextToday: {
  color: '#c7a864',
},
calendarViewSwitcher: {
  paddingHorizontal: 20,
  paddingVertical: 12,
  backgroundColor: '#faf7f2',
  position: 'relative',
  zIndex: 1000,
},
viewSwitcherButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  backgroundColor: '#fff',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
viewSwitcherText: {
  flex: 1,
  fontSize: 16,
  fontWeight: '600',
  color: '#1d342e',
},
viewSwitcherDropdown: {
  position: 'absolute',
  top: 60,
  left: 20,
  right: 20,
  backgroundColor: '#fff',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 5,
  zIndex: 1001,
},
viewSwitcherOption: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
},
viewSwitcherOptionActive: {
  backgroundColor: '#faf7f2',
},
viewSwitcherOptionText: {
  fontSize: 15,
  fontWeight: '500',
  color: '#666',
},
viewSwitcherOptionTextActive: {
  color: '#c7a864',
  fontWeight: '600',
},
  dailyNavigation: {
  flexDirection: 'row',
  alignItems: 'center',
  // ... rest of the daily styles
},
calendarDateHeaderMockup: {
  marginBottom: 24,
  paddingBottom: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
},
calendarDateHeaderTextMockup: {
  fontSize: 24,
  fontWeight: '800',
  color: '#1a1a1a',
  letterSpacing: 0.3,
},
calendarListContentMockup: {
  paddingHorizontal: 20,
  paddingBottom: 20,
  paddingTop: 16,
},
dailyNavigation: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingVertical: 16,
  backgroundColor: '#faf7f2',
},
dailyNavButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#fff',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
dailyDateDisplay: {
  flex: 1,
  alignItems: 'center',
  paddingHorizontal: 16,
},
dailyDateText: {
  fontSize: 20,
  fontWeight: '700',
  color: '#1F2937',
  textAlign: 'center',
},
dailyDateTextToday: {
  color: '#c7a864',
},
calendarViewSwitcher: {
  paddingHorizontal: 20,
  paddingVertical: 12,
  backgroundColor: '#faf7f2',
  position: 'relative',
  zIndex: 1000,
},
viewSwitcherButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  backgroundColor: '#fff',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
viewSwitcherText: {
  flex: 1,
  fontSize: 16,
  fontWeight: '600',
  color: '#1d342e',
},
viewSwitcherDropdown: {
  position: 'absolute',
  top: 60,
  left: 20,
  right: 20,
  backgroundColor: '#fff',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 5,
  zIndex: 1001,
},
viewSwitcherOption: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
},
viewSwitcherOptionActive: {
  backgroundColor: '#faf7f2',
},
viewSwitcherOptionText: {
  fontSize: 15,
  fontWeight: '500',
  color: '#666',
},
viewSwitcherOptionTextActive: {
  color: '#c7a864',
  fontWeight: '600',
},
scheduleCardMockup: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#faf7f2',
  borderRadius: 16,
  paddingVertical: 18,
  paddingHorizontal: 18,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
scheduleCardTimeMockup: {
  alignItems: 'flex-start',
  justifyContent: 'center',
  minWidth: 65,
  marginRight: 16,
},
scheduleCardTimeTextMockup: {
  fontSize: 20,
  fontWeight: '600',
  color: '#1F2937',
  marginBottom: 2,
},
scheduleCardBodyMockup: {
  flex: 1,
  gap: 4,
},
scheduleCardNameMockup: {
  fontSize: 17,
  fontWeight: '600',
  color: '#111827',
  marginBottom: 2,
},
scheduleCardServiceMockup: {
  fontSize: 15,
  fontWeight: '400',
  color: '#6B7280',
},

  /* Clean Calendar Styles - No Arrows */
  hiddenNavButton: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
calendarWeekHeaderClean: {
  paddingVertical: 16,
  paddingHorizontal: 20,
  backgroundColor: '#faf7f2',
  alignItems: 'center',
  marginBottom: 0,
},
calendarDayStripClean: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  width: '100%',
  paddingHorizontal: 0,
},
calendarDayItemClean: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 4,
  flex: 1,
  borderRadius: 22,
  backgroundColor: '#f2e6d4',
  borderWidth: 1,
  borderColor: '#e6dbc8',
},
calendarDayItemTodayClean: {
  backgroundColor: '#f2e6d4',
  borderColor: '#e6dbc8',
},
calendarDayItemActiveClean: {
  backgroundColor: '#c7a864',
  borderColor: '#c7a864',
},
calendarDayLabelClean: {
  fontSize: 10,
  fontWeight: '600',
  color: '#9CA3AF',
  letterSpacing: 0.3,
  textTransform: 'uppercase',
  position: 'absolute',
  top: -18,
},
calendarDayLabelTodayClean: {
  color: '#9CA3AF',
},
calendarDayLabelActiveClean: {
  color: '#ffffff',
},
calendarDayCircleClean: {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f2e6d4',
  borderWidth: 1,
  borderColor: '#e6dbc8',
},
calendarDayCircleTodayClean: {
  backgroundColor: '#f2e6d4',
  borderColor: '#e6dbc8',
},
calendarDayCircleActiveClean: {
  backgroundColor: '#c7a864',
  borderColor: '#c7a864',
},
calendarDayNumberClean: {
  fontSize: 20,
  fontWeight: '600',
  color: '#1F2937',
},
calendarDayNumberTodayClean: {
  color: '#1F2937',
  fontWeight: '600',
},
calendarDayNumberActiveClean: {
    color: '#fff',
    fontWeight: '800',
  },
  // Add these after calendarDayNumberActiveClean
modalCardLarge: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
  width: '92%',
  maxWidth: 500,           // Increased from 400
  maxHeight: '90%',        // Increased from 85%
  minHeight: 400,          // ADD THIS - ensures minimum height
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 5,
},
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  userDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  roleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  roleBtnActive: {
    backgroundColor: '#c7a864',
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  deleteBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  picker: {
    height: 50,
    marginBottom: 12,
  },
  viewSwitcherDropdownHeader: {
    position: 'absolute',
    top: 48,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 160,
    zIndex: 9999,
  },
  viewSwitcherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  viewSwitcherOptionActive: {
    backgroundColor: '#faf7f2',
  },
  viewSwitcherOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  viewSwitcherOptionTextActive: {
    color: '#c7a864',
    fontWeight: '600',
  },
  calendarViewSwitcher: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#faf7f2',
    position: 'relative',
    zIndex: 1000,
  },
  viewSwitcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  viewSwitcherText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1d342e',
  },
  viewSwitcherDropdown: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
  },
  viewSwitcherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  viewSwitcherOptionActive: {
    backgroundColor: '#faf7f2',
  },
  viewSwitcherOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  viewSwitcherOptionTextActive: {
    color: '#c7a864',
    fontWeight: '600',
  },
  dailyNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#faf7f2',
  },
  dailyNavButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dailyDateDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  dailyDateText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  dailyDateTextToday: {
    color: '#c7a864',
  },
  dailyTimelineWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 34,
    gap: 16,
  },
  dailyTimelineHours: {
    width: 42,
    gap: 0,
  },
  dailyHourRow: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingBottom: 8,
    paddingRight: 12,
  },
  dailyHourLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.3,
  },
  dailyHourLabelSuffix: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D1D5DB',
  },
    dailyMinuteLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#D1D5DB',
    opacity: 0.7,
  },
dailyTimelineBody: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  dailyTimelineGrid: {
    position: 'relative',
  },
  dailyTimelineLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#f5f1eb',
    opacity: 0.5,
  },
  dailyTimelineLineHour: {
    height: 1,
    backgroundColor: '#ede3d4',
    opacity: 0.6,
  },
  dailyCurrentTimeIndicator: {
    position: 'absolute',
    left: -16,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  dailyCurrentTimeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d64545',
    borderWidth: 2,
    borderColor: '#fff',
  },
  dailyCurrentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#d64545',
    marginLeft: 6,
    borderRadius: 2,
  },
dailyTimelineEmpty: {
    position: 'absolute',
    top: '12%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  dailyEmptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7b8277',
    letterSpacing: 0.3,
  },
  dailyEmptyStateSubtitle: {
    fontSize: 14,
    color: '#9c894d',
    textAlign: 'center',
    fontWeight: '500',
  },
  dailyTimelineCard: {
    position: 'absolute',
    left: 8,
    right: 8,
    zIndex: 2,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ede4d6',
    shadowColor: '#d9ccbc',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
    overflow: 'hidden',
  },
  dailyTimelineCardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  dailyTimelineCardContent: {
    marginLeft: 12,
    gap: 8,
  },
  dailyTimelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dailyTimelineDurationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  dailyTimelineDurationText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dailyTimelineCardTime: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.25,
  },
  dailyTimelineCardPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d342e',
    letterSpacing: 0.2,
  },
  dailyTimelineCardSecondary: {
    fontSize: 13,
    fontWeight: '500',
    color: '#586360',
    letterSpacing: 0.18,
  },
  dailyTimelineCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ede3d4',
    backgroundColor: '#f8f3ea',
  },
  dailyTimelineCardMetaText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  headerMenuButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#ede3d4',
  alignItems: 'center',
  justifyContent: 'center',
},
headerDropdownMenu: {
  position: 'absolute',
  top: 52,
  right: 0,
  backgroundColor: '#fff',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 8,
  minWidth: 180,
  zIndex: 9999,
},
headerDropdownOption: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
},
headerDropdownOptionActive: {
  backgroundColor: '#faf7f2',
},
headerDropdownText: {
  fontSize: 15,
  fontWeight: '500',
  color: '#666',
},
headerDropdownTextActive: {
  color: '#c7a864',
  fontWeight: '600',
},
viewSwitcherDropdownHeader: {
  position: 'absolute',
  top: 48,
  left: 0,
  backgroundColor: '#fff',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 8,
  minWidth: 160,
  zIndex: 9999,
},
viewSwitcherDropdownHeader: {
  position: 'absolute',
  top: 48,
  left: 0,
  backgroundColor: '#fff',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 8,
  minWidth: 160,
  zIndex: 9999,
},
viewSwitcherOption: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
},
viewSwitcherOptionActive: {
  backgroundColor: '#faf7f2',
},
viewSwitcherOptionText: {
  fontSize: 15,
  fontWeight: '500',
  color: '#666',
},
viewSwitcherOptionTextActive: {
  color: '#c7a864',
  fontWeight: '600',
},
adminTab: {
  flex: 1,
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 8,
  alignItems: 'center',
},
adminTabActive: {
  backgroundColor: '#fff',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
adminTabText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#6B7280',
},
adminTabTextActive: {
  color: '#111827',
  fontWeight: '700',
},
userCard: {
  flexDirection: 'row',
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 12,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
filterTab: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
filterTabActive: {
  backgroundColor: '#1d342e',
  borderColor: '#1d342e',
},
filterTabText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#6B7280',
},
filterTabTextActive: {
  color: '#fff',
  fontWeight: '700',
},
bookingHistoryCard: {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
statusBadgeDeleted: {
  backgroundColor: '#FEE2E2',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
},
statusBadgeTextDeleted: {
  color: '#B91C1C',
  fontSize: 10,
  fontWeight: '700',
},
statusBadgeModified: {
  backgroundColor: '#FEF3C7',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
},
statusBadgeTextModified: {
  color: '#92400E',
  fontSize: 10,
  fontWeight: '700',
},
// Add these to the styles object (around line 2800+)

  // Settings Modal Styles
settingsModalCard: {
  backgroundColor: '#fff',
  borderRadius: 20,
  width: '92%',
  maxWidth: 480,
  height: '80%',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 8,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
},
  settingsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  settingsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  settingsCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTabs: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 8,
    backgroundColor: '#F9FAFB',
  },
  settingsTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  settingsTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  settingsTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  settingsTabTextActive: {
    color: '#1d342e',
    fontWeight: '700',
  },
  settingsScrollView: {
    flex: 1,
  },
  // Add this in your styles object (around line 2400):
tabBar: {
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  height: 105,
  paddingBottom: 20,
  paddingTop: 8,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 8,
},
  settingsScrollContent: {
    padding: 20,
  },
  settingsSection: {
    gap: 20,
  },
  settingsGroup: {
    gap: 8,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  settingsBtn: {
    backgroundColor: '#c7a864',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  settingsBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  settingsBtnSecondary: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  settingsBtnSecondaryText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  langBtnActive: {
    borderColor: '#1d342e',
    backgroundColor: '#c7a864',
  },
  langBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  langBtnTextActive: {
    color: '#fff',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 8,
  },
  signOutBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  
  // Admin Panel Styles
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  addUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#c7a864',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addUserBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  searchInput: {
    marginBottom: 12,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userCardEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  userCardPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  roleToggle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  roleToggleActive: {
    borderColor: '#1d342e',
    backgroundColor: '#c7a864',
  },
  roleToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleToggleTextActive: {
    color: '#fff',
  },
  deleteUserBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Add User Modal
  addUserModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  addUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addUserTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  addUserActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  dailyTimeRow: {
  flexDirection: 'row',
  minHeight: 80,
  borderBottomWidth: 1,
  borderBottomColor: '#efe2cf',
  backgroundColor: '#faf7f2',
},
dailyTimeLabel: {
  width: 80,
  paddingTop: 8,
  paddingHorizontal: 8,
  alignItems: 'flex-end',
  justifyContent: 'flex-start',
},
dailyTimeLabelText: {
  fontSize: 14,
  fontWeight: '700',
  color: '#7b8277',
  textAlign: 'right',
  letterSpacing: 0.3,
},
dailyTimeSlot: {
  flex: 1,
  padding: 8,
  justifyContent: 'center',
  alignItems: 'center',
},
dailyTimeSlotCurrent: {
  backgroundColor: '#f9f3ec',
  borderLeftWidth: 3,
  borderLeftColor: '#c7a864',
},
dailyEmptySlot: {
  flex: 1,
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#ede3d4',
  borderStyle: 'dashed',
  backgroundColor: '#fff',
  minHeight: 64,
},
dailyEmptySlotText: {
  fontSize: 36,
  color: '#9c894d',
  fontWeight: '400',
},
dailyBookingsContainer: {
  flex: 1,
  gap: 8,
  width: '100%',
},
dailyBooking: {
  backgroundColor: '#1d342e',
  borderRadius: 12,
  padding: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
dailyBookingClient: {
  fontSize: 16,
  fontWeight: '700',
  color: '#fff',
  marginBottom: 4,
},
dailyBookingService: {
  fontSize: 14,
  color: 'rgba(255, 255, 255, 0.9)',
  marginBottom: 4,
},
dailyBookingTime: {
  fontSize: 13,
  color: 'rgba(255, 255, 255, 0.8)',
  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  fontWeight: '600',
},
  // Month Navigation Header
  monthNavigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#faf7f2',
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ede3d4',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d342e',
    letterSpacing: 0.3,
  },
  // Week Navigator Styles
  weekNavigator: {
    backgroundColor: '#faf7f2',
    borderBottomWidth: 1,
    borderBottomColor: '#efe2cf',
    paddingVertical: 14,
  },
  weekScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  weekDayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#f5f1eb',
    borderWidth: 1,
    borderColor: '#ede3d4',
    minWidth: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  weekDayItemToday: {
    borderColor: '#d9cbb5',
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#efe2cf',
  },
  weekDayItemSelected: {
    backgroundColor: '#c7a864',
    borderColor: '#1d342e',
    shadowColor: '#1d342e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7b8277',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  weekDayLabelActive: {
    color: '#fff',
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2c28',
  },
  weekDayNumberActive: {
    color: '#fff',
  },
calendarCleanHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 16,
  paddingHorizontal: 20,
  paddingVertical: 16,
  backgroundColor: '#faf7f2',
  borderBottomWidth: 1,
  borderBottomColor: '#efe2cf',
  position: 'relative',
},
calendarHeaderMinimal: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingTop: 4,
  paddingBottom: 12,
  backgroundColor: '#faf7f2',
  borderBottomWidth: 1,
  borderBottomColor: '#efe2cf',
},
calendarHeaderIconButton: {
  padding: 6,
},
calendarHeaderCenterWrapper: {
  flex: 1,
  alignItems: 'center',
  position: 'relative',
  width: '100%',
},
calendarHeaderCenterBlock: {
  width: '100%',
  paddingHorizontal: 16,
  alignItems: 'center',
  paddingVertical: 6,
},
calendarHeaderDayText: {
  fontSize: 18,
  fontWeight: '700',
  color: '#1d342e',
},
calendarHeaderTimeRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginTop: 2,
},
calendarHeaderTimeText: {
  fontSize: 13,
  color: '#7b8277',
  fontWeight: '500',
},
calendarHeaderEndActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
calendarMenuButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#fff',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: '#ede3d4',
},
calendarHeaderTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#1d342e',
  letterSpacing: 0.3,
},
calendarCleanDropdown: {
  position: 'absolute',
  top: 56,
  left: 0,
  right: 0,
  marginTop: 8,
  alignSelf: 'center',
  backgroundColor: '#fff',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#ede3d4',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 8,
  minWidth: 180,
  zIndex: 1000,
},
calendarCleanOption: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#f9f3ec',
},
calendarCleanOptionActive: {
  backgroundColor: '#f9f3ec',
},
calendarCleanOptionText: {
  fontSize: 15,
  fontWeight: '500',
  color: '#7b8277',
},
calendarCleanOptionTextActive: {
  color: '#c7a864',
  fontWeight: '700',
},
dailyEmptyStateSubtitle: {
    fontSize: 14,
    color: '#9c894d',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyStateButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#c7a864',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
});


















































