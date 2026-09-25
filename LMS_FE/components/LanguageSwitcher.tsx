import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type LanguageSwitcherProps = {
  compact?: boolean;
};

export const LanguageSwitcher = ({ compact = false }: LanguageSwitcherProps) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm ${
        compact ? 'gap-0' : 'gap-1'
      }`}
      aria-label="Language selector"
    >
      {!compact && <Languages size={15} className="ml-2 text-gray-400" />}
      {(['vi', 'en'] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLanguage(item)}
          className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
            language === item
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
          }`}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
