import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useState, useEffect} from 'react';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth0} from 'react-native-auth0';
import {Currency} from '../components';
import {api} from '../config/api';

const MULTI_CURRENCY_KEY = '@clerkk_multi_currency';
const CONVERT_DEBT_KEY = '@clerkk_convert_debt_to_local';

type DebtType = 'credit_card' | 'mortgage' | 'loan' | 'line_of_credit';

interface Debt {
  id: string;
  name: string;
  type: DebtType;
  currency: string;
  monthly_payment: string;
  current_balance: string;
  interest_rate: string;
  is_active: boolean;
}

const DEBT_TYPES = [
  {value: 'credit_card', label: 'Credit Card', icon: 'card-outline'},
  {value: 'mortgage', label: 'Mortgage', icon: 'home-outline'},
  {value: 'loan', label: 'Loan', icon: 'cash-outline'},
  {value: 'line_of_credit', label: 'Line of Credit', icon: 'wallet-outline'},
];

const CURRENCIES = [
  {value: 'CAD', label: 'CAD', symbol: '$'},
  {value: 'USD', label: 'USD', symbol: '$'},
  {value: 'INR', label: 'INR', symbol: '₹'},
  {value: 'EUR', label: 'EUR', symbol: '€'},
];

export default function DebtScreen() {
  const router = useRouter();
  const {getCredentials} = useAuth0();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [multiCurrencyEnabled, setMultiCurrencyEnabled] = useState(false);
  const [convertDebt, setConvertDebt] = useState(true);

  // Form state - Basic
  const [debtType, setDebtType] = useState<DebtType>('credit_card');
  const [currency, setCurrency] = useState('CAD');
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');

  // Form state - Additional details
  const [originalPrincipal, setOriginalPrincipal] = useState('');
  const [termMonths, setTermMonths] = useState('');
  const [startDate, setStartDate] = useState('');
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      // Load settings first
      const enabled = await AsyncStorage.getItem(MULTI_CURRENCY_KEY);
      const convert = await AsyncStorage.getItem(CONVERT_DEBT_KEY);
      setMultiCurrencyEnabled(enabled === 'true');
      const shouldConvert = convert !== 'false'; // Default to true
      setConvertDebt(shouldConvert);

      // Then fetch debts with the loaded setting
      await fetchDebtsWithSetting(shouldConvert);
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  };

  const fetchDebtsWithSetting = async (shouldConvert: boolean) => {
    try {
      setIsLoading(true);
      const creds = await getCredentials();
      const data = await api.debts.getAll(
        creds.accessToken,
        shouldConvert ? 'CAD' : undefined,
      );
      setDebts(data);
    } catch (error) {
      console.error('Failed to fetch debts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDebts = () => fetchDebtsWithSetting(convertDebt);

  const handleAddDebt = async () => {
    if (!name || !balance || !monthlyPayment || !interestRate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const creds = await getCredentials();
      await api.debts.create(
        {
          name,
          type: debtType,
          currency,
          monthly_payment: parseFloat(monthlyPayment),
          current_balance: parseFloat(balance),
          interest_rate: parseFloat(interestRate),
          original_principal: originalPrincipal
            ? parseFloat(originalPrincipal)
            : undefined,
          term_months: termMonths ? parseInt(termMonths) : undefined,
          start_date: startDate || undefined,
        },
        creds.accessToken,
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      resetForm();
      fetchDebts();
    } catch (error) {
      console.error('Failed to add debt:', error);
      Alert.alert('Error', 'Failed to add debt');
    }
  };

  const resetForm = () => {
    setDebtType('credit_card');
    setCurrency('CAD');
    setName('');
    setBalance('');
    setMonthlyPayment('');
    setInterestRate('');
    setOriginalPrincipal('');
    setTermMonths('');
    setStartDate('');
    setShowAdditionalFields(false);
  };

  const totalMonthlyPayment = debts.reduce(
    (sum, debt) => sum + parseFloat(debt.monthly_payment),
    0,
  );

  const hasIncompleteData = (debt: Debt) => {
    return !debt.original_principal || !debt.term_months || !debt.start_date;
  };

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.value === currency)?.symbol || '$';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Monthly Payment</Text>
          <Currency amount={totalMonthlyPayment} style={styles.summaryAmount} />
          <Text style={styles.summarySubtext}>
            {debts.length} {debts.length === 1 ? 'debt' : 'debts'}
          </Text>
        </View>

        {/* Empty State */}
        {debts.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No debt tracked</Text>
            <Text style={styles.emptyText}>
              Add your debts to see how they impact your surplus and get
              AI-powered payoff strategies
            </Text>
          </View>
        )}

        {/* Debt List */}
        {debts.map(debt => (
          <View key={debt.id} style={styles.debtCard}>
            <View style={styles.debtHeader}>
              <View style={styles.debtLeft}>
                <Ionicons
                  name={
                    (DEBT_TYPES.find(t => t.value === debt.type)?.icon ||
                      'wallet-outline') as any
                  }
                  size={24}
                  color="#666"
                  style={styles.debtIcon}
                />
                <View>
                  <Text style={styles.debtName}>{debt.name}</Text>
                  <Text style={styles.debtType}>
                    {DEBT_TYPES.find(t => t.value === debt.type)?.label} •{' '}
                    {debt.currency}
                  </Text>
                </View>
              </View>
              <View style={styles.debtRight}>
                <Currency
                  amount={debt.current_balance}
                  currency={debt.currency as 'CAD' | 'USD' | 'INR' | 'EUR'}
                  style={styles.debtBalance}
                />
                <Text style={styles.debtRate}>{debt.interest_rate}% APR</Text>
              </View>
            </View>
            <View style={styles.debtFooter}>
              <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                <Currency
                  amount={debt.monthly_payment}
                  currency={debt.currency as 'CAD' | 'USD' | 'INR' | 'EUR'}
                  style={styles.debtPayment}
                />
                <Text style={styles.debtPayment}> / month</Text>
              </View>
            </View>

            {/* Add Details Prompt */}
            {hasIncompleteData(debt) && (
              <TouchableOpacity
                style={styles.addDetailsButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingDebt(debt);
                  setOriginalPrincipal(debt.original_principal || '');
                  setTermMonths(debt.term_months?.toString() || '');
                  setStartDate(debt.start_date || '');
                  setShowAdditionalFields(true);
                  setShowEditModal(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={16} color="#4CAF50" />
                <Text style={styles.addDetailsText}>
                  Complete for better insights
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowAddModal(true);
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Debt</Text>
      </TouchableOpacity>

      {/* Add Debt Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Debt</Text>
              <TouchableOpacity onPress={handleAddDebt}>
                <Text style={styles.modalSave}>Add</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Debt Type Selector */}
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeGrid}>
                {DEBT_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      debtType === type.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setDebtType(type.value as DebtType)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={24}
                      color={debtType === type.value ? '#4CAF50' : '#666'}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        debtType === type.value && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Currency Selector - Only show if enabled */}
              {multiCurrencyEnabled && (
                <>
                  <Text style={styles.inputLabel}>Currency</Text>
                  <View style={styles.currencyRow}>
                    {CURRENCIES.map(curr => (
                      <TouchableOpacity
                        key={curr.value}
                        style={[
                          styles.currencyButton,
                          currency === curr.value &&
                            styles.currencyButtonActive,
                        ]}
                        onPress={() => setCurrency(curr.value)}
                      >
                        <Text
                          style={[
                            styles.currencyButtonText,
                            currency === curr.value &&
                              styles.currencyButtonTextActive,
                          ]}
                        >
                          {curr.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Name */}
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., TD Visa"
                placeholderTextColor="#999"
              />

              {/* Current Balance */}
              <Text style={styles.inputLabel}>Current Balance</Text>
              <View style={styles.inputWithPrefix}>
                <Text style={styles.inputPrefix}>{getCurrencySymbol()}</Text>
                <TextInput
                  style={styles.inputWithPrefixField}
                  value={balance}
                  onChangeText={setBalance}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Monthly Payment */}
              <Text style={styles.inputLabel}>Monthly Payment</Text>
              <View style={styles.inputWithPrefix}>
                <Text style={styles.inputPrefix}>{getCurrencySymbol()}</Text>
                <TextInput
                  style={styles.inputWithPrefixField}
                  value={monthlyPayment}
                  onChangeText={setMonthlyPayment}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Interest Rate */}
              <Text style={styles.inputLabel}>Interest Rate</Text>
              <View style={styles.inputWithPrefix}>
                <TextInput
                  style={styles.inputWithPrefixField}
                  value={interestRate}
                  onChangeText={setInterestRate}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>

              {/* Toggle Additional Fields */}
              <TouchableOpacity
                style={styles.additionalFieldsToggle}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAdditionalFields(!showAdditionalFields);
                }}
              >
                <Ionicons
                  name={showAdditionalFields ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#4CAF50"
                />
                <Text style={styles.additionalFieldsText}>
                  {showAdditionalFields ? 'Hide' : 'Add'} loan details
                  (optional)
                </Text>
              </TouchableOpacity>

              {/* Additional Fields */}
              {showAdditionalFields && (
                <>
                  {/* Original Principal */}
                  <Text style={styles.inputLabel}>Original Loan Amount</Text>
                  <View style={styles.inputWithPrefix}>
                    <Text style={styles.inputPrefix}>
                      {getCurrencySymbol()}
                    </Text>
                    <TextInput
                      style={styles.inputWithPrefixField}
                      value={originalPrincipal}
                      onChangeText={setOriginalPrincipal}
                      placeholder="0"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#999"
                    />
                  </View>

                  {/* Term Months */}
                  <Text style={styles.inputLabel}>Loan Term (months)</Text>
                  <TextInput
                    style={styles.input}
                    value={termMonths}
                    onChangeText={setTermMonths}
                    placeholder="e.g., 360 for 30 years"
                    keyboardType="number-pad"
                    placeholderTextColor="#999"
                  />

                  {/* Start Date */}
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TextInput
                    style={styles.input}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />

                  {/* Bottom spacing */}
                  <View style={{height: 200}} />
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Debt Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Details</Text>
              <TouchableOpacity
                onPress={async () => {
                  if (!editingDebt) return;

                  try {
                    const creds = await getCredentials();
                    await api.debts.update(
                      editingDebt.id,
                      {
                        original_principal: originalPrincipal
                          ? parseFloat(originalPrincipal)
                          : undefined,
                        term_months: termMonths
                          ? parseInt(termMonths)
                          : undefined,
                        start_date: startDate || undefined,
                      },
                      creds.accessToken,
                    );

                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success,
                    );
                    setShowEditModal(false);
                    resetForm();
                    fetchDebts();
                  } catch (error) {
                    console.error('Failed to update debt:', error);
                    Alert.alert('Error', 'Failed to update debt');
                  }
                }}
              >
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Original Principal */}
              <Text style={styles.inputLabel}>Original Loan Amount</Text>
              <View style={styles.inputWithPrefix}>
                <Text style={styles.inputPrefix}>{getCurrencySymbol()}</Text>
                <TextInput
                  style={styles.inputWithPrefixField}
                  value={originalPrincipal}
                  onChangeText={setOriginalPrincipal}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Term Months */}
              <Text style={styles.inputLabel}>Loan Term (months)</Text>
              <TextInput
                style={styles.input}
                value={termMonths}
                onChangeText={setTermMonths}
                placeholder="e.g., 360 for 30 years"
                keyboardType="number-pad"
                placeholderTextColor="#999"
              />

              {/* Start Date */}
              <Text style={styles.inputLabel}>Start Date</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />

              {/* Bottom spacing */}
              <View style={{height: 200}} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#000',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  debtCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  debtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  debtIcon: {
    marginRight: 0,
  },
  debtName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  debtType: {
    fontSize: 12,
    color: '#666',
  },
  debtRight: {
    alignItems: 'flex-end',
  },
  debtBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  debtRate: {
    fontSize: 12,
    color: '#666',
  },
  debtFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  debtPayment: {
    fontSize: 14,
    color: '#666',
  },
  addDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addDetailsText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: '#f0f9f4',
    borderColor: '#4CAF50',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#4CAF50',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 4,
  },
  inputSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 4,
  },
  inputWithPrefixField: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#000',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyButtonActive: {
    backgroundColor: '#f0f9f4',
    borderColor: '#4CAF50',
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  currencyButtonTextActive: {
    color: '#4CAF50',
  },
  additionalFieldsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  additionalFieldsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
