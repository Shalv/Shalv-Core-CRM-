/**
 * Converts a numeric currency amount into Indian English words (e.g. "Rupees Forty-Five Thousand Only")
 */
export function amountInWords(num: number): string {
  if (isNaN(num) || num < 0) return '';
  if (num === 0) return 'Rupees Zero Only';

  const singleDigits = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];
  const twoDigits = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tensMultiple = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertTwoDigits = (n: number): string => {
    if (n < 10) return singleDigits[n] || '';
    if (n < 20) return twoDigits[n - 10] || '';
    const tens = Math.floor(n / 10);
    const unit = n % 10;
    return `${tensMultiple[tens] || ''}${unit ? ' ' + singleDigits[unit] : ''}`;
  };

  const convertThreeDigits = (n: number): string => {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += `${singleDigits[hundred]} Hundred`;
    }
    if (rest > 0) {
      if (res) res += ' and ';
      res += convertTwoDigits(rest);
    }
    return res;
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  // Indian numbering system: Crores, Lakhs, Thousands, Hundreds
  const crores = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  const lakhs = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousands = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundreds = remainder;

  const parts: string[] = [];
  if (crores > 0) {
    parts.push(`${convertTwoDigits(crores)} Crore`);
  }
  if (lakhs > 0) {
    parts.push(`${convertTwoDigits(lakhs)} Lakh`);
  }
  if (thousands > 0) {
    parts.push(`${convertTwoDigits(thousands)} Thousand`);
  }
  if (hundreds > 0) {
    parts.push(convertThreeDigits(hundreds));
  }

  let words = `Rupees ${parts.join(' ')}`.trim();

  if (decimalPart > 0) {
    words += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }

  return `${words} Only`;
}
