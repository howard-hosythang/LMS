import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OAuth2CallbackPage from '../../pages/public_pages/OAuth2CallbackPage';

const mockSocialLogin = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ socialLogin: mockSocialLogin }) }));
jest.mock('../../contexts/LanguageContext', () => ({
  useTranslation: () => ({ language: 'vi', t: (_key: string, fallback: string) => fallback }),
}));

function Destination() {
  const { pathname, search } = useLocation();
  return <output data-testid="destination">{pathname}{search}</output>;
}
function view(query = '?code=google-code') {
  window.history.replaceState(null, '', `/oauth2/callback${query}`);
  render(<React.StrictMode><MemoryRouter initialEntries={[`/oauth2/callback${query}`]}><Routes>
    <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
    <Route path="*" element={<Destination />} />
  </Routes></MemoryRouter></React.StrictMode>);
}
beforeEach(() => jest.clearAllMocks());
afterEach(() => window.history.replaceState(null, '', '/'));

test.each([
  ['student', false, '/userpage/dashboard'],
  ['librarian', false, '/librarianpage/dashboard'],
  ['admin', false, '/adminpage/librarians'],
  ['student', true, '/publicpage/onboarding'],
])('OAuth callback for %s (new=%s) navigates to %s without hash or authorization code', async (role, isNewUser, target) => {
  mockSocialLogin.mockResolvedValue({ role, isNewUser });
  view();
  expect(await screen.findByTestId('destination')).toHaveTextContent(target);
  expect(screen.getByTestId('destination')).not.toHaveTextContent('google-code');
  expect(mockSocialLogin).toHaveBeenCalledTimes(1);
  expect(mockSocialLogin).toHaveBeenCalledWith('google', 'google-code');
});

test('missing OAuth code shows an error without calling backend', async () => {
  view('');
  expect(await screen.findByText('Thiếu mã code từ Google')).toBeInTheDocument();
  expect(mockSocialLogin).not.toHaveBeenCalled();
});

test('callback failures keep the sign-in recovery action usable', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    mockSocialLogin.mockRejectedValue(new Error('Google login failed'));
    view();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Quay lại trang đăng nhập' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại trang đăng nhập' }));
    expect(await screen.findByTestId('destination')).toHaveTextContent('/publicpage/login');
  } finally { consoleError.mockRestore(); }
});
