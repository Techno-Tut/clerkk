import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useAuth0} from 'react-native-auth0';

export default function SignUp() {
  const router = useRouter();
  const {authorize} = useAuth0();

  const handleGoogleSignIn = async () => {
    try {
      await authorize({
        customScheme: 'com.clerkk.app',
        scope: 'openid profile email',
        connection: 'google-oauth2',
      });

      // After successful login, replace navigation stack
      router.replace('/dashboard');
    } catch (e: any) {
      if (e.code === 'USER_CANCELLED' || e.name === 'USER_CANCELLED') {
        return;
      }
      console.error('Login error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={64} color="#000" />
        </View>
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>
          Create an account to see your personalized overview
        </Text>

        <View style={styles.benefits}>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
            <Text style={styles.benefit}>Monthly surplus calculation</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
            <Text style={styles.benefit}>Tax optimization insights</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
            <Text style={styles.benefit}>Financial health score</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity onPress={handleGoogleSignIn} activeOpacity={0.8}>
          <Image
            source={require('@/assets/images/google-signin.png')}
            style={styles.googleButton}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{'\n'}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
          {'\n\n'}
          <Text style={styles.disclaimer}>
            Clerkk provides informational tools, not financial advice.{'\n'}
            Consult a licensed professional for investment decisions.
          </Text>
        </Text>
      </View>
    </View>
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
  iconCircle: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  benefits: {
    alignItems: 'flex-start',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  benefit: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  buttons: {
    width: '100%',
  },
  googleButton: {
    width: '100%',
    height: 44,
    marginBottom: 20,
  },
  terms: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});
