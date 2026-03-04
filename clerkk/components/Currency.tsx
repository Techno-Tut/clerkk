import {Text, TextStyle} from 'react-native';

interface CurrencyProps {
  amount: number | string;
  currency?: 'CAD' | 'USD';
  style?: TextStyle;
  showDecimals?: boolean;
}

export default function Currency({
  amount,
  currency = 'CAD',
  style,
  showDecimals = true,
}: CurrencyProps) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check if it's a whole number
  const isWholeNumber = numAmount % 1 === 0;

  const formatted =
    showDecimals && !isWholeNumber
      ? numAmount.toLocaleString('en-CA', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : numAmount.toLocaleString('en-CA', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });

  const symbol = currency === 'USD' ? '$' : '$';

  return (
    <Text style={style}>
      {symbol}
      {formatted}
    </Text>
  );
}
