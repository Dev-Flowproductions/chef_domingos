import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors, Assets } from '../../lib/theme';
import { useSettingsStore, NotificationSettings } from '../../store/settingsStore';

const TOGGLES: { key: keyof NotificationSettings; titleKey: string; descKey: string }[] = [
  { key: 'promotions', titleKey: 'notifications.promotions', descKey: 'notifications.promotionsDesc' },
  { key: 'pointsEarned', titleKey: 'notifications.pointsEarned', descKey: 'notifications.pointsEarnedDesc' },
  { key: 'voucherReminders', titleKey: 'notifications.voucherReminders', descKey: 'notifications.voucherRemindersDesc' },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { notifications, setNotification } = useSettingsStore();

  return (
    <View style={styles.root}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('notifications.title')}</Text>
        <Text style={styles.subtitle}>{t('notifications.subtitle')}</Text>

        <View style={styles.list}>
          {TOGGLES.map((item) => (
            <View key={item.key} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{t(item.titleKey)}</Text>
                <Text style={styles.rowDesc}>{t(item.descKey)}</Text>
              </View>
              <Switch
                value={notifications[item.key]}
                onValueChange={(v) => void setNotification(item.key, v)}
                trackColor={{ false: '#ddd', true: Colors.goldLight }}
                thumbColor={notifications[item.key] ? Colors.gold : '#f4f4f4'}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bg: { position: 'absolute', width: 874, height: 874, left: -274, top: 0, opacity: 0.4 },
  scroll: { paddingHorizontal: 20 },
  back: { color: Colors.gold, fontSize: 16, marginBottom: 16 },
  title: { fontSize: 28, color: Colors.gold, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22, marginBottom: 24 },
  list: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#E8E0D5',
    gap: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, color: Colors.textPrimary, fontWeight: '600', marginBottom: 4 },
  rowDesc: { fontSize: 13, color: '#757575', lineHeight: 18 },
});
