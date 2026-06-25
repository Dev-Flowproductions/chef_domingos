import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors, Assets } from '../../lib/theme';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useLocaleStore, AppLocale } from '../../store/localeStore';
import { USE_MOCK } from '../../lib/config';
import JDLogo from '../../components/JDLogo';
import type { ProfileStackParamList } from '../../navigation/types';

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

const SETTINGS: {
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  route: keyof ProfileStackParamList;
}[] = [
  { icon: 'person-outline', labelKey: 'profile.editProfile', route: 'EditProfile' },
  { icon: 'notifications-outline', labelKey: 'profile.notifications', route: 'Notifications' },
  { icon: 'help-circle-outline', labelKey: 'profile.help', route: 'Help' },
  { icon: 'document-text-outline', labelKey: 'profile.terms', route: 'Terms' },
  { icon: 'lock-closed-outline', labelKey: 'profile.privacy', route: 'Privacy' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNav>();
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();
  const { setLocale } = useLocaleStore();

  useEffect(() => {
    if (user?.id) {
      void fetchProfile(user.id).then(() => {
        const lang = useUserStore.getState().profile?.preferred_language;
        if (lang === 'pt' || lang === 'en') {
          void setLocale(lang as AppLocale);
        }
      });
    }
  }, [user?.id]);

  const metaName = (user as { user_metadata?: { name?: string } })?.user_metadata?.name;
  const userName = profile?.name || metaName || '—';
  const email = profile?.email || user?.email || '—';

  return (
    <View style={styles.root}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.logoWrap}>
          <JDLogo
            size="small"
            onLongPress={() => navigation.navigate('StaffPin')}
          />
        </View>

        <Text style={styles.pageTitle}>{t('profile.title')}</Text>

        <View style={styles.userBlock}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#888" />
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>

        <View style={styles.settingsList}>
          {SETTINGS.map((item, idx) => (
            <View key={item.route}>
              <TouchableOpacity
                style={styles.settingsRow}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(item.route)}
              >
                <Ionicons name={item.icon} size={22} color={Colors.gold} style={styles.settingsIcon} />
                <Text style={styles.settingsLabel}>{t(item.labelKey)}</Text>
              </TouchableOpacity>
              {idx < SETTINGS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {USE_MOCK && (
          <View style={styles.devSection}>
            <Text style={styles.devTitle}>Dev Navigation</Text>
            <TouchableOpacity
              style={styles.devBtn}
              onPress={() => navigation.getParent()?.navigate('Login' as never)}
            >
              <Text style={styles.devBtnText}>→ Login Screen</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.signOut} onPress={signOut} activeOpacity={0.85}>
          <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bg: {
    position: 'absolute',
    width: 874,
    height: 874,
    left: -274,
    top: 0,
    opacity: 0.4,
  },
  scroll: { paddingHorizontal: 20 },
  logoWrap: { alignItems: 'center', marginBottom: 8 },
  pageTitle: {
    fontSize: 34,
    fontWeight: '400',
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 20,
  },
  userBlock: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: '#C8C8C8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: { fontSize: 26, color: Colors.textPrimary, marginBottom: 4 },
  userEmail: { fontSize: 18, color: Colors.textPrimary },
  settingsList: {
    borderTopWidth: 1,
    borderColor: '#E8E0D5',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  settingsIcon: { width: 28, textAlign: 'center' },
  settingsLabel: { fontSize: 16, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: '#E8E0D5' },
  devSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
    gap: 8,
  },
  devTitle: { fontSize: 12, fontWeight: '700', color: '#999', marginBottom: 4 },
  devBtn: { paddingVertical: 8 },
  devBtnText: { fontSize: 15, color: Colors.gold },
  signOut: {
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: 22,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 18,
    color: Colors.gold,
  },
});
