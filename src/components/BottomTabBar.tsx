import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabName = 'Home' | 'Menu' | 'Cart' | 'Orders' | 'Profile';

interface TabItem {
  name: TabName;
  icon: string;
  label: string;
}

const TABS: TabItem[] = [
  { name: 'Home', icon: '🏠', label: 'Home' },
  { name: 'Menu', icon: '🍕', label: 'Menu' },
  { name: 'Cart', icon: '🛒', label: 'Cart' },
  { name: 'Orders', icon: '📋', label: 'Orders' },
  { name: 'Profile', icon: '👤', label: 'Profile' },
];

interface BottomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  cartCount?: number;
}

export default function BottomTabBar({ activeTab, onTabPress, cartCount = 0 }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 4 }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Text style={styles.icon}>{tab.icon}</Text>
              {tab.name === 'Cart' && cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  iconWrapper: {
    position: 'relative',
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  labelActive: {
    color: '#E63946',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E63946',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E63946',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
