import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useState} from 'react';
import {useRouter} from 'expo-router';
import {Button, CurrencyInput, BackButton} from '@/components';
import {useOnboarding} from '@/contexts/OnboardingContext';

export default function OnboardingExpenses() {
  const router = useRouter();
  const {setExpenses} = useOnboarding();
  const [rent, setRent] = useState('');
  const [utilities, setUtilities] = useState('');
  const [groceries, setGroceries] = useState('');
  const [misc, setMisc] = useState('');

  const formatNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) return '';
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleContinue = () => {
    // Save expenses to context
    const expenses = [];
    if (rent)
      expenses.push({
        category: 'housing',
        name: 'Rent/Mortgage',
        amount: parseInt(rent.replace(/,/g, ''), 10),
      });
    if (utilities)
      expenses.push({
        category: 'utilities',
        name: 'Utilities',
        amount: parseInt(utilities.replace(/,/g, ''), 10),
      });
    if (groceries)
      expenses.push({
        category: 'food',
        name: 'Groceries',
        amount: parseInt(groceries.replace(/,/g, ''), 10),
      });
    if (misc)
      expenses.push({
        category: 'other',
        name: 'Miscellaneous',
        amount: parseInt(misc.replace(/,/g, ''), 10),
      });

    setExpenses(expenses);
    router.push('/onboarding/location');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <BackButton />

        <Text style={styles.title}>What are your monthly expenses?</Text>
        <Text style={styles.subtitle}>Add what you have (all optional)</Text>

        <View style={styles.inputGroup}>
          <CurrencyInput
            label="Rent / Mortgage"
            value={rent}
            onChangeText={text => setRent(formatNumber(text))}
            placeholder="2,000"
          />
        </View>

        <View style={styles.inputGroup}>
          <CurrencyInput
            label="Utilities (hydro, internet, phone)"
            value={utilities}
            onChangeText={text => setUtilities(formatNumber(text))}
            placeholder="200"
          />
        </View>

        <View style={styles.inputGroup}>
          <CurrencyInput
            label="Groceries"
            value={groceries}
            onChangeText={text => setGroceries(formatNumber(text))}
            placeholder="600"
          />
        </View>

        <View style={styles.inputGroup}>
          <CurrencyInput
            label="Miscellaneous (dining, entertainment)"
            value={misc}
            onChangeText={text => setMisc(formatNumber(text))}
            placeholder="400"
          />
        </View>

        <Button title="Continue" onPress={handleContinue} />

        <Text style={styles.footer}>Step 2 of 3</Text>

        {/* Bottom spacing for keyboard */}
        <View style={{height: 100}} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  footer: {
    textAlign: 'center',
    marginTop: 24,
    color: '#999',
    fontSize: 14,
  },
});
