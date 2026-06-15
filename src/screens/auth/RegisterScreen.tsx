import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
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

export default function RegisterScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { signUp } = useAuthStore();

  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [newsAccepted,  setNewsAccepted]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [done,          setDone]          = useState(false);

  const handleFinish = async () => {
    if (!name || !email || !password) {
      Alert.alert(t('auth.fieldsRequired'), t('auth.fillAllFields'));
      return;
    }
    if (!termsAccepted) {
      Alert.alert(t('auth.termsRequired'), t('auth.termsMustAccept'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('auth.invalidPassword'), t('auth.passwordMin6'));
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (error) {
      Alert.alert(t('auth.registerError'), error.message ?? t('auth.genericError'));
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, styles.successContainer, { paddingTop: insets.top + 40 }]}>
        <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
        <Text style={styles.successIcon}>✉️</Text>
        <Text style={styles.successTitle}>{t('auth.verifyEmailTitle')}</Text>
        <Text style={styles.successBody}>
          {t('auth.verifyEmailBody')}{'\n'}
          <Text style={styles.successEmail}>{email}</Text>
          {'\n\n'}{t('auth.verifyEmailHint')}
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('EmailLogin')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{t('auth.goToLogin')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 80 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />

        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>

        {/* Logo letters */}
        <View style={styles.logoWrap}>
          <View style={styles.letters}>
            <Text style={[styles.letter, { color: '#B59363' }]}>J</Text>
            <Text style={[styles.letter, styles.letterD, { color: '#8E7D65' }]}>D</Text>
          </View>
        </View>

        <Text style={styles.title}>{t('auth.registerTitle')}</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.name')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.namePlaceholder')}
              placeholderTextColor="#aaa"
              autoCorrect={false}
              value={name}
              onChangeText={setName}
            />
          </View>

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
              placeholder={t('auth.passwordMinPlaceholder')}
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Terms */}
          <TouchableOpacity style={styles.checkRow} onPress={() => setTermsAccepted(!termsAccepted)} activeOpacity={0.8}>
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkText}>
              {t('auth.termsAccept')}{' '}
              <Text style={styles.link}>{t('auth.termsLink')}</Text>
              {' '}{t('auth.termsAnd')}{' '}
              <Text style={styles.link}>{t('auth.privacyLink')}</Text>.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.checkRow} onPress={() => setNewsAccepted(!newsAccepted)} activeOpacity={0.8}>
            <View style={[styles.checkbox, newsAccepted && styles.checkboxChecked]}>
              {newsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkText}>{t('auth.newsOptIn')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, (!termsAccepted || loading) && styles.btnDisabled]}
            onPress={handleFinish}
            disabled={!termsAccepted || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{t('auth.createAccount')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('EmailLogin')}>
            <Text style={styles.loginLink}>{t('auth.hasAccount')}</Text>
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
  back: { marginBottom: 16 },
  backText: { color: Colors.gold, fontSize: 16 },
  logoWrap: { alignItems: 'center', marginBottom: 8 },
  letters: { flexDirection: 'row' },
  letter: { fontSize: 48, fontStyle: 'italic', fontWeight: '400', lineHeight: 60 },
  letterD: { marginTop: 5 },
  title: { fontSize: 28, fontWeight: '400', color: Colors.gold, marginBottom: 24, textAlign: 'center' },
  form: { gap: 16 },
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
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: { width: 26, height: 26, borderWidth: 2, borderColor: Colors.gold, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxChecked: { backgroundColor: Colors.gold },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkText: { flex: 1, fontSize: 13, color: Colors.textPrimary, lineHeight: 20 },
  link: { textDecorationLine: 'underline' },
  btn: {
    backgroundColor: Colors.gold,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  loginLink: { color: Colors.gold, fontSize: 15, textAlign: 'center', textDecorationLine: 'underline', marginTop: 4 },
  successContainer: { alignItems: 'center', justifyContent: 'center', gap: 20 },
  successIcon: { fontSize: 64 },
  successTitle: { fontSize: 28, fontWeight: '400', color: Colors.gold, textAlign: 'center' },
  successBody: { fontSize: 16, color: Colors.textPrimary, textAlign: 'center', lineHeight: 26 },
  successEmail: { fontWeight: '700', color: Colors.gold },
});
