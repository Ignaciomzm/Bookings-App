import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { supabase } from './supabase';
import { useSettings } from './SettingsContext';

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { devAutoLogin } = useSettings();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Auto sign-in (dev)
  useEffect(() => {
    (async () => {
      if (session || !devAutoLogin) return;
      const devEmail = process.env.EXPO_PUBLIC_DEV_EMAIL;
      const devPass = process.env.EXPO_PUBLIC_DEV_PASSWORD;
      if (!devEmail || !devPass) return;
      const { error } = await supabase.auth.signInWithPassword({ email: devEmail, password: devPass });
      if (error) console.warn('Auto sign-in failed:', error.message);
    })();
  }, [devAutoLogin, session]);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Sign-in failed', error.message);
  };

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Sign-up failed', error.message);
    else Alert.alert('Check your email', 'Confirm your account, then sign in.');
  };

  if (!session) {
    return (
      <View style={s.container}>
        <Text style={s.title}>Salon Login</Text>
        <TextInput style={s.input} placeholder="email" autoCapitalize="none" keyboardType="email-address"
          value={email} onChangeText={setEmail} placeholderTextColor="#9AA3AF" />
        <TextInput style={s.input} placeholder="password" secureTextEntry
          value={password} onChangeText={setPassword} placeholderTextColor="#9AA3AF" />
        <Pressable style={s.btn} onPress={signIn}><Text style={s.btnTxt}>Sign in</Text></Pressable>
        <Pressable style={[s.btn, s.alt]} onPress={signUp}><Text style={s.btnAltTxt}>Sign up</Text></Pressable>
      </View>
    );
  }

  return <View style={{ flex: 1 }}>{children}</View>;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7FA', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16, color: '#111827' },
  input: { width: '100%', backgroundColor: '#fff', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10, color: '#111827' },
  btn: { backgroundColor: '#111827', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 6, width: '100%' },
  btnTxt: { color: '#fff', fontWeight: '800' },
  alt: { backgroundColor: '#E5E7EB' },
  btnAltTxt: { color: '#111827', fontWeight: '800' },
});
