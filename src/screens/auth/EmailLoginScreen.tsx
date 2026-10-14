import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors, Assets } from '../../lib/theme';
import { useAuthStore } from '../../store/authStore';
import PasswordInput from '../../components/PasswordInput';

export default function EmailLoginScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { signIn, resetPassword } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.fieldsRequired'), t('auth.fillEmailPassword'));
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert(t('auth.loginError'), error.message ?? t('auth.invalidCredentials'));
    }
  };

  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert(t('auth.fieldsRequired'), t('auth.fillEmailForReset'));
      return;
    }
    setResetting(true);
    const { error } = await resetPassword(trimmed);
    setResetting(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }
    Alert.alert(t('auth.resetSentTitle'), t('auth.resetSentBody'));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />

        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('auth.emailLoginTitle')}</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <PasswordInput
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity onPress={handleForgotPassword} disabled={resetting} activeOpacity={0.7}>
            <Text style={styles.forgot}>{resetting ? t('common.loading') : t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{t('auth.login')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>{t('auth.noAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 32,
  },
  bg: { position: 'absolute', width: 874, height: 874, left: -275, top: 0, opacity: 0.4 },
  back: { marginBottom: 24 },
  backText: { color: Colors.gold, fontSize: 16 },
  title: { fontSize: 28, fontWeight: '400', color: Colors.gold, marginBottom: 32 },
  form: { gap: 20 },
  field: { gap: 6 },
  label: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: '#e0d8cc',
  },
  forgot: {
    color: Colors.gold,
    fontSize: 14,
    textAlign: 'right',
    textDecorationLine: 'underline',
    marginTop: -8,
  },
  btn: {
    backgroundColor: Colors.gold,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  link: { color: Colors.gold, fontSize: 15, textAlign: 'center', textDecorationLine: 'underline', marginTop: 4 },
});
