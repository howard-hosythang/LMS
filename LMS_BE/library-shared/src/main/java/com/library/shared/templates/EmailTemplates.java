package com.library.shared.templates;

import java.util.Arrays;
import lombok.Getter;
import org.springframework.web.util.HtmlUtils;

@Getter
public enum EmailTemplates {
  // args: fullName, actionUrl, actionUrl, actionUrl
  VERIFY_EMAIL_TEMPLATE(
      "[SmartLibrary] Xác nhận địa chỉ email của bạn",
      """
          <!doctype html>
          <html>
          <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <div style="background:#5b5ce2;padding:22px 28px;color:#ffffff;">
                  <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Library74</div>
                  <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;">Xác nhận tài khoản thư viện</h1>
                </div>
                <div style="padding:28px;">
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Xin chào <strong>%s</strong>,</p>
                  <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">
                    Cảm ơn bạn đã đăng ký SmartLibrary. Vui lòng xác nhận email để kích hoạt tài khoản và bắt đầu sử dụng các chức năng mượn sách, đặt trước, thông báo và gợi ý tài liệu.
                  </p>
                  <p style="margin:24px 0;text-align:center;">
                    <a href="%s" style="display:inline-block;background:#5b5ce2;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:8px;">Xác nhận email</a>
                  </p>
                  <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#6b7280;">Liên kết có hiệu lực trong 24 giờ. Nếu nút không hoạt động, hãy copy đường dẫn sau:</p>
                  <p style="margin:0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:13px;line-height:1.5;word-break:break-all;">
                    <a href="%s" style="color:#5b5ce2;">%s</a>
                  </p>
                </div>
                <div style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.6;">
                  Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email. Không chia sẻ email này cho người khác.
                </div>
              </div>
            </div>
          </body>
          </html>
          """
  ),

  // args: fullName, actionUrl, actionUrl, actionUrl
  VERIFY_RESET_PASSWORD_TEMPLATE(
      "[SmartLibrary] Đặt lại mật khẩu tài khoản",
      """
          <!doctype html>
          <html>
          <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <div style="background:#5b5ce2;padding:22px 28px;color:#ffffff;">
                  <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Library74</div>
                  <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;">Yêu cầu đặt lại mật khẩu</h1>
                </div>
                <div style="padding:28px;">
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Xin chào <strong>%s</strong>,</p>
                  <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">
                    SmartLibrary nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn nút bên dưới để tạo mật khẩu mới.
                  </p>
                  <p style="margin:24px 0;text-align:center;">
                    <a href="%s" style="display:inline-block;background:#5b5ce2;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:8px;">Đặt lại mật khẩu</a>
                  </p>
                  <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#6b7280;">Liên kết có hiệu lực trong 30 phút. Nếu nút không hoạt động, hãy copy đường dẫn sau:</p>
                  <p style="margin:0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:13px;line-height:1.5;word-break:break-all;">
                    <a href="%s" style="color:#5b5ce2;">%s</a>
                  </p>
                </div>
                <div style="padding:18px 28px;background:#fef2f2;border-top:1px solid #fee2e2;color:#991b1b;font-size:12px;line-height:1.6;">
                  Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này và kiểm tra bảo mật tài khoản.
                </div>
              </div>
            </div>
          </body>
          </html>
          """
  ),

  // args: fullName, publicationTitle, location, deadline, actionUrl, actionUrl
  BORROW_PICKUP_REMINDER(
      "[SmartLibrary] Sách của bạn đang chờ được lấy",
      """
          <!doctype html>
          <html>
          <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <div style="background:#5b5ce2;padding:22px 28px;color:#ffffff;">
                  <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Library74</div>
                  <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;">Yêu cầu mượn sách đã sẵn sàng</h1>
                </div>
                <div style="padding:28px;">
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Xin chào <strong>%s</strong>,</p>
                  <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">Yêu cầu mượn sách <strong>"%s"</strong> đã được ghi nhận. Vui lòng đến thư viện nhận sách trước thời hạn.</p>
                  <table style="width:100%%;border-collapse:collapse;margin:20px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                    <tr><td style="padding:12px;color:#6b7280;width:34%%;">Địa điểm</td><td style="padding:12px;font-weight:700;">%s</td></tr>
                    <tr><td style="padding:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Hạn nhận sách</td><td style="padding:12px;border-top:1px solid #e5e7eb;font-weight:700;color:#b91c1c;">%s</td></tr>
                  </table>
                  <p style="margin:24px 0;text-align:center;"><a href="%s" style="display:inline-block;background:#5b5ce2;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:8px;">Xem sách đang chờ nhận</a></p>
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Nếu quá hạn, yêu cầu mượn có thể bị tự động hủy.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
          """
  ),

