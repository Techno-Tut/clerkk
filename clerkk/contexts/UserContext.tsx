import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth0} from 'react-native-auth0';
import {api} from '@/config/api';
import {CURRENCY_MAP} from '@/constants/currency';

interface UserProfile {
  id: string;
  email: string;
  region: string;
  onboarding_completed: boolean;
}

interface OnboardingData {
  grossAnnual: number;
  expenses: Array<{category: string; name: string; amount: number}>;
  region: string;
}

interface UserContextType {
  profile: UserProfile | null;
  onboardingData: OnboardingData;
  isLoading: boolean;
  primaryCurrency: string;
  setGrossAnnual: (amount: number) => void;
  setExpenses: (expenses: OnboardingData['expenses']) => void;
  setRegion: (region: string) => void;
  completeOnboarding: () => Promise<void>;
  loadProfile: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const PROFILE_KEY = '@clerkk_user_profile';

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({children}: {children: React.ReactNode}) {
  const {user, getCredentials} = useAuth0();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    grossAnnual: 0,
    expenses: [],
    region: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const credentials = await getCredentials();
      const userProfile = await api.user.getProfile(credentials!.accessToken);

      // Cache entire profile
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));

      setProfile({
        id: userProfile.user_id,
        email: userProfile.email ?? '',
        region: userProfile.region,
        onboarding_completed: userProfile.onboarding_completed,
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Fallback to cached profile
      const cached = await AsyncStorage.getItem(PROFILE_KEY);
      if (cached) {
        setProfile(JSON.parse(cached));
      }
      setIsLoading(false);
    }
  }, [getCredentials]);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user, loadProfile]);

  const completeOnboarding = async () => {
    try {
      const credentials = await getCredentials();
      await api.user.submitOnboarding(onboardingData, credentials!.accessToken);

      // Update profile
      const updatedProfile = {
        ...profile,
        onboarding_completed: true,
      } as UserProfile;
      setProfile(updatedProfile);

      // Cache updated profile
      AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile)).catch(
        err => console.error('Failed to cache profile:', err),
      );
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  const setGrossAnnual = (amount: number) =>
    setOnboardingData(prev => ({...prev, grossAnnual: amount}));

  const setExpenses = (expenses: OnboardingData['expenses']) =>
    setOnboardingData(prev => ({...prev, expenses}));

  const setRegion = (region: string) =>
    setOnboardingData(prev => ({...prev, region}));

  const clearCache = async () => {
    await AsyncStorage.removeItem(PROFILE_KEY);
    setProfile(null);
  };

  // Get currency based on region (default to CAD)
  const country =
    profile?.region?.substring(0, 2) ||
    onboardingData.region?.substring(0, 2) ||
    'CA';
  const primaryCurrency = CURRENCY_MAP[country] || 'CAD';

  return (
    <UserContext.Provider
      value={{
        profile,
        onboardingData,
        isLoading,
        primaryCurrency,
        setGrossAnnual,
        setExpenses,
        setRegion,
        completeOnboarding,
        loadProfile,
        clearCache,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
