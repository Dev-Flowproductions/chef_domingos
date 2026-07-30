import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/theme';
import { hasAdminAccess } from '../../lib/adminAccess';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'StaffHub'>;

export default function StaffHubScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const isAdmin = hasAdminAccess({
    email: user?.email ?? profile?.email,
    isAdminFlag: profile?.is_admin,
    appMetadata: (user as { app_metadata?: Record<string, unknown> } | null)?.app_metadata,
  });

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) navigation.goBack();
    }, [isAdmin, navigation]),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color={Colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>{t('staff.title')}</Text>
      <Text style={styles.subtitle}>{t('staff.hubSubtitle')}</Text>

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('StaffValidate')}
      >
        <Ionicons name="qr-code-outline" size={28} color={Colors.gold} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{t('staff.validateTitle')}</Text>
          <Text style={styles.cardBody}>{t('staff.validateHint')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AdminOffers')}
      >
        <Ionicons name="cash-outline" size={28} color={Colors.gold} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{t('staff.manageOffers')}</Text>
          <Text style={styles.cardBody}>{t('staff.manageOffersHint')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AdminMenu')}
      >
        <Ionicons name="restaurant-outline" size={28} color={Colors.gold} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{t('staff.manageMenu')}</Text>
          <Text style={styles.cardBody}>{t('staff.manageMenuHint')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#999" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  close: { alignSelf: 'flex-end', padding: 8 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  subtitle: { fontSize: 14, color: '#757575', marginTop: 8, marginBottom: 28 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  cardBody: { fontSize: 13, color: '#757575', lineHeight: 18 },
});
