import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { USE_MOCK } from '../lib/config';
import { Colors } from '../lib/theme';

const TAB_ICONS: Record<string, any> = {
  Home:        require('../assets/tab-home.png'),
  Carteira:    require('../assets/tab-wallet.png'),
  Recompensas: require('../assets/tab-gift.png'),
  Conta:       require('../assets/tab-person.png'),
};

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import MenuScreen from '../screens/menu/MenuScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import GanharScreen from '../screens/ganhar/GanharScreen';
import RecompensasScreen from '../screens/recompensas/RecompensasScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SplashScreen from '../screens/splash/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Carteira: undefined;
  Ganhar: undefined;
  Recompensas: undefined;
  Conta: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Maps tab name → Ionicons name (active / inactive) — kept for reference only
const _TAB_ICON_MAP: Record<string, { active: string; inactive: string }> = {
  Home:        { active: 'home',            inactive: 'home-outline' },
  Carteira:    { active: 'wallet',          inactive: 'wallet-outline' },
  Ganhar:      { active: 'qr-code',         inactive: 'qr-code-outline' },
  Recompensas: { active: 'gift',            inactive: 'gift-outline' },
  Conta:       { active: 'person',          inactive: 'person-outline' },
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = route.name;
        const isFocused = state.index === index;
        const isGanhar = label === 'Ganhar';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isGanhar) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItemGanhar}
              activeOpacity={0.85}
            >
              <View style={[styles.ganharCircle, isFocused && styles.ganharCircleActive]}>
                <Image
                  source={require('../assets/tab-ganhar-qr.png')}
                  style={[styles.ganharQrIcon, { tintColor: '#fff' }]}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        }

        const iconSrc = TAB_ICONS[label];

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.85}
          >
            {iconSrc && (
              <Image
                source={iconSrc}
                style={[styles.tabIcon, { tintColor: isFocused ? Colors.gold : '#888' }]}
                resizeMode="contain"
              />
            )}
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <MainTab.Screen name="Home"        component={HomeScreen} />
      <MainTab.Screen name="Carteira"    component={WalletScreen} />
      <MainTab.Screen name="Ganhar"      component={GanharScreen} />
      <MainTab.Screen name="Recompensas" component={RecompensasScreen} />
      <MainTab.Screen name="Conta"       component={ProfileScreen} />
    </MainTab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"    component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MockRootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main"        component={MainNavigator} />
      <RootStack.Screen name="Login"       component={LoginScreen} />
      <RootStack.Screen name="Register"    component={RegisterScreen} />
      <RootStack.Screen name="Onboarding"  component={() => <OnboardingScreen onFinish={() => {}} />} />
    </RootStack.Navigator>
  );
}

export default function RootNavigator() {
  const { session } = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  if (!onboardingDone && !USE_MOCK) {
    return <OnboardingScreen onFinish={() => setOnboardingDone(true)} />;
  }

  return (
    <NavigationContainer>
      {USE_MOCK
        ? <MockRootNavigator />
        : session
          ? <MainNavigator />
          : <AuthNavigator />
      }
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    gap: 3,
    minWidth: 0,
  },
  tabItemGanhar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    gap: 3,
    minWidth: 0,
  },
  ganharCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  ganharCircleActive: {
    backgroundColor: Colors.goldLight,
  },
  tabLabel: {
    fontSize: 10,
    color: '#999',
    opacity: 1,
    textAlign: 'center',
    flexShrink: 1,
  },
  tabLabelActive: {
    color: Colors.gold,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  ganharQrIcon: {
    width: 22,
    height: 22,
  },
});
