# Hình thức thu cọc khi giao sách

## Phạm vi

Thủ thư chọn **Tiền mặt** (`CASH`, mặc định) hoặc **Chuyển khoản / QR** (`BANK_TRANSFER`) tại Mượn trực tiếp và Xác nhận giao sách, gồm phiếu mượn chờ lấy và đặt trước. Chỉ hiển thị lựa chọn khi chính sách có thu cọc > 0. Kết quả giao sách hiển thị số tiền và hình thức backend đã ghi nhận. Giao dịch tiếp theo mặc định lại tiền mặt.

V60 ban đầu chỉ ghi nhận phương thức thu. **Từ V61 đã bổ sung QR và xác minh cọc qua payOS**; khi có thu cọc, BANK_TRANSFER bắt buộc có đơn PAID khớp bạn đọc/bản sao/phiếu. Xem [DEPOSIT_PAYOS.md](DEPOSIT_PAYOS.md) để biết API, guardrails và kiểm thử. Không thay đổi cách tính, cấn trừ, hoàn cọc hoặc thu phí phạt.

## API

- `POST /api/v1/transactions/borrow-direct`: body thêm `paymentMethod` tùy chọn.
- `POST /api/v1/transactions/{id}/confirm-pickup?paymentMethod=BANK_TRANSFER`.
- `POST /api/v1/reservations/{id}/confirm-pickup?paymentMethod=BANK_TRANSFER`.
- Response giao sách thêm `depositPaymentMethod`.
- Thiếu, null hoặc chuỗi trắng mặc định `CASH`. Giá trị khác hai mã hợp lệ bị từ chối trước khi thay đổi dữ liệu. Chữ hoa là bắt buộc.

## Lưu trữ và báo cáo

Migration `V60__deposit_payment_method.sql` (V48 đã được sử dụng): thêm `borrowing_transactions.deposit_payment_method` và `borrow_deposit_events.payment_method`, NOT NULL, default CASH, CHECK hai mã hợp lệ. Không sửa migration cũ.

Thu cọc lưu cùng phương thức trên giao dịch, sự kiện COLLECTED và audit log. Không thu cọc thì không tạo sự kiện thu tiền. Các sự kiện quyết toán hiện giữ mặc định CASH; tính năng này chưa bổ sung lựa chọn phương thức hoàn cọc. Không tự suy ra phương thức hoàn từ phương thức thu.

Sheet đối soát Excel hiển thị Chuyển khoản/Tiền mặt theo sự kiện; APPLIED_TO_FINE ưu tiên Trừ cọc. ADDITIONAL_DUE vẫn là công nợ, không phải dòng tiền đã thu.

**Dữ liệu trước migration** nhận CASH theo default kỹ thuật yêu cầu; đây không phải xác minh phương thức thực tế của các khoản thu/hoàn lịch sử. Cần lưu ý khi đối soát dữ liệu cũ.

Flyway áp dụng migration khi backend triển khai/khởi động với cơ sở dữ liệu. Kiểm thử SQL thật cần Docker/PostgreSQL; unit test không thay thế xác nhận migration trên môi trường triển khai.
