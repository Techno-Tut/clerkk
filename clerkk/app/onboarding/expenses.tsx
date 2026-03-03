import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useState} from 'react';
import {useRouter} from 'expo-router';
import {Button, CurrencyInput, BackButton} from '@/components';

export default function OnboardingExpenses() {
  const router = useRouter();
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
    // TODO: Save to local storage
    router.push('/onboarding/location');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
