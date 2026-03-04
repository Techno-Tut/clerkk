import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {Auth0Provider} from 'react-native-auth0';
import {AUTH0_DOMAIN, AUTH0_CLIENT_ID} from '../config/auth';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import {OnboardingProvider} from '../contexts/OnboardingContext';

export default function RootLayout() {
  return (
    <Auth0Provider domain={AUTH0_DOMAIN} clientId={AUTH0_CLIENT_ID}>
      <OnboardingProvider>
        <KeyboardProvider>
          <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="index" />
          </Stack>
          <StatusBar style="dark" />
        </KeyboardProvider>
      </OnboardingProvider>
    </Auth0Provider>
  );
}
