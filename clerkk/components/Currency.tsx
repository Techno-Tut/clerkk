import {Text, TextStyle} from 'react-native';

interface CurrencyProps {
  amount: number | string;
  currency?: 'CAD' | 'USD' | 'INR' | 'EUR';
  style?: TextStyle;
  showDecimals?: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  CAD: '$',
  USD: '$',
  INR: '₹',
  EUR: '€',
};

const CURRENCY_LOCALES: Record<string, string> = {
  CAD: 'en-CA',
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'de-DE',
};

export default function Currency({
  amount,
  currency = 'CAD',
  style,
  showDecimals = true,
}: CurrencyProps) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const isWholeNumber = numAmount % 1 === 0;

  const locale = CURRENCY_LOCALES[currency] || 'en-CA';

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: showDecimals && !isWholeNumber ? 2 : 0,
    maximumFractionDigits: showDecimals && !isWholeNumber ? 2 : 0,
  }).format(numAmount);

  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  return (
    <Text style={style} numberOfLines={1} adjustsFontSizeToFit>
      {symbol}
      {formatted}
    </Text>
  );
}
