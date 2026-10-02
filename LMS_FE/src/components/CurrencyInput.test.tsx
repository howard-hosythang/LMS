import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import CurrencyInput from '../../components/CurrencyInput';

function Harness() {
  const [value, setValue] = useState('');
  return <><CurrencyInput aria-label="amount" value={value} onValueChange={setValue} /><output data-testid="raw">{value}</output></>;
}

test('groups typed/pasted currency and supplies raw digits to the payload', () => {
  render(<Harness />);
  const input = screen.getByLabelText('amount');
  fireEvent.change(input, { target: { value: '1000000' } });
  expect(input).toHaveValue('1.000.000');
  expect(screen.getByTestId('raw')).toHaveTextContent('1000000');
  fireEvent.change(input, { target: { value: '100.000đ' } });
  expect(input).toHaveValue('100.000');
  expect(screen.getByTestId('raw')).toHaveTextContent('100000');
});

test('backspace across a grouping separator removes a digit without jumping to the end', () => {
  render(<Harness />);
  const input = screen.getByLabelText('amount') as HTMLInputElement;
  fireEvent.change(input, { target: { value: '1000000' } });
  input.focus();
  input.setSelectionRange(2, 2);
  fireEvent.keyDown(input, { key: 'Backspace' });
  expect(input).toHaveValue('0');
  expect(input.selectionStart).toBe(0);
});

test('keeps the caret beside a digit inserted in the middle', () => {
  render(<Harness />);
  const input = screen.getByLabelText('amount') as HTMLInputElement;
  fireEvent.change(input, { target: { value: '1234567' } });
  fireEvent.change(input, { target: { value: '1.2934.567', selectionStart: 4, selectionEnd: 4 } });
  expect(input).toHaveValue('12.934.567');
  expect(input.selectionStart).toBe(4);
  expect(screen.getByTestId('raw')).toHaveTextContent('12934567');
});

test('delete before a grouping separator removes the next digit and preserves the caret', () => {
  render(<Harness />);
  const input = screen.getByLabelText('amount') as HTMLInputElement;
  fireEvent.change(input, { target: { value: '1234567' } });
  input.setSelectionRange(1, 1);
  fireEvent.keyDown(input, { key: 'Delete' });
  expect(input).toHaveValue('134.567');
  expect(input.selectionStart).toBe(1);
  expect(screen.getByTestId('raw')).toHaveTextContent('134567');
});
