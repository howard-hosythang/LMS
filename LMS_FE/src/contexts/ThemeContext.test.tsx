import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

const ThemeProbe = () => {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  return (
    <div>
      <span data-testid="mode">{themeMode}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setThemeMode('dark')}>Dark</button>
      <button onClick={() => setThemeMode('light')}>Light</button>
      <button onClick={() => setThemeMode('system')}>System</button>
    </div>
  );
};

const installMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    installMatchMedia(false);
  });

  it('defaults to system and resolves light when system is light', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('applies dark mode and persists the selected mode', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Dark'));

    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('library74.theme')).toBe('dark');
  });

  it('resolves system mode from prefers-color-scheme', () => {
    installMatchMedia(true);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
  });
});
