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

  // If user is logged in, go to dashboard
  if (user) {
    return <Redirect href="/dashboard" />;
  }

  // Otherwise, go to welcome/onboarding
  return <Redirect href="/onboarding/welcome" />;
}
