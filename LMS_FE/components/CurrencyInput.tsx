import { InputHTMLAttributes, useLayoutEffect, useRef, useState } from 'react';
import { formatCurrencyDigits } from '../utils/currency';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string;
  onValueChange: (digits: string) => void;
};

// The parent receives raw integer digits; grouping is only a display concern.
export default function CurrencyInput({ value, onValueChange, onKeyDown, ...props }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const cursor = useRef<number | null>(null);
  const [, refreshSelection] = useState(0);
  const display = formatCurrencyDigits(value);
  useLayoutEffect(() => {
    if (cursor.current !== null && ref.current) {
      ref.current.setSelectionRange(cursor.current, cursor.current);
      cursor.current = null;
    }
  });

  const update = (text: string, position: number) => {
    const digitsBefore = text.slice(0, position).replace(/\D/g, '').length;
    const raw = text.replace(/\D/g, '');
    const digits = raw.replace(/^0+(?=\d)/, '');
    const count = Math.max(0, digitsBefore - (raw.length - digits.length));
    const formatted = formatCurrencyDigits(digits);
    let offset = 0;
    let seen = 0;
    while (offset < formatted.length && seen < count) {
      if (/\d/.test(formatted[offset])) seen++;
      offset++;
    }
    cursor.current = offset;
    onValueChange(digits);
    refreshSelection(n => n + 1);
  };

  return <input {...props} ref={ref} type="text" inputMode="numeric" value={display}
    onChange={event => update(event.target.value, event.target.selectionStart ?? event.target.value.length)}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      const input = event.currentTarget;
      const start = input.selectionStart ?? 0;
      if (start !== input.selectionEnd) return;
      if (event.key === 'Backspace' && display[start - 1] === '.') {
        event.preventDefault();
        update(display.slice(0, start - 2) + display.slice(start), start - 2);
      } else if (event.key === 'Delete' && display[start] === '.') {
        event.preventDefault();
        update(display.slice(0, start) + display.slice(start + 2), start);
      }
    }} />;
}
