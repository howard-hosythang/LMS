import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Link, useLocation } from 'react-router-dom';
import { LegacyHashRedirect, legacyHashDestination } from '../../components/LegacyHashRedirect';

function Page() {
  const location = useLocation();
  return <>
    <output data-testid="location">{location.pathname}{location.search}{location.hash}</output>
    <Link to="/publicpage/search?q=AI&page=2">Search</Link>
    <Link to="/publicpage/guide">Guide</Link>
  </>;
}
function view(url: string) {
  window.history.replaceState(null, '', url);
  return render(<BrowserRouter><LegacyHashRedirect><Page /></LegacyHashRedirect></BrowserRouter>);
}
afterEach(() => window.history.replaceState(null, '', '/'));

test.each([
  ['/#/publicpage/guide', '/publicpage/guide'],
  ['/#/publicpage/reset-password?token=a%2Bb%3D', '/publicpage/reset-password?token=a%2Bb%3D'],
  ['/#/librarianpage/transactions?tab=reader&userId=9&page=2', '/librarianpage/transactions?tab=reader&userId=9&page=2'],
  ['/?code=provider-code#/oauth2/callback', '/oauth2/callback?code=provider-code'],
  ['/?status=outer&extra=keep#/librarianpage/circulation?status=inner', '/librarianpage/circulation?status=inner&extra=keep'],
  ['/#/librarianpage/circulation?deposit=success&orderCode=123', '/librarianpage/circulation?deposit=success&orderCode=123'],
  ['/#/publicpage/guide#borrowing', '/publicpage/guide#borrowing'],
])('old link %s becomes %s without mounting the old page', async (oldUrl, target) => {
  view(oldUrl);
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(target));
  expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(target);
});

test('direct URLs and query parameters survive a fresh router mount', () => {
  const url = '/librarianpage/transactions?tab=lifecycle&itemId=5&dateType=returned&page=3';
  const mounted = view(url);
  expect(screen.getByTestId('location')).toHaveTextContent(url);
  mounted.unmount();
  render(<BrowserRouter><LegacyHashRedirect><Page /></LegacyHashRedirect></BrowserRouter>);
  expect(screen.getByTestId('location')).toHaveTextContent(url);
});

test('BrowserRouter navigation and Back/Forward restore path and filters', async () => {
  view('/publicpage/guide');
  fireEvent.click(screen.getByRole('link', { name: 'Search' }));
  expect(window.location.pathname).toBe('/publicpage/search');
  expect(window.location.search).toBe('?q=AI&page=2');
  await act(async () => { window.history.back(); });
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/publicpage/guide'));
  await act(async () => { window.history.forward(); });
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/publicpage/search?q=AI&page=2'));
});

test.each(['#borrowing', '#//evil.example', '#/\\evil.example', '#/publicpage/guide\n'])('does not reinterpret anchor or unsafe hash %s as a route', hash => {
  expect(legacyHashDestination('', hash)).toBeNull();
});

test('normal in-page anchors remain unchanged', () => {
  view('/publicpage/guide#borrowing');
  expect(screen.getByTestId('location')).toHaveTextContent('/publicpage/guide#borrowing');
});