  // args: fullName, publicationTitle, dueDate, depositAmount, actionUrl, actionUrl
  PICKUP_CONFIRMED(
      "[SmartLibrary] Xác nhận giao sách và tiền cọc",
      """
          <!doctype html>
          <html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <div style="max-width:640px;margin:0 auto;padding:28px 16px;"><div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <div style="background:#059669;padding:22px 28px;color:#ffffff;"><div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Library74</div><h1 style="margin:8px 0 0;font-size:24px;">Giao sách thành công</h1></div>
              <div style="padding:28px;">
                <p style="margin:0 0 14px;font-size:16px;">Xin chào <strong>%s</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">Bạn đã nhận sách <strong>"%s"</strong>. Hạn trả sách là <strong>%s</strong>.</p>
                <table style="width:100%%;border-collapse:collapse;margin:20px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                  <tr><td style="padding:12px;color:#6b7280;width:42%%;">Tiền cọc đã thu</td><td style="padding:12px;font-weight:700;color:#047857;">%s</td></tr>
                </table>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#6b7280;">Khoản cọc này sẽ được hoàn hoặc cấn trừ với phí phạt khi bạn trả sách.</p>
                <p style="margin:24px 0;text-align:center;"><a href="%s" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:8px;">Xem sách của tôi</a></p>
              </div>
            </div></div>
          </body></html>
          """
  ),

  // args: fullName, publicationTitle, dueDate, actionUrl, actionUrl
  DUE_DATE_WARNING(
      "[SmartLibrary] Nhắc nhở hạn trả sách",
      """
          <!doctype html>
          <html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <div style="max-width:640px;margin:0 auto;padding:28px 16px;"><div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <div style="background:#7c3aed;padding:22px 28px;color:#ffffff;"><div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Library74</div><h1 style="margin:8px 0 0;font-size:24px;">Sách sắp đến hạn trả</h1></div>
              <div style="padding:28px;">
                <p style="margin:0 0 14px;font-size:16px;">Xin chào <strong>%s</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">Sách <strong>"%s"</strong> sẽ đến hạn trả vào <strong style="color:#7c3aed;">%s</strong>. Vui lòng trả sách đúng hạn để tránh phát sinh phí phạt.</p>
                <p style="margin:24px 0;text-align:center;"><a href="%s" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:8px;">Xem sách đang mượn</a></p>
              </div>
            </div></div>
          </body></html>
          """
  ),

  // args: fullName, publicationTitle, returnDate, depositAmount, grossFineAmount, depositAppliedAmount, depositRefundAmount, additionalAmountDue, actionUrl, actionUrl
  RETURN_CONFIRMED(
      "[SmartLibrary] Xác nhận trả sách thành công",
      """
          <!doctype html>
          <html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <div style="max-width:640px;margin:0 auto;padding:28px 16px;"><div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <div style="background:#5b5ce2;padding:22px 28px;color:#ffffff;"><div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Library74</div><h1 style="margin:8px 0 0;font-size:24px;">Trả sách thành công</h1></div>
              <div style="padding:28px;">
                <p style="margin:0 0 14px;font-size:16px;">Xin chào <strong>%s</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">Bạn đã trả sách <strong>"%s"</strong> thành công vào ngày <strong>%s</strong>.</p>
                <table style="width:100%%;border-collapse:collapse;margin:20px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                  <tr><td style="padding:12px;color:#6b7280;width:42%%;">Cọc đã thu</td><td style="padding:12px;font-weight:700;">%s</td></tr>
                  <tr><td style="padding:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Phạt gốc</td><td style="padding:12px;border-top:1px solid #e5e7eb;font-weight:700;color:#b91c1c;">%s</td></tr>
                  <tr><td style="padding:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Đã cấn cọc</td><td style="padding:12px;border-top:1px solid #e5e7eb;font-weight:700;color:#b45309;">%s</td></tr>
                  <tr><td style="padding:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Hoàn lại</td><td style="padding:12px;border-top:1px solid #e5e7eb;font-weight:700;color:#047857;">%s</td></tr>
                  <tr><td style="padding:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Cần đóng thêm</td><td style="padding:12px;border-top:1px solid #e5e7eb;font-weight:700;color:#b91c1c;">%s</td></tr>
                </table>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">Nếu có thời gian, hãy đánh giá tài liệu để giúp các bạn đọc khác chọn sách tốt hơn.</p>
                <p style="margin:24px 0;text-align:center;"><a href="%s" style="display:inline-block;background:#5b5ce2;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:8px;">Đánh giá tài liệu</a></p>
              </div>
            </div></div>
          </body></html>
          """
  ),

