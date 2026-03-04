import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import {useState} from 'react';
import {useRouter} from 'expo-router';
import {useAuth0} from 'react-native-auth0';
import {Button, BackButton} from '@/components';
import {api} from '@/config/api';
import {useOnboarding} from '@/contexts/OnboardingContext';

const PROVINCES = [
  {code: 'ON', name: 'Ontario'},
  {code: 'BC', name: 'British Columbia'},
  {code: 'AB', name: 'Alberta'},
  {code: 'QC', name: 'Quebec'},
  {code: 'MB', name: 'Manitoba'},
  {code: 'SK', name: 'Saskatchewan'},
  {code: 'NS', name: 'Nova Scotia'},
  {code: 'NB', name: 'New Brunswick'},
  {code: 'NL', name: 'Newfoundland and Labrador'},
  {code: 'PE', name: 'Prince Edward Island'},
  {code: 'NT', name: 'Northwest Territories'},
  {code: 'YT', name: 'Yukon'},
  {code: 'NU', name: 'Nunavut'},
];

export default function OnboardingLocation() {
  const router = useRouter();
  const {getCredentials, user} = useAuth0();
  const {data, setRegion, reset} = useOnboarding();
  const [selected, setSelected] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = PROVINCES.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (code: string) => {
    setSelected(code);
    setRegion(code);
    setModalVisible(false);
    setSearch('');
  };

  const handleContinue = async () => {
    // If not logged in, go to signup screen
    if (!user) {
      router.push('/signup');
      return;
    }

    // User is logged in, save data
    setLoading(true);
    try {
      const creds = await getCredentials();

      // Submit all onboarding data
      await api.user.submitOnboarding(data, creds.accessToken);

      // Reset context and navigate
      reset();
      router.replace('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert('Error', 'Failed to save your information');
    } finally {
      setLoading(false);
    }
  };

  const selectedProvince = PROVINCES.find(p => p.code === selected);

  return (
    <View style={styles.container}>
      <BackButton />

      <Text style={styles.title}>Where do you live?</Text>
      <Text style={styles.subtitle}>
        We need this for accurate tax calculations
      </Text>

      <TouchableOpacity
        style={styles.picker}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.pickerText, !selected && styles.placeholder]}>
          {selectedProvince ? selectedProvince.name : 'Select your province'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Button
        title="Continue"
        onPress={handleContinue}
        disabled={!selected || loading}
      />

      <Text style={styles.footer}>Step 3 of 3</Text>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setSearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Province</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearch('');
                }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <FlatList
              data={filtered}
              keyExtractor={item => item.code}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selected === item.code && styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelect(item.code)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selected === item.code && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selected === item.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noResults}>No results found</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
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
    marginBottom: 32,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
  },
  pickerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    color: '#999',
    fontWeight: '400',
  },
  arrow: {
    fontSize: 14,
    color: '#000',
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    color: '#999',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionSelected: {
    backgroundColor: '#f5f5f5',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
  },
  modalOptionTextSelected: {
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    padding: 24,
  },
});
