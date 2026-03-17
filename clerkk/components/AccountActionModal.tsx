import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import CurrencyInput from './CurrencyInput';
import {useState, useEffect} from 'react';

type ActionType = 'contribute' | 'withdraw' | 'update_balance';

export const ACCOUNT_ACTIONS = {
  CONTRIBUTE: 'contribute',
  WITHDRAW: 'withdraw',
  UPDATE_BALANCE: 'update_balance',
} as const;

const CONFIG: Record<
  ActionType,
  {
    title: string;
    label: string;
    button: string;
    danger?: boolean;
    toast: string;
    errorToast: string;
  }
> = {
  contribute: {
    title: 'Contribute to',
    label: 'Amount',
    button: 'Contribute',
    toast: 'Contribution added',
    errorToast: 'Failed to add contribution',
  },
  withdraw: {
    title: 'Withdraw from',
    label: 'Amount',
    button: 'Withdraw',
    danger: true,
    toast: 'Withdrawal recorded',
    errorToast: 'Failed to withdraw',
  },
  update_balance: {
    title: 'Update Balance for',
    label: 'New Balance',
    button: 'Update Balance',
    toast: 'Balance updated',
    errorToast: 'Failed to update balance',
  },
};

interface Props {
  visible: boolean;
  type: ActionType;
  accountName: string;
  accountId: string;
  currency: string;
  onClose: () => void;
  onSubmit: (accountId: string, payload: any) => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function AccountActionModal({
  visible,
  type,
  accountName,
  accountId,
  currency,
  onClose,
  onSubmit,
  onSuccess,
  onError,
}: Props) {
  const [value, setValue] = useState('');
  const config = CONFIG[type];

  useEffect(() => {
    if (!visible) setValue('');
  }, [visible]);

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (!num) return;
    setValue('');
    onClose();
    (async () => {
      try {
        const payload =
          type === 'update_balance'
            ? {event_type: 'update_balance', balance_snapshot: num}
            : {event_type: type, amount: num};
        await onSubmit(accountId, payload);
        onSuccess(config.toast);
      } catch (error) {
        onError(config.errorToast);
      }
    })();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={{flex: 1}}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.content,
            {paddingBottom: 40 + (Platform.OS === 'ios' ? 0 : 0)},
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {config.title}{' '}
              <Text style={styles.titleHighlight}>{accountName}</Text>
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>{config.label}</Text>
          <CurrencyInput
            currency={currency}
            placeholder="0.00"
            value={value}
            onChangeText={setValue}
          />
          <TouchableOpacity
            style={[styles.button, config.danger && styles.buttonDanger]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>{config.button}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 16,
  },
  titleHighlight: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDanger: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