  // args: fullName, publicationTitle, deadline, actionUrl, actionUrl
  BOOK_AVAILABLE(
      "[SmartLibrary] Sách đặt trước đã sẵn sàng",
      """
          <!doctype html>
          <html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <div style="max-width:640px;margin:0 auto;padding:28px 16px;"><div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <div style="background:#5b5ce2;padding:22px 28px;color:#ffffff;"><div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Library74</div><h1 style="margin:8px 0 0;font-size:24px;">Sách đặt trước đã có sẵn</h1></div>
              <div style="padding:28px;">
                <p style="margin:0 0 14px;font-size:16px;">Xin chào <strong>%s</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">Sách <strong>"%s"</strong> bạn đặt trước hiện đã sẵn sàng tại thư viện.</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">Vui lòng đến nhận trước <strong style="color:#b91c1c;">%s</strong>. Nếu quá hạn, lượt giữ sách có thể chuyển cho bạn đọc tiếp theo.</p>
                <p style="margin:24px 0;text-align:center;"><a href="%s" style="display:inline-block;background:#5b5ce2;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:8px;">Xem đặt trước của tôi</a></p>
              </div>
            </div></div>
          </body></html>
          """
  ),

  // args: fullName, fineAmount, publicationTitle, actionUrl, actionUrl
  FINE_PAID(
      "[SmartLibrary] Xác nhận thanh toán phí phạt",
      """
          <!doctype html>
          <html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <div style="max-width:640px;margin:0 auto;padding:28px 16px;"><div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <div style="background:#5b5ce2;padding:22px 28px;color:#ffffff;"><div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Library74</div><h1 style="margin:8px 0 0;font-size:24px;">Thanh toán phí phạt thành công</h1></div>
              <div style="padding:28px;">
                <p style="margin:0 0 14px;font-size:16px;">Xin chào <strong>%s</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">Khoản phí <strong>%s</strong> liên quan đến sách <strong>"%s"</strong> đã được ghi nhận thanh toán.</p>
                <p style="margin:24px 0;text-align:center;"><a href="%s" style="display:inline-block;background:#5b5ce2;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:8px;">Xem phí phạt của tôi</a></p>
              </div>
            </div></div>
          </body></html>
          """
  ),

  // args: fullName, ticketCode, subject, replyMessage
  CONTACT_REPLY(
      "[Library74] Phản hồi yêu cầu liên hệ",
      """
          <!doctype html>
          <html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <div style="max-width:640px;margin:0 auto;padding:28px 16px;"><div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <div style="background:#5b5ce2;padding:22px 28px;color:#ffffff;"><div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Library74</div><h1 style="margin:8px 0 0;font-size:24px;">Phản hồi từ thư viện</h1></div>
              <div style="padding:28px;">
                <p style="margin:0 0 14px;font-size:16px;">Xin chào <strong>%s</strong>,</p>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#374151;">Thư viện đã phản hồi yêu cầu <strong>%s</strong> về chủ đề <strong>%s</strong>:</p>
                <div style="margin:18px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;font-size:15px;line-height:1.7;color:#374151;">%s</div>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">Nếu vấn đề chưa được giải quyết, vui lòng phản hồi email này hoặc gửi yêu cầu mới trên trang Liên hệ.</p>
              </div>
            </div></div>
          </body></html>
          """
  ),

  // args: fullName, ticketCode, subject, actionUrl, actionUrl
  CONTACT_RESOLVED(
      "[Library74] Yêu cầu hỗ trợ đã được xử lý",
      """
          <!doctype html>
          <html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <div style="max-width:640px;margin:0 auto;padding:28px 16px;"><div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <div style="background:#059669;padding:22px 28px;color:#ffffff;"><div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Library74 Support</div><h1 style="margin:8px 0 0;font-size:24px;">Hỗ trợ đã hoàn tất</h1></div>
              <div style="padding:28px;">
                <p style="margin:0 0 14px;font-size:16px;">Xin chào <strong>%s</strong>,</p>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#374151;">Yêu cầu hỗ trợ <strong>%s</strong> về chủ đề <strong>%s</strong> đã được thủ thư đánh dấu là đã xử lý.</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">Bạn có thể kiểm tra lại nội dung trao đổi, đánh giá chất lượng hỗ trợ hoặc yêu cầu mở lại nếu vấn đề vẫn chưa hoàn tất.</p>
                <p style="margin:24px 0;text-align:center;"><a href="%s" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:8px;">Xem yêu cầu hỗ trợ</a></p>
                <p style="margin:0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:13px;line-height:1.5;word-break:break-all;">
                  <a href="%s" style="color:#047857;">%s</a>
                </p>
              </div>
              <div style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.6;">
                Email này được gửi từ Trung tâm hỗ trợ Library74.
              </div>
            </div></div>
          </body></html>
          """
  );

  private final String subject;
  private final String content;

  EmailTemplates(String subject, String content) {
    this.subject = subject;
    this.content = content;
  }

  public String formatContent(Object... args) {
    Object[] escapedArgs = Arrays.stream(args)
        .map(arg -> HtmlUtils.htmlEscape(arg == null ? "" : arg.toString()))
        .toArray();
    return String.format(this.content, escapedArgs);
  }
}
