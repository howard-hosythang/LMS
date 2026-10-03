import type { Language } from '../contexts/LanguageContext';

const MESSAGES = {
  vi: {
    default: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
    network: 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối mạng.',
    emailExists: 'Email đã được sử dụng.',
    userExists: 'Tài khoản đã tồn tại.',
    invalidEmail: 'Email phải là địa chỉ Gmail hợp lệ.',
    duplicateReview: 'Giao dịch mượn này đã được đánh giá.',
    isbnExists: 'ISBN đã được sử dụng cho một ấn phẩm khác.',
    reviewRequiresBorrow: 'Bạn cần có giao dịch mượn đã trả còn hiệu lực để viết đánh giá.',
    reviewWindowExpired: 'Thời hạn đánh giá đã hết. Đánh giá cần được gửi trong vòng 7 ngày kể từ ngày trả sách.',
    reviewEditExpired: 'Thời hạn chỉnh sửa đánh giá đã hết.',
    borrowLimit: 'Bạn đã đạt giới hạn mượn sách tối đa. Vui lòng trả bớt sách trước khi mượn thêm.',
    pickupExpired: 'Đã hết hạn nhận sách. Vui lòng tạo yêu cầu mượn hoặc đặt trước mới.',
    loginRequired: 'Bạn cần đăng nhập để thực hiện chức năng này.',
    forbidden: 'Bạn không có quyền thực hiện thao tác này.',
  },
  en: {
    default: 'Something went wrong. Please try again.',
    network: 'Unable to connect to the server. Please check your network connection.',
    emailExists: 'This email is already registered.',
    userExists: 'This account already exists.',
    invalidEmail: 'Invalid email format. Please use a valid Gmail address.',
    duplicateReview: 'This loan transaction has already been reviewed.',
    isbnExists: 'This ISBN is already used by another publication.',
    reviewRequiresBorrow: 'An eligible returned loan transaction is required before writing a review.',
    reviewWindowExpired: 'The review period has expired. Reviews must be submitted within 7 days after return.',
    reviewEditExpired: 'The review edit period has expired.',
    borrowLimit: 'You have reached the maximum borrowing limit. Please return some books before borrowing more.',
    pickupExpired: 'The pickup deadline has expired. Please create a new borrowing request or reservation.',
    loginRequired: 'Please log in to continue.',
    forbidden: 'You do not have permission to perform this action.',
  },
};

export const getFriendlyErrorMessage = (error: any, language: Language = 'vi') => {
  const dictionary = MESSAGES[language];
  const raw = String(
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    ''
  );
  const normalized = raw.toLowerCase();
  const status = error?.status || error?.response?.status;
  const code = Number(error?.data?.code || error?.response?.data?.code || error?.code);

  if (!raw && !status) return dictionary.default;
  if (code === 1101) return dictionary.userExists;
  if (code === 1103) return dictionary.emailExists;
  if (code === 1105) return dictionary.invalidEmail;
  if (code === 2700) return dictionary.duplicateReview;
  if (code === 2002) return dictionary.isbnExists;
  if (code === 2701) return dictionary.reviewRequiresBorrow;
  if (code === 2702) return dictionary.reviewWindowExpired;
  if (code === 2703) return dictionary.reviewEditExpired;
  if (code === 3002) return dictionary.borrowLimit;
  if (code === 3023) return dictionary.pickupExpired;
  if (status === 401) return dictionary.loginRequired;
  if (status === 403) return dictionary.forbidden;
  if (normalized.includes('network') || normalized.includes('không kết nối')) return dictionary.network;

  if (
    normalized.includes('email already exists') ||
    normalized.includes('email đã được sử dụng')
  ) {
    return dictionary.emailExists;
  }

  if (
    normalized.includes('user already exists') ||
    normalized.includes('người dùng đã tồn tại')
  ) {
    return dictionary.userExists;
  }

  if (
    normalized.includes('isbn already exists') ||
    normalized.includes('isbn đã được sử dụng')
  ) {
    return dictionary.isbnExists;
  }

  if (
    normalized.includes('uk_user_publication') ||
    normalized.includes('already reviewed') ||
    normalized.includes('already has a rating') ||
    normalized.includes('đã đánh giá')
  ) {
    return dictionary.duplicateReview;
  }

  if (
    normalized.includes('verified_borrow') ||
    normalized.includes('must borrow') ||
    normalized.includes('borrow before') ||
    normalized.includes('chưa mượn') ||
    normalized.includes('cần mượn')
  ) {
    return dictionary.reviewRequiresBorrow;
  }

  if (
    normalized.includes('maximum borrow') ||
    normalized.includes('borrow limit') ||
    normalized.includes('giới hạn mượn')
  ) {
    return dictionary.borrowLimit;
  }

  if (
    normalized.includes('could not execute statement') ||
    normalized.includes('constraint') ||
    normalized.includes('sql ') ||
    normalized.includes('insert into') ||
    normalized.includes('org.hibernate')
  ) {
    return dictionary.default;
  }

  return raw || dictionary.default;
};
