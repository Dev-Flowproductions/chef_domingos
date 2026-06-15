import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors, Assets } from '../../lib/theme';
import type { ProfileStackParamList } from '../../navigation/types';

type LegalRoute = RouteProp<ProfileStackParamList, 'Terms' | 'Privacy'>;

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<LegalRoute>();
  const { t } = useTranslation();

  const isTerms = route.name === 'Terms';
  const title = isTerms ? t('legal.termsTitle') : t('legal.privacyTitle');

  const sections = isTerms
    ? [
        { title: 'legal.termsS1Title', body: 'legal.termsS1' },
        { title: 'legal.termsS2Title', body: 'legal.termsS2' },
        { title: 'legal.termsS3Title', body: 'legal.termsS3' },
      ]
    : [
        { title: 'legal.privacyS1Title', body: 'legal.privacyS1' },
        { title: 'legal.privacyS2Title', body: 'legal.privacyS2' },
        { title: 'legal.privacyS3Title', body: 'legal.privacyS3' },
      ];

  return (
    <View style={styles.root}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.updated}>{t('legal.lastUpdated')}</Text>
        <Text style={styles.intro}>{t('legal.placeholderIntro')}</Text>

        {sections.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{t(s.title)}</Text>
            <Text style={styles.sectionBody}>{t(s.body)}</Text>
          </View>
        ))}
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
  updated: { fontSize: 12, color: '#888', marginBottom: 16 },
  intro: { fontSize: 15, color: Colors.textPrimary, lineHeight: 24, marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  sectionBody: { fontSize: 15, color: Colors.textPrimary, lineHeight: 24 },
});
