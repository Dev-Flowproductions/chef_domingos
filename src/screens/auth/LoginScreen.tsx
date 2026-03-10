import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Assets } from '../../lib/theme';
import { useAuthStore } from '../../store/authStore';
import { USE_MOCK } from '../../lib/config';

type AuthNav = NativeStackNavigationProp<any>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AuthNav>();
  const { signIn } = useAuthStore();

  const handleEmailLogin = async () => {
    if (USE_MOCK) {
      await signIn('demo@example.com', 'password');
      return;
    }
    navigation.navigate('EmailLogin');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.letters}>
          <Text style={[styles.letter, { color: '#B59363' }]}>J</Text>
          <Text style={[styles.letter, styles.letterD, { color: '#8E7D65' }]}>D</Text>
        </View>
      </View>

      {/* Title + subtitle */}
      <View style={styles.info}>
        <Text style={styles.title}>Bem-Vindo</Text>
        <Text style={styles.body}>
          Entre ou registe-se para ter acesso às suas recompensas
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.btns}>
        <TouchableOpacity style={styles.btn} activeOpacity={0.85}>
          <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>Entrar com telemóvel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={handleEmailLogin} activeOpacity={0.85}>
          <Ionicons name="mail-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>Entrar com email</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>
            Ainda não tem conta? Registe-se.
          </Text>
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
    marginBottom: 16,
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
    marginTop: 60,
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '400',
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  btns: {
    gap: 16,
    alignItems: 'center',
  },
  btn: {
    backgroundColor: Colors.gold,
    height: 48,
    width: '100%',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
  },
  registerText: {
    color: Colors.gold,
    fontSize: 16,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});
