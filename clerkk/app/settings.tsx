import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useState, useEffect} from 'react';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEV_MODE_KEY = '@clerkk_dev_mode';
const API_URL_KEY = '@clerkk_api_url';

export default function Settings() {
  const router = useRouter();
  const [devMode, setDevMode] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const mode = await AsyncStorage.getItem(DEV_MODE_KEY);
      const url = await AsyncStorage.getItem(API_URL_KEY);
      setDevMode(mode === 'true');
      setApiUrl(url || 'http://localhost:8000');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const toggleDevMode = async (value: boolean) => {
    setDevMode(value);
    await AsyncStorage.setItem(DEV_MODE_KEY, value.toString());
  };

  const saveApiUrl = async () => {
    try {
      await AsyncStorage.setItem(API_URL_KEY, apiUrl);
      Alert.alert(
        'Success',
        'API URL saved. Restart the app to apply changes.',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save API URL');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Dev Mode</Text>
            <Switch
              value={devMode}
              onValueChange={toggleDevMode}
              trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
              thumbColor="#fff"
            />
          </View>
        </View>

        {devMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>API Configuration</Text>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="http://localhost:8000"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.button} onPress={saveApiUrl}>
              <Text style={styles.buttonText}>Save API URL</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
