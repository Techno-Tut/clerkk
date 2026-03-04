import React, {createContext, useContext, useState} from 'react';

interface OnboardingData {
  grossAnnual: number;
  expenses: Array<{category: string; name: string; amount: number}>;
  region: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  setGrossAnnual: (amount: number) => void;
  setExpenses: (expenses: OnboardingData['expenses']) => void;
  setRegion: (region: string) => void;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function OnboardingProvider({children}: {children: React.ReactNode}) {
  const [data, setData] = useState<OnboardingData>({
    grossAnnual: 0,
    expenses: [],
    region: '',
  });

  const setGrossAnnual = (amount: number) =>
    setData(prev => ({...prev, grossAnnual: amount}));

  const setExpenses = (expenses: OnboardingData['expenses']) =>
    setData(prev => ({...prev, expenses}));

  const setRegion = (region: string) => setData(prev => ({...prev, region}));

  const reset = () => setData({grossAnnual: 0, expenses: [], region: ''});

  return (
    <OnboardingContext.Provider
      value={{data, setGrossAnnual, setExpenses, setRegion, reset}}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
