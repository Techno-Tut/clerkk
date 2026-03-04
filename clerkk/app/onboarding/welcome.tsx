import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '@/components';
import {useAuth0} from 'react-native-auth0';
import {api} from '@/config/api';
import {useState} from 'react';

export default function Welcome() {
  const router = useRouter();
  const {authorize, getCredentials} = useAuth0();
  const [loading, setLoading] = useState(false);

  const handleGetStarted = () => {
    router.push('/onboarding/income');
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await authorize({
        customScheme: 'com.clerkk.app',
        scope: 'openid profile email',
        connection: 'google-oauth2',
        audience: 'https://api.inbriefs.com', // CRITICAL: Get JWT access token
      });

      const creds = await getCredentials();

      // Check onboarding status
      const profile = await api.user.getProfile(creds.accessToken);

      if (profile.onboarding_completed) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding/income');
      }
    } catch (e: any) {
      // User cancelled - just ignore
      if (e.code === 'USER_CANCELLED' || e.name === 'USER_CANCELLED') {
        console.log('User cancelled login');
        return;
      }
      // Other errors - log them
      console.error('Login error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Clerkk</Text>
        <Text style={styles.tagline}>Your money, simplified</Text>
        <Text style={styles.description}>
          Get your financial overview in seconds.{'\n'}
          No transaction tracking. No spreadsheets.
        </Text>
      </View>

      <View style={styles.buttons}>
        <Button title="Get Started" onPress={handleGetStarted} />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Already have an account?</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity onPress={handleGoogleSignIn} activeOpacity={0.8}>
          <Image
            source={require('@/assets/images/google-signin.png')}
            style={styles.googleButton}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 20,
    color: '#666',
    marginBottom: 40,
  },
  description: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  buttons: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    width: '100%',
    height: 44,
  },
});
