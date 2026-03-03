import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useState} from 'react';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, CurrencyInput} from '@/components';

export default function OnboardingIncome() {
  const router = useRouter();
  const [grossAnnual, setGrossAnnual] = useState('');

  const formatNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) return '';
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleChange = (text: string) => {
    setGrossAnnual(formatNumber(text));
  };

  const handleContinue = () => {
    // TODO: Save to local storage
    router.push('/onboarding/expenses');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>What's your annual income?</Text>
          <Text style={styles.subtitle}>
            We'll use this to calculate your tax savings
          </Text>

          <CurrencyInput
            value={grossAnnual}
            onChangeText={handleChange}
            placeholder="180,000"
            autoFocus
            style={{marginBottom: 24}}
          />

          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!grossAnnual}
          />

          <Text style={styles.footer}>Step 1 of 3</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    color: '#999',
    fontSize: 14,
  },
});
