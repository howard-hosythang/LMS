import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { ThemeModeToggle } from '../../components/ThemeModeToggle';

const installMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
};

describe('header switcher components', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    installMatchMedia(false);
  });

  it('switches language from Vietnamese to English', () => {
    render(<LanguageProvider><LanguageSwitcher /></LanguageProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(localStorage.getItem('library74.language')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('switches theme from system to dark through the toggle', () => {
    render(
      <LanguageProvider>
        <ThemeProvider>
          <ThemeModeToggle compact />
        </ThemeProvider>
      </LanguageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tối' }));

    expect(localStorage.getItem('library74.theme')).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
  });
});
