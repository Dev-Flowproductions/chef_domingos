import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors, Assets } from '../../lib/theme';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useLocaleStore, AppLocale } from '../../store/localeStore';
import { supabase } from '../../lib/supabase';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { profile, loading, fetchProfile, updateProfile } = useUserStore();
  const { locale, setLocale } = useLocaleStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id]);

  useEffect(() => {
    const metaName = (user as { user_metadata?: { name?: string } })?.user_metadata?.name;
    setName(profile?.name ?? metaName ?? '');
    setPhone(profile?.phone ?? '');
    if (profile?.preferred_language === 'en' || profile?.preferred_language === 'pt') {
      void setLocale(profile.preferred_language);
    }
  }, [profile, user]);

  const email = profile?.email ?? user?.email ?? '';

  const handleSave = async () => {
    if (!user?.id || !name.trim()) return;
    setSaving(true);

    const lang = locale;
    const updates = {
      name: name.trim(),
      phone: phone.trim(),
      preferred_language: lang,
    };

    if (!profile) {
      const { error: upsertErr } = await supabase.from('users').upsert(
        { id: user.id, email, ...updates },
        { onConflict: 'id' },
      );
      if (upsertErr) {
        setSaving(false);
        Alert.alert(t('common.error'), t('profile.saveError'));
        return;
      }
      await fetchProfile(user.id);
    } else {
      const { error } = await updateProfile(user.id, updates);
      if (error) {
        setSaving(false);
        Alert.alert(t('common.error'), t('profile.saveError'));
        return;
      }
    }

    await supabase.auth.updateUser({ data: { name: name.trim() } });
    setSaving(false);
    Alert.alert(t('common.success'), t('profile.saved'), [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const pickLang = (lang: AppLocale) => {
    void setLocale(lang);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.root}>
        <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>{t('common.back')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('profile.editTitle')}</Text>

          {loading ? (
            <ActivityIndicator color={Colors.gold} style={{ marginVertical: 24 }} />
          ) : (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>{t('auth.name')}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('auth.namePlaceholder')}
                  placeholderTextColor="#aaa"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={email}
                  editable={false}
                />
                <Text style={styles.hint}>{t('profile.emailReadOnly')}</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('profile.phone')}</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('profile.phonePlaceholder')}
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('profile.language')}</Text>
                <View style={styles.langRow}>
                  <TouchableOpacity
                    style={[styles.langBtn, locale === 'pt' && styles.langBtnActive]}
                    onPress={() => pickLang('pt')}
                  >
                    <Text style={[styles.langText, locale === 'pt' && styles.langTextActive]}>
                      {t('profile.langPt')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.langBtn, locale === 'en' && styles.langBtnActive]}
                    onPress={() => pickLang('en')}
                  >
                    <Text style={[styles.langText, locale === 'en' && styles.langTextActive]}>
                      {t('profile.langEn')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bg: { position: 'absolute', width: 874, height: 874, left: -274, top: 0, opacity: 0.4 },
  scroll: { paddingHorizontal: 20 },
  back: { color: Colors.gold, fontSize: 16, marginBottom: 16 },
  title: { fontSize: 28, color: Colors.gold, marginBottom: 24 },
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
  inputDisabled: { backgroundColor: '#f5f0e8', color: '#888' },
  hint: { fontSize: 12, color: '#888' },
  langRow: { flexDirection: 'row', gap: 12 },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
  },
  langBtnActive: { backgroundColor: Colors.gold },
  langText: { fontSize: 16, color: Colors.textPrimary },
  langTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: Colors.gold,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
