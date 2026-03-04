import {Redirect} from 'expo-router';
import {useAuth0} from 'react-native-auth0';
import {ActivityIndicator, View} from 'react-native';

export default function Index() {
  const {user, isLoading} = useAuth0();

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // If logged in, go to dashboard (onboarding check happens at login)
  if (user) {
    return <Redirect href="/dashboard" />;
  }

  // Not logged in, show welcome
  return <Redirect href="/onboarding/welcome" />;
}
