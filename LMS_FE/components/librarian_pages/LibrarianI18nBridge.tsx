import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const VI_TO_EN: Record<string, string> = {
  'Đang tải dữ liệu...': 'Loading data...',
  'Đang tải...': 'Loading...',
  'Đang lưu...': 'Saving...',
  'Đang tạo...': 'Creating...',
  'Đang xóa...': 'Deleting...',
  'Đang xoá...': 'Deleting...',
  'Lưu': 'Save',
  'Hủy': 'Cancel',
  'Huỷ': 'Cancel',
  'Xóa': 'Delete',
  'Xoá': 'Delete',
  'Sửa': 'Edit',
  'Ghi chú': 'Note',
  'Làm mới': 'Refresh',
  'Áp dụng': 'Apply',
  'Lọc': 'Filter',
  'Xóa lọc': 'Clear filters',
  'Xóa bộ lọc': 'Clear filters',
  'Tất cả': 'All',
  'Tất cả năm': 'All years',
  'Nhập năm': 'Custom year',
  'Tất cả chủ đề': 'All topics',
  'Chọn chủ đề...': 'Select a topic...',
  'Tìm kiếm': 'Search',
  'Tìm Kiếm': 'Search',
  'Chủ đề': 'Topic',
  'Năm xuất bản': 'Publication year',
  'Có bản sao': 'Has copies',
  'Chưa có bản sao': 'No copies yet',
  'Thao tác': 'Actions',
  'Hành động': 'Actions',
  'Trạng thái': 'Status',
  'Tình trạng': 'Condition',
  'Tình trạng máy': 'Condition',
  'Vị trí': 'Location',
  'Vị trí thư viện (Cơ sở)': 'Library location (Branch)',
  'Vị trí vật lý (Tòa / Phòng)': 'Physical location (Building / Room)',
  'Ghi chú nội bộ': 'Internal note',
  'Thông tin bản sao': 'Copy information',
  'Chi tiết bản sao': 'Copy details',
  'Thêm mới bản sao': 'Add new copy',
  'Tạo bản sao mới': 'Create new copy',
  'Lưu thay đổi': 'Save changes',
  'Chỉnh sửa': 'Edit',
  'Chỉnh Sửa': 'Edit',
  'Xem chi tiết': 'View details',
  'Xem lịch sử': 'View history',
  'Xem ấn phẩm': 'View publication',
  'Xem Trang Công Khai': 'View Public Page',
  'Quay lại trang danh sách bản sao': 'Back to copy list',
  'Nhân bản bản sao': 'Duplicate copy',
  'In nhãn barcode': 'Print barcode label',
  'Xuất file': 'Export file',
  'Tải xuống': 'Download',
  'Trang chủ': 'Home',
  'Tổng quan': 'Dashboard',
  'Bản sao': 'Copies',
  'Trang thêm mới': 'New item page',
  'Quản lý bản sao': 'Copy Management',
  'Danh sách bản sao': 'Copy list',
  'Không tìm thấy bản sao nào.': 'No copies found.',
  'Bản sao không tồn tại.': 'Copy does not exist.',
  'Đang tải bản sao...': 'Loading copy...',
  'Không tải được thông tin bản sao.': 'Unable to load copy information.',
  'Không tìm thấy thông tin ấn phẩm (publicationId).': 'Publication information was not found (publicationId).',
  'Tạo bản sao thành công.': 'Copy created successfully.',
  'Đã xóa bản sao.': 'Copy deleted.',
  'Xóa bản sao': 'Delete copy',
  'Bạn chắc chắn muốn xóa bản sao này? Hành động không thể hoàn tác.': 'Are you sure you want to delete this copy? This action cannot be undone.',
  'Có sẵn': 'Available',
  'Mất': 'Lost',
  'Đã đặt trước': 'Reserved',
  'Đang bảo trì': 'In maintenance',
  'Bảo trì': 'Maintenance',
  'Mới': 'New',
  'Cũ': 'Old',
  'Chọn cơ sở': 'Select branch',
  '-- Chọn cơ sở --': '-- Select branch --',
  'Cơ sở 1 - Lý Thường Kiệt': 'Campus 1 - Ly Thuong Kiet',
  'Cơ sở 2 - Dĩ An': 'Campus 2 - Di An',
  'Ấn phẩm': 'Publication',
  'Đầu sách': 'Publications',
  'Thêm mới': 'New',
  'Thêm đầu sách': 'Add publication',
  'Chi Tiết Đầu Sách': 'Publication Details',
  'Tạo Bản Sao Mới': 'Create New Copy',
  'Quản lý các thông tin cơ bản về ấn phẩm': 'Manage core publication metadata',
  'Lưu Metadata': 'Save Metadata',
  'Tra cứu thông tin sách tự động': 'Automatic book lookup',
  'Tra cứu': 'Lookup',
  'Đang tìm...': 'Searching...',
  'Đã điền tự động từ': 'Auto-filled from',
  'Đang tra cứu tác giả & NXB...': 'Resolving authors & publisher...',
  'Nhập ISBN để điền tự động ngay · Nhập tên sách để chọn từ danh sách kết quả': 'Enter ISBN to auto-fill immediately · Enter a title to choose from search results',
  'ISBN phải là ISBN-10 hoặc ISBN-13 hợp lệ.': 'ISBN must be a valid ISBN-10 or ISBN-13.',
  'Mã xếp giá (DDC)': 'Call number (DDC)',
  'Số trang': 'Pages',
  'Ngôn ngữ': 'Language',
  'Chọn ngôn ngữ': 'Select language',
  'Tiếng Việt': 'Vietnamese',
  'Tái bản lần thứ': 'Edition',
  'Kích cỡ (A x A x A cm)': 'Size (W x H x D cm)',
  'Khối lượng (g)': 'Weight (g)',
  'Đặc tả': 'Description',
  'Đối tượng độc giả (Khoa)': 'Target audience (Faculty)',
  'Toàn bộ sinh viên BKU': 'All BKU students',
  'Khoa Khoa học và Kỹ thuật Máy tính': 'Faculty of Computer Science and Engineering',
  'Khoa Điện - Điện tử': 'Faculty of Electrical and Electronics Engineering',
  'Khoa Cơ khí': 'Faculty of Mechanical Engineering',
  'Khoa Kỹ thuật Hóa học': 'Faculty of Chemical Engineering',
  'Khoa Kỹ thuật Xây dựng': 'Faculty of Civil Engineering',
  'Khoa Kỹ thuật Giao thông': 'Faculty of Transportation Engineering',
  'Khoa Quản lý Công nghiệp': 'Faculty of Industrial Management',
  'Khoa Môi trường và Tài nguyên': 'Faculty of Environment and Natural Resources',
  'Khoa Công nghệ Vật liệu': 'Faculty of Materials Technology',
  'Khoa Khoa học Ứng dụng': 'Faculty of Applied Science',
  'Khoa Kỹ thuật Địa chất và Dầu khí': 'Faculty of Geology and Petroleum Engineering',
  '-- Chưa phân loại --': '-- Uncategorized --',
  'Khoa / ngành phù hợp với nội dung ấn phẩm này': 'Faculty / major suitable for this publication',
  'AI Summary & Tóm Tắt Nội Dung': 'AI Summary & Content Summary',
  'Nhà xuất bản': 'Publisher',
  'Tác giả': 'Author',
  'Danh mục': 'Category',
  'Chọn hoặc nhập nhà xuất bản': 'Select or enter publisher',
  'Chọn hoặc nhập tác giả': 'Select or enter author',
  'Chọn hoặc nhập danh mục': 'Select or enter category',
  'Chọn hoặc nhập tag': 'Select or enter tag',
  'Quản Lý Trang Bìa': 'Cover Management',
  'Tải lên và thay đổi ảnh bìa của ấn phẩm': 'Upload and change this publication cover',
  'Chọn ảnh bìa cho ấn phẩm': 'Choose cover image for this publication',
  'Cập nhật ảnh bìa mới': 'Update cover image',
  'Tải lên một tệp hình ảnh để làm ảnh bìa cho ấn phẩm này.': 'Upload an image file to use as this publication cover.',
  'Định dạng hỗ trợ: JPG, PNG, WEBP. Tối đa 5MB.': 'Supported formats: JPG, PNG, WEBP. Maximum 5MB.',
  'Chọn ảnh bìa': 'Choose cover',
  'Thay đổi ảnh bìa': 'Change cover',
  'Sẵn sàng tải lên': 'Ready to upload',
  'Gỡ ảnh bìa': 'Remove cover',
  'Bạn có chắc chắn muốn gỡ bỏ ảnh bìa hiện tại?': 'Are you sure you want to remove the current cover image?',
  'Gỡ bỏ': 'Remove',
  'Chọn ảnh bìa từ kết quả tra cứu': 'Choose a cover from lookup results',
  'Đang dùng': 'In use',
  'Quản Lý File Đính Kèm': 'Attachment File Management',
  'Tải file nội dung trực tiếp lên hệ thống (PDF, EPUB...)': 'Upload content files directly to the system (PDF, EPUB...)',
  'Kéo thả file hoặc chọn file để upload': 'Drag and drop a file or choose a file to upload',
  'Hỗ trợ PDF, EPUB, tối đa 100MB': 'Supports PDF, EPUB, up to 100MB',
  'Chọn file': 'Choose file',
  'Sẵn sàng': 'Ready',
  'File đã upload': 'File uploaded',
  'Đang upload file...': 'Uploading file...',
  'Tạo Ấn Phẩm': 'Create Publication',
  'Thao tác quản trị': 'Administrative actions',
  'Các thao tác có ảnh hưởng trực tiếp đến dữ liệu ấn phẩm.': 'Actions that directly affect publication data.',
  'Vùng Nguy Hiểm': 'Danger Zone',
  'Vùng nguy hiểm': 'Danger Zone',
  'Xóa ấn phẩm': 'Delete publication',
  'Xóa vĩnh viễn ấn phẩm này và tất cả các mục liên quan. Hành động này không thể hoàn tác.': 'Permanently delete this publication and all related records. This action cannot be undone.',
  'Bạn chắc chắn muốn xoá ấn phẩm này? Hành động không thể hoàn tác.': 'Are you sure you want to delete this publication? This action cannot be undone.',
  'Xem Trước': 'Preview',
  'XEM TRƯỚC': 'PREVIEW',
  'XEM TRANG CÔNG KHAI': 'VIEW PUBLIC PAGE',
  'Chưa có tiêu đề': 'Untitled',
  'Chưa có NXB': 'No publisher',
  'đánh giá': 'reviews',
  'bản sao': 'copies',
  'Không tìm thấy trong hệ thống': 'Not found in the system',
  'Chọn các mục bạn muốn tạo mới:': 'Choose the items you want to create:',
  'NXB': 'Publisher',
  'Bỏ qua tất cả': 'Skip all',
  'Tạo mục đã chọn': 'Create selected items',
  'Kết quả tìm kiếm — chọn cuốn sách cần điền': 'Search results - choose the book to fill',
  'Lịch sử mượn': 'Borrowing history',
  'Người mượn': 'Borrower',
  'Ngày mượn': 'Borrowed date',
  'Hạn trả': 'Due date',
  'Ngày trả': 'Returned date',
  'Phí': 'Fine',
  'Chưa có lịch sử mượn': 'No borrowing history',
  'Trước': 'Previous',
  'Tiếp': 'Next',
  'Thống kê nhanh': 'Quick stats',
  'Tổng số lượt mượn': 'Total borrows',
  'Trạng thái hiện tại': 'Current status',
  'Ngày trả gần nhất': 'Latest return date',
  'Tình trạng & bảo trì bản sao': 'Copy condition & maintenance',
  'Tình trạng tổng quan': 'Overall condition',
  'Tốt': 'Good',
  'Hạn bảo trì': 'Maintenance due',
  'Không': 'No',
  'Giá trị ước tính': 'Estimated value',
  'Nhật ký hoạt động': 'Activity log',
  'Những hành động không thể hoàn tác, đòi hỏi sự cân nhắc kỹ lưỡng.': 'Actions that cannot be undone and require careful consideration.',
  'Xóa vĩnh viễn bản sao này khỏi hệ thống. Hành động này không thể hoàn tác.': 'Permanently delete this copy from the system. This action cannot be undone.',
  'Quản lý mượn - trả sách': 'Circulation',
  'Quản lý lưu thông sách': 'Circulation Management',
  'Giao sách': 'Hand off books',
  'Mượn trực tiếp': 'Direct loan',
  'Mượn sách': 'Borrow books',
  'Trả sách': 'Return books',
  'Gia hạn': 'Renew',
  'Báo mất/hỏng': 'Report lost/damaged',
  'Từ mượn ngay': 'From direct loan',
  'Từ đặt trước': 'From reservation',
  'Quét QR': 'Scan QR',
  'Nhập thủ công': 'Manual entry',
  'Mã giao dịch': 'Transaction ID',
  'Mã đặt trước': 'Reservation ID',
  '(scanner tự điền khi quét QR)': '(scanner fills this after QR scan)',
  'Đang tra...': 'Looking up...',
  'Đang tra cứu...': 'Looking up...',
  'Tra cứu phiếu mượn': 'Look up loan slip',
  'Tra cứu đặt trước': 'Look up reservation',
  'Quét mã QR hoặc nhập mã số rồi nhấn Enter': 'Scan a QR code or enter an ID, then press Enter',
  'Nhập MSSV và barcode sách rồi nhấn Tra cứu': 'Enter student ID and book barcode, then click Lookup',
  'Lưu ý khi mượn trực tiếp': 'Direct loan notes',
  'Áp dụng khi độc giả': 'Applies when the reader',
  'đến thư viện mà không đặt trước': 'comes to the library without a reservation',
  'qua hệ thống.': 'in the system.',
  'Sách được ghi nhận trạng thái': 'The book is recorded as',
  'Đang mượn': 'Borrowed',
  'ngay lập tức, hạn trả': 'immediately, with a due date',
  '14 ngày': '14 days',
  'kể từ hôm nay.': 'from today.',
  'Hệ thống tự động kiểm tra: tối đa': 'The system automatically checks: maximum',
  '5 cuốn': '5 books',
  'đang mượn, không có': 'currently borrowed, no',
  'phí phạt chưa trả': 'unpaid fines',
  'và chưa mượn': 'and no active loan for',
  'bản sao khác của cùng đầu sách': 'another copy of the same publication',
  'MSSV độc giả': 'Reader student ID',
  'Barcode sách': 'Book barcode',
  'Barcode bản sao': 'Copy barcode',
  'Nhập MSSV...': 'Enter student ID...',
  'Nhập MSSV rồi nhấn Enter...': 'Enter student ID, then press Enter...',
  'Quét hoặc nhập barcode...': 'Scan or enter barcode...',
  'Cho mượn ngay': 'Loan now',
  'Đang xử lý...': 'Processing...',
  'Mượn sách thành công!': 'Book loaned successfully!',
  'Đã ghi nhận mượn': 'Recorded loan for',
  'Giao dịch tiếp theo': 'Next transaction',
  'Bản sao này đang ở trạng thái không thể mượn:': 'This copy is in a status that cannot be borrowed:',
  'Đang được mượn, Đã đặt trước, Đang bảo trì': 'Borrowed, Reserved, In maintenance',
  'Mất/thất lạc': 'Lost/missing',
  'Vui lòng chọn bản sao khác.': 'Please choose another copy.',
  'Nhập MSSV và barcode sách để mượn trực tiếp tại thư viện': 'Enter student ID and book barcode for a direct library loan',
  'Xác nhận giao sách, mượn trực tiếp và xử lý trả sách tại thư viện.': 'Confirm book handoffs, direct loans, and returns at the library.',
  'Quy định tính phí phạt hư hỏng / mất sách': 'Damaged / lost book fine rules',
  'Mua lại tài liệu đó theo cuốn tái bản mới nhất kèm chi phí xử lý sách.': 'Replace the material with the latest edition plus processing costs.',
  'Đối với sách': 'For books',
  'không mua lại được': 'that cannot be replaced',
  'đền gấp': 'charge',
  '3 lần giá sách': '3 times the book price',
  'không ghi giá tiền': 'without a listed price',
  'tính theo giá photo': 'calculate using photocopy price',
  'Tìm độc giả': 'Find reader',
  'Tìm sách': 'Find book',
  'Mã sinh viên': 'Student ID',
  'Mã barcode': 'Barcode',
  'Xác nhận mượn': 'Confirm loan',
  'Xác nhận trả': 'Confirm return',
  'Xác nhận gia hạn': 'Confirm renewal',
  'Xác nhận': 'Confirm',
  'Hoàn tất': 'Complete',
  'Độc giả': 'Reader',
  'Sách': 'Book',
  'Phiếu mượn': 'Loan slip',
  'cuốn đang mượn': 'borrowed books',
  'Sinh viên không có sách nào đang mượn.': 'This student has no borrowed books.',
  'Hạn': 'Due',
  'Trễ': 'Late',
  'ngày': 'days',
  'Trả': 'Return',
  'Hư': 'Damaged',
  'Nhập MSSV để xem danh sách sách đang mượn': 'Enter student ID to view borrowed books',
  'Trả sách thành công!': 'Book returned successfully!',
  'Sách trả trễ hạn — phí phạt đã ghi nhận:': 'Book returned late - fine recorded:',
  'Ghi nhận hư hỏng thành công!': 'Damage report recorded successfully!',
  'Ghi nhận mất sách thành công!': 'Lost book report recorded successfully!',
  'Trạng thái sách': 'Book status',
  'Mất / thất lạc': 'Lost / missing',
  'Phí hư hỏng': 'Damage fine',
  'Phí mất sách': 'Lost book fine',
  'Phí trễ hạn': 'Overdue fine',
  'Sách trễ': 'Book is late',
  'hệ thống tự tính thêm phí trễ hạn': 'the system automatically adds an overdue fine',
  'Xác nhận trả sách này?': 'Confirm returning this book?',
  'Xác nhận hư hỏng': 'Confirm damage',
  'Xác nhận mất sách': 'Confirm lost book',
  'Phí phạt hư hỏng (đ)': 'Damage fine (VND)',
  'Phí phạt mất sách (đ)': 'Lost book fine (VND)',
  'Nhập số tiền do thủ thư định...': 'Enter the amount set by the librarian...',
  'Giao sách thành công!': 'Book handed off successfully!',
  'đã nhận': 'received',
  'Hạn trả sách': 'Book due date',
  'Hạn lấy sách': 'Pickup deadline',
  'Không có kết quả': 'No results',
  'Không có phí': 'No fine',
  'Chưa thu': 'Unpaid',
  'Đã thu': 'Paid',
  'Cần kiểm tra': 'Needs review',
  'Quá hạn': 'Overdue',
  'Đã hủy': 'Cancelled',
  'Chờ lấy sách': 'Waiting for pickup',
  'Đặt trước đang chờ': 'Pending reservations',
  'Phí chưa thu': 'Unpaid fines',
  'Bộ lọc giao dịch': 'Transaction filters',
  'Tất cả trạng thái': 'All statuses',
  'Tất cả phí phạt': 'All fines',
  'Mới nhất': 'Newest',
  'Cũ nhất': 'Oldest',
  'Phí phạt cao nhất': 'Highest fine',
  'Phí phạt thấp nhất': 'Lowest fine',
  'Hạn trả gần nhất': 'Nearest due date',
  'Ngày mượn mới nhất': 'Newest borrowed date',
  'Sinh viên': 'Student',
  'Trạng thái trả sách': 'Book status',
  'Trạng thái trả phí': 'Fine status',
  'Đã đánh dấu quan trọng': 'Marked important',
  'Chưa có ghi chú': 'No note',
  'Ghi chú nội bộ cho giao dịch...': 'Internal note for this transaction...',
  'Thông tin đầy đủ và các tùy chọn quản lý cho tài liệu thư viện này': 'Complete information and management options for this library item',
  'Thêm ghi chú nội bộ cho bản sao này...': 'Add an internal note for this copy...',
  'Chưa có mô tả cho ấn phẩm này.': 'No description is available for this publication.',
  'Số lượt mượn theo tháng (2024)': 'Monthly borrows (2024)',
  'Phân bố người mượn': 'Borrower distribution',
  'Lần kiểm tra gần nhất': 'Last inspection',
  'Lần kiểm tra tiếp theo': 'Next inspection',
  '90% của tổng giá gốc': '90% of original value',
  'Bản sao được mượn bởi Phạm Minh Tuấn': 'Copy borrowed by Pham Minh Tuan',
  'Việc kiểm tra tình trạng đã hoàn tất': 'Condition inspection completed',
  'Kiểm tra định kỳ bởi Nguyễn Văn A - Tình trạng: Xuất sắc': 'Periodic inspection by Nguyen Van A - Condition: Excellent',
  'Sản phẩm đã được kiểm tra cho Phạm Minh Tuấn': 'Item was checked for Pham Minh Tuan',
  'Nhân bản thành công nhưng không lấy được ID bản sao mới.': 'Duplicated successfully, but the new copy ID could not be read.',
  'Quản lý mượn sách': 'Circulation Management',
  'Quản lý mượn sách.': 'Circulation management',
  '': 'Confirm handoffs, direct loans, and returns at the library.',
  'Xác nhận giao sách': 'Confirm handoff',
  'Thu phí phạt': 'Collect fines',
  'Quét QR hoặc nhập mã giao dịch...': 'Scan QR or enter transaction ID...',
  'Quét QR hoặc nhập mã đặt trước...': 'Scan QR or enter reservation ID...',
  'Không tìm thấy phiếu mượn hoặc đã hết hạn.': 'Loan slip was not found or has expired.',
  'Không tìm thấy đặt trước hoặc chưa sẵn sàng.': 'Reservation was not found or is not ready.',
  'Hư hỏng': 'Damaged',
  'Mất sách': 'Lost book',
  'Phí phát sinh do trả sách sau hạn quy định. Hệ thống tính 1.000đ cho mỗi ngày quá hạn.': 'Fine generated because the book was returned after the due date. The system charges 1,000 VND per overdue day.',
  'Phí do thủ thư ghi nhận sách bị hư hỏng khi trả hoặc kiểm kê.': 'Fine recorded by the librarian because the book was damaged during return or inventory.',
  'Phí do thủ thư ghi nhận sách bị mất.': 'Fine recorded by the librarian because the book was lost.',
  'Đã ghi nhận thanh toán tiền mặt cho': 'Recorded cash payment for',
  'khoản phí.': 'fines.',
  'Tổng nợ chưa trả': 'Total unpaid',
  'Sinh viên không có phí phạt nào chưa thanh toán.': 'This student has no unpaid fines.',
  'Phương thức thanh toán': 'Payment method',
  'Tiền mặt': 'Cash',
  'Chuyển khoản': 'Bank transfer',
  'Đã thanh toán tiền mặt': 'Record cash payment',
  'Tạo QR thanh toán tất cả': 'Create QR to pay all',
  'Đang tạo mã QR...': 'Creating QR code...',
  'Hệ thống chỉ hỗ trợ thanh toán toàn bộ phí phạt chưa thu của sinh viên. Với chuyển khoản, payOS sẽ gửi webhook xác nhận để hệ thống tự cập nhật trạng thái đã thanh toán.': 'The system only supports collecting all unpaid fines for this student. For bank transfers, payOS sends a confirmation webhook and the system updates the paid status automatically.',
  'Tạo ngày': 'Created on',
  'Phí phạt được ghi nhận bởi thủ thư.': 'Fine recorded by the librarian.',
  'Nhập MSSV để xem và thu phí phạt của sinh viên': 'Enter a student ID to view and collect student fines',
  'Thanh toán qua payOS': 'payOS Payment',
  'Quét mã QR để chuyển khoản': 'Scan the QR code to transfer',
  'Số tiền': 'Amount',
  'Nội dung': 'Description',
  'Mã đơn': 'Order code',
  'Mở trang thanh toán payOS': 'Open payOS checkout',
  'Kiểm tra trạng thái thanh toán': 'Check payment status',
  'Sau khi chuyển khoản thành công, payOS sẽ tự động xác nhận và hệ thống cập nhật trong vài giây.': 'After the transfer succeeds, payOS will confirm it and the system will update within a few seconds.',
  'payOS đã xác nhận chuyển khoản. Phí phạt đã được cập nhật.': 'payOS confirmed the transfer. Fines have been updated.',
  'payOS chưa ghi nhận giao dịch đã thanh toán.': 'payOS has not recorded a paid transaction yet.',
  'Quét QR:': 'Scan QR:',
  'User mang QR từ app — scanner tự điền mã giao dịch.': 'The reader brings the QR from the app - the scanner fills the transaction ID automatically.',
  'Nhập thủ công:': 'Manual entry:',
  'User không có QR — nhập MSSV + barcode sách.': 'The reader has no QR - enter student ID and book barcode.',
  'Chỉ tra được phiếu đang ở trạng thái': 'Only slips in',
  'Mượn trực tiếp:': 'Direct loan:',
  'Áp dụng khi độc giả đến thư viện mà không đặt trước.': 'Applies when a reader comes to the library without a reservation.',
  'Sách được ghi nhận': 'The book is recorded as',
  'BORROWING ngay': 'BORROWING immediately',
  ', hạn trả 14 ngày kể từ hôm nay.': ', with a due date 14 days from today.',
  'Hệ thống sẽ kiểm tra: giới hạn 5 cuốn, phí phạt chưa trả, và không mượn trùng sách.': 'The system checks the 5-book limit, unpaid fines, and duplicate active loans for the same book.',
  'để xem danh sách sách đang mượn của sinh viên.': 'to view the student borrowed book list.',
  'Chọn từng cuốn để': 'Choose each book to',
  'Báo hư': 'Report damaged',
  'Báo mất': 'Report lost',
  'hoặc': 'or',
  '. Phí trễ hạn (': '. Overdue fines (',
  '1.000đ/ngày': '1,000 VND/day',
  ') được tính tự động khi trả.': ') are calculated automatically on return.',
  'để xem danh sách phí phạt chưa thanh toán của sinh viên.': 'to view the student unpaid fine list.',
  'Có thể thanh toán từng khoản riêng lẻ hoặc': 'You can pay individual fines or',
  'thanh toán tất cả': 'pay all',
  'cùng lúc.': 'at once.',

};

