export type CookieConsentValue = 'accepted' | 'rejected';

export const COOKIE_CONSENT_KEY = 'library74.cookieConsent.v1';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const getCookieConsent = (): CookieConsentValue | null => {
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
};

export const setCookieConsent = (value: CookieConsentValue) => {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent('library74-cookie-consent-changed', { detail: value }));
};

export const hasAnalyticsConfigured = () => Boolean(import.meta.env.VITE_GA_MEASUREMENT_ID?.trim());

export const enableAnalyticsIfConsented = () => {
  if (getCookieConsent() !== 'accepted') return;

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId || document.getElementById('library74-ga-script')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true });

  const script = document.createElement('script');
  script.id = 'library74-ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
};
