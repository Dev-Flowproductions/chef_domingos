import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Assets } from '../../lib/theme';

const FAQ_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <View style={styles.root}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('faq.title')}</Text>

        {FAQ_KEYS.map((id) => {
          const isOpen = openId === id;
          return (
            <View key={id} style={styles.item}>
              <TouchableOpacity
                style={styles.question}
                onPress={() => setOpenId(isOpen ? null : id)}
                activeOpacity={0.8}
              >
                <Text style={styles.questionText}>{t(`faq.q${id}`)}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.gold}
                />
              </TouchableOpacity>
              {isOpen && (
                <Text style={styles.answer}>{t(`faq.a${id}`)}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bg: { position: 'absolute', width: 874, height: 874, left: -274, top: 0, opacity: 0.4 },
  scroll: { paddingHorizontal: 20 },
  back: { color: Colors.gold, fontSize: 16, marginBottom: 16 },
  title: { fontSize: 28, color: Colors.gold, marginBottom: 20 },
  item: {
    borderBottomWidth: 1,
    borderColor: '#E8E0D5',
    paddingVertical: 4,
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  questionText: { flex: 1, fontSize: 16, color: Colors.textPrimary, fontWeight: '600' },
  answer: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    paddingBottom: 14,
    paddingRight: 8,
  },
});
