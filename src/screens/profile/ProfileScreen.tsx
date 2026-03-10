import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuthStore();
  const { profile, loading, fetchProfile, updateProfile } = useUserStore();
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      reset({ name: profile.name ?? '', phone: profile.phone ?? '' });
    }
  }, [profile]);

  const onSave = async (data: FormData) => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, data);
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } else {
      Alert.alert('Saved', 'Profile updated successfully.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (loading && !profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header title="Profile" />
        <View style={styles.center}>
          <ActivityIndicator color="#E63946" size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Profile" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full Name"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Phone Number"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.phone?.message}
              />
            )}
          />

          <Button
            title="Save Changes"
            onPress={handleSubmit(onSave)}
            loading={saving}
            style={styles.saveBtn}
          />
        </View>

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          style={styles.signOutBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 44,
  },
  email: {
    fontSize: 15,
    color: '#6B7280',
  },
  form: {
    marginBottom: 24,
  },
  saveBtn: {
    marginTop: 8,
  },
  signOutBtn: {
    marginTop: 8,
  },
});
