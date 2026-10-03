import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

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
export function useDebounced(value: string) {
  const [settled, setSettled] = useState(value);
  useEffect(() => { const timer = window.setTimeout(() => setSettled(value), 300); return () => window.clearTimeout(timer); }, [value]);
  return settled;
}
