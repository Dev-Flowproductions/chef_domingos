export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}
