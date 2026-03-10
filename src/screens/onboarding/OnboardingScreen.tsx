import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Assets } from '../../lib/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Uma conta, todos\nos sabores.',
    body: 'Acumule pontos nos nossos restaurantes e saboreie a sua refeição.',
  },
  {
    id: '2',
    title: 'Ganhar é simples.',
    body: 'Depois de saborear a sua refeição, faça scan do QR Code no talão e veja o seu saldo crescer.',
  },
  {
    id: '3',
    title: 'Recompensas\ne Ofertas',
    body: 'Troque pontos por refeições, sobremesas ou ofertas exclusivas para utilizar na sua próxima visita.',
  },
];

interface OnboardingProps {
  onFinish: () => void;
}

export default function OnboardingScreen({ onFinish }: OnboardingProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(idx);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onFinish();
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <Image source={{ uri: Assets.bgIllustration }} style={styles.bg} resizeMode="cover" />

      {/* Logo */}
      <View style={[styles.logoWrap, { paddingTop: insets.top + 20 }]}>
        <View style={styles.letters}>
          <Text style={[styles.letter, { color: '#B59363' }]}>J</Text>
          <Text style={[styles.letter, styles.letterD, { color: '#8E7D65' }]}>D</Text>
        </View>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
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
            {currentIndex < SLIDES.length - 1 ? 'Próximo' : 'Começar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onFinish}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bg: {
    position: 'absolute',
    width: 874,
    height: 874,
    left: -254,
    top: 0,
    opacity: 0.4,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  letters: {
    flexDirection: 'row',
  },
  letter: {
    fontSize: 52,
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: 65,
  },
  letterD: {
    marginTop: 5,
  },
  slide: {
    width,
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
  },
  body: {
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
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
    gap: 12,
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
