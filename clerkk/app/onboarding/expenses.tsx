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
import {useUser} from '@/contexts/UserContext';

const EXPENSE_CATEGORIES = [
  {
    category: 'housing',
    name: 'Rent / Mortgage',
    placeholder: '2,000',
  },
  {
    category: 'utilities',
    name: 'Utilities (hydro, internet, phone)',
    placeholder: '200',
  },
  {
    category: 'food',
    name: 'Groceries',
    placeholder: '600',
  },
  {
    category: 'other',
    name: 'Miscellaneous (dining, entertainment)',
    placeholder: '400',
  },
];

export default function OnboardingExpenses() {
  const router = useRouter();
  const {setExpenses, primaryCurrency} = useUser();
  const [values, setValues] = useState<Record<string, string>>({});

  const formatNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) return '';
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleChange = (category: string, text: string) => {
    setValues(prev => ({...prev, [category]: formatNumber(text)}));
  };

  const handleContinue = () => {
    const expenses = EXPENSE_CATEGORIES.filter(cat => values[cat.category]).map(
      cat => ({
        category: cat.category,
        name: cat.name,
        amount: parseInt(values[cat.category].replace(/,/g, ''), 10),
      }),
    );

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

        {EXPENSE_CATEGORIES.map(cat => (
          <View key={cat.category} style={styles.inputGroup}>
            <Text style={styles.label}>{cat.name}</Text>
            <CurrencyInput
              value={values[cat.category] || ''}
              onChangeText={text => handleChange(cat.category, text)}
              placeholder={cat.placeholder}
              currency={primaryCurrency}
            />
          </View>
        ))}

        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.button}
        />

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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  button: {
    marginTop: 16,
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    color: '#999',
    fontSize: 14,
  },
});
