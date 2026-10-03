import { Banknote, CreditCard } from 'lucide-react';
import { useId } from 'react';
import type { DepositPaymentMethod } from '../../api/transactionsService';
import { useLanguage } from '../../contexts/LanguageContext';

export const depositPaymentMethodLabel = (method: DepositPaymentMethod | undefined, language: string) =>
  method === 'BANK_TRANSFER' ? (language === 'en' ? 'Bank transfer' : 'Chuyển khoản') : (language === 'en' ? 'Cash' : 'Tiền mặt');

export default function DepositPaymentMethodSelector({ value, onChange, disabled = false }: {
  value: DepositPaymentMethod;
  onChange: (method: DepositPaymentMethod) => void;
  disabled?: boolean;
}) {
  const { language } = useLanguage();
  const name = useId();
  return (
    <fieldset disabled={disabled} className="mb-4 space-y-2 disabled:opacity-60">
      <legend className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {language === 'en' ? 'Deposit payment method' : 'Hình thức thu cọc'}
      </legend>
      <div className="flex flex-wrap gap-3">
        {(['CASH', 'BANK_TRANSFER'] as const).map(method => {
          const Icon = method === 'CASH' ? Banknote : CreditCard;
          return (
            <label key={method} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm ${value === method ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'}`}>
              <input type="radio" name={name} value={method} checked={value === method} onChange={() => onChange(method)} className="accent-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500" />
              <Icon size={18} aria-hidden="true" />
              {depositPaymentMethodLabel(method, language)}{method === 'BANK_TRANSFER' ? ' / QR' : ''}
            </label>
          );
        })}
      </div>
      {value === 'BANK_TRANSFER' && <p className="text-xs text-slate-500 dark:text-slate-400">
        {language === 'en' ? 'Verify that the transfer has been received before handing over the book.' : 'Kiểm tra đã nhận được chuyển khoản trước khi xác nhận giao sách.'}
      </p>}
    </fieldset>
  );
}
