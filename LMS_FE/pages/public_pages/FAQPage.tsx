import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { CirculationPolicy } from '../../api/adminService';
import circulationPolicyService from '../../api/circulationPolicyService';
import { useTranslation } from '../../contexts/LanguageContext';
const FAQItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string | React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-semibold text-gray-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="text-gray-400 flex-shrink-0" size={20} />
        ) : (
          <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 border-t border-gray-200 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQPage = () => {
  const { language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [policy, setPolicy] = useState<CirculationPolicy | null>(null);

  useEffect(() => {
    let mounted = true;
    circulationPolicyService
      .getPolicy()
      .then((response) => {
        if (mounted && response.code === 200) setPolicy(response.data);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const currentPolicy = {
    maxActiveBorrows: policy?.maxActiveBorrows ?? 5,
    maxActiveReservations: policy?.maxActiveReservations ?? 2,
    defaultLoanDays: policy?.defaultLoanDays ?? 14,
    pickupDeadlineHours: policy?.pickupDeadlineHours ?? 24,
    overdueFinePerDay: policy?.overdueFinePerDay ?? 1000,
    defaultDepositAmount: policy?.defaultDepositAmount ?? 0,
    blockBorrowWhenUnpaidFines: policy?.blockBorrowWhenUnpaidFines ?? true,
  };
  const fineText = new Intl.NumberFormat(
    language === 'en' ? 'en-US' : 'vi-VN'
  ).format(currentPolicy.overdueFinePerDay);
  const depositText = new Intl.NumberFormat(
    language === 'en' ? 'en-US' : 'vi-VN'
  ).format(currentPolicy.defaultDepositAmount);

  const faqs =
    language === 'en'
      ? [
          {
            category: 'Account and login',
            items: [
              {
                q: 'How do I create an account?',
                a: 'Open the Sign up page, enter your HCMUT email and required profile information, then verify your email before logging in.',
              },
              {
                q: 'I forgot my password. What should I do?',
                a: 'Use the Forgot password link on the login page. We will send a reset link to your HCMUT email address.',
              },
              {
                q: 'What is the difference between student and librarian accounts?',
                a: 'Students can search, borrow, reserve, and manage their personal library. Librarians can manage publications, copies, circulation, and system operations.',
              },
            ],
          },
          {
            category: 'Search and borrowing',
            items: [
              {
                q: 'How do I search for books?',
                a: 'Use the Search page to enter a title, author, ISBN, or keyword. You can also use AI semantic search by describing what you need in natural language.',
              },
              {
                q: 'How many books can I borrow at once?',
                a: `Currently, a student can have up to ${currentPolicy.maxActiveBorrows} active borrowed or pickup-waiting books. The default loan period is ${currentPolicy.defaultLoanDays} days.`,
              },
              {
                q: 'How do I know whether a book is available?',
                a: 'The book detail page shows available copies. If no copy is available, you can reserve the publication.',
              },
              {
                q: 'Can I renew a borrowed book?',
                a: 'Renewal depends on library rules and whether another reader has reserved the book. Check your My books page for current status.',
              },
            ],
          },
          {
            category: 'Reservations and notifications',
            items: [
              {
                q: 'How do I reserve a book?',
                a: 'When all copies are unavailable, use the Reserve action on the book detail page, choose a preferred branch, and confirm.',
              },
              {
                q: 'How long do I have to pick up a reserved book?',
                a: `Currently, the pickup window is ${currentPolicy.pickupDeadlineHours} hours after the book is ready. The exact deadline is also shown on your Reservations page and QR slip.`,
              },
              {
                q: 'How will I receive notifications?',
                a: 'Library74 shows notifications inside your account and may also send email updates for important events.',
              },
            ],
          },
          {
            category: 'Fines and rules',
            items: [
              {
                q: 'How are overdue fines calculated?',
                a: `Currently, overdue fines are ${fineText} VND per day for each overdue item. Users with unpaid fines ${currentPolicy.blockBorrowWhenUnpaidFines ? 'cannot create new borrow or reservation requests until the fine is settled' : 'may still create requests depending on librarian handling'}.`,
              },
              {
                q: 'How do I pay fines?',
                a: `Please pay fines at the library desk. The current borrow deposit is ${depositText} VND per book and is collected at pickup; on return it is offset against fines, then the library records any refund or extra amount due.`,
              },
              {
                q: 'What happens if I lose or damage a book?',
                a: 'Report the issue to the library immediately. Compensation or replacement may be required depending on the case.',
              },
            ],
          },
          {
            category: 'Digital materials',
            items: [
              {
                q: 'How do I access ebooks?',
                a: 'If a publication has a digital file, the book detail page will show the available online reading or download option.',
              },
              {
                q: 'Are ebooks free?',
                a: 'Digital materials provided by the library are available to eligible registered users according to library policy.',
              },
            ],
          },
          {
            category: 'Other questions',
            items: [
              {
                q: 'How do I contact the library?',
                a: 'Use the Contact page, call +84 88 676 5392, or email support@library74.uk.',
              },
              {
                q: 'Does the system support English search?',
                a: 'Yes. You can search in Vietnamese or English.',
              },
            ],
          },
        ]
      : [
          {
            category: 'Đăng ký và đăng nhập',
            items: [
              {
                q: 'Làm thế nào để đăng ký tài khoản?',
                a: 'Bạn có thể đăng ký tài khoản tại trang Đăng ký. Bạn cần cung cấp email hoặc mã sinh viên và tạo mật khẩu. Sau khi đăng ký, bạn sẽ nhận được email xác nhận.',
              },
              {
                q: 'Tôi quên mật khẩu, làm sao để lấy lại?',
                a: 'Tại trang Đăng nhập, nhấn vào liên kết "Quên mật khẩu?" và làm theo hướng dẫn. Bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu.',
              },
              {
                q: 'Sự khác biệt giữa tài khoản sinh viên và thủ thư là gì?',
                a: 'Tài khoản sinh viên cho phép bạn tìm kiếm, mượn sách, đặt trước, xem lịch sử mượn và phí phạt. Tài khoản thủ thư có quyền quản lý đầu sách, bản sao, xử lý mượn trả và ghi nhận nghiệp vụ tại quầy.',
              },
            ],
          },
          {
            category: 'Tìm kiếm và mượn sách',
            items: [
              {
                q: 'Làm thế nào để tìm sách?',
                a: 'Bạn có thể tìm sách tại trang Tìm kiếm bằng cách nhập tên sách, tác giả, hoặc từ khóa. Bạn cũng có thể sử dụng tìm kiếm thông minh với AI bằng cách mô tả nhu cầu của mình bằng ngôn ngữ tự nhiên.',
              },
              {
                q: 'Tôi có thể mượn bao nhiêu cuốn sách cùng lúc?',
                a: `Hiện tại, mỗi sinh viên có thể có tối đa ${currentPolicy.maxActiveBorrows} sách đang mượn hoặc đang chờ lấy. Thời gian mượn mặc định là ${currentPolicy.defaultLoanDays} ngày.`,
              },
              {
                q: 'Làm sao để biết sách có sẵn để mượn không?',
                a: 'Tại trang chi tiết sách, bạn sẽ thấy số lượng bản có sẵn. Nếu hiển thị "Có sẵn", bạn có thể mượn ngay. Nếu hiển thị "Đang được mượn", bạn có thể đặt trước.',
              },
              {
                q: 'Tôi có thể gia hạn thời gian mượn sách không?',
                a: 'Việc gia hạn phụ thuộc vào quy định vận hành của thư viện và tình trạng đặt trước của đầu sách. Hãy kiểm tra trạng thái tại trang "Sách của tôi" hoặc liên hệ thủ thư nếu cần hỗ trợ.',
              },
            ],
          },
          {
            category: 'Đặt trước và thông báo',
            items: [
              {
                q: 'Làm thế nào để đặt trước sách?',
                a: 'Khi sách đang được mượn, bạn sẽ thấy nút "Đặt trước". Nhấn vào nút này, chọn địa điểm nhận sách, và xác nhận. Bạn sẽ nhận thông báo khi sách có sẵn.',
              },
              {
                q: 'Tôi có bao nhiêu thời gian để nhận sách sau khi đặt trước?',
                a: `Hiện tại, sau khi sách sẵn sàng, bạn có ${currentPolicy.pickupDeadlineHours} giờ để đến thư viện nhận sách. Nếu quá thời hạn, yêu cầu có thể bị hệ thống tự động hủy.`,
              },
              {
                q: 'Làm sao để nhận thông báo về sách?',
                a: 'Hệ thống sẽ tự động gửi thông báo qua email và hiển thị trong trang "Thông báo" của bạn. Bạn có thể bật/tắt thông báo trong phần Cài đặt.',
              },
            ],
          },
          {
            category: 'Phí phạt và quy định',
            items: [
              {
                q: 'Phí phạt khi trả sách quá hạn là bao nhiêu?',
                a: `Hiện tại, phí phạt quá hạn là ${fineText} VND/ngày cho mỗi cuốn sách quá hạn. Phí được tính từ sau ngày đến hạn đến ngày trả sách thực tế.`,
              },
              {
                q: 'Làm thế nào để thanh toán phí phạt?',
                a: `Bạn có thể thanh toán phí phạt tại quầy thư viện khi trả sách. Tiền cọc hiện tại là ${depositText} VND/cuốn, được thu khi nhận sách; khi trả sách hệ thống cấn cọc vào phạt, sau đó ghi nhận số hoàn lại hoặc số cần đóng thêm.`,
              },
              {
                q: 'Điều gì xảy ra nếu tôi làm mất hoặc làm hỏng sách?',
                a: 'Nếu làm mất hoặc làm hỏng sách, bạn cần báo cáo ngay với thư viện. Bạn sẽ phải bồi thường theo giá trị sách hoặc mua sách mới để thay thế.',
              },
              {
                q: 'Tôi có thể mượn sách trong bao lâu?',
                a: `Hiện tại, thời gian mượn mặc định là ${currentPolicy.defaultLoanDays} ngày. Mỗi sinh viên có thể có tối đa ${currentPolicy.maxActiveBorrows} giao dịch mượn/chờ lấy đang hoạt động và tối đa ${currentPolicy.maxActiveReservations} yêu cầu đặt trước đang hoạt động.`,
              },
            ],
          },
          {
            category: 'Tài liệu số và ebook',
            items: [
              {
                q: 'Làm thế nào để truy cập ebook?',
                a: 'Tại trang chi tiết sách, nếu có phiên bản ebook, bạn sẽ thấy nút "Đọc online" hoặc "Tải về". Nhấn vào để đọc trực tuyến hoặc tải về thiết bị của bạn.',
              },
              {
                q: 'Tôi có thể tải bao nhiêu ebook?',
                a: 'Nếu tài liệu số được thư viện cung cấp, quyền đọc/tải sẽ phụ thuộc vào giấy phép nội dung và chính sách truy cập của từng tài liệu.',
              },
              {
                q: 'Ebook có miễn phí không?',
                a: 'Tài liệu số do thư viện cung cấp được truy cập theo chính sách của thư viện và giấy phép nội dung tương ứng.',
              },
            ],
          },
          {
            category: 'Khác',
            items: [
              {
                q: 'Làm thế nào để liên hệ với thư viện?',
                a: 'Bạn có thể liên hệ qua trang Liên hệ, gọi điện đến số +84 88 676 5392, hoặc gửi email đến support@library74.uk. Thư viện mở cửa từ 8:00 - 20:00 các ngày trong tuần.',
              },
              {
                q: 'Tôi có thể đề xuất sách mới không?',
                a: 'Bạn có thể liên hệ trực tiếp với thư viện để đề xuất bổ sung tài liệu. Các yêu cầu nghiệp vụ trong hệ thống sẽ do thủ thư xử lý.',
              },
              {
                q: 'Hệ thống có hỗ trợ tìm kiếm bằng tiếng Anh không?',
                a: 'Có, hệ thống hỗ trợ tìm kiếm bằng cả tiếng Việt và tiếng Anh. Bạn có thể nhập từ khóa bằng bất kỳ ngôn ngữ nào.',
              },
            ],
          },
        ];

  const filteredFAQs = faqs
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (typeof item.a === 'string' &&
            item.a.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <HelpCircle size={48} className="mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {language === 'en'
                ? 'Frequently asked questions'
                : 'Câu hỏi thường gặp'}
            </h1>
            <p className="text-xl text-blue-100">
              {language === 'en'
                ? 'Find answers to common questions about Library74'
                : 'Tìm câu trả lời cho những thắc mắc phổ biến về Library74'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder={
                language === 'en'
                  ? 'Search questions...'
                  : 'Tìm kiếm câu hỏi...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {language === 'en'
                ? 'No questions match your search.'
                : 'Không tìm thấy câu hỏi nào phù hợp với từ khóa của bạn.'}
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-blue-600 hover:underline"
            >
              {language === 'en' ? 'Clear filter' : 'Xóa bộ lọc'}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredFAQs.map((category, idx) => (
              <div key={idx}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.items.map((item, itemIdx) => (
                    <React.Fragment key={itemIdx}>
                      <FAQItem question={item.q} answer={item.a} />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {language === 'en'
              ? 'Still need help?'
              : 'Vẫn chưa tìm thấy câu trả lời?'}
          </h3>
          <p className="text-gray-600 mb-6">
            {language === 'en'
              ? 'Contact us for direct support'
              : 'Liên hệ với chúng tôi để được hỗ trợ trực tiếp'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+84886765392"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {language === 'en' ? 'Call now' : 'Gọi ngay'}: +84 88 676 5392
            </a>
            <a
              href="/publicpage/contact"
              className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              {language === 'en' ? 'Send message' : 'Gửi tin nhắn'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
