import {
  Bell,
  Book,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
  Search,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';

const GuideSection = ({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
}: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="text-blue-600" size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="text-gray-400" size={20} />
        ) : (
          <ChevronDown className="text-gray-400" size={20} />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 border-t border-gray-200">{children}</div>
      )}
    </div>
  );
};

const UserGuidePage = () => {
  const { language } = useTranslation();
  if (language === 'en') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">User Guide</h1>
            <p className="text-xl text-blue-100 max-w-3xl">Learn how to use Library74 effectively.</p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-4">
            <GuideSection icon={User} title="Start with your account" defaultOpen>
              <p className="text-gray-600">Create an account, verify your email, and complete your profile so the library can identify your borrowing and reservation records.</p>
            </GuideSection>
            <GuideSection icon={Search} title="Search and discover books">
              <p className="text-gray-600">Search by title, author, ISBN, keyword, or natural language. Use filters to narrow results by category, campus, year, and availability.</p>
            </GuideSection>
            <GuideSection icon={Book} title="Borrow and pick up books">
              <p className="text-gray-600">Choose an available copy from the book detail page, submit a borrowing request, then show the QR slip to the librarian before the pickup deadline.</p>
            </GuideSection>
            <GuideSection icon={Clock} title="Manage due dates and fines">
              <p className="text-gray-600">Open My books to track waiting, borrowed, returned, and cancelled books. Check the fines block for any transactions with unpaid fines.</p>
            </GuideSection>
            <GuideSection icon={Bell} title="Reservations and notifications">
              <p className="text-gray-600">Reserve unavailable books, monitor your queue position, and watch notifications for books ready for pickup.</p>
            </GuideSection>
            <GuideSection icon={Heart} title="Wishlist">
              <p className="text-gray-600">Save books to your wishlist and remove individual items or clear the list when it is no longer needed.</p>
            </GuideSection>
          </div>
          <div className="mt-12 bg-blue-50 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Need help?</h3>
            <p className="text-gray-600 mb-6">Contact the library team for direct support.</p>
            <Link to="/publicpage/contact" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Contact us</Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Hướng dẫn sử dụng
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Tìm hiểu cách sử dụng Library74 một cách hiệu quả nhất
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-4">
          <GuideSection
            icon={User}
            title="Bắt đầu với tài khoản"
            defaultOpen={true}
          >
            <div className="space-y-4 text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  1. Đăng ký tài khoản
                </h4>
                <p className="mb-2">
                  Truy cập trang{' '}
                  <Link
                    to="/publicpage/register"
                    className="text-blue-600 hover:underline"
                  >
                    Đăng ký
                  </Link>{' '}
                  và điền thông tin:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Email hoặc mã sinh viên</li>
                  <li>Mật khẩu (tối thiểu 8 ký tự)</li>
                  <li>Xác nhận mật khẩu</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  2. Đăng nhập
                </h4>
                <p>
                  Sau khi đăng ký, bạn có thể đăng nhập tại trang{' '}
                  <Link
                    to="/publicpage/login"
                    className="text-blue-600 hover:underline"
                  >
                    Đăng nhập
                  </Link>
                  .
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Lưu ý: Tài khoản thủ thư do quản trị viên cấp và quản lý,
                  không dùng chung tài khoản với sinh viên.
                </p>
              </div>
            </div>
          </GuideSection>

          <GuideSection icon={Search} title="Tìm kiếm sách">
            <div className="space-y-4 text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Tìm kiếm cơ bản
                </h4>
                <p className="mb-2">
                  Tại trang{' '}
                  <Link
                    to="/publicpage/search"
                    className="text-blue-600 hover:underline"
                  >
                    Tìm kiếm
                  </Link>
                  , bạn có thể:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nhập tên sách, tác giả, hoặc từ khóa</li>
                  <li>Sử dụng bộ lọc theo danh mục, năm xuất bản</li>
                  <li>Xem kết quả với thông tin chi tiết về sách</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Tìm kiếm thông minh với AI
                </h4>
                <p>Bạn có thể mô tả nhu cầu bằng ngôn ngữ tự nhiên, ví dụ:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>"Sách về machine learning cho người mới bắt đầu"</li>
                  <li>"Tài liệu học Python nâng cao"</li>
                  <li>"Sách văn học Việt Nam hiện đại"</li>
                </ul>
                <p className="mt-2">
                  AI sẽ hiểu ý định và đưa ra kết quả phù hợp nhất.
                </p>
              </div>
            </div>
          </GuideSection>

          <GuideSection icon={Book} title="Mượn và trả sách">
            <div className="space-y-4 text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Mượn sách</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Tìm sách bạn muốn mượn</li>
                  <li>Kiểm tra số lượng bản có sẵn</li>
                  <li>
                    Nhấn nút "Mượn sách" hoặc "Đặt trước" nếu sách đang được
                    mượn
                  </li>
                  <li>
                    Đến thư viện để nhận sách (nếu đặt trước, bạn sẽ nhận thông
                    báo khi sách có sẵn)
                  </li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Trả sách</h4>
                <p>
                  Trả sách tại quầy thư viện. Hệ thống sẽ tự động cập nhật trạng
                  thái.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Gia hạn mượn
                </h4>
                <p>
                  Bạn có thể gia hạn thời gian mượn sách từ trang "Sách đang
                  mượn" nếu chưa quá hạn và không có người khác đặt trước.
                </p>
              </div>
            </div>
          </GuideSection>

          <GuideSection icon={Clock} title="Đặt trước sách">
            <div className="space-y-4 text-gray-600">
              <p>
                Khi sách bạn muốn mượn đang được người khác mượn, bạn có thể đặt
                trước:
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Nhấn nút "Đặt trước" trên trang chi tiết sách</li>
                <li>Chọn địa điểm nhận sách</li>
                <li>Hệ thống sẽ thông báo khi sách có sẵn</li>
                <li>
                  Bạn cần đến thư viện nhận sách trong thời hạn hiển thị trên
                  phiếu QR hoặc trang đặt trước của mình.
                </li>
              </ol>
              <p className="text-sm text-gray-500 mt-2">
                Lưu ý: Nếu không đến nhận trong thời hạn, đặt trước sẽ bị hủy.
              </p>
            </div>
          </GuideSection>

          <GuideSection icon={Heart} title="Danh sách yêu thích">
            <div className="space-y-4 text-gray-600">
              <p>
                Lưu lại những cuốn sách bạn quan tâm vào danh sách yêu thích:
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Tại trang chi tiết sách, nhấn nút "Thêm vào yêu thích"</li>
                <li>
                  Xem danh sách yêu thích tại trang "Yêu thích" trong menu
                </li>
                <li>
                  Nhận thông báo khi sách trong danh sách yêu thích có sẵn để
                  mượn
                </li>
              </ol>
            </div>
          </GuideSection>

          <GuideSection icon={Bell} title="Thông báo">
            <div className="space-y-4 text-gray-600">
              <p>Hệ thống sẽ gửi thông báo về:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Sách đặt trước đã có sẵn</li>
                <li>Nhắc nhở hạn trả sách theo lịch thông báo của hệ thống</li>
                <li>Cảnh báo sách quá hạn</li>
                <li>Sách mới phù hợp với sở thích của bạn</li>
                <li>Cập nhật về phí phạt (nếu có)</li>
              </ul>
              <p className="mt-2">
                Bạn có thể xem tất cả thông báo tại trang "Thông báo" trong
                menu.
              </p>
            </div>
          </GuideSection>

          <GuideSection icon={BookOpen} title="Quản lý tài khoản">
            <div className="space-y-4 text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Xem thông tin cá nhân
                </h4>
                <p>Truy cập trang "Thông tin cá nhân" để xem và cập nhật:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Thông tin liên hệ</li>
                  <li>Lịch sử mượn sách</li>
                  <li>Thống kê hoạt động</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Theo dõi phí phạt
                </h4>
                <p>
                  Xem chi tiết phí phạt (nếu có) tại trang "Phí phạt" và thanh
                  toán tại quầy thư viện.
                </p>
              </div>
            </div>
          </GuideSection>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Cần hỗ trợ thêm?
          </h3>
          <p className="text-gray-600 mb-6">
            Nếu bạn có thắc mắc hoặc gặp vấn đề khi sử dụng, vui lòng liên hệ
            với chúng tôi
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/publicpage/contact"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Liên hệ hỗ trợ
            </Link>
            <Link
              to="/publicpage/faq"
              className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Xem câu hỏi thường gặp
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuidePage;
