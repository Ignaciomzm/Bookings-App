// SettingsContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { en, pl } from './i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsCtx = createContext(null);

export function SettingsProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [devAutoLogin, setDevAutoLogin] = useState(false);

  useEffect(() => { (async () => {
    const L = await AsyncStorage.getItem('lang'); if (L) setLang(L);
    const A = await AsyncStorage.getItem('devAutoLogin'); if (A) setDevAutoLogin(A === 'true');
  })(); }, []);
  useEffect(() => { AsyncStorage.setItem('lang', lang); }, [lang]);
  useEffect(() => { AsyncStorage.setItem('devAutoLogin', String(devAutoLogin)); }, [devAutoLogin]);

  const dict = lang === 'pl' ? pl : en;
  const t = (k) => dict[k] ?? k;

  const value = useMemo(() => ({ lang, setLang, devAutoLogin, setDevAutoLogin, t }), [lang, devAutoLogin]);
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}
export const useSettings = () => useContext(SettingsCtx);
