import React from 'react';
import { Image } from 'react-native';
import type { RestaurantId } from '../lib/menuI18n';

const PORTUGUESE_LAB_LOGO = require('../assets/portuguese-lab-logo.png');
const PIZZA_LAB_LOGO = require('../assets/pizza-lab-logo.png');

interface RestaurantLogoProps {
  restaurantId: RestaurantId;
  size?: number;
}

function logoFor(restaurantId: RestaurantId): { source: number; label: string } {
  switch (restaurantId) {
    case 'portugueseLab':
      return { source: PORTUGUESE_LAB_LOGO, label: 'Portuguese Lab' };
    case 'pizzaLab':
      return { source: PIZZA_LAB_LOGO, label: 'Pizza Lab' };
    default: {
      const _exhaustive: never = restaurantId;
      return _exhaustive;
    }
  }
}

export default function RestaurantLogo({ restaurantId, size = 54 }: RestaurantLogoProps) {
  const { source, label } = logoFor(restaurantId);
  return (
    <Image
      source={source}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#FEFCF3' }}
      resizeMode="contain"
      accessibilityLabel={label}
    />
  );
}
