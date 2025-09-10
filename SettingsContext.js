// SettingsContext.js - language + dev auto-login toggle (persisted)
// Default language comes from .env (EXPO_PUBLIC_DEFAULT_LANG) or device locale.
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { tFor } from './i18n';

const SUPPORTED = ['en', 'pl'];
const SettingsCtx = createContext(null);

export function SettingsProvider({ children }) {
  const [lang, setLang] = useState('en');       // will be overridden on init
  const [devAutoLogin, setDevAutoLogin] = useState(false);

  // On first run, pick language: saved -> env -> device -> 'en'
  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem('lang');
        const savedDev = await AsyncStorage.getItem('devAutoLogin');

        if (savedLang && SUPPORTED.includes(savedLang)) {
          setLang(savedLang);
        } else {
          const envDefault = String(process.env.EXPO_PUBLIC_DEFAULT_LANG || '').toLowerCase();
          let initial =
            SUPPORTED.includes(envDefault)
              ? envDefault
              : (Localization.locale || 'en').split('-')[0].toLowerCase() === 'pl'
                ? 'pl'
                : 'en';

          setLang(initial);
          await AsyncStorage.setItem('lang', initial);
        }

        if (savedDev) setDevAutoLogin(savedDev === '1');
      } catch {
        // Fallbacks already applied above
      }
    })();
  }, []);

  const updateLang = async (v) => {
    const val = SUPPORTED.includes(v) ? v : 'en';
    setLang(val);
    await AsyncStorage.setItem('lang', val);
  };

  const updateDevAuto = async (v) => {
    setDevAutoLogin(v);
    await AsyncStorage.setItem('devAutoLogin', v ? '1' : '0');
  };

  const t = tFor(lang);

  return (
    <SettingsCtx.Provider value={{
      lang,
      t,
      setLang: updateLang,
      devAutoLogin,
      setDevAutoLogin: updateDevAuto,
    }}>
      {children}
    </SettingsCtx.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsCtx);
}
