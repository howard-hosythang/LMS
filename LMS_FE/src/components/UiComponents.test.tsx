import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { StarRating, Input, Button } from '../../components/ui';

describe('shared UI components', () => {
  it('renders rounded star rating and review count', () => {
    const { container } = render(<StarRating rating={3.6} count={12} />);

    expect(container.querySelectorAll('svg.fill-yellow-400')).toHaveLength(4);
    expect(screen.getByText('(12)')).toBeInTheDocument();
  });

  it('toggles password input visibility', () => {
    const { container } = render(<Input label="Password" type="password" defaultValue="secret" />);
    const input = container.querySelector('input') as HTMLInputElement;

    expect(input.type).toBe('password');
    fireEvent.click(screen.getByRole('button'));
    expect(input.type).toBe('text');
  });

  it('applies disabled state to button', () => {
    render(<Button disabled>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
