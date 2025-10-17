// AuthGate.js — updated so you can log in without entering the app first
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { supabase } from './supabase';
import { useSettings } from './SettingsContext';

export default function AuthGate({ children }) {
  const { devAutoLogin, setDevAutoLogin } = useSettings();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);

  // Local inputs for email/password login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription?.unsubscribe();
  }, []);

 // Dev auto login using fixed credentials from env (no random emails)
useEffect(() => {
  (async () => {
    if (!ready || session || !devAutoLogin) return;

    // HARDCODED ADMIN CREDENTIALS FOR DEV AUTO-LOGIN
    const email = 'josemunoz@outlook.com.au';
    const password = 'Nthhmzm0989'; // ⚠️ REPLACE THIS WITH YOUR ACTUAL PASSWORD

    console.log('🔐 Dev auto-login: Attempting to sign in as admin...');

    // Try sign-in first
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.log('❌ Dev auto-login failed:', error.message);
      return;
    }
    
    console.log('✅ Dev auto-login successful as admin!');
    
    // Ensure user has admin role in profiles table
    if (data?.user?.id) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: data.user.id, 
          email: email,
          role: 'admin',
          full_name: 'Admin' 
        });
      
      if (profileError) {
        console.log('⚠️ Profile update warning:', profileError.message);
      }
    }
  })();
}, [ready, session, devAutoLogin]);

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Enter email and password.');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Sign in failed', error.message);
  };

  if (!ready) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
        <Text style={s.msg}>Loading…</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.center}
      >
        <Text style={s.headline}>Please sign in</Text>

        {/* Email / Password form */}
        <View style={s.card}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#9AA3AF"
          />
          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#9AA3AF"
          />
          <Pressable style={s.btnPrimary} onPress={handlePasswordLogin}>
            <Text style={s.btnPrimaryText}>Sign in</Text>
          </Pressable>
        </View>

        {/* Google OAuth (optional if configured) */}
        <Pressable
          style={[s.btn, { marginTop: 14 }]}
          onPress={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
        >
          <Text style={s.btnText}>Sign in with Google</Text>
        </Pressable>

        {/* Dev auto login toggle */}
        <View style={s.devRow}>
          <Text style={s.devText}>Dev auto sign-in</Text>
          <Switch value={devAutoLogin} onValueChange={setDevAutoLogin} />
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Authenticated
  return children;
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F7F7FA' },
  headline: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 12 },
  msg: { marginTop: 12, color: '#111827' },

  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: { color: '#6B7280', fontWeight: '600', marginTop: 6, marginBottom: 4 },
  input: {
    backgroundColor: '#FAFBFC',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 16,
  },

  btn: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  btnText: { color: '#fff', fontWeight: '800' },

  btnPrimary: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },

  devRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  devText: { color: '#111827', fontWeight: '700' },
});
