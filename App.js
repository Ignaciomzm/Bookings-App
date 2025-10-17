// mobile/App.js
import React, { useState, useEffect, useContext, createContext, useRef, useMemo } from 'react';
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
  Share,
  AppState,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, useFocusEffect, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from './supabase';
import CalendarWeekGrid from './CalendarWeekGrid';
// Helps KeyboardAvoidingView clear the top bar/safe area
const KEYBOARD_OFFSET = Platform.select({ ios: 120, android: 60 });

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


/* ===================== Settings (i18n + dev toggle) ===================== */
const SettingsContext = createContext(null);
const useSettings = () => useContext(SettingsContext);

function SettingsProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [devAutoLogin, setDevAutoLogin] = useState(false);

  const dict = {
    en: {
      bookings: 'Upcoming',
      newBooking: 'New Booking',
      services: 'Services',
      calendar: 'Calendar',
      admin: 'Admin',
      profileSettings: 'Account & Settings',
      changeEmail: 'Email',
      language: 'Language',
      close: 'Close',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      cancel: 'Cancel',
      upcoming: 'Upcoming',
      past: 'Past',
      client: 'Client',
      clientName: 'Client name',
      phone: 'Phone',
      emailOptional: 'Email (optional)',
      service: 'Service',
      chooseService: 'Choose service',
      durationMin: 'Duration (min)',
      staff: 'Staff',
      apptTime: 'Appointment time',
      date: 'Date',
      time: 'Time',
      notesOptional: 'Notes (optional)',
      saveBooking: 'Save booking',
      saveChanges: 'Save changes',
      addService: 'Add service',
      editServices: 'Edit Services',
      typeOfService: 'Type of service',
      pricePLN: 'Price (PLN)',
      duration: 'Duration (min)',
      durationHours: 'Hours',
      durationMinutes: 'Minutes',
      today: 'Today',
      prev: 'Prev',
      next: 'Next',
      saved: 'Changes saved',
      bookingSaved: 'Booking saved',
      bookingDeleted: 'Booking deleted',
      serviceAdded: 'Service added',
      serviceRemoved: 'Service removed',
      timeUnavailable: 'That time is already taken for this stylist.',
      clientNameRequired: 'Client name is required',
      dateRequired: 'Date is required',
      timeRequired: 'Time is required',
      pastTimeNotAllowed: 'Cannot book appointments in the past',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      haveAccount: 'Have an account?',
      needAccount: "Don't have an account?",
      email: 'Email',
      password: 'Password',
      fullName: 'Full name (optional)',
      signOut: 'Sign Out',
      forgotPassword: 'Forgot password?',
      resetPassword: 'Reset Password',
      newPassword: 'New password',
      confirm: 'Confirm',
      users: 'Users',
      makeAdmin: 'Make admin',
      makeStaff: 'Make staff',
      disable: 'Disable',
      enable: 'Enable',
      stats: 'Stats',
      searchUsers: 'Search users',
      sendReset: 'Send reset email',
      deleteProfile: 'Delete profile row',
      viewBookings: "View user's bookings",
      exportAll: 'Export ALL bookings (CSV)',
      exportUser: 'Export this user (CSV)',
      previewAs: 'Preview as this user',
      stopPreview: 'Stop preview',
      noBookings: 'No bookings found.',
      addUser: 'Add user',
      role: 'Role',
      name: 'Name',
      emailProfiles: 'Email (profiles)',
      phoneProfiles: 'Phone',
      // Calendar Views
      daily: 'Daily',
      schedule: 'Schedule',
      monthly: 'Monthly',
      calendarView: 'View',
      navigation: 'Navigation',
      previous: 'Previous',
      next: 'Next',
      proximityWarning: 'Booking in 30 minutes',
    },
    pl: {
      bookings: 'Nadchodzące',
      newBooking: 'Nowa rezerwacja',
      services: 'Uslugi',
      calendar: 'Kalendarz',
      admin: 'Admin',
      profileSettings: 'Konto i ustawienia',
      changeEmail: 'Email',
      language: 'Jezyk',
      close: 'Zamknij',
      save: 'Zapisz',
      delete: 'Usun',
      edit: 'Edytuj',
      cancel: 'Anuluj',
      upcoming: 'Nadchodzace',
      past: 'Przeszle',
      client: 'Klient',
      clientName: 'Imie i nazwisko',
      phone: 'Telefon',
      emailOptional: 'Email (opcjonalnie)',
      service: 'Usluga',
      chooseService: 'Wybierz usluge',
      pricePLN: 'Cena (PLN)',
      duration: 'Czas (min)',
      durationMin: 'Czas (min)',
      durationHours: 'Godziny',
      durationMinutes: 'Minuty',
      staff: 'Personel',
      apptTime: 'Termin wizyty',
      date: 'Data',
      time: 'Godzina',
      notesOptional: 'Notatki (opcjonalnie)',
      saveBooking: 'Zapisz rezerwacje',
      saveChanges: 'Zapisz zmiany',
      addService: 'Dodaj usluge',
      editServices: 'Edytuj uslugi',
      typeOfService: 'Rodzaj uslugi',
      today: 'Dzisiaj',
      prev: 'Wstecz',
      next: 'Dalej',
      saved: 'Zapisano zmiany',
      bookingSaved: 'Rezerwacja zapisana',
      bookingDeleted: 'Usunieto rezerwacje',
      serviceAdded: 'Dodano usluge',
      serviceRemoved: 'Usunieto usluge',
      timeUnavailable: 'Ten termin jest juz zajety dla tego stylisty.',
      clientNameRequired: 'Imie klienta jest wymagane',
      dateRequired: 'Data jest wymagana',
      timeRequired: 'Czas jest wymagany',
      pastTimeNotAllowed: 'Nie mozna rezerwowac wizyt w przeszlosci',
      signIn: 'Zaloguj',
      signUp: 'Zarejestruj',
      haveAccount: 'Masz konto?',
      needAccount: 'Nie masz konta?',
      email: 'Email',
      password: 'Haslo',
      fullName: 'Imie i nazwisko (opcjonalnie)',
      signOut: 'Wyloguj',
      forgotPassword: 'Zapomniales hasla?',
      resetPassword: 'Ustaw haslo',
      newPassword: 'Nowe haslo',
      confirm: 'Potwierdz',
      users: 'Uzytkownicy',
      makeAdmin: 'Nadaj admina',
      makeStaff: 'Nadaj staff',
      disable: 'Wylacz',
      enable: 'Wlacz',
      stats: 'Statystyki',
      searchUsers: 'Szukaj uzytkownikow',
      sendReset: 'Wyslij email resetu',
      deleteProfile: 'Usun rekord profilu',
      viewBookings: 'Pokaz rezerwacje uzytkownika',
      exportAll: 'Eksport wszystkich rezerwacji (CSV)',
      exportUser: 'Eksport tego uzytkownika (CSV)',
      previewAs: 'Podejrzyj jako uzytkownik',
      stopPreview: 'Zakoncz podglad',
      noBookings: 'Brak rezerwacji.',
      addUser: 'Dodaj uzytkownika',
      role: 'Rola',
      name: 'Imie i nazwisko',
      emailProfiles: 'Email (profil)',
      phoneProfiles: 'Telefon',
      // Calendar Views
      daily: 'Dzienny',
      schedule: 'Harmonogram',
      monthly: 'Miesięczny',
      calendarView: 'Widok',
      navigation: 'Nawigacja',
      previous: 'Poprzedni',
      next: 'Następny',
      proximityWarning: 'Rezerwacja za 30 minut',
    },
  };

  const t = (k, vars) => {
    const s = (dict[lang][k] ?? k);
    if (!vars) return s;
    return Object.entries(vars).reduce((acc, [kk, v]) => acc.replaceAll(`{${kk}}`, String(v)), s);
  };

  return (
    <SettingsContext.Provider value={{ t, lang, setLang, devAutoLogin, setDevAutoLogin }}>
      {children}
    </SettingsContext.Provider>
  );
}

