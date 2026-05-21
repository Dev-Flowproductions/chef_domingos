import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './src/i18n';
import RootNavigator from './src/navigation';
import { useAuthStore } from './src/store/authStore';
import { useLocaleStore } from './src/store/localeStore';
import { useSettingsStore } from './src/store/settingsStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppBootstrap() {
  const { initLocale } = useLocaleStore();
  const { initSettings } = useSettingsStore();
  const { initialize } = useAuthStore();
  const [bootDone, setBootDone] = React.useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await Promise.allSettled([initLocale(), initSettings(), initialize()]);
      if (!cancelled) setBootDone(true);
    };

    void run();

    // Never block the UI indefinitely if storage or auth is slow/unreachable
    const fallback = setTimeout(() => {
      if (!cancelled) setBootDone(true);
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, []);

  if (!bootDone) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F5F0' }}>
        <ActivityIndicator size="large" color="#BF994E" />
      </View>
    );
  }

  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppBootstrap />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
