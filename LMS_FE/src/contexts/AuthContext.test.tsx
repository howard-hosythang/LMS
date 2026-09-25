import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import authService from '../../api/authService';

jest.mock('../../api/authService', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    logout: jest.fn(),
    socialLoginCallback: jest.fn(),
  },
}));

const makeToken = (payload: Record<string, unknown>) => {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `header.${encodedPayload}.signature`;
};

const AuthProbe = () => {
  const { userType, login, logout, socialLogin } = useAuth();
  return (
    <div>
      <span data-testid="user-type">{userType ?? 'none'}</span>
      <button onClick={() => login('student')}>Manual student</button>
      <button onClick={() => login('email@hcmut.edu.vn', 'secret')}>Password login</button>
      <button onClick={() => socialLogin('google', 'code')}>Social login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('loads the saved user type from localStorage', () => {
    localStorage.setItem('userType', 'librarian');

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    expect(screen.getByTestId('user-type')).toHaveTextContent('librarian');
  });

  it('supports manual role login for local/demo flows', async () => {
    render(<AuthProvider><AuthProbe /></AuthProvider>);

    fireEvent.click(screen.getByText('Manual student'));

    expect(await screen.findByTestId('user-type')).toHaveTextContent('student');
    expect(localStorage.getItem('userType')).toBe('student');
  });

  it('parses a librarian token after password login and stores tokens', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      data: {
        accessToken: makeToken({ scope: 'ROLE_LIBRARIAN' }),
        refreshToken: 'refresh-token',
      },
    });

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    fireEvent.click(screen.getByText('Password login'));

    await waitFor(() => expect(screen.getByTestId('user-type')).toHaveTextContent('librarian'));
    expect(localStorage.getItem('accessToken')).toContain('header.');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
    expect(localStorage.getItem('userType')).toBe('librarian');
  });

  it('returns social login metadata and stores student role', async () => {
    (authService.socialLoginCallback as jest.Mock).mockResolvedValue({
      data: {
        accessToken: makeToken({ scope: 'ROLE_STUDENT' }),
        refreshToken: 'social-refresh',
        isNewUser: true,
      },
    });

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    fireEvent.click(screen.getByText('Social login'));

    await waitFor(() => expect(screen.getByTestId('user-type')).toHaveTextContent('student'));
    expect(authService.socialLoginCallback).toHaveBeenCalledWith('google', 'code');
    expect(localStorage.getItem('refreshToken')).toBe('social-refresh');
  });

  it('clears role and tokens on logout after notifying backend', async () => {
    localStorage.setItem('userType', 'student');
    localStorage.setItem('accessToken', 'access');
    localStorage.setItem('refreshToken', 'refresh');
    (authService.logout as jest.Mock).mockResolvedValue({});

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => expect(screen.getByTestId('user-type')).toHaveTextContent('none'));
    expect(authService.logout).toHaveBeenCalledWith('refresh');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('userType')).toBeNull();
  });
});
