import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '../i18n';

const STORAGE_KEY = 'app_language';

export type AppLocale = 'pt' | 'en';

function deviceLocale(): AppLocale {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  return code.startsWith('pt') ? 'pt' : 'en';
}

interface LocaleState {
  locale: AppLocale;
  ready: boolean;
  initLocale: () => Promise<void>;
  setLocale: (lang: AppLocale) => Promise<void>;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'pt',
  ready: false,

  initLocale: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const locale: AppLocale =
        saved === 'pt' || saved === 'en' ? saved : deviceLocale();
      await i18n.changeLanguage(locale);
      set({ locale, ready: true });
    } catch (err) {
      console.warn('[localeStore] initLocale failed, using defaults:', err);
      await i18n.changeLanguage('pt').catch(() => undefined);
      set({ locale: 'pt', ready: true });
    }
  },

  setLocale: async (lang) => {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    set({ locale: lang });
  },
}));

export function localeTag(locale: AppLocale): string {
  return locale === 'pt' ? 'pt-PT' : 'en-GB';
}
