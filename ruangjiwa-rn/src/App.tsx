import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';
import './i18n';
import AuthProvider from './providers/AuthProvider';
import { requestPermissions } from './services/notifications';

const queryClient = new QueryClient();

export default function App() {
  React.useEffect(() => {
    requestPermissions().catch(() => {});
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
}
