import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

const OAuth2CallbackPage = () => {
  const { language, t } = useTranslation();
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    // Authorization codes are single-use, including during StrictMode effect replay.
    if (started.current) return;
    started.current = true;
    // Google redirects to /oauth2/callback with the authorization code in the query string.
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');

    if (!code) {
      setError(t('oauth.missingCode', 'Thiếu mã code từ Google'));
      return;
    }

    const performLogin = async () => {
      try {
        const { role, isNewUser } = await socialLogin('google', code);
        
        if (isNewUser) {
          navigate('/publicpage/onboarding', { replace: true });
        } else if (role === 'librarian') {
          navigate('/librarianpage/dashboard', { replace: true });
        } else if (role === 'admin') {
          navigate('/adminpage/librarians', { replace: true });
        } else {
          navigate('/userpage/dashboard', { replace: true });
        }
      } catch (err: any) {
        console.error('Social login error:', err);
        setError(getFriendlyErrorMessage(err, language));
      }
    };

    performLogin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{t('oauth.failedTitle', 'Đăng nhập thất bại')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/publicpage/login', { replace: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            {t('oauth.backToLogin', 'Quay lại trang đăng nhập')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">{t('oauth.processingTitle', 'Đang xử lý đăng nhập Google...')}</h2>
        <p className="text-gray-500 mt-2">{t('oauth.processingDesc', 'Vui lòng chờ trong giây lát')}</p>
      </div>
    </div>
  );
};

export default OAuth2CallbackPage;
