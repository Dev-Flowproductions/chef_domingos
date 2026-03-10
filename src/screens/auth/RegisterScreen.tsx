import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Assets } from '../../lib/theme';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [newsAccepted, setNewsAccepted] = useState(false);
  const { signUp } = useAuthStore();

  const handleFinish = async () => {
    if (!termsAccepted) return;
    await signUp('demo@example.com', 'password', name || 'Utilizador');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Image source={{ uri: Assets.bgIllustration }} style={styles.bg} resizeMode="cover" />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.letters}>
          <Text style={[styles.letter, { color: '#B59363' }]}>J</Text>
          <Text style={[styles.letter, styles.letterD, { color: '#8E7D65' }]}>D</Text>
        </View>
      </View>

      {/* Title + subtitle */}
      <View style={styles.info}>
        <Text style={styles.title}>Configuração Inicial</Text>
        <Text style={styles.body}>
          Para começarmos, como{'\n'}devemos tratá-lo(a)?
        </Text>
      </View>

      {/* Name input */}
      <View style={styles.inputWrap}>
        <Ionicons name="person-outline" size={18} color={Colors.gold} />
        <TextInput
          style={styles.input}
          placeholder="O seu nome"
          placeholderTextColor={Colors.gold}
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Checkboxes */}
      <TouchableOpacity
        style={styles.checkRow}
        onPress={() => setTermsAccepted(!termsAccepted)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
          {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkText}>
          Li e aceito os{' '}
          <Text style={styles.link}>Termos e Condições</Text>
          {' '}e a{' '}
          <Text style={styles.link}>Política de Privacidade</Text>.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkRow}
        onPress={() => setNewsAccepted(!newsAccepted)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, newsAccepted && styles.checkboxChecked]}>
          {newsAccepted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkText}>
          Aceito receber novidades, promoções e ofertas personalizadas.
        </Text>
      </TouchableOpacity>

      {/* Finish button */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.finishBtn, !termsAccepted && styles.finishBtnDisabled]}
          onPress={handleFinish}
          disabled={!termsAccepted}
          activeOpacity={0.85}
        >
          <Text style={styles.finishText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 48,
  },
  bg: {
    position: 'absolute',
    width: 874,
    height: 874,
    left: -275,
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
  info: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: '400',
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 22,
    height: 48,
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: Colors.gold,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.gold,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  link: {
    textDecorationLine: 'underline',
  },
  bottom: {
    position: 'absolute',
    bottom: 48,
    left: 48,
    right: 48,
  },
  finishBtn: {
    backgroundColor: Colors.gold,
    height: 48,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnDisabled: {
    opacity: 0.5,
  },
  finishText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '400',
  },
});
