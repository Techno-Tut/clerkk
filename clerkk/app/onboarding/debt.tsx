import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useState} from 'react';
import {useRouter} from 'expo-router';

export default function OnboardingDebt() {
  const router = useRouter();
  const [creditCard, setCreditCard] = useState('');
  const [mortgage, setMortgage] = useState('');
  const [carLoan, setCarLoan] = useState('');
  const [otherDebt, setOtherDebt] = useState('');

  const formatNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) return '';
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleContinue = () => {
    // TODO: Save to local storage
    router.push('/onboarding/location');
  };

  const handleSkip = () => {
    router.push('/onboarding/location');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Any debt?</Text>
      <Text style={styles.subtitle}>
        Monthly minimum payments (leave blank if none)
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Credit Card</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.input}
            value={creditCard}
            onChangeText={text => setCreditCard(formatNumber(text))}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mortgage</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.input}
            value={mortgage}
            onChangeText={text => setMortgage(formatNumber(text))}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Car Loan</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.input}
            value={carLoan}
            onChangeText={text => setCarLoan(formatNumber(text))}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Other Debt</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.input}
            value={otherDebt}
            onChangeText={text => setOtherDebt(formatNumber(text))}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSkip}>
        <Text style={styles.skipText}>Skip - I have no debt</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Step 3 of 4</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
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
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    padding: 16,
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#000',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#666',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    color: '#999',
    fontSize: 14,
  },
});
