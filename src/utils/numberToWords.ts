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

  const totalPaise = Math.round(num * 100);
  const integerPart = Math.floor(totalPaise / 100);
  const decimalPart = totalPaise % 100;

  // Indian numbering system (Crore, Lakh, Thousand, Hundred), expressed recursively so that
  // amounts of any size render correctly — e.g. ₹100 crore must read "One Hundred Crore",
  // not "Crore". The previous non-recursive version silently dropped the crore segment for
  // any amount of ₹100 crore or more.
  const convertIndianInteger = (n: number): string => {
    if (n <= 0) return '';
    if (n < 1000) return convertThreeDigits(n);
    const parts: string[] = [];
    const crore = Math.floor(n / 10000000);
    let rest = n % 10000000;
    if (crore > 0) parts.push(`${convertIndianInteger(crore)} Crore`);
    const lakh = Math.floor(rest / 100000);
    rest %= 100000;
    const thousand = Math.floor(rest / 1000);
    rest %= 1000;
    if (lakh > 0) parts.push(`${convertTwoDigits(lakh)} Lakh`);
    if (thousand > 0) parts.push(`${convertTwoDigits(thousand)} Thousand`);
    if (rest > 0) parts.push(convertThreeDigits(rest));
    return parts.join(' ');
  };

  let words = `Rupees ${integerPart > 0 ? convertIndianInteger(integerPart) : 'Zero'}`;

  if (decimalPart > 0) {
    words += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }

  return `${words} Only`;
}
