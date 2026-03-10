import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
}

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);
    if (error) Alert.alert('Login failed', error.message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrapper}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🍕</Text>
          </View>
          <Text style={styles.brand}>Pizza Lab</Text>
          <Text style={styles.tagline}>Chef Domingos</Text>
        </View>

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>Sign in to your account</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              secureToggle
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <Button
          title="Sign In"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.submitBtn}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 40,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: '#E63946',
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 28,
  },
  submitBtn: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#E63946',
    fontWeight: '700',
  },
});
