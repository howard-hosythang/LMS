import { useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

export function pageNumber(value: string | null) { return value && /^\d+$/.test(value) ? Math.min(1000000, Number(value)) : 0; }
export function idValue(value: string | null) { return value && /^[1-9]\d{0,18}$/.test(value) ? value : undefined; }
export function useInquiryUrl() {
  const [params, setParams] = useSearchParams();
  const update = (values: Record<string, string | number | undefined>, replace = false) => setParams(previous => {
    const next = new URLSearchParams(previous);
    Object.entries(values).forEach(([key, value]) => { if (value === undefined || value === '') next.delete(key); else next.set(key, String(value)); });
    return next;
  }, { replace });
  return { params, update };
}
export function useSearchInput(key: string, resetPages: Record<string, number>) {
  const { params, update } = useInquiryUrl();
  const { key: navigationKey } = useLocation();
  const urlValue = params.get(key) || '';
  const [value, setValue] = useState(urlValue);
  const commit = useRef(() => {});
  commit.current = () => update({ ...resetPages, [key]: value }, true);

  // Navigation (including clearing filters and Back/Forward) cancels any draft.
  useEffect(() => { setValue(urlValue); }, [urlValue, navigationKey]);
  useEffect(() => {
    if (value === urlValue) return;
    const timer = window.setTimeout(() => commit.current(), 350);
    return () => window.clearTimeout(timer);
  }, [value, urlValue, navigationKey]);
  return [value, setValue] as const;
}
