import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '../../contexts/LanguageContext';
import ContactPage from '../../pages/public_pages/ContactPage';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const renderPage = () =>
  render(
    <LanguageProvider>
      <ContactPage />
    </LanguageProvider>
  );

describe('ContactPage', () => {
  it('renders contact channels and Google Maps iframe', () => {
    renderPage();

    expect(
      screen.getByRole('link', { name: '+84 88 676 5392' })
    ).toHaveAttribute('href', 'tel:+84886765392');
    expect(
      screen.getByRole('link', { name: 'support@library74.uk' })
    ).toHaveAttribute('href', 'mailto:support@library74.uk');
    expect(
      screen.getByTitle('Bản đồ Trường Đại học Bách khoa TP.HCM')
    ).toHaveAttribute('loading', 'lazy');
  });

  it('directs visitors to sign in before opening a ticket', () => {
    renderPage();

    expect(screen.queryByLabelText('Email *')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Đăng nhập để mở phiếu hỗ trợ/ })
    ).toHaveAttribute('href', '/publicpage/login');
    expect(
      screen.getByText(/mọi yêu cầu hỗ trợ được mở bằng tài khoản Library74/)
    ).toBeInTheDocument();
  });
});
