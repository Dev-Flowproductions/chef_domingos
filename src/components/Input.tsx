import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  secureToggle = false,
  containerStyle,
  secureTextEntry,
  ...props
}: InputProps) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : styles.inputNormal]}>
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={hidden}
          {...props}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} style={styles.toggle}>
            <Text style={styles.toggleText}>{hidden ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
  },
  inputNormal: {
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#111827',
  },
  toggle: {
    paddingLeft: 8,
  },
  toggleText: {
    fontSize: 13,
    color: '#E63946',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});
