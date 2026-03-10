import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
}

export default function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
}: QuantitySelectorProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, quantity <= min && styles.btnDisabled]}
        onPress={onDecrease}
        disabled={quantity <= min}
      >
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.quantity}>{quantity}</Text>
      <TouchableOpacity style={styles.btn} onPress={onIncrease}>
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 18,
    color: '#E63946',
    fontWeight: '700',
    lineHeight: 20,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    minWidth: 20,
    textAlign: 'center',
  },
});
