import { Laptop, Moon, Sun } from 'lucide-react';
import { ThemeMode, useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/LanguageContext';

const OPTIONS: { value: ThemeMode; icon: typeof Sun; labelKey: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'settings.light' },
  { value: 'dark', icon: Moon, labelKey: 'settings.dark' },
  { value: 'system', icon: Laptop, labelKey: 'settings.system' },
];

export const ThemeModeToggle = ({ compact = false }: { compact?: boolean }) => {
  const { themeMode, setThemeMode } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = themeMode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setThemeMode(option.value)}
            title={t(option.labelKey)}
            aria-label={t(option.labelKey)}
            className={`inline-flex h-7 items-center justify-center rounded-full px-2 text-xs font-semibold transition-colors ${
              active
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Icon size={14} />
            {!compact && <span className="ml-1.5 hidden lg:inline">{t(option.labelKey)}</span>}
          </button>
        );
      })}
    </div>
  );
};
