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
import {useUser} from '@/contexts/UserContext';

export default function OnboardingIncome() {
  const router = useRouter();
  const {setGrossAnnual, primaryCurrency} = useUser();
  const [grossAnnual, setGrossAnnualLocal] = useState('');

  const formatNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) return '';
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleChange = (text: string) => {
    setGrossAnnualLocal(formatNumber(text));
  };

  const handleContinue = () => {
    const amount = parseInt(grossAnnual.replace(/,/g, ''), 10);
    setGrossAnnual(amount);
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
            currency={primaryCurrency}
            autoFocus
          />

          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!grossAnnual}
            style={styles.button}
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
  button: {
    marginTop: 32,
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    color: '#999',
    fontSize: 14,
  },
});
