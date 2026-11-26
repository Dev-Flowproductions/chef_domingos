import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../lib/theme';
import { PageBackground } from '../../components/ScreenWrapper';
import { PageFrame } from '../../components/PageFrame';
import { useAuthStore } from '../../store/authStore';
import { USE_MOCK } from '../../lib/config';
import JDLogo from '../../components/JDLogo';

type AuthNav = NativeStackNavigationProp<any>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AuthNav>();
  const { t } = useTranslation();
  const { signIn } = useAuthStore();

  const handleEmailLogin = async () => {
    if (USE_MOCK) {
      await signIn('demo@example.com', 'password');
      return;
    }
    navigation.navigate('EmailLogin');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <PageBackground />

      <PageFrame maxWidth={480} style={styles.authFrame}>
      <View style={styles.logoWrap}>
        <JDLogo size="large" />
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>{t('auth.welcome')}</Text>
        <Text style={styles.body}>{t('auth.welcomeBody')}</Text>
      </View>

      <View style={styles.btns}>
        <TouchableOpacity style={styles.btn} onPress={handleEmailLogin} activeOpacity={0.85}>
          <Ionicons name="mail-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>{t('auth.loginEmail')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
        </TouchableOpacity>
      </View>
      </PageFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 48,
    overflow: 'hidden',
  },
  authFrame: { flex: 1, justifyContent: 'center', width: '100%' },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  info: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '400',
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  btns: {
    gap: 16,
    alignItems: 'center',
  },
  btn: {
    backgroundColor: Colors.gold,
    height: 48,
    width: '100%',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
  },
  registerText: {
    color: Colors.gold,
    fontSize: 16,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});
