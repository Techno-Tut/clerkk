import {Redirect} from 'expo-router';
import {useAuth0} from 'react-native-auth0';
import {ActivityIndicator, View} from 'react-native';
import {useUser} from '@/contexts/UserContext';

export default function Index() {
  const {user, isLoading: authLoading} = useAuth0();
  const {profile, isLoading: profileLoading} = useUser();

  // Wait for auth to load
  if (authLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // If user exists, wait for profile to be ready
  if (user && (profileLoading || !profile)) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // If logged in, check onboarding status
  if (user && profile) {
    if (profile.onboarding_completed) {
      return <Redirect href="/dashboard" />;
    }
    return <Redirect href="/onboarding/income" />;
  }

  // Not logged in, show welcome
  return <Redirect href="/onboarding/welcome" />;
}
