/**
 * Converts a numeric amount to Indian currency words
 * Example: 1499 -> "Indian Rupees One Thousand Four Hundred Ninety-Nine Only"
 */
export function numberToIndianWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertBelowThousand(n: number): string {
    let str = '';
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + (n % 10 > 0 ? '-' + singleDigits[n % 10] : '') + ' ';
    } else if (n > 0) {
      str += singleDigits[n] + ' ';
    }
    return str.trim();
  }

  let num = rounded;
  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  if (crore > 0) {
    words += convertBelowThousand(crore) + ' Crore ';
  }

  const lakh = Math.floor(num / 100000);
  num %= 100000;
  if (lakh > 0) {
    words += convertBelowThousand(lakh) + ' Lakh ';
  }

  const thousand = Math.floor(num / 1000);
  num %= 1000;
  if (thousand > 0) {
    words += convertBelowThousand(thousand) + ' Thousand ';
  }

  if (num > 0) {
    words += convertBelowThousand(num) + ' ';
  }

  return `Indian Rupees ${words.trim()} Only`;
}
