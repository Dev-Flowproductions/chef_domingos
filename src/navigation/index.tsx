import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { USE_MOCK } from '../lib/config';
import { Colors } from '../lib/theme';
import type { HomeStackParamList, ProfileStackParamList, RewardsStackParamList } from './types';
import type { NavigatorScreenParams } from '@react-navigation/native';

const TAB_ICONS: Record<string, any> = {
  Home:        require('../assets/tab-home.png'),
  Carteira:    require('../assets/tab-wallet.png'),
  Recompensas: require('../assets/tab-gift.png'),
  Conta:       require('../assets/tab-person.png'),
};

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailLoginScreen from '../screens/auth/EmailLoginScreen';
import HomeScreen from '../screens/home/HomeScreen';
import MenuScreen from '../screens/menu/MenuScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import GanharScreen from '../screens/ganhar/GanharScreen';
import RecompensasScreen from '../screens/recompensas/RecompensasScreen';
import MyVouchersScreen from '../screens/recompensas/MyVouchersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import HelpScreen from '../screens/profile/HelpScreen';
import LegalScreen from '../screens/profile/LegalScreen';
import StaffPinScreen from '../screens/staff/StaffPinScreen';
import StaffValidateScreen from '../screens/staff/StaffValidateScreen';
import SplashScreen from '../screens/splash/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

export type { HomeStackParamList, ProfileStackParamList, RewardsStackParamList } from './types';

export type AuthStackParamList = {
  Login:      undefined;
  Register:   undefined;
  EmailLogin: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Carteira: undefined;
  Ganhar: undefined;
  Recompensas: undefined;
  Conta: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const RewardsStack = createNativeStackNavigator<RewardsStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const TAB_LABEL_KEYS: Record<string, string> = {
  Home: 'tabs.home',
  Carteira: 'tabs.wallet',
  Ganhar: 'tabs.ganhar',
  Recompensas: 'tabs.rewards',
  Conta: 'tabs.account',
};

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
  const { t } = useTranslation();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
      {state.routes.map((route: any, index: number) => {
        const labelKey = TAB_LABEL_KEYS[route.name];
        const label = labelKey ? t(labelKey) : route.name;
        const isFocused = state.index === index;
        const isGanhar = route.name === 'Ganhar';

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

        const iconSrc = TAB_ICONS[route.name];

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

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Menu" component={MenuScreen} />
    </HomeStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome"   component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile"   component={EditProfileScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="Help"          component={HelpScreen} />
      <ProfileStack.Screen name="Terms"         component={LegalScreen} />
      <ProfileStack.Screen name="Privacy"       component={LegalScreen} />
      <ProfileStack.Screen name="StaffPin"      component={StaffPinScreen} />
      <ProfileStack.Screen name="StaffValidate" component={StaffValidateScreen} />
    </ProfileStack.Navigator>
  );
}

function RewardsStackNavigator() {
  return (
    <RewardsStack.Navigator screenOptions={{ headerShown: false }}>
      <RewardsStack.Screen name="RewardsMain" component={RecompensasScreen} />
      <RewardsStack.Screen name="MyVouchers"  component={MyVouchersScreen} />
    </RewardsStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <MainTab.Screen name="Home"        component={HomeStackNavigator} />
      <MainTab.Screen name="Carteira"    component={WalletScreen} />
      <MainTab.Screen name="Ganhar"      component={GanharScreen} />
      <MainTab.Screen name="Recompensas" component={RewardsStackNavigator} />
      <MainTab.Screen name="Conta"       component={ProfileStackNavigator} />
    </MainTab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"      component={LoginScreen} />
      <AuthStack.Screen name="Register"   component={RegisterScreen} />
      <AuthStack.Screen name="EmailLogin" component={EmailLoginScreen} />
    </AuthStack.Navigator>
  );
}

function MockOnboardingScreen() {
  return <OnboardingScreen onFinish={() => {}} />;
}

function MockRootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main"        component={MainNavigator} />
      <RootStack.Screen name="Login"       component={LoginScreen} />
      <RootStack.Screen name="Register"    component={RegisterScreen} />
      <RootStack.Screen name="Onboarding"  component={MockOnboardingScreen} />
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
