import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useState, useEffect} from 'react';
import {useAuth0} from 'react-native-auth0';
import {useRouter, Stack} from 'expo-router';
import * as Haptics from 'expo-haptics';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';
import {api} from '../config/api';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Currency from '../components/Currency';

export default function Home() {
  const {user, clearSession, clearCredentials, getCredentials} = useAuth0();
  const router = useRouter();
  const firstName = user?.givenName || user?.name?.split(' ')[0] || 'there';

  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showUpdateBalanceModal, setShowUpdateBalanceModal] = useState(false);
  const [showLogPaycheckModal, setShowLogPaycheckModal] = useState(false);
  const [showAccountsInfo, setShowAccountsInfo] = useState(false);
  const [showQuickActionsInfo, setShowQuickActionsInfo] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'investment' | 'cash'>(
    'cash',
  );
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [paycheckAmount, setPaycheckAmount] = useState('');
  const [paycheckDate, setPaycheckDate] = useState('Today');
  const [paycheckSource, setPaycheckSource] = useState('');

  useEffect(() => {
    fetchStats();
  }, [viewMode]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const creds = await getCredentials();
      const data = await api.dashboard.getStats(viewMode, creds.accessToken);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Artificial delay
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearCredentials();
            router.replace('/onboarding/welcome');
          } catch (e) {
            console.error('Logout error:', e);
          }
        },
      },
    ]);
  };

  const actionItems = [
    {
      icon: 'add-circle',
      iconColor: '#4CAF50',
      title: "Log this month's paycheck",
      subtitle: 'Keep your surplus up to date',
      onPress: () => setShowLogPaycheckModal(true),
      haptic: Haptics.ImpactFeedbackStyle.Light,
    },
    {
      icon: 'receipt-outline',
      iconColor: '#2196F3',
      title: 'Log major expense',
      subtitle: 'Track big purchases that matter',
      onPress: () => {},
      haptic: Haptics.ImpactFeedbackStyle.Light,
    },
    {
      icon: 'log-out-outline',
      iconColor: '#dc3545',
      iconBgColor: '#fee',
      title: 'Log Out',
      subtitle: 'Sign out of your account',
      onPress: handleLogout,
      haptic: Haptics.ImpactFeedbackStyle.Medium,
    },
  ];

  const accounts = [
    {
      name: 'Emergency Fund',
      balance: 18000,
      status: '6 months saved ✓',
      statusColor: '#4CAF50',
    },
  ];

  const renderSurplusHero = () => (
    <View style={styles.hero}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroLabel}>
          {viewMode === 'monthly' ? 'Monthly' : 'Yearly'} Surplus
        </Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'monthly' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('monthly')}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'monthly' && styles.toggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'yearly' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('yearly')}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'yearly' && styles.toggleTextActive,
              ]}
            >
              Yearly
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {isLoading ? (
        <SkeletonPlaceholder backgroundColor="#1a1a1a" highlightColor="#2a2a2a">
          <SkeletonPlaceholder.Item
            width={200}
            height={48}
            marginTop={20}
            alignSelf="center"
          />
        </SkeletonPlaceholder>
      ) : (
        <Currency amount={stats?.surplus || 0} style={styles.heroAmount} />
      )}
      {isLoading ? (
        <SkeletonPlaceholder backgroundColor="#1a1a1a" highlightColor="#2a2a2a">
          <SkeletonPlaceholder.Item
            width={200}
            height={16}
            marginTop={8}
            alignSelf="center"
          />
        </SkeletonPlaceholder>
      ) : (
        <Text style={styles.heroSubtitle}>
          Out of{' '}
          <Currency
            amount={stats?.post_tax_income || 0}
            style={styles.heroSubtitleBold}
          />{' '}
          after taxes this {viewMode === 'monthly' ? 'month' : 'year'}
        </Text>
      )}
      <View style={styles.heroFooter}>
        <View style={styles.heroFooterItem}>
          <Text style={styles.footerLabel}>Marginal Tax Rate</Text>
          <View style={styles.taxRateRow}>
            {isLoading ? (
              <SkeletonPlaceholder
                backgroundColor="#1a1a1a"
                highlightColor="#2a2a2a"
              >
                <SkeletonPlaceholder.Item width={60} height={24} />
              </SkeletonPlaceholder>
            ) : (
              <Text style={styles.footerValue}>
                $
                {stats?.marginal_tax_rate
                  ? (1 - Number(stats.marginal_tax_rate) / 100).toFixed(2)
                  : '0.00'}
              </Text>
            )}
            <Text style={styles.taxRateDivider}>/</Text>
            <Text style={styles.taxRateDollar}>$1</Text>
          </View>
          {isLoading ? (
            <SkeletonPlaceholder
              backgroundColor="#1a1a1a"
              highlightColor="#2a2a2a"
            >
              <SkeletonPlaceholder.Item width={100} height={14} marginTop={4} />
            </SkeletonPlaceholder>
          ) : (
            <Text style={styles.footerSubtext}>you keep per dollar earned</Text>
          )}
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.heroFooterItem}>
          <Text style={styles.footerLabel}>Income Ranking</Text>
          {isLoading ? (
            <SkeletonPlaceholder
              backgroundColor="#1a1a1a"
              highlightColor="#2a2a2a"
            >
              <SkeletonPlaceholder.Item width={70} height={20} marginTop={4} />
            </SkeletonPlaceholder>
          ) : (
            <Text style={styles.footerValue}>
              {stats?.income_percentile || 'N/A'}
            </Text>
          )}
          <Text style={styles.footerSubtext}>of Canadian earners</Text>
        </View>
      </View>
    </View>
  );

  const renderQuickStats = () => (
    <View style={styles.stats}>
      <View style={styles.statCard}>
        <Ionicons name="trending-up" size={24} color="#4CAF50" />
        {isLoading ? (
          <SkeletonPlaceholder
            backgroundColor="#E0E0E0"
            highlightColor="#F5F5F5"
          >
            <SkeletonPlaceholder.Item width={80} height={28} marginTop={8} />
          </SkeletonPlaceholder>
        ) : (
          <Currency amount={stats?.income || 0} style={styles.statAmount} />
        )}
        <Text style={styles.statLabel}>What you earn</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="card-outline" size={24} color="#FF9800" />
        {isLoading ? (
          <SkeletonPlaceholder
            backgroundColor="#E0E0E0"
            highlightColor="#F5F5F5"
          >
            <SkeletonPlaceholder.Item width={80} height={28} marginTop={8} />
          </SkeletonPlaceholder>
        ) : (
          <Currency amount={stats?.expenses || 0} style={styles.statAmount} />
        )}
        <Text style={styles.statLabel}>What you spend</Text>
      </View>
      <TouchableOpacity
        style={styles.statCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/debt');
        }}
      >
        <Ionicons name="wallet-outline" size={24} color="#2196F3" />
        {isLoading ? (
          <SkeletonPlaceholder
            backgroundColor="#E0E0E0"
            highlightColor="#F5F5F5"
          >
            <SkeletonPlaceholder.Item width={80} height={28} marginTop={8} />
          </SkeletonPlaceholder>
        ) : (
          <Currency amount={stats?.debt || 0} style={styles.statAmount} />
        )}
        <Text style={styles.statLabel}>What you owe</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAccounts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Accounts</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAccountsInfo(true);
          }}
        >
          <Ionicons name="information-circle-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={48} color="#4CAF50" />
          <Text style={styles.emptyStateTitle}>Get smarter advice</Text>
          <Text style={styles.emptyStateText}>
            Track your savings accounts so your AI CFO can give you personalized
            recommendations on where to put your surplus each month.
          </Text>
          <TouchableOpacity
            style={styles.addAccountButton}
            onPress={() => setShowAddAccountModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="#4CAF50" />
            <Text style={styles.addAccountButtonText}>
              Add Your First Account
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {accounts.map(account => (
            <View key={account.name} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text
                    style={[styles.accountStatus, {color: account.statusColor}]}
                  >
                    {account.status}
                  </Text>
                </View>
                <Text style={styles.accountBalance}>
                  ${account.balance.toLocaleString()}
                </Text>
              </View>
              <View style={styles.accountActions}>
                <TouchableOpacity
                  style={styles.accountButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAccount(account.name);
                    setShowContributeModal(true);
                  }}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color="#4CAF50"
                  />
                  <Text style={styles.accountButtonText}>Contribute</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.accountButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAccount(account.name);
                    setShowWithdrawModal(true);
                  }}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={16}
                    color="#F44336"
                  />
                  <Text style={styles.accountButtonText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.rebalanceButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedAccount(account.name);
                  setShowUpdateBalanceModal(true);
                }}
              >
                <Text style={styles.rebalanceButtonText}>Update balance</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addAccountButtonSmall}
            onPress={() => setShowAddAccountModal(true)}
          >
            <Ionicons name="add" size={16} color="#4CAF50" />
            <Text style={styles.addAccountButtonSmallText}>
              Add Another Account
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowQuickActionsInfo(true);
          }}
        >
          <Ionicons name="information-circle-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      {actionItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.actionCard}
          onPress={() => {
            Haptics.impactAsync(item.haptic);
            item.onPress();
          }}
        >
          <View
            style={[
              styles.actionIcon,
              item.iconBgColor && {backgroundColor: item.iconBgColor},
            ]}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={item.iconColor}
            />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{item.title}</Text>
            <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderModals = () => (
    <>
      <Modal visible={showQuickActionsInfo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{flex: 1}}
            activeOpacity={1}
            onPress={() => setShowQuickActionsInfo(false)}
          />
          <View style={styles.infoSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About Quick Actions</Text>
              <TouchableOpacity onPress={() => setShowQuickActionsInfo(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoText}>
              Keep your financial data up to date by logging your paychecks and
              major expenses. This helps us calculate your real-time surplus and
              give you accurate recommendations. The more current your data, the
              better advice we can provide.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal visible={showAccountsInfo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{flex: 1}}
            activeOpacity={1}
            onPress={() => setShowAccountsInfo(false)}
          />
          <View style={styles.infoSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About Accounts</Text>
              <TouchableOpacity onPress={() => setShowAccountsInfo(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoText}>
              Track your savings accounts like emergency funds, RRSP, TFSA, and
              investments. We use this to calculate your financial health and
              give you personalized advice on where to allocate your surplus,
              like maxing out your RRSP for tax savings or building your
              emergency fund. Your accounts stay private and secure.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal visible={showLogPaycheckModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAwareScrollView
            contentContainerStyle={{flex: 1, justifyContent: 'flex-end'}}
          >
            <TouchableOpacity
              style={{flex: 1}}
              activeOpacity={1}
              onPress={() => setShowLogPaycheckModal(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log Paycheck</Text>
                <TouchableOpacity
                  onPress={() => setShowLogPaycheckModal(false)}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>Amount</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="$0.00"
                keyboardType="numeric"
                value={paycheckAmount}
                onChangeText={setPaycheckAmount}
              />
              <Text style={styles.modalLabel}>Date</Text>
              <TouchableOpacity style={styles.modalInput}>
                <Text style={styles.modalInputText}>{paycheckDate}</Text>
              </TouchableOpacity>
              <Text style={styles.modalLabel}>Source (optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Tech Job"
                value={paycheckSource}
                onChangeText={setPaycheckSource}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setPaycheckAmount('');
                  setPaycheckDate('Today');
                  setPaycheckSource('');
                  setShowLogPaycheckModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Log Paycheck</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      <Modal visible={showAddAccountModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAwareScrollView
            contentContainerStyle={{flex: 1, justifyContent: 'flex-end'}}
          >
            <TouchableOpacity
              style={{flex: 1}}
              activeOpacity={1}
              onPress={() => setShowAddAccountModal(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Account</Text>
                <TouchableOpacity onPress={() => setShowAddAccountModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>Account Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Emergency Fund"
                value={newAccountName}
                onChangeText={setNewAccountName}
              />
              <Text style={styles.modalLabel}>Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newAccountType === 'cash' && styles.typeButtonActive,
                  ]}
                  onPress={() => setNewAccountType('cash')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      newAccountType === 'cash' && styles.typeButtonTextActive,
                    ]}
                  >
                    Savings
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newAccountType === 'investment' && styles.typeButtonActive,
                  ]}
                  onPress={() => setNewAccountType('investment')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      newAccountType === 'investment' &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    Investment
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>Current Balance</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="$0.00"
                keyboardType="numeric"
                value={newAccountBalance}
                onChangeText={setNewAccountBalance}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setNewAccountName('');
                  setNewAccountType('cash');
                  setNewAccountBalance('');
                  setShowAddAccountModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Add Account</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      <Modal visible={showUpdateBalanceModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAwareScrollView
            contentContainerStyle={{flex: 1, justifyContent: 'flex-end'}}
          >
            <TouchableOpacity
              style={{flex: 1}}
              activeOpacity={1}
              onPress={() => setShowUpdateBalanceModal(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Update Balance for{' '}
                  <Text style={styles.modalTitleHighlight}>
                    {selectedAccount}
                  </Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setShowUpdateBalanceModal(false)}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>New Balance</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="$0.00"
                keyboardType="numeric"
                value={newBalance}
                onChangeText={setNewBalance}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setNewBalance('');
                  setShowUpdateBalanceModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Update Balance</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      <Modal visible={showContributeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAwareScrollView
            contentContainerStyle={{flex: 1, justifyContent: 'flex-end'}}
          >
            <TouchableOpacity
              style={{flex: 1}}
              activeOpacity={1}
              onPress={() => setShowContributeModal(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Contribute to{' '}
                  <Text style={styles.modalTitleHighlight}>
                    {selectedAccount}
                  </Text>
                </Text>
                <TouchableOpacity onPress={() => setShowContributeModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>Amount</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="$0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setAmount('');
                  setShowContributeModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Contribute</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      <Modal visible={showWithdrawModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAwareScrollView
            contentContainerStyle={{flex: 1, justifyContent: 'flex-end'}}
          >
            <TouchableOpacity
              style={{flex: 1}}
              activeOpacity={1}
              onPress={() => setShowWithdrawModal(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Withdraw from{' '}
                  <Text style={styles.modalTitleHighlight}>
                    {selectedAccount}
                  </Text>
                </Text>
                <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>Amount</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="$0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={() => {
                  setAmount('');
                  setShowWithdrawModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>
    </>
  );

  return (
    <>
      <Stack.Screen options={{gestureEnabled: false}} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          {renderSurplusHero()}
          {renderQuickStats()}
          {renderAccounts()}
          {renderQuickActions()}
        </ScrollView>
        {renderModals()}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  hero: {
    backgroundColor: '#000',
    padding: 32,
    margin: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 14,
    color: '#999',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#333',
  },
  toggleText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  heroAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  heroSubtitleBold: {
    fontWeight: 'bold',
    color: '#999',
  },
  heroFooter: {
    flexDirection: 'row',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333',
    width: '100%',
    gap: 16,
  },
  heroFooterItem: {
    flex: 1,
    alignItems: 'center',
  },
  footerDivider: {
    width: 1,
    backgroundColor: '#333',
  },
  footerLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  footerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  taxRateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  taxRateDivider: {
    fontSize: 16,
    color: '#4CAF50',
    marginHorizontal: 2,
  },
  taxRateDollar: {
    fontSize: 14,
    color: '#4CAF50',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 12,
    marginBottom: 4,
    minHeight: 28,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
    minHeight: 32,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  addAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#999',
  },
  addAccountButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  addAccountButtonSmallText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  accountCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  accountStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  accountBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  accountActions: {
    flexDirection: 'row',
    gap: 8,
  },
  accountButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  accountButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  rebalanceButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  rebalanceButtonText: {
    fontSize: 13,
    color: '#999',
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
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 16,
  },
  modalTitleHighlight: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalInputText: {
    fontSize: 16,
    color: '#000',
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonDanger: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    maxWidth: 400,
    alignSelf: 'center',
  },
  infoSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  infoButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
});
