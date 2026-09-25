import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider, useTranslation } from '../../contexts/LanguageContext';

const LanguageProbe = () => {
  const { language, setLanguage, t } = useTranslation();
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="settings-title">{t('settings.title')}</span>
      <span data-testid="missing">{t('missing.key', 'Fallback text')}</span>
      <button onClick={() => setLanguage('en')}>English</button>
    </div>
  );
};

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
  });

  it('defaults to Vietnamese and falls back to explicit fallback text', () => {
    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>
    );

    expect(screen.getByTestId('language')).toHaveTextContent('vi');
    expect(screen.getByTestId('settings-title')).toHaveTextContent('Cài đặt');
    expect(screen.getByTestId('missing')).toHaveTextContent('Fallback text');
    expect(document.documentElement.lang).toBe('vi');
  });

  it('switches to English and persists language selection', () => {
    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByText('English'));

    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('settings-title')).toHaveTextContent('Settings');
    expect(localStorage.getItem('library74.language')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
