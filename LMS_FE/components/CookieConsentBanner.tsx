import { BarChart3, Check, Cookie, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import {
  enableAnalyticsIfConsented,
  getCookieConsent,
  hasAnalyticsConfigured,
  setCookieConsent,
} from '../utils/analyticsConsent';

const CookieConsentBanner = () => {
  const { language } = useTranslation();
  const [choice, setChoice] = useState(() => getCookieConsent());
  const isEnglish = language === 'en';

  useEffect(() => {
    enableAnalyticsIfConsented();
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail === 'accepted' || detail === 'rejected') setChoice(detail);
    };
    window.addEventListener('library74-cookie-consent-changed', handler);
    return () => window.removeEventListener('library74-cookie-consent-changed', handler);
  }, []);

  const applyChoice = (value: 'accepted' | 'rejected') => {
    setCookieConsent(value);
    setChoice(value);
    if (value === 'accepted') enableAnalyticsIfConsented();
  };

  if (!hasAnalyticsConfigured() || choice) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Cookie size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-950">
              {isEnglish ? 'Cookie, storage and analytics choices' : 'Tùy chọn cookie, bộ nhớ và analytics'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {isEnglish
                ? 'Required browser storage is used for login, security and your preferences. Library74 does not use auth cookies for login. Analytics cookies only run after you actively agree.'
                : 'Bộ nhớ trình duyệt cần thiết được dùng cho đăng nhập, bảo mật và lựa chọn của bạn. Library74 không dùng cookie đăng nhập. Cookie analytics chỉ chạy khi bạn chủ động đồng ý.'}
            </p>
            <Link to="/publicpage/cookie-policy" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
              <BarChart3 size={13} />
              {isEnglish ? 'View cookie details' : 'Xem chi tiết cookie'}
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
          <button
            type="button"
            onClick={() => applyChoice('rejected')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <X size={16} />
            {isEnglish ? 'Reject analytics' : 'Từ chối analytics'}
          </button>
          <button
            type="button"
            onClick={() => applyChoice('accepted')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Check size={16} />
            {isEnglish ? 'Accept analytics' : 'Đồng ý analytics'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
