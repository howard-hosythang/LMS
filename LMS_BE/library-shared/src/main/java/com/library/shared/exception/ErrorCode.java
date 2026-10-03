package com.library.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
  // General errors (1000-1099)
  UNCATEGORIZED_EXCEPTION(1000, "Uncategorized error", "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
  INVALID_REQUEST(1001, "Invalid request", "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
  RESOURCE_NOT_FOUND(1002, "Resource not found", "Không tìm thấy tài nguyên", HttpStatus.NOT_FOUND),

  // User errors (1100-1199)
  USER_NOT_FOUND(1100, "User not found", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
  USER_ALREADY_EXISTS(1101, "User already exists", "Người dùng đã tồn tại", HttpStatus.CONFLICT),
  USERNAME_ALREADY_EXISTS(1102, "Username already exists", "Tên đăng nhập đã tồn tại", HttpStatus.CONFLICT),
  EMAIL_ALREADY_EXISTS(1103, "Email already exists", "Email đã được sử dụng", HttpStatus.CONFLICT),
  INVALID_USERNAME(1104, "Invalid username format", "Định dạng tên đăng nhập không hợp lệ", HttpStatus.BAD_REQUEST),
  INVALID_EMAIL(1105, "Invalid email format, expect a gmail.com or hcmut.edu.vn address", "Email phải có định dạng @gmail.com hoặc @hcmut.edu.vn", HttpStatus.BAD_REQUEST),
  INVALID_PASSWORD(1106, "Invalid password", "Mật khẩu không hợp lệ", HttpStatus.BAD_REQUEST),
  USER_NOT_ACTIVE(1107, "User account is not active", "Tài khoản chưa được kích hoạt", HttpStatus.FORBIDDEN),
  USER_SUSPENDED(1108, "User account is suspended", "Tài khoản đã bị tạm khóa", HttpStatus.FORBIDDEN),
  EMAIL_OR_PASSWORD_INCORRECT(1109, "Email or password is incorrect", "Email hoặc mật khẩu không đúng", HttpStatus.BAD_REQUEST),
  VERIFY_EMAIL_FAILED(1110, "Email verification failed", "Xác thực email thất bại", HttpStatus.BAD_REQUEST),
  INVALID_FILE_TYPE(1111, "Only image files are allowed (jpeg, png, gif, webp)", "Chỉ chấp nhận file ảnh (jpeg, png, gif, webp)", HttpStatus.BAD_REQUEST),
  FILE_TOO_LARGE(1112, "File size exceeds the 5MB limit", "Kích thước file vượt quá giới hạn 5MB", HttpStatus.BAD_REQUEST),
  FILE_UPLOAD_FAILED(1113, "Failed to upload file, please try again", "Tải file thất bại, vui lòng thử lại", HttpStatus.INTERNAL_SERVER_ERROR),

  // Role errors (1200-1299)
  ROLE_NOT_FOUND(1200, "Role not found", "Không tìm thấy vai trò", HttpStatus.NOT_FOUND),
  ROLE_ALREADY_EXISTS(1201, "Role already exists", "Vai trò đã tồn tại", HttpStatus.CONFLICT),
  ROLE_NAME_ALREADY_EXISTS(1202, "Role name already exists", "Tên vai trò đã tồn tại", HttpStatus.CONFLICT),
  CANNOT_DELETE_ROLE(1203, "Cannot delete role - users are assigned to it", "Không thể xóa vai trò đang được gán cho người dùng", HttpStatus.CONFLICT),
  USER_ALREADY_HAS_ROLE(1204, "User already has this role", "Người dùng đã có vai trò này", HttpStatus.CONFLICT),

  // Permission errors (1300-1399)
  PERMISSION_NOT_FOUND(1300, "Permission not found", "Không tìm thấy quyền", HttpStatus.NOT_FOUND),
  PERMISSION_ALREADY_EXISTS(1301, "Permission already exists", "Quyền đã tồn tại", HttpStatus.CONFLICT),
  PERMISSION_NAME_ALREADY_EXISTS(1302, "Permission name already exists", "Tên quyền đã tồn tại", HttpStatus.CONFLICT),
  INSUFFICIENT_PERMISSIONS(1303, "You do not have permission to access this resource", "Bạn không có quyền truy cập tài nguyên này", HttpStatus.FORBIDDEN),

  // Authentication errors (1400-1499)
  UNAUTHENTICATED(1400, "Authentication required", "Vui lòng đăng nhập để tiếp tục", HttpStatus.UNAUTHORIZED),
  FORBIDDEN(1401, "Access denied", "Truy cập bị từ chối", HttpStatus.FORBIDDEN),
  INVALID_TOKEN(1402, "Invalid token", "Token không hợp lệ", HttpStatus.UNAUTHORIZED),
  TOKEN_EXPIRED(1403, "Token expired", "Phiên đăng nhập đã hết hạn", HttpStatus.UNAUTHORIZED),
  TOKEN_GENERATION_FAILED(1404, "Token generation failed", "Tạo token thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
  NOT_OWNER(1405, "You are not the owner of this resource", "Bạn không phải chủ sở hữu tài nguyên này", HttpStatus.FORBIDDEN),
  TOKEN_REFRESH_FAILED(1406, "Token refresh failed", "Làm mới phiên đăng nhập thất bại", HttpStatus.BAD_REQUEST),

  // Validation errors (1500-1599)
  VALIDATION_ERROR(1500, "Validation error", "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
  INVALID_INPUT(1501, "Invalid input", "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),

  // Catalog - Publication errors (2000-2099)
  PUBLICATION_NOT_FOUND(2001, "Publication not found", "Không tìm thấy ấn phẩm", HttpStatus.NOT_FOUND),
  PUBLICATION_ALREADY_EXISTS(2001, "Publication already exists", "Ấn phẩm đã tồn tại", HttpStatus.CONFLICT),
  ISBN_ALREADY_EXISTS(2002, "ISBN already exists", "ISBN đã được sử dụng", HttpStatus.CONFLICT),
  CANNOT_DELETE_PUBLICATION_HAS_ITEMS(2003, "Cannot delete publication: items still exist", "Không thể xóa ấn phẩm: vẫn còn bản sao tồn tại", HttpStatus.CONFLICT),
  CANNOT_DELETE_PUBLICATION_HAS_ACTIVE_RESERVATIONS(2004, "Cannot delete publication: active reservations exist", "Không thể xóa ấn phẩm: đang có lượt đặt trước chờ xử lý", HttpStatus.CONFLICT),
  DOCUMENT_FILE_TOO_LARGE(2005, "Document file size exceeds the 100MB limit", "Kích thước tài liệu vượt quá giới hạn 100MB", HttpStatus.BAD_REQUEST),
  INVALID_DOCUMENT_FILE_TYPE(2006, "Only PDF and EPUB documents are allowed", "Chỉ chấp nhận tài liệu PDF hoặc EPUB", HttpStatus.BAD_REQUEST),

  // Catalog - Item errors (2100-2199)
  ITEM_NOT_FOUND(2100, "Item not found", "Không tìm thấy bản sao sách", HttpStatus.NOT_FOUND),
  ITEM_ALREADY_EXISTS(2101, "Item already exists", "Bản sao sách đã tồn tại", HttpStatus.CONFLICT),
  BARCODE_ALREADY_EXISTS(2102, "Barcode already exists", "Mã barcode đã được sử dụng", HttpStatus.CONFLICT),
  ITEM_NOT_BORROWABLE(2103, "Item is not available for borrowing", "Bản sao sách hiện không thể mượn", HttpStatus.CONFLICT),

  // Catalog - Author errors (2200-2299)
  AUTHOR_NOT_FOUND(2200, "Author not found", "Không tìm thấy tác giả", HttpStatus.NOT_FOUND),
  AUTHOR_ALREADY_EXISTS(2201, "Author already exists", "Tác giả đã tồn tại", HttpStatus.CONFLICT),
  CANNOT_DELETE_AUTHOR_HAS_PUBLICATIONS(2202, "Cannot delete author has publications", "Không thể xóa tác giả đang có ấn phẩm liên kết", HttpStatus.CONFLICT),
  AUTHOR_NAME_ALREADY_EXISTS(2003, "Author name already exists", "Tên tác giả đã tồn tại", HttpStatus.CONFLICT),

  // Catalog - Publisher errors (2300-2399)
  PUBLISHER_NOT_FOUND(2300, "Publisher not found", "Không tìm thấy nhà xuất bản", HttpStatus.NOT_FOUND),
  PUBLISHER_ALREADY_EXISTS(2301, "Publisher already exists", "Nhà xuất bản đã tồn tại", HttpStatus.CONFLICT),
  PUBLISHER_NAME_ALREADY_EXISTS(2302, "Publisher name already exists", "Tên nhà xuất bản đã tồn tại", HttpStatus.CONFLICT),
  CANNOT_DELETE_PUBLISHER_HAS_PUBLICATIONS(2303, "Cannot delete publisher has publications", "Không thể xóa nhà xuất bản đang có ấn phẩm liên kết", HttpStatus.CONFLICT),

  // Catalog - Category errors (2400-2499)
  CATEGORY_NOT_FOUND(2400, "Category not found", "Không tìm thấy danh mục", HttpStatus.NOT_FOUND),
  CATEGORY_ALREADY_EXISTS(2401, "Category already exists", "Danh mục đã tồn tại", HttpStatus.CONFLICT),
  CATEGORY_NAME_ALREADY_EXISTS(2402, "Category name already exists", "Tên danh mục đã tồn tại", HttpStatus.CONFLICT),
  CANNOT_DELETE_CATEGORY_HAS_CHILDREN(2403, "Cannot delete category has children", "Không thể xóa danh mục đang có danh mục con", HttpStatus.CONFLICT),
  CANNOT_DELETE_CATEGORY_HAS_PUBLICATIONS(2404, "Cannot delete category has publications", "Không thể xóa danh mục đang có ấn phẩm liên kết", HttpStatus.CONFLICT),
  CIRCULAR_CATEGORY_REFERENCE(2405, "Circular category reference", "Tham chiếu danh mục tạo thành vòng lặp", HttpStatus.CONFLICT),
  INVALID_PARENT_CATEGORY(2406, "Invalid parent category", "Danh mục cha không hợp lệ", HttpStatus.BAD_REQUEST),

  // Catalog - Tag errors (2500-2599)
  TAG_NOT_FOUND(2500, "Tag not found", "Không tìm thấy thẻ tag", HttpStatus.NOT_FOUND),
  TAG_ALREADY_EXISTS(2501, "Tag already exists", "Thẻ tag đã tồn tại", HttpStatus.CONFLICT),
  TAG_NAME_ALREADY_EXISTS(2502, "Tag name already exists", "Tên thẻ tag đã tồn tại", HttpStatus.CONFLICT),

  // Circulation - Transaction errors (3000-3099)
  TRANSACTION_NOT_FOUND(3000, "Borrowing transaction not found", "Không tìm thấy giao dịch mượn sách", HttpStatus.NOT_FOUND),
  TRANSACTION_NOT_RETURNABLE(3001, "Transaction cannot be returned in its current status", "Giao dịch hiện không thể được trả sách", HttpStatus.CONFLICT),
  USER_BORROW_LIMIT_EXCEEDED(3002, "User has exceeded the maximum borrow limit", "Bạn đã đạt giới hạn số sách mượn tối đa", HttpStatus.CONFLICT),
  CANNOT_RENEW_TRANSACTION(3003, "Cannot renew transaction - conditions are not met", "Không thể gia hạn: sách đã quá hạn, chưa đến thời điểm gia hạn, đã hết lượt, còn phí chưa thanh toán hoặc đã có độc giả đặt trước", HttpStatus.CONFLICT),
  RESERVATION_NOT_FOUND(3004, "Reservation not found", "Không tìm thấy lượt đặt trước", HttpStatus.NOT_FOUND),
  RESERVATION_ALREADY_EXISTS(3005, "User already has a pending reservation for this publication", "Bạn đã có lượt đặt trước đang chờ cho ấn phẩm này", HttpStatus.CONFLICT),
  FINE_NOT_FOUND(3006, "Fine not found", "Không tìm thấy khoản phí phạt", HttpStatus.NOT_FOUND),
  USER_HAS_UNPAID_FINES(3007, "User has unpaid fines and cannot borrow", "Bạn còn phí phạt chưa thanh toán, không thể thực hiện thao tác này", HttpStatus.FORBIDDEN),
  ACCOUNT_SUSPENDED(3008, "User account is suspended", "Tài khoản của bạn đã bị tạm khóa", HttpStatus.FORBIDDEN),
  FINE_ALREADY_PAID(3009, "Fine is already paid", "Khoản phí phạt này đã được thanh toán", HttpStatus.CONFLICT),
  FINE_PAYMENT_IN_PROGRESS(3015, "Fine has a pending payment order; resolve it before editing", "Khoản phí đang có đơn thanh toán QR chờ xử lý. Vui lòng xử lý đơn thanh toán trước khi chỉnh sửa", HttpStatus.CONFLICT),
  RESERVATION_NOT_CANCELLABLE(3010, "Reservation cannot be cancelled in its current status", "Lượt đặt trước không thể hủy ở trạng thái hiện tại", HttpStatus.CONFLICT),
  RESERVATION_BOOK_AVAILABLE(3011, "Book is currently available, please borrow it directly", "Sách hiện đang có sẵn, vui lòng mượn trực tiếp", HttpStatus.CONFLICT),
  RESERVATION_BRANCH_NO_ITEMS(3012, "No items of this publication found in the selected branch", "Không có bản sao nào của ấn phẩm này tại cơ sở đã chọn", HttpStatus.BAD_REQUEST),
  RESERVATION_LIMIT_EXCEEDED(3013, "User has exceeded the maximum reservation limit", "Bạn đã đạt giới hạn số lượt đặt trước tối đa", HttpStatus.CONFLICT),
  RESERVATION_NOT_READY(3014, "Reservation is not in READY_FOR_PICKUP status", "Lượt đặt trước chưa sẵn sàng để nhận sách", HttpStatus.BAD_REQUEST),
  RENEWAL_OVERDUE(3016, "The book is overdue and cannot be renewed", "Sách đã quá hạn mượn, không thể gia hạn", HttpStatus.CONFLICT),
  RENEWAL_LIMIT_REACHED(3017, "The maximum number of renewals has been reached", "Đã hết lượt gia hạn theo chính sách hiện hành", HttpStatus.CONFLICT),
  RENEWAL_NOT_IN_WINDOW(3018, "The renewal window has not opened yet", "Chưa đến thời điểm gia hạn theo chính sách hiện hành", HttpStatus.CONFLICT),
  RENEWAL_HAS_RESERVATIONS(3019, "The publication has pending reservations", "Ấn phẩm đang có người đặt trước, không thể gia hạn", HttpStatus.CONFLICT),
  RENEWAL_UNPAID_FINES(3020, "The reader has unpaid fines", "Độc giả còn tiền phạt chưa thanh toán, không thể gia hạn", HttpStatus.CONFLICT),
  RENEWAL_NOT_BORROWING(3021, "Only actively borrowed books can be renewed", "Chỉ có thể gia hạn sách đang mượn", HttpStatus.CONFLICT),
  RENEWAL_MISSING_DUE_DATE(3022, "The loan has no due date", "Giao dịch chưa có hạn trả, không thể gia hạn", HttpStatus.CONFLICT),
  PICKUP_DEADLINE_EXPIRED(3023, "The pickup deadline has expired", "Đã hết hạn nhận sách. Vui lòng tạo yêu cầu mượn hoặc đặt trước mới", HttpStatus.CONFLICT),

  // Security Error (2600-2699)
  USER_LOCKED(2600, "User account is locked", "Tài khoản của bạn đã bị khóa", HttpStatus.LOCKED),
  USER_EMAIL_NOT_VERIFIED(2601, "Email address is not verified", "Email chưa được xác thực, vui lòng kiểm tra hộp thư", HttpStatus.UNAUTHORIZED),
  USER_BANNED(2602, "User account has BANNED", "Tài khoản của bạn đã bị cấm", HttpStatus.UNAUTHORIZED),
  PASSWORD_EXPIRED(2603, "User password has expired", "Mật khẩu đã hết hạn, vui lòng đặt lại", HttpStatus.UNAUTHORIZED),
  TOKEN_INVALID(2604, "Token invalid", "Token không hợp lệ", HttpStatus.UNAUTHORIZED),
  BUILD_OAUTH2_URL_FAILED(2605, "Failed to build OAuth2 URL", "Không thể tạo URL đăng nhập Google", HttpStatus.BAD_REQUEST),

  // Rating (2700-2799)
  RATING_ALREADY_EXISTS(2700, "This loan transaction has already been reviewed", "Giao dịch mượn này đã được đánh giá", HttpStatus.CONFLICT),
  USER_NOT_BORROWED_PUBLICATION(2701, "An eligible returned loan transaction is required to review this publication", "Bạn cần có giao dịch mượn đã trả còn hiệu lực để đánh giá ấn phẩm này", HttpStatus.FORBIDDEN),
  RATING_REVIEW_WINDOW_EXPIRED(2702, "The review period has expired. Reviews must be submitted within 7 days after return", "Thời hạn đánh giá đã hết. Đánh giá cần được gửi trong vòng 7 ngày kể từ ngày trả sách", HttpStatus.FORBIDDEN),
  RATING_EDIT_WINDOW_EXPIRED(2703, "The review edit period has expired. Reviews can only be edited within 7 days after submission", "Thời hạn chỉnh sửa đánh giá đã hết. Đánh giá chỉ có thể được chỉnh sửa trong vòng 7 ngày kể từ khi gửi", HttpStatus.FORBIDDEN),
  RATING_NOT_FOUND(2704, "Rating not found", "Không tìm thấy đánh giá", HttpStatus.NOT_FOUND),

  // Notification errors (3100-3199)
  NOTIFICATION_NOT_FOUND(3100, "Notification not found", "Không tìm thấy thông báo", HttpStatus.NOT_FOUND);

  private final int code;
  private final String message;
  private final String messageVi;
  private final HttpStatusCode status;

  ErrorCode(int code, String message, String messageVi, HttpStatusCode status) {
    this.code = code;
    this.message = message;
    this.messageVi = messageVi;
    this.status = status;
  }
}
