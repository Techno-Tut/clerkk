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
import {useUser} from '@/contexts/UserContext';

const DEV_MODE_KEY = '@clerkk_dev_mode';
const API_URL_KEY = '@clerkk_api_url';
const MULTI_CURRENCY_KEY = '@clerkk_multi_currency';
const CONVERT_DEBT_KEY = '@clerkk_convert_debt_to_local';

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  type: 'toggle' | 'input' | 'button';
  storageKey?: string;
  defaultValue?: any;
  showWhen?: string;
  action?: () => void | Promise<void>;
  buttonStyle?: 'primary' | 'destructive';
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

const SETTINGS_CONFIG: SettingSection[] = [
  {
    title: 'DEBT MANAGEMENT',
    items: [
      {
        id: 'multiCurrency',
        label: 'Multi-Currency Support',
        description: 'Track debts in USD, INR, EUR',
        type: 'toggle',
        storageKey: MULTI_CURRENCY_KEY,
        defaultValue: false,
      },
      {
        id: 'convertDebt',
        label: 'Convert to Local Currency',
        description: 'Show all debts in CAD',
        type: 'toggle',
        storageKey: CONVERT_DEBT_KEY,
        defaultValue: true,
      },
    ],
  },
  {
    title: 'DEVELOPER',
    items: [
      {
        id: 'devMode',
        label: 'Developer Mode',
        type: 'toggle',
        storageKey: DEV_MODE_KEY,
        defaultValue: false,
      },
      {
        id: 'apiUrl',
        label: 'API URL',
        type: 'input',
        storageKey: API_URL_KEY,
        defaultValue: 'http://localhost:8000',
        showWhen: 'devMode',
      },
      {
        id: 'clearCache',
        label: 'Clear User Cache',
        description: 'Clear cached profile to test onboarding',
        type: 'button',
        buttonStyle: 'destructive',
        showWhen: 'devMode',
      },
    ],
  },
];

export default function Settings() {
  const router = useRouter();
  const {clearCache} = useUser();
  const [settings, setSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings: Record<string, any> = {};

      for (const section of SETTINGS_CONFIG) {
        for (const item of section.items) {
          const value = await AsyncStorage.getItem(item.storageKey);
          if (item.type === 'toggle') {
            loadedSettings[item.id] =
              value === 'true' || (value === null && item.defaultValue);
          } else {
            loadedSettings[item.id] = value || item.defaultValue;
          }
        }
      }

      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async (id: string, value: any, storageKey: string) => {
    setSettings(prev => ({...prev, [id]: value}));
    await AsyncStorage.setItem(storageKey, value.toString());
  };

  const saveApiUrl = async () => {
    try {
      await AsyncStorage.setItem(API_URL_KEY, settings.apiUrl);
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
        {SETTINGS_CONFIG.map((section, sectionIndex) => {
          const shouldShowSection = section.items.some(item => {
            if (!item.showWhen) return true;
            return settings[item.showWhen];
          });

          if (!shouldShowSection) return null;

          return (
            <View key={sectionIndex}>
              <Text style={styles.sectionHeader}>{section.title}</Text>
              <View style={styles.section}>
                {section.items.map((item, itemIndex) => {
                  if (item.showWhen && !settings[item.showWhen]) return null;

                  if (item.type === 'toggle') {
                    return (
                      <View key={item.id}>
                        {itemIndex > 0 && <View style={styles.divider} />}
                        <View style={styles.settingRow}>
                          <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>
                              {item.label}
                            </Text>
                            {item.description && (
                              <Text style={styles.settingDescription}>
                                {item.description}
                              </Text>
                            )}
                          </View>
                          <Switch
                            value={settings[item.id] || false}
                            onValueChange={value =>
                              updateSetting(item.id, value, item.storageKey)
                            }
                            trackColor={{false: '#E5E5EA', true: '#34C759'}}
                            thumbColor="#fff"
                          />
                        </View>
                      </View>
                    );
                  }

                  if (item.type === 'input') {
                    return (
                      <View key={item.id} style={styles.inputRow}>
                        <Text style={styles.inputLabel}>{item.label}</Text>
                        <TextInput
                          style={styles.input}
                          value={settings[item.id] || ''}
                          onChangeText={value =>
                            setSettings(prev => ({...prev, [item.id]: value}))
                          }
                          placeholder={item.defaultValue}
                          placeholderTextColor="#999"
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          style={styles.saveButton}
                          onPress={saveApiUrl}
                        >
                          <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }

                  if (item.type === 'button') {
                    return (
                      <View key={item.id}>
                        {itemIndex > 0 && <View style={styles.divider} />}
                        <View style={styles.buttonRow}>
                          <View style={styles.buttonInfo}>
                            <Text style={styles.buttonLabel}>{item.label}</Text>
                            {item.description && (
                              <Text style={styles.buttonDescription}>
                                {item.description}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              item.buttonStyle === 'destructive' &&
                                styles.destructiveButton,
                            ]}
                            onPress={async () => {
                              if (item.id === 'clearCache') {
                                Alert.alert(
                                  'Clear Cache',
                                  'This will clear cached profile data. Restart app to test.',
                                  [
                                    {text: 'Cancel', style: 'cancel'},
                                    {
                                      text: 'Clear',
                                      style: 'destructive',
                                      onPress: async () => {
                                        await clearCache();
                                        Alert.alert('Success', 'Cache cleared');
                                      },
                                    },
                                  ],
                                );
                              }
                            }}
                          >
                            <Text
                              style={[
                                styles.actionButtonText,
                                item.buttonStyle === 'destructive' &&
                                  styles.destructiveButtonText,
                              ]}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }

                  return null;
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6D6D72',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: -0.08,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    minHeight: 44,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E5E5EA',
    width: '90%',
    alignSelf: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 17,
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6D6D72',
    marginTop: 2,
  },
  inputRow: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#6D6D72',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 17,
    color: '#000',
  },
  saveButton: {
    margin: 16,
    marginTop: 16,
    marginBottom: 0,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonRow: {
    padding: 16,
  },
  buttonInfo: {
    marginBottom: 12,
  },
  buttonLabel: {
    fontSize: 17,
    color: '#000',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 13,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  destructiveButtonText: {
    color: '#fff',
  },
});
