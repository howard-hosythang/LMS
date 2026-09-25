import { Cookie, Eye, Settings, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import {
  enableAnalyticsIfConsented,
  getCookieConsent,
  hasAnalyticsConfigured,
  setCookieConsent,
} from '../../utils/analyticsConsent';

const CookiePolicyPage = () => {
  const { language } = useTranslation();
  const [consent, setConsent] = useState(() => getCookieConsent());

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail === 'accepted' || detail === 'rejected') setConsent(detail);
    };
    window.addEventListener('library74-cookie-consent-changed', handler);
    return () =>
      window.removeEventListener('library74-cookie-consent-changed', handler);
  }, []);

  const updateConsent = (value: 'accepted' | 'rejected') => {
    setCookieConsent(value);
    setConsent(value);
    if (value === 'accepted') enableAnalyticsIfConsented();
  };

  const ConsentControls = () => (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
      <h3 className="text-base font-bold text-gray-900">
        {language === 'en' ? 'Analytics preference' : 'Tùy chọn analytics'}
      </h3>
      {!hasAnalyticsConfigured() && (
        <p className="mt-2 text-sm leading-6 text-gray-600">
          {language === 'en'
            ? 'Analytics is not configured in the current deployment, so no analytics script is loaded by Library74.'
            : 'Bản triển khai hiện tại chưa cấu hình analytics, nên Library74 không tải script analytics.'}
        </p>
      )}
      <p className="mt-2 text-sm leading-6 text-gray-600">
        {language === 'en'
          ? 'Required browser storage remains enabled. Analytics cookies and similar tracking only run after opt-in and can be disabled here at any time.'
          : 'Bộ nhớ trình duyệt cần thiết luôn bật. Cookie analytics và cơ chế theo dõi tương tự chỉ chạy sau khi bạn đồng ý và có thể tắt tại đây bất cứ lúc nào.'}
      </p>
      <p className="mt-2 text-sm font-semibold text-gray-800">
        {language === 'en' ? 'Current choice: ' : 'Lựa chọn hiện tại: '}
        <span className="text-blue-700">
          {consent === 'accepted'
            ? language === 'en'
              ? 'Analytics accepted'
              : 'Đã đồng ý analytics'
            : consent === 'rejected'
              ? language === 'en'
                ? 'Analytics rejected'
                : 'Đã từ chối analytics'
              : language === 'en'
                ? 'No choice yet'
                : 'Chưa chọn'}
        </span>
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => updateConsent('accepted')}
          disabled={!hasAnalyticsConfigured()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {language === 'en' ? 'Accept analytics' : 'Đồng ý analytics'}
        </button>
        <button
          type="button"
          onClick={() => updateConsent('rejected')}
          disabled={!hasAnalyticsConfigured()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          {language === 'en' ? 'Reject analytics' : 'Từ chối analytics'}
        </button>
      </div>
    </div>
  );

  if (language === 'en') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <Cookie size={48} />
              <h1 className="text-4xl md:text-5xl font-bold">Cookie Policy</h1>
            </div>
            <p className="text-xl text-blue-100">
              How Library74 uses cookies, browser storage and similar
              technologies
            </p>
            <p className="text-sm text-blue-200 mt-2">
              Last updated: 24/05/2026
            </p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Cookies and similar technologies
              </h2>
              <p>
                Cookies are small files stored on your device. Similar
                technologies include browser storage such as LocalStorage. In
                the current Library74 app, login and preferences are stored
                mainly in LocalStorage, not in first-party login cookies.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. How we use browser storage
              </h2>
              <p>
                Required browser storage keeps login tokens, account type,
                language/theme preferences and display choices so the service
                works correctly. Login tokens are sent to the backend in request
                headers, not automatically as cookies. Analytics is optional and
                remains disabled unless you actively accept it.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Analytics cookies
              </h2>
              <p>
                If you accept analytics, Library74 may load Google Analytics.
                Google Analytics may set its own cookies or use similar
                identifiers according to Google's terms. If you reject
                analytics, Library74 does not load the Google Analytics script.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Your choices
              </h2>
              <p className="mb-4">
                You can control cookies and site data in your browser settings,
                but disabling required storage may affect login, borrowing and
                account features. You can accept or reject analytics below.
              </p>
              <ConsentControls />
            </section>
            <section className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <p className="text-gray-700 leading-relaxed">
                <strong>
                  By continuing to use Library74, you understand that required
                  browser storage is used to provide the service. Analytics
                  cookies and similar tracking are only enabled when you
                  actively choose to accept analytics.
                </strong>
              </p>
            </section>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Cookie size={48} />
            <h1 className="text-4xl md:text-5xl font-bold">
              Chính sách Cookie
            </h1>
          </div>
          <p className="text-xl text-blue-100">
            Thông tin về cách chúng tôi sử dụng cookie, bộ nhớ trình duyệt và
            công nghệ tương tự
          </p>
          <p className="text-sm text-blue-200 mt-2">
            Cập nhật lần cuối: 24/05/2026
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              Library74 chủ yếu sử dụng bộ nhớ trình duyệt như LocalStorage để
              duy trì đăng nhập, ghi nhớ ngôn ngữ/giao diện và giúp hệ thống
              hoạt động ổn định. Ứng dụng hiện không dùng cookie đăng nhập do
              Library74 tự đặt; cookie analytics của bên thứ ba chỉ được dùng
              nếu bạn chủ động đồng ý.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">
                1. Cookie là gì?
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn
              khi bạn truy cập một trang web. Các công nghệ tương tự bao gồm
              LocalStorage, SessionStorage và các cơ chế lưu/đọc thông tin khác
              trên trình duyệt. Vì vậy chính sách này dùng từ "cookie và công
              nghệ tương tự" để bao quát cả bộ nhớ trình duyệt.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Các loại cookie và bộ nhớ trình duyệt chúng tôi sử dụng
            </h2>
            <div className="space-y-6 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Settings className="text-blue-600" size={20} />
                  2.1. Bộ nhớ trình duyệt cần thiết
                </h3>
                <p className="mb-2">
                  Các dữ liệu này cần thiết để trang web hoạt động đúng:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Token đăng nhập và thông tin phiên cần thiết cho tài khoản
                  </li>
                  <li>Tùy chọn ngôn ngữ và giao diện</li>
                  <li>Dữ liệu tạm thời giúp màn hình hoạt động ổn định</li>
                </ul>
                <p className="mt-2 text-sm text-gray-500">
                  Đây là dữ liệu cần thiết để cung cấp chức năng bạn yêu cầu.
                  Nếu xóa hoặc chặn, đăng nhập và một số chức năng tài khoản có
                  thể không hoạt động đúng.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Eye className="text-purple-600" size={20} />
                  2.2. Cookie phân tích
                </h3>
                <p className="mb-2">
                  Nếu bạn đồng ý, Library74 có thể tải Google Analytics để hiểu
                  cách người dùng tương tác với trang web:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Số lượt truy cập và trang được xem</li>
                  <li>Thời gian dành cho trang web</li>
                  <li>Lỗi và vấn đề kỹ thuật</li>
                  <li>Nguồn truy cập (từ đâu người dùng đến)</li>
                </ul>
                <p className="mt-2 text-sm text-gray-500">
                  Analytics không được tải trước khi bạn đồng ý. Khi được bật,
                  Google Analytics có thể đặt cookie hoặc dùng định danh tương
                  tự theo chính sách của Google.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Shield className="text-green-600" size={20} />
                  2.3. Bộ nhớ chức năng
                </h3>
                <p className="mb-2">
                  Cho phép trang web ghi nhớ lựa chọn hiển thị và thao tác gần
                  đây:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Ghi nhớ tùy chọn tìm kiếm</li>
                  <li>Ghi nhớ cài đặt hiển thị (grid/list view)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Cookie của bên thứ ba
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Hệ thống không phụ thuộc vào cookie quảng cáo. Library74 chỉ tải
                Google Analytics sau khi bạn đồng ý analytics. Dịch vụ bên thứ
                ba như Google Analytics hoặc OAuth/đăng nhập ngoài có thể dùng
                cơ chế lưu trữ riêng theo chính sách của họ.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>OAuth/đăng nhập ngoài:</strong> Chỉ dùng khi bạn chọn
                  phương thức đăng nhập tương ứng
                </li>
                <li>
                  <strong>CDN hoặc dịch vụ tài nguyên:</strong> Có thể dùng để
                  tải nội dung nhanh hơn nếu được cấu hình
                </li>
                <li>
                  <strong>Google Analytics:</strong> Chỉ được tải sau khi bạn
                  bấm đồng ý analytics
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Quản lý cookie
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Bạn có thể kiểm soát và quản lý cookie, LocalStorage và dữ liệu
                trang web theo nhiều cách:
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  4.1. Cài đặt trình duyệt
                </h3>
                <p className="mb-2">Hầu hết trình duyệt cho phép bạn:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Xem cookie và dữ liệu trang web đã được lưu trữ</li>
                  <li>Xóa cookie hoặc dữ liệu trang web cụ thể</li>
                  <li>Chặn cookie từ các trang web cụ thể</li>
                  <li>Xóa dữ liệu trang web khi đóng trình duyệt</li>
                </ul>
                <p className="mt-2 text-sm text-gray-500">
                  Lưu ý: Xóa hoặc chặn dữ liệu trang web cần thiết có thể ảnh
                  hưởng đến chức năng đăng nhập và tài khoản.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  4.2. Cài đặt trên trang web
                </h3>
                <p className="mb-4">
                  Các dữ liệu cần thiết được trình duyệt lưu để phục vụ đăng
                  nhập và cài đặt cá nhân. Analytics chỉ được bật khi bạn đồng
                  ý, và lựa chọn đó được ghi nhận bằng khóa
                  <span className="mx-1 font-mono text-xs">
                    library74.cookieConsent.v1
                  </span>
                  trong LocalStorage.
                </p>
                <ConsentControls />
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Dữ liệu lưu trên trình duyệt chúng tôi sử dụng cụ thể
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Cơ chế / tên lưu trữ
                    </th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Mục đích
                    </th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Thời hạn
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-600">
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-mono text-xs">
                      accessToken / refreshToken
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      LocalStorage. Duy trì phiên đăng nhập và xác thực API.
                      Token được gửi sang backend bằng header Authorization hoặc
                      re-token, không tự động gửi như cookie.
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      Theo thời hạn token của hệ thống
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-mono text-xs">
                      library74.language / library74.theme
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      Lưu ngôn ngữ và giao diện người dùng
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      Đến khi người dùng thay đổi hoặc xoá dữ liệu trình duyệt
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-mono text-xs">
                      userType
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      Xác định loại tài khoản để điều hướng đúng dashboard
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      Theo phiên đăng nhập
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-mono text-xs">
                      library74.cookieConsent.v1
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      LocalStorage. Ghi nhớ lựa chọn đồng ý hoặc từ chối
                      analytics
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      Đến khi người dùng thay đổi hoặc xoá dữ liệu trình duyệt
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-mono text-xs">
                      Search view mode và trạng thái UI
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      LocalStorage. Giữ trạng thái màn hình, bộ lọc hoặc lựa
                      chọn hiển thị
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      Ngắn hạn hoặc đến khi xoá dữ liệu trình duyệt
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Công nghệ tương tự
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Phiên bản hiện tại chủ yếu dùng LocalStorage. Chúng tôi không
                thấy ứng dụng tự đặt cookie đăng nhập, SessionStorage hay Web
                Beacon riêng trong mã nguồn hiện tại.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>LocalStorage:</strong> Lưu token đăng nhập, loại tài
                  khoản, ngôn ngữ, giao diện, lựa chọn analytics và một số trạng
                  thái giao diện.
                </li>
                <li>
                  <strong>Cookie analytics của bên thứ ba:</strong> Chỉ có thể
                  xuất hiện sau khi bạn đồng ý analytics và Google Analytics
                  được tải.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Thay đổi chính sách
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi có thể cập nhật chính sách cookie này theo thời gian để
              phản ánh các thay đổi trong cách chúng tôi sử dụng cookie hoặc vì
              lý do pháp lý, vận hành hoặc quy định. Vui lòng xem lại trang này
              định kỳ để cập nhật.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Liên hệ
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nếu bạn có câu hỏi về chính sách cookie, vui lòng liên hệ:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>
                Email:{' '}
                <a
                  href="mailto:support@library74.uk"
                  className="text-blue-600 hover:underline"
                >
                  support@library74.uk
                </a>
              </li>
              <li>
                Điện thoại:{' '}
                <a
                  href="tel:+84886765392"
                  className="text-blue-600 hover:underline"
                >
                  +84 88 676 5392
                </a>
              </li>
              <li>
                Địa chỉ: Trường Đại học Bách khoa - ĐHQG TP.HCM, 268 Lý Thường
                Kiệt, Phường 14, Quận 10, TPHCM
              </li>
            </ul>
          </section>

          {/* Agreement */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <p className="text-gray-700 leading-relaxed">
              <strong>
                Bằng việc tiếp tục sử dụng Library74, bạn hiểu rằng bộ nhớ trình
                duyệt cần thiết được dùng để cung cấp dịch vụ. Cookie analytics
                và cơ chế theo dõi tương tự chỉ được bật khi bạn chủ động lựa
                chọn đồng ý.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;
