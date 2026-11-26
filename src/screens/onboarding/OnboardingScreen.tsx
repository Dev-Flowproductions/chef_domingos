import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../lib/theme';
import { PageBackground } from '../../components/ScreenWrapper';
import JDLogo from '../../components/JDLogo';

const SLIDE_IDS = ['1', '2', '3'] as const;

interface OnboardingProps {
  onFinish: () => void;
}

export default function OnboardingScreen({ onFinish }: OnboardingProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const slides = SLIDE_IDS.map((id) => ({
    id,
    title: t(`onboarding.slide${id}Title`),
    body: t(`onboarding.slide${id}Body`),
  }));

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(idx);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onFinish();
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <PageBackground />

      {/* Logo */}
      <View style={[styles.logoWrap, { paddingTop: insets.top + 20 }]}>
        <JDLogo size="small" />
      </View>

      {/* Slides */}
      <FlatList
        key={width}
        ref={flatRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.btns}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextText}>
            {currentIndex < slides.length - 1 ? t('onboarding.next') : t('onboarding.start')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onFinish}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  slide: {
    paddingHorizontal: 44,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '400',
    color: Colors.gold,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 20,
    maxWidth: 520,
  },
  body: {
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 520,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.goldLight,
    opacity: 0.5,
  },
  dotActive: {
    opacity: 1,
    width: 20,
  },
  btns: {
    paddingHorizontal: 48,
    alignItems: 'center',
    alignSelf: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 480,
  },
  nextBtn: {
    backgroundColor: Colors.gold,
    height: 48,
    width: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '400',
  },
  skipText: {
    color: Colors.gold,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
