import React from 'react';
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
import { Colors, Assets } from '../../lib/theme';
import { useAuthStore } from '../../store/authStore';
import { USE_MOCK } from '../../lib/config';
import JDLogo from '../../components/JDLogo';

const SETTINGS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'person-outline',           label: 'Editar Perfil' },
  { icon: 'notifications-outline',    label: 'Notificações' },
  { icon: 'help-circle-outline',      label: 'Ajuda e Suporte' },
  { icon: 'document-text-outline',    label: 'Termos e Condições' },
  { icon: 'lock-closed-outline',      label: 'Política de Privacidade' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuthStore();
  const userName = (user as any)?.user_metadata?.name || 'Maria Silva';
  const email = (user as any)?.email || 'maria.silva@email.com';

  return (
    <View style={styles.root}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <JDLogo size="small" />
        </View>

        {/* Title */}
        <Text style={styles.pageTitle}>A minha conta</Text>

        {/* User info */}
        <View style={styles.userBlock}>
      <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#888" />
        </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>

        {/* Settings list */}
        <View style={styles.settingsList}>
          {SETTINGS.map((item, idx) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
                <Ionicons name={item.icon} size={22} color={Colors.gold} style={styles.settingsIcon} />
                <Text style={styles.settingsLabel}>{item.label}</Text>
              </TouchableOpacity>
              {idx < SETTINGS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Dev navigation only visible in mock mode */}
        {USE_MOCK && (
          <View style={styles.devSection}>
            <Text style={styles.devTitle}>Dev Navigation</Text>
            <TouchableOpacity
              style={styles.devBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.devBtnText}>→ Login Screen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.devBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.devBtnText}>→ Register Screen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.devBtn}
              onPress={() => navigation.navigate('Onboarding')}
            >
              <Text style={styles.devBtnText}>→ Onboarding Screen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOut} onPress={signOut} activeOpacity={0.85}>
          <Text style={styles.signOutText}>Terminar sessão</Text>
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
  avatarText: { fontSize: 40 }, // kept for reference
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
