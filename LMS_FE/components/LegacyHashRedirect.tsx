import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/** Convert previously shared HashRouter URLs before mounting pages or starting API requests. */
export function legacyHashDestination(search: string, hash: string): string | null {
  if (!hash.startsWith('#/') || hash.startsWith('#//') || /[\\\u0000-\u001f\u007f]/.test(hash)) return null;
  const destination = new URL(hash.slice(1), window.location.origin);
  if (destination.origin !== window.location.origin) return null;
  // Inner route parameters take priority; retain outer OAuth/provider parameters as well.
  const outer = new URLSearchParams(search);
  for (const name of new Set(outer.keys())) {
    if (!destination.searchParams.has(name)) {
      for (const value of outer.getAll(name)) destination.searchParams.append(name, value);
    }
  }
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export function LegacyHashRedirect({ children }: { children: ReactNode }) {
  const location = useLocation();
  const destination = legacyHashDestination(location.search, location.hash);
  return destination
    ? <Navigate to={destination} replace state={location.state} />
    : <>{children}</>;
}
