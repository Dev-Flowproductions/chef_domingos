import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/theme';
import { validateStaffVoucher, VoucherValidationStatus } from '../../services/lkm/vouchers';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'StaffValidate'>;

const STATUS_STYLE: Record<
  VoucherValidationStatus,
  { bg: string; icon: keyof typeof Ionicons.glyphMap; msgKey: string }
> = {
  valid: { bg: '#16a34a', icon: 'checkmark-circle', msgKey: 'staff.resultValid' },
  already_used: { bg: '#dc2626', icon: 'close-circle', msgKey: 'staff.resultUsed' },
  expired: { bg: '#ca8a04', icon: 'time', msgKey: 'staff.resultExpired' },
  not_active: { bg: '#ca8a04', icon: 'time', msgKey: 'staff.resultNotActive' },
};

export default function StaffValidateScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: VoucherValidationStatus; title: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const validate = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await validateStaffVoucher(trimmed);
      setResult(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCode('');
    setResult(null);
    setError(null);
  };

  const statusUi = result ? STATUS_STYLE[result.status] : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color={Colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>{t('staff.validateTitle')}</Text>
      <Text style={styles.subtitle}>{t('staff.validateHint')}</Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder={t('staff.voucherPlaceholder')}
        placeholderTextColor="#999"
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={() => void validate()}
        disabled={loading || !code.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{t('staff.validateBtn')}</Text>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result && statusUi ? (
        <View style={[styles.resultBox, { backgroundColor: statusUi.bg }]}>
          <Ionicons name={statusUi.icon} size={48} color="#fff" />
          <Text style={styles.resultTitle}>{result.title}</Text>
          <Text style={styles.resultMsg}>{t(statusUi.msgKey)}</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Text style={styles.resetBtnText}>{t('staff.scanAnother')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24 },
  close: { alignSelf: 'flex-end', padding: 8 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#757575', textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    letterSpacing: 1,
    textAlign: 'center',
  },
  btn: {
    marginTop: 16,
    backgroundColor: Colors.gold,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#dc2626', textAlign: 'center', marginTop: 16, fontSize: 14 },
  resultBox: {
    marginTop: 28,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  resultTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  resultMsg: { color: 'rgba(255,255,255,0.95)', fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  resetBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  resetBtnText: { color: '#fff', fontWeight: '600' },
});
