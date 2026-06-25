import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/theme';
import { isStaffPinValid } from '../../lib/staffConfig';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'StaffPin'>;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function StaffPinScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [pin, setPin] = useState('');

  const append = (key: string) => {
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!key || pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) {
      if (isStaffPinValid(next)) {
        navigation.replace('StaffValidate');
      } else {
        Alert.alert(t('staff.wrongPin'), t('staff.wrongPinHint'));
        setPin('');
      }
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color={Colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>{t('staff.title')}</Text>
      <Text style={styles.subtitle}>{t('staff.pinPrompt')}</Text>

      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {KEYS.map((key, idx) => (
          <TouchableOpacity
            key={`${key}-${idx}`}
            style={[styles.key, !key && styles.keyEmpty]}
            onPress={() => key && append(key)}
            disabled={!key}
            activeOpacity={0.7}
          >
            {key === 'del' ? (
              <Ionicons name="backspace-outline" size={24} color={Colors.textPrimary} />
            ) : (
              <Text style={styles.keyText}>{key}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24 },
  close: { alignSelf: 'flex-end', padding: 8 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 15, color: '#757575', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 40 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  dotFilled: { backgroundColor: Colors.gold },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280, alignSelf: 'center' },
  key: {
    width: 72,
    height: 72,
    margin: 8,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  keyEmpty: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  keyText: { fontSize: 24, color: Colors.textPrimary },
});