const EN_TO_VI = Object.fromEntries(Object.entries(VI_TO_EN).map(([vi, en]) => [en, vi]));

const translateExact = (value: string, language: 'vi' | 'en') => {
  const trimmed = value.trim();
  const translated = language === 'en' ? VI_TO_EN[trimmed] : EN_TO_VI[trimmed];
  if (!translated) return value;
  return value.replace(trimmed, translated);
};

const translatePatterns = (value: string, language: 'vi' | 'en') => {
  if (language === 'en') {
    return value
      .replace(/Hiển thị (\d+) - (\d+) trong tổng số (\d+) phần tử/g, 'Showing $1 - $2 of $3 items')
      .replace(/Hiển thị (\d+)-(\d+) trong tổng số\s*(\d+) đầu sách/g, 'Showing $1-$2 of $3 publications')
      .replace(/Hiển thị (\d+)-(\d+) trong (\d+) giao dịch/g, 'Showing $1-$2 in $3 transactions')
      .replace(/Trang (\d+) \/ (\d+) \(Tổng (\d+) lượt\)/g, 'Page $1 / $2 (Total $3)')
      .replace(/Tổng cộng (\d+) phần tử/g, 'Total $1 items')
      .replace(/Đang tải lên \((\d+)%\)/g, 'Uploading ($1%)')
      .replace(/Cập nhật: /g, 'Updated: ')
      .replace(/(\d+) đánh giá/g, '$1 reviews')
      .replace(/(\d+) bản sao/g, '$1 copies')
      .replace(/(\d+) cuốn đang mượn/g, '$1 borrowed books')
      .replace(/Hạn: ([0-9/]+)/g, 'Due: $1')
      .replace(/Trễ (\d+) ngày · Phí: /g, 'Late $1 days · Fine: ')
      .replace(/Sách trễ (\d+) ngày/g, 'Book is $1 days late')
      .replace(/Đã ghi nhận mượn /g, 'Recorded loan for ')
      .replace(/Ngày trả: /g, 'Returned date: ')
      .replace(/Trạng thái sách: /g, 'Book status: ');
  }

  return value
    .replace(/Showing (\d+) - (\d+) of (\d+) items/g, 'Hiển thị $1 - $2 trong tổng số $3 phần tử')
    .replace(/Showing (\d+)-(\d+) of (\d+) publications/g, 'Hiển thị $1-$2 trong tổng số $3 đầu sách')
    .replace(/Showing (\d+)-(\d+) in (\d+) transactions/g, 'Hiển thị $1-$2 trong $3 giao dịch')
    .replace(/Page (\d+) \/ (\d+) \(Total (\d+)\)/g, 'Trang $1 / $2 (Tổng $3 lượt)')
    .replace(/Total (\d+) items/g, 'Tổng cộng $1 phần tử')
    .replace(/Uploading \((\d+)%\)/g, 'Đang tải lên ($1%)')
    .replace(/Updated: /g, 'Cập nhật: ')
    .replace(/(\d+) reviews/g, '$1 đánh giá')
    .replace(/(\d+) copies/g, '$1 bản sao')
    .replace(/(\d+) borrowed books/g, '$1 cuốn đang mượn')
    .replace(/Due: ([0-9/]+)/g, 'Hạn: $1')
    .replace(/Late (\d+) days · Fine: /g, 'Trễ $1 ngày · Phí: ')
    .replace(/Book is (\d+) days late/g, 'Sách trễ $1 ngày')
    .replace(/Recorded loan for /g, 'Đã ghi nhận mượn ')
    .replace(/Returned date: /g, 'Ngày trả: ')
    .replace(/Book status: /g, 'Trạng thái sách: ');
};

const translateValue = (value: string, language: 'vi' | 'en') => {
  const exact = translateExact(value, language);
  return translatePatterns(exact, language);
};

const translateElement = (root: ParentNode, language: 'vi' | 'en') => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.nodeValue?.trim()) nodes.push(node);
  }

  nodes.forEach((node) => {
    const next = translateValue(node.nodeValue || '', language);
    if (next !== node.nodeValue) node.nodeValue = next;
  });

  const attrNames = ['placeholder', 'title', 'aria-label'];
  document.querySelectorAll<HTMLElement>('[data-librarian-content] [placeholder], [data-librarian-content] [title], [data-librarian-content] [aria-label]')
    .forEach((element) => {
      attrNames.forEach((attr) => {
        const value = element.getAttribute(attr);
        if (!value) return;
        const next = translateValue(value, language);
        if (next !== value) element.setAttribute(attr, next);
      });
    });
};

export const LibrarianI18nBridge = () => {
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const root = document.querySelector('[data-librarian-content]');
    if (!root) return;

    translateElement(root, language);
    const observer = new MutationObserver(() => translateElement(root, language));
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    return () => observer.disconnect();
  }, [language, location.pathname]);

  return null;
};