function BigBtn({ text, onPress, kind = 'default', style: st }) {
  const base =
    kind === 'danger'
      ? [styles.bigBtn, { backgroundColor: '#B91C1C' }]
      : [styles.bigBtn, { backgroundColor: '#1d342e' }];
  const color = '#fff';
  return (
    <Pressable onPress={onPress} style={[...base, st]}>
      <Text style={{ color, fontWeight: '800', fontSize: 18 }} numberOfLines={1}>
        {text}
      </Text>
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

// Custom attractive alert modal
function CustomAlert({ visible, title, message, type = 'info', buttons = [], onClose }) {
  const getIconAndColor = (type) => {
    switch (type) {
      case 'success':
        return { icon: '✓', color: '#10B981', bgColor: '#ECFDF5' };
      case 'error':
        return { icon: '⚠', color: '#EF4444', bgColor: '#FEF2F2' };
      case 'warning':
        return { icon: '⚠', color: '#F59E0B', bgColor: '#FFFBEB' };
      case 'confirm':
        return { icon: '?', color: '#1d342e', bgColor: '#EEF2FF' };
      default:
        return { icon: 'ℹ', color: '#3B82F6', bgColor: '#EFF6FF' };
    }
  };

  const { icon, color, bgColor } = getIconAndColor(type);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.customAlertOverlay} onPress={onClose}>
        <Pressable style={styles.customAlertContainer} onPress={(e) => e.stopPropagation()}>
          {/* Icon */}
          <View style={[styles.customAlertIcon, { backgroundColor: bgColor }]}>
            <Text style={[styles.customAlertIconText, { color }]}>{icon}</Text>
          </View>
          
          {/* Title */}
          <Text style={styles.customAlertTitle}>{title}</Text>
          
          {/* Message */}
          {message && <Text style={styles.customAlertMessage}>{message}</Text>}
          
          {/* Buttons */}
          <View style={styles.customAlertButtons}>
            {buttons.length > 0 ? buttons.map((button, index) => (
              <Pressable
                key={index}
                style={[
                  styles.customAlertButton,
                  button.style === 'cancel' && styles.customAlertButtonCancel,
                  button.style === 'destructive' && styles.customAlertButtonDestructive,
                  index > 0 && { marginLeft: 12 }
                ]}
                onPress={() => {
                  if (button.onPress) button.onPress();
                  if (onClose) onClose();
                }}
              >
                <Text style={[
                  styles.customAlertButtonText,
                  button.style === 'cancel' && styles.customAlertButtonTextCancel,
                  button.style === 'destructive' && styles.customAlertButtonTextDestructive,
                ]}>
                  {button.text}
                </Text>
              </Pressable>
            )) : (
              <Pressable style={styles.customAlertButton} onPress={onClose}>
                <Text style={styles.customAlertButtonText}>OK</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const Input = React.forwardRef((props, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <TextInput 
      ref={ref} 
      {...props} 
      style={[
        styles.input, 
        isFocused && styles.inputFocused,
        props.style
      ]} 
      placeholderTextColor="#9AA3AF"
      returnKeyType="next"
      blurOnSubmit={false}
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
});

const TimeInput = React.forwardRef((props, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleFocus = (e) => {
    setIsFocused(true);
    
    // Add a small delay to ensure keyboard is visible, then scroll
    setTimeout(() => {
      if (ref?.current) {
        ref.current.scrollIntoView && ref.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
    
    props.onFocus?.(e);
  };
  
  return (
    <TextInput 
      ref={ref} 
      {...props} 
      style={[
        styles.timeInput, 
        isFocused && styles.timeInputFocused,
        props.style
      ]} 
      placeholderTextColor="#9AA3AF"
      keyboardType="numeric"
      selectTextOnFocus={true}
      returnKeyType="next"
      blurOnSubmit={false}
      onFocus={handleFocus}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
});

// Enhanced wrapper for better keyboard handling
const KeyboardAwareScrollView = ({ children, style, ...props }) => {
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
      style={[{ flex: 1 }, style]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 160 : 100}
      enabled={true}
    >
      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingBottom: 300 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'}
        scrollEventThrottle={16}
        keyboardDismissMode="interactive"
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/* =============================== Helpers & Constants =============================== */
const APP_SCHEME = 'triosalon';
const makeLink = (path = '/') => `${APP_SCHEME}://${String(path).replace(/^\//, '')}`;

const POLAND_PREFIX = '+48 ';
const currency = (n) => `PLN ${Number(n || 0).toFixed(2)}`;
const timeLabel = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const dateLabel = (d) => d.toLocaleDateString();
const withPolandPrefix = (txt) =>
  !txt?.startsWith('+48') ? POLAND_PREFIX + (txt || '').replace(/^[+\d\s]*/, '') : txt;

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

function ScreenScaffold({
  title,
  subtitle,
  children,
  onOpenSettings,
  user,
  staff,
  actionSlot,
  leftAction,  // ADD THIS LINE
  isSyncing,
}) {
  return (
    <SafeAreaView style={styles.screenRoot}>
      <View style={styles.screenHeaderWrapper}>
        <View style={styles.screenHeader}>
          <View style={styles.screenHeading}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {leftAction}
              <Text style={styles.screenTitle}>{title}</Text>
            </View>
            {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
          </View>
          <View style={styles.screenHeaderActions}>
            {isSyncing ? (
              <View style={styles.syncBadge}>
                <ActivityIndicator size="small" color="#1d342e" />
                <Text style={styles.syncBadgeText}>Syncing</Text>
              </View>
            ) : null}
            {actionSlot}
            <TouchableOpacity
              onPress={onOpenSettings}
              style={styles.headerCircleButton}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="settings-outline" size={20} color="#0f172a" />
            </TouchableOpacity>
            {null}
          </View>
        </View>
      </View>
      <View style={styles.screenContent}>{children}</View>
    </SafeAreaView>
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
  const [showPassword, setShowPassword] = useState(false);

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
    Alert.alert('Email sent', 'Open the link from your email — it will return you here to set a new password.');
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
              placeholder="••••••••" 
              secureTextEntry={!showPassword} 
              value={password} 
              onChangeText={setPassword} 
              onSubmitEditing={mode === 'signin' ? signIn : signUp}
            />
            <Pressable 
              style={styles.eyeButton} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
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
  const [viewMode, setViewMode] = useState('weekly'); // 'daily', 'weekly', 'monthly'
const [showViewMenu, setShowViewMenu] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
              placeholder="••••••••" 
              secureTextEntry={!showPassword} 
              value={newPass} 
              onChangeText={setNewPass} 
              onSubmitEditing={submit}
            />
            <Pressable 
              style={styles.eyeButton} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
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

/* ============================== Screens ============================== */
function BookingsScreen({ bookings, services, staff, onEdit, onDelete, showAlert }) {
  const { t } = useSettings();
  const now = Date.now();

  const full = bookings.map((b) => {
    const start = new Date(b.start_at);
    const svc = services.find((s) => s.id === b.service_id) || null;
    const stf = staff.find((s) => s.id === b.staff_id) || null;
    return {
      ...b,
      start,
      serviceName: svc?.name ?? '—',
      servicePrice: svc?.price ?? 0,
      staffName: stf?.name ?? '—',
    };
  });

  const upcoming = full.filter((b) => b.start.getTime() >= now).sort((a, b) => a.start - b.start);
  const past = full.filter((b) => b.start.getTime() < now).sort((a, b) => b.start - a.start);

const Row = ({ item }) => {
  // Check if booking is deleted or modified
  const isDeleted = item.status === 'deleted';
  const isModified = item.modified_at && item.created_at && 
    new Date(item.modified_at).getTime() !== new Date(item.created_at).getTime();
  
  return (
    <View style={[
      styles.scheduleCard,
      isDeleted && { opacity: 0.6, backgroundColor: '#F9FAFB' }
    ]}>
      <View style={{ flex: 1, gap: 4 }}>
        {/* Client Name with Status Badges */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={styles.bookingClient}>{item.client_name}</Text>
          
          {/* DELETED BADGE */}
          {isDeleted && (
            <View style={{
              backgroundColor: '#FEE2E2',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#EF4444',
            }}>
              <Text style={{
                color: '#B91C1C',
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                🔴 Deleted
              </Text>
            </View>
          )}
          
          {/* MODIFIED BADGE */}
          {isModified && !isDeleted && (
            <View style={{
              backgroundColor: '#FEF3C7',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#F59E0B',
            }}>
              <Text style={{
                color: '#92400E',
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                🟡 Modified
              </Text>
            </View>
          )}
        </View>

        <Text style={[
          styles.bookingSubBig,
          isDeleted && { color: '#9CA3AF' }
        ]}>
          {dateLabel(item.start)} {timeLabel(item.start)} • {item.duration_min ?? 60} min
        </Text>
        <Text style={[
          styles.bookingService,
          isDeleted && { color: '#D1D5DB' }
        ]}>
          {item.serviceName} • {currency(item.servicePrice)}
        </Text>
        <Text style={[
          styles.bookingSub,
          isDeleted && { color: '#D1D5DB' }
        ]}>{item.staffName}</Text>
        <Text style={[
          styles.bookingSub,
          isDeleted && { color: '#D1D5DB' }
        ]}>
          {item.client_phone}{item.client_email ? ` • ${item.client_email}` : ''}
        </Text>
        {item.note ? (
          <Text style={[
            styles.bookingNote,
            isDeleted && { color: '#D1D5DB' }
          ]}>
            "{item.note}"
          </Text>
        ) : null}
      </View>

      <View style={{ justifyContent: 'center', gap: 8 }}>
        {!isDeleted && <BigBtn text={t('edit')} onPress={() => onEdit(item)} />}
        {!isDeleted && (
          <BigBtn
            text={t('delete')}
            kind="danger"
            onPress={() =>
              showAlert(
                t('delete'), 
                'Are you sure?', 
                'confirm', 
                [
                  { text: t('cancel'), style: 'cancel' },
                  { text: t('delete'), style: 'destructive', onPress: () => onDelete(item.id) }
                ]
              )
            }
          />
        )}
        {isDeleted && (
          <View style={{
            padding: 12,
            backgroundColor: '#F3F4F6',
            borderRadius: 8,
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: 12,
              color: '#6B7280',
              fontWeight: '600',
            }}>
              Deleted
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Card title={t('upcoming')}>
        {upcoming.length === 0 ? <Text style={styles.empty}>—</Text> : upcoming.map((b) => <Row key={b.id} item={b} />)}
      </Card>
      <Card title={t('past')}>
        {past.length === 0 ? <Text style={styles.empty}>—</Text> : past.map((b) => <Row key={b.id} item={b} />)}
      </Card>
    </ScrollView>
  );
}

function ManageBookingScreen({ booking, services, staff, onSave, onDelete, onBack, showAlert, checkTimeConflict }) {
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
const initDate = booking?.start_at ? new Date(booking.start_at) : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30, 0, 0);
const [date, setDate] = useState(initDate);
  
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
      ? ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']
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
          <TextInput
            style={[styles.input, !clientName.trim() && styles.inputRequired]}
            value={clientName}
            onChangeText={setClientName}
            placeholder="Jane Doe"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.label}>{t('phone')}</Text>
          <TextInput
            style={[styles.input, (!clientPhone.trim() || clientPhone === POLAND_PREFIX) && styles.inputRequired]}
            value={clientPhone}
            onChangeText={setClientPhone}
            placeholder="+48"
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
                <Text style={styles.customDropdownArrow}>{showServiceDropdown ? '▲' : '▼'}</Text>
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
                      {isSelected && <Text style={styles.customDropdownCheckmark}>✓</Text>}
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
            <TextInput
              style={[styles.timeInput, styles.inputFocused]}
              value={hourText}
              onChangeText={setHourText}
              placeholder="10"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={2}
              onBlur={() => {
                const hour = parseInt(hourText, 10);
                if (isNaN(hour) || hour < 0 || hour > 23) {
                  setHourText('10');
                } else {
                  setHourText(hour.toString().padStart(2, '0'));
                }
              }}
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput
              style={[styles.timeInput, styles.inputFocused]}
              value={minuteText}
              onChangeText={setMinuteText}
              placeholder="30"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={2}
              onBlur={() => {
                const minute = parseInt(minuteText, 10);
                if (isNaN(minute) || minute < 0 || minute > 59) {
                  setMinuteText('30');
                } else {
                  setMinuteText(minute.toString().padStart(2, '0'));
                }
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

        {/* Action buttons */}
        <View style={styles.manageBookingActions}>
          <BigBtn text="Update Booking" onPress={submit} />
          <BigBtn text={t('delete')} kind="danger" onPress={handleDelete} />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function NewBookingScreen({ services, staff, onSave, initial, onSaved, showAlert, checkTimeConflict, navigation, route, setEditBooking }) {
  const { t, lang } = useSettings();

  const [title, setTitle] = useState(initial?.note ?? '');
  const [clientName, setClientName] = useState(initial?.client_name ?? '');
  const [clientPhone, setClientPhone] = useState(withPolandPrefix(initial?.client_phone ?? POLAND_PREFIX));
  const [serviceId, setServiceId] = useState(initial?.service_id ?? services[0]?.id);
  const [staffId, setStaffId] = useState(initial?.staff_id ?? staff[0]?.id);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const initialEmail = initial?.client_email ?? null;

const initDate = initial?.start_at ? new Date(initial.start_at) : new Date();
  
// Set default time to 10:30 for new bookings and ensure it's today
if (!initial?.start_at) {
  const today = new Date();
  initDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
  initDate.setHours(10, 30, 0, 0);
}
  
  const [date, setDate] = useState(initDate);
  const [time, setTime] = useState(initDate);
  
  // Separate state for input text to allow proper editing
  const [hourText, setHourText] = useState(initDate.getHours().toString().padStart(2, '0'));
  const [minuteText, setMinuteText] = useState(initDate.getMinutes().toString().padStart(2, '0'));

  // Ref for auto-focusing client name input
  const clientNameInputRef = useRef(null);
  const hourInputRef = useRef(null);
  const minuteInputRef = useRef(null);

  // Auto-focus on client name input when component mounts
  useEffect(() => {
    if (clientNameInputRef.current) {
      const timer = setTimeout(() => {
        clientNameInputRef.current.focus();
      }, 100); // Small delay to ensure the component is fully rendered
      return () => clearTimeout(timer);
    }
  }, []);

  // Function to check and show conflict alert when time or staff changes
  const checkAndAlertConflict = async (selectedStaffId, selectedTime) => {
    // Disable real-time conflict checking - only check when saving
    // This prevents blocking users from entering times during input
    return;
  };

  // Check for conflicts when staff changes
  useEffect(() => {
    if (staffId && time) {
      checkAndAlertConflict(staffId, time);
    }
  }, [staffId]);

  // Check for conflicts when time changes
  useEffect(() => {
    if (staffId && time) {
      checkAndAlertConflict(staffId, time);
    }
  }, [time]);

  const [durationMin, setDurationMin] = useState(
    initial?.duration_min ?? (services.find((s) => s.id === serviceId)?.duration_min || 60)
  );

  // Update all form fields when initial booking changes
  useEffect(() => {
    if (initial) {
      // Update all form fields with the booking data
      setTitle(initial.note ?? '');
      setClientName(initial.client_name ?? '');
      setClientPhone(withPolandPrefix(initial.client_phone ?? POLAND_PREFIX));
      setServiceId(initial.service_id ?? services[0]?.id);
      setStaffId(initial.staff_id ?? staff[0]?.id);
      setDurationMin(initial.duration_min ?? (services.find((s) => s.id === initial.service_id)?.duration_min || 60));
      
      if (initial.start_at) {
        const initialDate = new Date(initial.start_at);
        setDate(initialDate);
        setTime(initialDate);
        setHourText(initialDate.getHours().toString().padStart(2, '0'));
        setMinuteText(initialDate.getMinutes().toString().padStart(2, '0'));
      }
    } else {
      // Reset form for new booking
      setTitle('');
      setClientName('');
      setClientPhone(POLAND_PREFIX);
      setServiceId(services[0]?.id);
      setStaffId(staff[0]?.id);
      setDurationMin(services.find((s) => s.id === services[0]?.id)?.duration_min || 60);
      
      const newDate = new Date();
      newDate.setHours(10, 30, 0, 0);
      setDate(newDate);
      setTime(newDate);
      setHourText('10');
      setMinuteText('30');
    }
  }, [initial, services, staff]);

  useEffect(() => {
    if (!initial) {
      const d = services.find((s) => s.id === serviceId)?.duration_min || 60;
      setDurationMin(d);
    }
  }, [serviceId]); // eslint-disable-line

  // Clear edit booking when navigating to NewBooking from drawer (not from edit button)
  useFocusEffect(
    React.useCallback(() => {
      // If we're focusing on this screen and it's not from an edit action, clear edit state
      if (!route.params?.isEditing && setEditBooking) {
        setEditBooking(null);
      }
      // Reset the isEditing parameter for future navigations
      if (route.params?.isEditing && navigation) {
        navigation.setParams({ isEditing: undefined });
      }
    }, [route.params?.isEditing, setEditBooking, navigation])
  );

  const onDateChange = (_e, d) => d && setDate(d);
  const onTimeChange = (_e, d) => d && setTime(d);

  const openAndroidDate = () => DateTimePickerAndroid.open({ value: date, mode: 'date', onChange: onDateChange });
  const openAndroidTime = () => DateTimePickerAndroid.open({ value: time, mode: 'time', is24Hour: true, onChange: onTimeChange });

  // Language-aware date formatting
  const formatDate = (date) => {
    const months = lang === 'pl' 
      ? ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']
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

  // Generate calendar days
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    
    // Adjust for Monday as first day (0=Sunday, 1=Monday, etc.)
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday becomes 6, Monday becomes 0
    startDate.setDate(startDate.getDate() - mondayOffset);
    
    const days = [];
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const handleSave = async () => {
    // Validate staff selection FIRST
if (!staffId) {
  showAlert(
    lang === 'pl' ? 'Błąd' : 'Error',
    lang === 'pl' ? 'Wybierz personel' : 'Please select a staff member',
    'error'
  );
  return;
}    // Validate that client name is not empty
    if (!clientName || clientName.trim() === '') {
      showAlert(
        lang === 'pl' ? 'Błąd' : 'Error',
        t('clientNameRequired'),
        'error'
      );
      return;
    }

    // Validate that date is selected
    if (!date) {
      showAlert(
        lang === 'pl' ? 'Błąd' : 'Error',
        t('dateRequired'),
        'error'
      );
      return;
    }

    // Validate that time is selected
    if (!time) {
      showAlert(
        lang === 'pl' ? 'Błąd' : 'Error',
        t('timeRequired'),
        'error'
      );
      return;
    }

// Validate that the selected date/time is not in the past
const start = new Date(date);
start.setHours(parseInt(hourText, 10) || 0, parseInt(minuteText, 10) || 0, 0, 0);
    
    const now = new Date();
    if (start < now) {
      showAlert(
        lang === 'pl' ? 'Błąd' : 'Error',
        t('pastTimeNotAllowed'),
        'warning'
      );
      return;
    }

    const ok = await onSave({
      id: initial?.id,
      title,
      clientName: clientName.trim(),
      clientPhone,
      clientEmail: initialEmail,
      staffId,
      serviceId,
      durationMin: Number(durationMin || 60),
      startISO: start.toISOString(),
    });

    if (ok && typeof onSaved === 'function') {
      onSaved();
    }
  };

  return (
    <KeyboardAwareScrollView>
      <Card title={t('client')}>
          <Text style={styles.label}>
            {t('clientName')} <Text style={styles.requiredMark}>*</Text>
          </Text>
          <Input 
            ref={clientNameInputRef}
            value={clientName} 
            onChangeText={setClientName} 
            placeholder="Jane Doe"
            autoFocus={true}
            style={!clientName || clientName.trim() === '' ? styles.inputRequired : null}
          />

          <Text style={styles.label}>{t('phone')}</Text>
          <Input
            value={clientPhone}
            onChangeText={(val) => setClientPhone(withPolandPrefix(val))}
            keyboardType="phone-pad"
            placeholder="+48 555 555 555"
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
                <Text style={styles.customDropdownArrow}>{showServiceDropdown ? '▲' : '▼'}</Text>
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
                      {isSelected && <Text style={styles.customDropdownCheckmark}>✓</Text>}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </Card>

        <Card title={t('staff')}>
          <View style={styles.staffRow}>
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
          <Text style={styles.label}>
            {t('date')} <Text style={styles.requiredMark}>*</Text>
          </Text>
          <Pressable 
            style={[
              styles.dateTimeButton,
              !date ? styles.inputRequired : null
            ]} 
            onPress={() => setShowCalendar(!showCalendar)}
          >
            <Text style={styles.dateTimeButtonText}>{formatDate(date)}</Text>
            <Text style={styles.dateTimeButtonArrow}>{showCalendar ? '▲' : '▼'}</Text>
          </Pressable>

          {showCalendar && (
            <View style={styles.calendarContainer}>
              {/* Stylish Month/Year Selectors */}
              <View style={styles.calendarHeaderNew}>
                {/* Month Selector */}
                <View style={styles.dateSelectorsContainer}>
                  <Pressable 
                    style={styles.monthYearSelector}
                    onPress={() => {
                      setShowMonthDropdown(!showMonthDropdown);
                      setShowYearDropdown(false);
                    }}
                  >
                    <Text style={styles.monthYearSelectorText}>
                      {lang === 'pl' 
                        ? ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
                           'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'][date.getMonth()]
                        : ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()]
                      }
                    </Text>
                    <Text style={styles.monthYearSelectorArrow}>{showMonthDropdown ? '▲' : '▼'}</Text>
                  </Pressable>

                  {/* Year Selector */}
                  <Pressable 
                    style={styles.monthYearSelector}
                    onPress={() => {
                      setShowYearDropdown(!showYearDropdown);
                      setShowMonthDropdown(false);
                    }}
                  >
                    <Text style={styles.monthYearSelectorText}>{date.getFullYear()}</Text>
                    <Text style={styles.monthYearSelectorArrow}>{showYearDropdown ? '▲' : '▼'}</Text>
                  </Pressable>
                </View>

                {/* Month Dropdown */}
                {showMonthDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                      {(lang === 'pl' 
                        ? ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
                           'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
                        : ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December']
                      ).map((month, index) => (
                        <Pressable
                          key={index}
                          style={[
                            styles.dropdownOption,
                            index === date.getMonth() && styles.dropdownOptionSelected
                          ]}
                          onPress={() => {
                            const newDate = new Date(date);
                            newDate.setMonth(index);
                            setDate(newDate);
                            setShowMonthDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownOptionText,
                            index === date.getMonth() && styles.dropdownOptionTextSelected
                          ]}>
                            {month}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Year Dropdown */}
                {showYearDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                      {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                        <Pressable
                          key={year}
                          style={[
                            styles.dropdownOption,
                            year === date.getFullYear() && styles.dropdownOptionSelected
                          ]}
                          onPress={() => {
                            const newDate = new Date(date);
                            newDate.setFullYear(year);
                            setDate(newDate);
                            setShowYearDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownOptionText,
                            year === date.getFullYear() && styles.dropdownOptionTextSelected
                          ]}>
                            {year}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Days of Week */}
              <View style={styles.calendarWeekDays}>
                {(lang === 'pl' 
                  ? ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
                  : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
                ).map((day, index) => (
                  <Text key={index} style={styles.calendarWeekDay}>{day}</Text>
                ))}
              </View>

              {/* Calendar Days */}
              <View style={styles.calendarDays}>
                {generateCalendarDays().map((day, index) => {
                  const isCurrentMonth = day.getMonth() === date.getMonth();
                  const isSelected = day.toDateString() === date.toDateString();
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  // Get selected staff color
                  const selectedStaff = staff.find(s => s.id === staffId);
                  const staffColor = selectedStaff?.color || '#1d342e';
                  
                  return (
                    <Pressable
                      key={index}
                      style={[
                        styles.calendarDay,
                        isSelected && {
                          backgroundColor: staffColor,
                          borderRadius: 8,
                        },
                        isToday && !isSelected && {
                          backgroundColor: `${staffColor}20`,
                          borderRadius: 8,
                        }
                      ]}
                      onPress={() => {
                        if (isCurrentMonth) {
                          setDate(day);
                          setShowCalendar(false);
                        }
                      }}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        !isCurrentMonth && styles.calendarDayTextInactive,
                        isSelected && styles.calendarDayTextSelected,
                        isToday && !isSelected && { color: staffColor, fontWeight: '600' }
                      ]}>
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <Text style={[styles.label, { marginTop: 16 }]}>
            {t('time')} <Text style={styles.requiredMark}>*</Text>
          </Text>
          <View style={styles.timeInputContainer}>
            <View style={styles.timeInputBox}>
              <Text style={styles.timeInputLabel}>
                {lang === 'pl' ? 'Godzina' : 'Hour'}
              </Text>
              <TimeInput
                ref={hourInputRef}
                style={[
                  !time ? styles.inputRequired : null
                ]}
                value={hourText}
                onChangeText={(text) => {
                  // Only allow numbers, max 2 digits
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                  setHourText(cleaned);
                  
                  // Update time if it's a valid hour
                  const hour = parseInt(cleaned);
                  if (!isNaN(hour) && hour >= 0 && hour <= 23) {
                    const newTime = new Date(time);
                    newTime.setHours(hour);
                    setTime(newTime);
                  }
                }}
                onBlur={() => {
                  // Format the input when user finishes editing
                  const hour = parseInt(hourText) || 0;
                  const validHour = Math.min(Math.max(hour, 0), 23);
                  const formatted = validHour.toString().padStart(2, '0');
                  setHourText(formatted);
                  
                  const newTime = new Date(time);
                  newTime.setHours(validHour);
                  setTime(newTime);
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="09"
                placeholderTextColor="#9CA3AF"
                selectTextOnFocus={true}
              />
            </View>
            
            <Text style={styles.timeInputSeparator}>:</Text>
            
            <View style={styles.timeInputBox}>
              <Text style={styles.timeInputLabel}>
                {lang === 'pl' ? 'Minuta' : 'Min'}
              </Text>
              <TimeInput
                ref={minuteInputRef}
                style={[
                  !time ? styles.inputRequired : null
                ]}
                value={minuteText}
                onChangeText={(text) => {
                  // Only allow numbers, max 2 digits
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                  setMinuteText(cleaned);
                  
                  // Update time if it's a valid minute
                  const minute = parseInt(cleaned);
                  if (!isNaN(minute) && minute >= 0 && minute <= 59) {
                    const newTime = new Date(time);
                    newTime.setMinutes(minute);
                    setTime(newTime);
                  }
                }}
                onBlur={() => {
                  // Format the input when user finishes editing
                  const minute = parseInt(minuteText) || 0;
                  const validMinute = Math.min(Math.max(minute, 0), 59);
                  const formatted = validMinute.toString().padStart(2, '0');
                  setMinuteText(formatted);
                  
                  const newTime = new Date(time);
                  newTime.setMinutes(validMinute);
                  setTime(newTime);
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="00"
                placeholderTextColor="#9CA3AF"
                selectTextOnFocus={true}
              />
            </View>
          </View>
        </Card>

        <Card title={t('notesOptional')}>
          <Input value={title} onChangeText={setTitle} placeholder="e.g., toner preferences, allergies" multiline />
        </Card>

        <View style={{ marginTop: 16, paddingHorizontal: 32 }}>
          <BigBtn 
            text={initial ? t('saveChanges') : t('saveBooking')} 
            kind="primary" 
            onPress={handleSave} 
          />
        </View>
    </KeyboardAwareScrollView>
  );
}

function ServicesScreen({ services, reload, showAlert }) {
  const { t, lang } = useSettings();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceHours, setNewServiceHours] = useState('1');
  const [newServiceMinutes, setNewServiceMinutes] = useState('0');

  const toLocal = (svc) => {
    const minutes = Math.max(0, Number(svc.duration_min ?? 60));
    const hoursPart = Math.floor(minutes / 60);
    const minutesPart = minutes % 60;
    return {
      ...svc,
      durationHours: String(hoursPart),
      durationMinutes: String(minutesPart),
    };
  };

  const [items, setItems] = useState(services.map(toLocal));
  useEffect(() => setItems(services.map(toLocal)), [services]);

  const updateLocal = (id, patch) =>
    setItems((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...patch };
        if (patch.hasOwnProperty('durationHours') || patch.hasOwnProperty('durationMinutes')) {
          const hoursText = next.durationHours ?? '';
          const minutesText = next.durationMinutes ?? '';
          const hoursVal = hoursText === '' ? 0 : Math.max(0, parseInt(hoursText, 10) || 0);
          let minutesVal = minutesText === '' ? 0 : Math.max(0, parseInt(minutesText, 10) || 0);
          minutesVal = Math.min(59, minutesVal);
          if (minutesText !== '' && String(minutesVal) !== minutesText) {
            next.durationMinutes = String(minutesVal);
          }
          next.duration_min = hoursVal * 60 + minutesVal;
        }
        return next;
      })
    );

  const addService = async () => {
    setShowAddModal(true);
  };

  const confirmAddService = async () => {
    const name = newServiceName.trim();
    if (!name) {
      showAlert('Error', 'Service name is required.', 'error');
      return;
    }
    const hours = Math.max(0, parseInt(newServiceHours ?? '', 10) || 0);
    const minutes = Math.max(0, Math.min(59, parseInt(newServiceMinutes ?? '', 10) || 0));
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) {
      showAlert('Error', 'Duration must be greater than zero.', 'error');
      return;
    }

    const { error } = await supabase.from('services').insert({ 
      name: name, 
      price: 0, 
      duration_min: totalMinutes 
    });
    if (error) return showAlert('Error', error.message, 'error');
    
    // Reset form
    setNewServiceName('');
    setNewServiceHours('1');
    setNewServiceMinutes('0');
    setShowAddModal(false);
    
    showAlert('Success', t('serviceAdded'), 'success');
    reload();
  };

  const cancelAddService = () => {
    setNewServiceName('');
    setNewServiceHours('1');
    setNewServiceMinutes('0');
    setShowAddModal(false);
  };

  const saveOne = async (s) => {
    const hours = Math.max(0, parseInt(s.durationHours ?? '', 10) || 0);
    const minutes = Math.max(0, Math.min(59, parseInt(s.durationMinutes ?? '', 10) || 0));
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) {
      showAlert('Error', 'Duration must be greater than zero.', 'error');
      return;
    }
    const payload = {
      name: (s.name ?? '').trim(),
      duration_min: totalMinutes,
    };
    const { error } = await supabase.from('services').update(payload).eq('id', s.id);
    if (error) return showAlert('Error', error.message, 'error');
    showAlert('Success', t('saved'), 'success');
    reload();
  };

  const remove = async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) return showAlert('Error', error.message, 'error');
    showAlert('Success', t('serviceRemoved'), 'success');
    reload();
  };

  return (
    <>
      <KeyboardAwareScrollView>
        <Card title={t('editServices')}>
            {items.length === 0 ? (
              <Text style={styles.empty}>—</Text>
          ) : (
            items.map((s) => (
              <View key={s.id} style={styles.serviceBlock}>
                <Text style={[styles.label, styles.serviceLabel]}>{t('typeOfService')}</Text>
                <Input
                  style={styles.serviceInput}
                  value={s.name ?? ''}
                  onChangeText={(txt) => updateLocal(s.id, { name: txt })}
                  placeholder={t('typeOfService')}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, styles.serviceLabel]}>{t('durationHours')}</Text>
                    <Input
                      style={styles.serviceInput}
                      value={s.durationHours}
                      onChangeText={(txt) => updateLocal(s.id, { durationHours: txt.replace(/[^\d]/g, '') })}
                      keyboardType="number-pad"
                      placeholder="1"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, styles.serviceLabel]}>{t('durationMinutes')}</Text>
                    <Input
                      style={styles.serviceInput}
                      value={s.durationMinutes}
                      onChangeText={(txt) => updateLocal(s.id, { durationMinutes: txt.replace(/[^\d]/g, '') })}
                      keyboardType="number-pad"
                      placeholder="30"
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                  <BigBtn text={t('save')} onPress={() => saveOne(s)} />
                  <BigBtn text="✕" kind="danger" onPress={() => remove(s.id)} />
                </View>

                <View style={styles.divider} />
              </View>
            ))
          )}

          <View style={{ marginTop: 8 }}>
            <BigBtn kind="primary" text={t('addService')} onPress={addService} />
          </View>
        </Card>

        <View style={{ height: 24 }} />
    </KeyboardAwareScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={cancelAddService}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('addService')}</Text>
            
            <Text style={[styles.label, styles.serviceLabel]}>Type of service</Text>
            <Input
              style={styles.serviceInput}
              value={newServiceName}
              onChangeText={setNewServiceName}
              placeholder="Enter service name"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, styles.serviceLabel]}>{t('durationHours')}</Text>
                <Input
                  style={styles.serviceInput}
                  value={newServiceHours}
                  onChangeText={(txt) => setNewServiceHours(txt.replace(/[^\d]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="1"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, styles.serviceLabel]}>{t('durationMinutes')}</Text>
                <Input
                  style={styles.serviceInput}
                  value={newServiceMinutes}
                  onChangeText={(txt) => {
                    const num = parseInt(txt.replace(/[^\d]/g, ''), 10) || 0;
                    setNewServiceMinutes(String(Math.min(59, num)));
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <BigBtn text={t('save')} onPress={confirmAddService} />
              <BigBtn text="✕" kind="danger" onPress={cancelAddService} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/* ============== Admin (power tools) ============== */
function AdminScreen({ reloadAll, onPreviewRole, currentEmail, showAlert }) {
  const { t } = useSettings();
  const [profiles, setProfiles] = useState([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState({ open: false, title: '', items: [] });
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '', role: 'staff' });

  const load = async () => {
    // Attempt with email; if schema doesn't have it, retry without.
    let data, error;
    ({ data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, phone, email')
      .order('full_name', { ascending: true }));

    if (error?.code === '42703') {
      const retry = await supabase
        .from('profiles')
        .select('user_id, full_name, role, phone') // no email
        .order('full_name', { ascending: true });
      data = retry.data;
    } else if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setProfiles(data || []);
  };

  useEffect(() => { load(); }, []);

  const setRole = async (user_id, nextRole) => {
    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('user_id', user_id);
    if (error) return showAlert('Error', error.message, 'error');
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
      const { error: e2 } = await supabase.from('profiles').update({ full_name: patch.full_name, phone: patch.phone }).eq('user_id', p.user_id);
      if (e2) return showAlert('Error', e2.message, 'error');
    } else if (error) {
      return showAlert('Error', error.message, 'error');
    }
    showAlert('Success', 'Profile updated successfully', 'success');
    load();
  };

  const deleteProfileRow = async (user_id) => {
    showAlert(
      t('delete'), 
      t('deleteProfile') + '?', 
      'confirm', 
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('profiles').delete().eq('user_id', user_id);
            if (error) return showAlert('Error', error.message, 'error');
            load();
          },
        },
      ]
    );
  };

  const sendReset = async (email) => {
    if (!email) return Alert.alert('Error', 'No email for this user.');
    const redirectTo = makeLink('/password-reset');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) return Alert.alert('Failed', error.message);
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

    if (res.error) return Alert.alert('Error', res.error.message);
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
      title: `${t('viewBookings')} — ${p.full_name || p.email || p.user_id}`,
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
    if (error) return Alert.alert('Error', error.message);
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
    if (!csv) return Alert.alert('Info', t('noBookings'));
    await Share.share({ message: csv });
  };

  const exportUserBookings = async (p) => {
    const { data: all } = await supabase.from('bookings').select('*').order('start_at', { ascending: true });
    const rows = (all || []).filter((b) =>
      (b.created_by && b.created_by === p.user_id) ||
      (p.email && b.client_email === p.email) ||
      (p.full_name && (b.client_name || '').toLowerCase().includes((p.full_name || '').toLowerCase()))
    ).map((b) => ({
      id: b.id,
      start_at: b.start_at,
      client_name: b.client_name,
      client_phone: b.client_phone,
      client_email: b.client_email,
      duration_min: b.duration_min,
      note: b.note,
    }));
    const csv = toCSV(rows);
    if (!csv) return Alert.alert('Info', t('noBookings'));
    await Share.share({ message: csv });
  };

  const previewAsUser = (p) => {
    const label = p.full_name || p.email || p.user_id.slice(0, 8);
    onPreviewRole?.({ role: p.role || 'staff', label });
    Alert.alert('Preview', `Now previewing as ${label}`);
  };

  // Add user
  const createTempPassword = () =>
    Math.random().toString(36).slice(-8) + 'A!' + Math.random().toString(36).slice(-4);

  const addUser = async () => {
    const full_name = (addForm.full_name || '').trim();
    const email = (addForm.email || '').trim();
    const phone = (addForm.phone || '').trim() || null;
    const role = addForm.role || 'staff';
    if (!email || !email.includes('@')) return Alert.alert('Error', 'Enter a valid email.');
    const tempPass = createTempPassword();
    const redirectTo = makeLink('/auth-callback');

    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPass,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) return Alert.alert('Error', error.message);

    const uid = data?.user?.id;
    if (uid) {
      const patch = { user_id: uid, full_name, phone, role };
      // try upserting with email; if schema lacks it, fall back without
      let up = await supabase.from('profiles').upsert({ ...patch, email });
      if (up.error?.code === '42703') up = await supabase.from('profiles').upsert(patch);
      if (up.error) return Alert.alert('Error', up.error.message);
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
      <KeyboardAwareScrollView>
          <Card title={t('users')}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Input placeholder={t('searchUsers')} value={q} onChangeText={setQ} style={{ flex: 1 }} />
              <BigBtn text={t('addUser')} onPress={() => setAddOpen(true)} />
            </View>

            {filtered.length === 0 ? (
              <Text style={styles.empty}>—</Text>
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

                    {p.email !== undefined && (
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
                    )}

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
        prev.map((x) => (x.user_id === p.user_id ? { ...x, role: val } : x))
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
                    {p.email !== undefined && <BigBtn text={t('sendReset')} onPress={() => sendReset(p.email)} />}
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

      {/* Bookings list modal */}
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
                <Text style={styles.empty}>—</Text>
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

      {/* Add user modal */}
      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <Pressable style={styles.modalBack} onPress={() => setAddOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('addUser')}</Text>
            <Text style={styles.label}>{t('name')}</Text>
            <Input value={addForm.full_name} onChangeText={(v) => setAddForm((f) => ({ ...f, full_name: v }))} placeholder="Jane Doe" />
            <Text style={styles.label}>Email</Text>
            <Input value={addForm.email} autoCapitalize="none" keyboardType="email-address" onChangeText={(v) => setAddForm((f) => ({ ...f, email: v }))} placeholder="user@example.com" />
            <Text style={styles.label}>{t('phoneProfiles')}</Text>
            <Input value={addForm.phone} keyboardType="phone-pad" onChangeText={(v) => setAddForm((f) => ({ ...f, phone: v }))} placeholder="+48 ..." />
            <Text style={styles.label}>{t('role')}</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={addForm.role} onValueChange={(v) => setAddForm((f) => ({ ...f, role: v }))} style={styles.pickerBig}>
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

// Main Calendar Screen with dropdown menu
function CalendarScreen({ bookings, services, staff, weekStart, setWeekStart, onPressBooking, onCreateBooking }) {
  const { t, lang } = useSettings();
  
  // View mode state - Daily is now default
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [showViewMenu, setShowViewMenu] = useState(false);
  
const today = new Date();
const initialWeek = weekStart ? new Date(weekStart) : startOfWeekMonday(new Date());
const [selectedDate, setSelectedDate] = useState(weekStart ? initialWeek : today);

useEffect(() => {
    if (!weekStart) return;
    const incoming = new Date(weekStart);
    if (Number.isNaN(incoming.getTime())) return;
    const incomingWeek = startOfWeekMonday(incoming);
    const currentWeek = startOfWeekMonday(selectedDate);
    if (incomingWeek.getTime() !== currentWeek.getTime()) {
      setSelectedDate(incomingWeek);
    }
  }, [weekStart]);

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

  const handleCreateBooking = () => {
    const candidate = new Date(selectedDate);
    candidate.setHours(9, 0, 0, 0);
    if (onCreateBooking) onCreateBooking(candidate);
  };

  const weekdayShort = lang === 'pl' 
    ? ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB', 'ND']
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

  return (
    <View style={styles.calendarWrapper}>
      {/* View Mode Dropdown */}
      <View style={styles.calendarViewSwitcher}>
        <Pressable 
          style={styles.viewSwitcherButton}
          onPress={() => setShowViewMenu(!showViewMenu)}
        >
          <Ionicons name="menu" size={20} color="#1d342e" />
          <Text style={styles.viewSwitcherText}>
            {viewMode === 'daily' ? t('daily') : 
             viewMode === 'weekly' ? (lang === 'pl' ? 'Tygodniowy' : 'Weekly') : 
             t('monthly')}
          </Text>
          <Ionicons name={showViewMenu ? "chevron-up" : "chevron-down"} size={16} color="#666" />
        </Pressable>

        {showViewMenu && (
          <View style={styles.viewSwitcherDropdown}>
            <Pressable 
              style={[styles.viewSwitcherOption, viewMode === 'daily' && styles.viewSwitcherOptionActive]}
              onPress={() => { setViewMode('daily'); setShowViewMenu(false); }}
            >
              <Ionicons name="today" size={18} color={viewMode === 'daily' ? '#c7a864' : '#666'} />
              <Text style={[styles.viewSwitcherOptionText, viewMode === 'daily' && styles.viewSwitcherOptionTextActive]}>
                {t('daily')}
              </Text>
            </Pressable>

            <Pressable 
              style={[styles.viewSwitcherOption, viewMode === 'weekly' && styles.viewSwitcherOptionActive]}
              onPress={() => { setViewMode('weekly'); setShowViewMenu(false); }}
            >
              <Ionicons name="calendar" size={18} color={viewMode === 'weekly' ? '#c7a864' : '#666'} />
              <Text style={[styles.viewSwitcherOptionText, viewMode === 'weekly' && styles.viewSwitcherOptionTextActive]}>
                {lang === 'pl' ? 'Tygodniowy' : 'Weekly'}
              </Text>
            </Pressable>

            <Pressable 
              style={[styles.viewSwitcherOption, viewMode === 'monthly' && styles.viewSwitcherOptionActive]}
              onPress={() => { setViewMode('monthly'); setShowViewMenu(false); }}
            >
              <Ionicons name="calendar-outline" size={18} color={viewMode === 'monthly' ? '#c7a864' : '#666'} />
              <Text style={[styles.viewSwitcherOptionText, viewMode === 'monthly' && styles.viewSwitcherOptionTextActive]}>
                {t('monthly')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Render based on view mode */}
      {viewMode === 'weekly' && (
        <>
          <TouchableOpacity
            onPress={() => shiftWeek(-1)}
            style={styles.hiddenNavButton}
          />
          
          <View style={styles.calendarWeekHeaderClean}>
            <View style={styles.calendarDayStripClean}>
              {weekDays.map((day, idx) => {
                const isActive = day.toDateString() === selectedDate.toDateString();
                const dayIndex = (day.getDay() + 6) % 7;
                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => handleDayPress(day)}
                    style={styles.calendarDayItemClean}
                  >
                    <Text style={styles.calendarDayLabelClean}>
                      {weekdayShort[dayIndex]}
                    </Text>
                    <View style={[
                      styles.calendarDayCircleClean,
                      isActive && styles.calendarDayCircleActiveClean
                    ]}>
                      <Text style={[
                        styles.calendarDayNumberClean,
                        isActive && styles.calendarDayNumberActiveClean
                      ]}>
                        {day.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => shiftWeek(1)}
            style={styles.hiddenNavButton}
          />

          <ScrollView contentContainerStyle={styles.calendarListContentMockup} showsVerticalScrollIndicator={false}>
            <View style={styles.calendarDateHeaderMockup}>
              <Text style={styles.calendarDateHeaderTextMockup}>{dayHeadline}</Text>
            </View>

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
                      <Text style={styles.scheduleCardNameMockup}>{booking.client_name || t('client')}</Text>
                      <Text style={styles.scheduleCardServiceMockup}>{service?.name || t('service')}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </>
      )}

      {/* Daily view with time grid */}
      {viewMode === 'daily' && (
        <>
          {/* Daily navigation */}
          <View style={styles.dailyNavigation}>
            <TouchableOpacity
              onPress={() => {
                const prevDay = new Date(selectedDate);
                prevDay.setDate(prevDay.getDate() - 1);
                setSelectedDate(prevDay);
              }}
              style={styles.dailyNavButton}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
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
              <Ionicons name="chevron-forward" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Time grid */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {Array.from({ length: 14 }, (_, i) => i + 8).map((hour) => {
                const bookingsAtHour = bookingsForDay.filter(booking => {
                  const bookingStart = new Date(booking.start_at);
                  return bookingStart.getHours() === hour;
                });

                const now = new Date();
                const isCurrentHour = now.getHours() === hour && 
                                      selectedDate.toDateString() === now.toDateString();

                return (
                  <View key={hour} style={styles.dailyTimeRow}>
                    {/* Time label */}
                    <View style={styles.dailyTimeLabel}>
                      <Text style={styles.dailyTimeLabelText}>
                        {hour.toString().padStart(2, '0')}:00
                      </Text>
                    </View>

                    {/* Time slot */}
                    <View style={[
                      styles.dailyTimeSlot,
                      isCurrentHour && styles.dailyTimeSlotCurrent
                    ]}>
                      {bookingsAtHour.length === 0 ? (
                        <Pressable 
                          style={styles.dailyEmptySlot}
                          onPress={() => {
                            const newBooking = new Date(selectedDate);
                            newBooking.setHours(hour, 0, 0, 0);
                            onCreateBooking?.(newBooking);
                          }}
                        >
                          <Text style={styles.dailyEmptySlotText}>+</Text>
                        </Pressable>
                      ) : (
                        <View style={styles.dailyBookingsContainer}>
                          {bookingsAtHour.map((booking) => {
                            const service = services.find(s => s.id === booking.service_id);
                            const staffMember = staff.find(s => s.id === booking.staff_id);
                            const startTime = new Date(booking.start_at);
                            
                            return (
                              <Pressable
                                key={booking.id}
                                onPress={() => onPressBooking?.(booking)}
                                style={[
                                  styles.dailyBooking,
                                  { backgroundColor: staffMember?.color || '#1d342e' }
                                ]}
                              >
                                <Text style={styles.dailyBookingClient}>
                                  {booking.client_name}
                                </Text>
                                <Text style={styles.dailyBookingService}>
                                  {service?.name || t('service')}
                                </Text>
                                <Text style={styles.dailyBookingTime}>
                                  {startTime.toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })} • {booking.duration_min || 60} min
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </>
      )}

      {/* Monthly view placeholder */}
      {viewMode === 'monthly' && (
        <>
          {/* Monthly navigation */}
          <View style={styles.dailyNavigation}>
            <TouchableOpacity
              onPress={() => {
                const prevMonth = new Date(selectedDate);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                setSelectedDate(prevMonth);
              }}
              style={styles.dailyNavButton}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
            </TouchableOpacity>

            <View style={styles.dailyDateDisplay}>
              <Text style={styles.dailyDateText}>
                {selectedDate.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                const nextMonth = new Date(selectedDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setSelectedDate(nextMonth);
              }}
              style={styles.dailyNavButton}
            >
              <Ionicons name="chevron-forward" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Monthly calendar grid */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {/* Day headers */}
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                {(lang === 'pl' 
                  ? ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
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
                  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                  const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
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
                    const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
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
                              width: 6,
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
    ? ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
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
    <View style={styles.calendarViewSwitcher}>
      <Pressable 
        style={styles.viewSwitcherButton}
        onPress={() => setShowViewMenu(!showViewMenu)}
      >
        <Ionicons name="menu" size={20} color="#1d342e" />
        <Text style={styles.viewSwitcherText}>
          {viewMode === 'daily' ? (lang === 'pl' ? 'Dzienny' : 'Daily') : 
           viewMode === 'weekly' ? (lang === 'pl' ? 'Tygodniowy' : 'Weekly') : 
           (lang === 'pl' ? 'Miesięczny' : 'Monthly')}
        </Text>
        <Ionicons name={showViewMenu ? "chevron-up" : "chevron-down"} size={16} color="#666" />
      </Pressable>

      {showViewMenu && (
        <View style={styles.viewSwitcherDropdown}>
          <Pressable 
            style={[styles.viewSwitcherOption, viewMode === 'daily' && styles.viewSwitcherOptionActive]}
            onPress={() => { setViewMode('daily'); setShowViewMenu(false); }}
          >
            <Ionicons name="today" size={18} color={viewMode === 'daily' ? '#c7a864' : '#666'} />
            <Text style={[styles.viewSwitcherOptionText, viewMode === 'daily' && styles.viewSwitcherOptionTextActive]}>
              {lang === 'pl' ? 'Dzienny' : 'Daily'}
            </Text>
          </Pressable>

          <Pressable 
            style={[styles.viewSwitcherOption, viewMode === 'weekly' && styles.viewSwitcherOptionActive]}
            onPress={() => { setViewMode('weekly'); setShowViewMenu(false); }}
          >
            <Ionicons name="calendar" size={18} color={viewMode === 'weekly' ? '#c7a864' : '#666'} />
            <Text style={[styles.viewSwitcherOptionText, viewMode === 'weekly' && styles.viewSwitcherOptionTextActive]}>
              {lang === 'pl' ? 'Tygodniowy' : 'Weekly'}
            </Text>
          </Pressable>

          <Pressable 
            style={[styles.viewSwitcherOption, viewMode === 'monthly' && styles.viewSwitcherOptionActive]}
            onPress={() => { setViewMode('monthly'); setShowViewMenu(false); }}
          >
            <Ionicons name="calendar-outline" size={18} color={viewMode === 'monthly' ? '#c7a864' : '#666'} />
            <Text style={[styles.viewSwitcherOptionText, viewMode === 'monthly' && styles.viewSwitcherOptionTextActive]}>
              {lang === 'pl' ? 'Miesięczny' : 'Monthly'}
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

    {viewMode === 'weekly' && (
      <>
        <TouchableOpacity
          onPress={() => shiftWeek(-1)}
          style={styles.hiddenNavButton}
        />
        
        <View style={styles.calendarWeekHeaderClean}>
          <View style={styles.calendarDayStripClean}>
            {weekDays.map((day, idx) => {
              const isActive = day.toDateString() === selectedDate.toDateString();
              const dayIndex = (day.getDay() + 6) % 7;
              return (
                <Pressable
                  key={day.toISOString()}
                  onPress={() => handleDayPress(day)}
                  style={styles.calendarDayItemClean}
                >
                  <Text style={styles.calendarDayLabelClean}>
                    {weekdayShort[dayIndex]}
                  </Text>
                  <View style={[
                    styles.calendarDayCircleClean,
                    isActive && styles.calendarDayCircleActiveClean
                  ]}>
                    <Text style={[
                      styles.calendarDayNumberClean,
                      isActive && styles.calendarDayNumberActiveClean
                    ]}>
                      {day.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => shiftWeek(1)}
          style={styles.hiddenNavButton}
        />

        <ScrollView contentContainerStyle={styles.calendarListContentMockup} showsVerticalScrollIndicator={false}>
          <View style={styles.calendarDateHeaderMockup}>
            <Text style={styles.calendarDateHeaderTextMockup}>{dayHeadline}</Text>
          </View>

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
                    <Text style={styles.scheduleCardNameMockup}>{booking.client_name || t('client')}</Text>
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
          {lang === 'pl' ? 'Widok miesięczny - wkrótce' : 'Monthly view - coming soon'}
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
useEffect(() => {
  setUser({ 
    id: 'test-user-123', 
    email: 'test@test.com',
    user_metadata: { full_name: 'Test User' }
  });
  setProfile({ 
    user_id: 'test-user-123', 
    full_name: 'Test User', 
    role: 'admin' 
  });
}, []);

  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const [editBooking, setEditBooking] = useState(null);
  const [manageBooking, setManageBooking] = useState(null);

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Custom alert state
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });

  // Helper function to show custom alerts
  const showCustomAlert = (title, message, type = 'info', buttons = []) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
      buttons
    });
  };

  const hideCustomAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  };

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

  /* Data */
  const loadServices = async () => {
    setSyncing(true);
    const { data } = await supabase.from('services').select('*').order('name', { ascending: true });
    setServices(data || []);
    setSyncing(false);
  };
  const loadStaff = async () => {
    setSyncing(true);
    const { data } = await supabase.from('staff').select('*').order('name', { ascending: true });
    const cleaned = (data || []).filter((s) => !((s.name || '').toLowerCase().includes('magda')));
    // Ensure Lucyna first if present
    const lucyna = cleaned.find((s) => (s.name || '').toLowerCase().includes('lucyna'));
    const rest = cleaned.filter((s) => s !== lucyna);
    setStaff(lucyna ? [lucyna, ...rest] : cleaned);
    setSyncing(false);
  };
const loadBookings = async () => {
  setSyncing(true);
  
  // Check if current user is admin
  const userEmail = (user?.email || '').toLowerCase();
  const userRole = profile?.role || 'staff';
  const isUserAdmin = userEmail === 'josemunoz@outlook.com.au' || userRole === 'admin';
  
  console.log('🔍 Admin Check:', { userEmail, userRole, isUserAdmin });

  // Build query - admins see ALL bookings, regular users only see active ones
  let query = supabase.from('bookings').select('*');
  
  // DEBUG: Check what values we're getting
  console.log('🔍 Admin Check:', {
    userEmail,
    userRole,
    isUserAdmin
  });
  
  const { data } = await query.order('start_at', { ascending: true });
  setBookings(data || []);
  setSyncing(false);
};
  const reloadAll = async () => {
    setSyncing(true);
    await Promise.all([loadServices(), loadStaff(), loadBookings()]);
    setSyncing(false);
  };

  useEffect(() => { if (user) reloadAll(); }, [user?.id]);

  // Real-time subscriptions for live data sync
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to bookings changes
    const bookingsChannel = supabase
      .channel('bookings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Bookings change detected:', payload);
          loadBookings(); // Reload bookings when any change occurs
        }
      )
      .subscribe();

    // Subscribe to services changes
    const servicesChannel = supabase
      .channel('services_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        (payload) => {
          console.log('Services change detected:', payload);
          loadServices(); // Reload services when any change occurs
        }
      )
      .subscribe();

    // Subscribe to staff changes
    const staffChannel = supabase
      .channel('staff_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        (payload) => {
          console.log('Staff change detected:', payload);
          loadStaff(); // Reload staff when any change occurs
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount or user change
    return () => {
      console.log('Cleaning up real-time subscriptions');
      bookingsChannel.unsubscribe();
      servicesChannel.unsubscribe();
      staffChannel.unsubscribe();
    };
  }, [user?.id]);

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
      .select('id, start_at, duration_min, staff_id, client_name')
      .eq('staff_id', staffId);

    let directConflict = false;
    let proximityWarning = null;

    for (const b of overlaps || []) {
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
        lang === 'pl' ? 'Wymagane jest minimum 30 minut przerwy między rezerwacjami.' : 'Minimum 30 minutes gap required between bookings.',
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
          lang === 'pl' ? 'Nadchodząca rezerwacja' : 'Upcoming Booking',
          lang === 'pl' 
            ? `Istnieje nadchodząca rezerwacja o ${warningTime}.`
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
    lang === 'pl' ? 'Rezerwacja usunięta!' : 'Booking deleted successfully!', 
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
            title={t('calendar')}
            subtitle=""
            onOpenSettings={() => setSettingsOpen(true)}
            user={user}
            staff={staff}
            actionSlot={
              <View style={styles.headerActionGroup}>
                <TouchableOpacity
                  onPress={() => {
                    setEditBooking({
                      start_at: new Date().toISOString(),
                      client_name: '',
                      client_phone: '',
                      client_email: '',
                      service_id: services[0]?.id,
                      staff_id: staff[0]?.id,
                      duration_min: 30,
                    });
                    navigation.navigate('NewBooking');
                  }}
                  style={styles.headerQuickAction}
                  accessibilityRole="button"
                  accessibilityLabel="New booking"
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            }
            isSyncing={syncing}
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
              checkTimeConflict={checkTimeConflict}
              navigation={navigation}
              route={route}
              setEditBooking={setEditBooking}
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
                checkTimeConflict={checkTimeConflict}
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
  isAdmin={isAdmin}
  user={user}
  profile={profile}
  bookings={bookings}
  services={services}
  staff={staff}
  showAlert={showCustomAlert}
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

/* --- Settings Modal (extracted to keep TopBar simple) --- */
function SettingsModal({ open, onClose, onSignOut, onRequestEmailChange }) {
  const { t, lang, setLang } = useSettings();
  const [newEmail, setNewEmail] = useState('');
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBack} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{t('profileSettings')}</Text>

          <Text style={styles.label}>{t('language')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <BigBtn text="PL" onPress={() => setLang('pl')} />
            <BigBtn text="EN" onPress={() => setLang('en')} />
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>{t('changeEmail')}</Text>
          <Input value={newEmail} onChangeText={setNewEmail} placeholder="new@email.com" autoCapitalize="none" keyboardType="email-address" />
          <BigBtn text="Send email change link" onPress={() => onRequestEmailChange(newEmail)} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <BigBtn text={t('close')} onPress={onClose} />
            <BigBtn text={t('signOut')} kind="danger" onPress={onSignOut} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

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
  paddingTop: Platform.select({ ios: 48, android: 76 }),
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
    gap: 4,
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
    borderRadius: 20,
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
    gap: 4,
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
    gap: 4,
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
    backgroundColor: '#1d342e',
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
    borderRadius: 20,
    shadowColor: 'rgba(255, 255, 255, 0.8)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitleContainer: {
    backgroundColor: '#1d342e',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 18,
    marginBottom: 4,
    shadowColor: '#1d342e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
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
    borderRadius: 20,
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
    paddingVertical: 12,
    marginBottom: 28,
  },
  drawerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1d342e',
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
    paddingHorizontal: 16,
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
    backgroundColor: '#1d342e',
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
    paddingHorizontal: 16,
  },
  bigBtn: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ac8c62',
  },
  cardTitle: { fontWeight: '900', marginBottom: 8, color: '#111827', fontSize: 18 },
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
  flexWrap: 'wrap',     // wraps on very small screens—no overlap
  rowGap: 8,
  columnGap: 8,
},
navFixed: {
  width: 120,           // equal fixed widths keep Month perfectly centered
  alignItems: 'center',
},
navBtn: {
  marginTop: 0,         // cancel BigBtn’s default top margin (prevents “overlay” look)
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
  fontSize: 16,
  color: '#1d342e',
  fontWeight: 'bold',
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

  // Custom Alert Styles
  customAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customAlertContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  customAlertIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  customAlertIconText: {
    fontSize: 32,
    fontWeight: '700',
  },
  customAlertTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  customAlertMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  customAlertButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  customAlertButton: {
    backgroundColor: '#1d342e',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  customAlertButtonCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  customAlertButtonDestructive: {
    backgroundColor: '#EF4444',
  },
  customAlertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  customAlertButtonTextCancel: {
    color: '#6B7280',
  },
  customAlertButtonTextDestructive: {
    color: '#fff',
  },

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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  viewButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    shadowOpacity: 0.1,
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
    paddingHorizontal: 16,
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
    backgroundColor: '#1d342e',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    paddingVertical: 12,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1d342e',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    backgroundColor: '#1d342e',
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
    paddingVertical: 12,
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
    backgroundColor: '#1d342e',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    backgroundColor: '#1d342e',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
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
calendarDayCircleClean: {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
},
 calendarDayCircleActiveClean: {
  backgroundColor: '#c7a864',
},
calendarDayNumberClean: {
  fontSize: 20,
  fontWeight: '600',
  color: '#1F2937',
},
calendarDayNumberActiveClean: {
    color: '#fff',
    fontWeight: '800',
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
});
