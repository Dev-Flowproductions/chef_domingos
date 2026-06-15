import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notification_settings';

export interface NotificationSettings {
  promotions: boolean;
  pointsEarned: boolean;
  voucherReminders: boolean;
}

const DEFAULTS: NotificationSettings = {
  promotions: true,
  pointsEarned: true,
  voucherReminders: true,
};

interface SettingsState {
  notifications: NotificationSettings;
  ready: boolean;
  initSettings: () => Promise<void>;
  setNotification: (key: keyof NotificationSettings, value: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  notifications: DEFAULTS,
  ready: false,

  initSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
        set({
          notifications: { ...DEFAULTS, ...parsed },
          ready: true,
        });
        return;
      }
    } catch (err) {
      console.warn('[settingsStore] initSettings failed, using defaults:', err);
    }
    set({ ready: true });
  },

  setNotification: async (key, value) => {
    const next = { ...get().notifications, [key]: value };
    set({ notifications: next });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },
}));
