export const formatVnd = (amount: number | string | null | undefined) =>
  `${Number(amount ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ`;

export const formatCurrencyDigits = (digits: string) =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
