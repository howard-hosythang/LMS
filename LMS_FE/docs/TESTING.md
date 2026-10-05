# Quy tắc kiểm thử Frontend

Áp dụng cùng [quy tắc chung](../../CONTRIBUTING.md).

## 1. Công cụ và vị trí test

- Jest, React Testing Library, jest-dom, user-event và jsdom theo cấu hình dự án.
- Cấu hình: [jest.config.cjs](../jest.config.cjs); thiết lập chung: [src/test/setup.ts](../src/test/setup.ts).
- Jest hiện tìm test tại `src/**/*.test.ts` và `src/**/*.test.tsx`.
- Component nằm trong `components/` hoặc `pages/` không đồng nghĩa test đặt cạnh component sẽ được Jest tìm thấy. Đặt test trong `src/components/`, service trong `src/api/`, helper trong `src/utils/` theo cấu trúc hiện có.

Tham khảo:

- [TransactionInquiry.test.tsx](../src/components/TransactionInquiry.test.tsx): tra cứu, URL và tương tác.
- [CurrencyInput.test.tsx](../src/components/CurrencyInput.test.tsx): định dạng tiền, giá trị nguyên bản và caret.
- [DepositPayOsPayment.test.tsx](../src/components/DepositPayOsPayment.test.tsx): giao diện thanh toán cọc.
- [depositPaymentMethod.test.ts](../src/api/depositPaymentMethod.test.ts): tham số API thu cọc.

## 2. Nguyên tắc test giao diện

- Kiểm tra điều người dùng nhìn thấy và thao tác được, không kiểm tra state nội bộ của React.
- Ưu tiên truy vấn theo role/name, label và nội dung; chỉ dùng `data-testid` khi không có cách phù hợp khác.
- Dùng `userEvent.setup()` và `await` tương tác khi mô phỏng người dùng. `fireEvent` phù hợp với sự kiện thấp tầng hoặc cần kiểm soát caret cụ thể.
- Với API bất đồng bộ, dùng `findBy...` hoặc `waitFor` để đợi điều kiện xác định; không chờ vài giây cố định.
- Cung cấp router/context cần thiết theo hành vi thật, bao gồm LanguageContext khi giao diện phụ thuộc ngôn ngữ.
- Mock ở ranh giới service/API; không mock chính hành vi component cần kiểm tra.
- Kiểm tra loading, error, empty và success khi thay đổi liên quan; kiểm tra hành động bị vô hiệu hóa có thực sự không gửi API.
- Snapshot chỉ hỗ trợ phát hiện thay đổi, không thay cho assertion tương tác/payload.
- Reset mock, timer, listener/subscription; tránh dữ liệu và request của test trước ảnh hưởng test sau.

Ví dụ cấu trúc cho tìm kiếm bằng Enter:

1. Arrange: mock API và render trang với router/context cần thiết.
2. Act: nhập từ khóa.
3. Assert: ô input giữ nội dung/focus; chưa gửi yêu cầu tìm kiếm mới do gõ phím.
4. Act: nhấn Enter.
5. Assert: từ khóa và trang số gửi API/URL đúng; chờ kết quả hiển thị.

Cần phân biệt request tải ban đầu với request do thao tác; không mặc định tổng số call luôn bằng 0 khi component vừa mount.

## 3. Các trường hợp đặc thù LMS

| Phạm vi | Hành vi cần bảo vệ khi thay đổi liên quan |
| --- | --- |
| Tra cứu | Gõ không mất focus, chỉ gửi khi Enter theo yêu cầu hiện tại, reset bộ lọc và Back/Forward đúng |
| Router | Link tab mới đúng HashRouter; filter/URL khôi phục được, không điều hướng nhầm trang public |
| Drawer | Mở/đóng đúng đối tượng, Escape/overlay nếu hỗ trợ, không reset scroll khi chỉ đổi query |
| Tiền tệ | Hiển thị phân cách hàng nghìn; payload số đúng; không làm lệch caret khi nhập giữa chuỗi |
| payOS/polling | Chưa PAID không hoàn tất thu; lỗi/timeout có phản hồi; đóng modal dọn polling; bỏ qua response cũ không còn phù hợp |
| Cơ sở | Đổi branch làm mới dữ liệu/lựa chọn; không xác nhận sách ngoài phạm vi đang thao tác |
| Ngôn ngữ | Nhãn và trạng thái mới có Vi/En; test các bản dịch liên quan, tránh hard-code một ngôn ngữ |
| Quyền truy cập | Hiển thị/thao tác theo role; không coi test FE là kiểm chứng phân quyền BE |

Nếu dùng fake timers để kiểm tra polling, điều khiển timer rõ ràng, xử lý promise/React update và khôi phục timer thật sau test. Không gọi payOS thật trong Jest.

jsdom không chứng minh bố cục thực tế, độ rộng bảng, scrollbar hay giật màn hình. Thay đổi responsive/scroll/drawer cần kiểm tra thêm trên trình duyệt: desktop/mobile phù hợp, light/dark khi liên quan; ghi bước thực hiện và kết quả vào PR. Không khẳng định đã kiểm tra thị giác chỉ vì unit test pass.

## 4. Hợp đồng API

- Test service phải kiểm tra method, endpoint, query/body và giá trị mặc định liên quan.
- Fixture response phải bám hợp đồng BE về field, nullability, enum và kiểu ID/số tiền.
- Khi BE thay đổi API, cập nhật cả test service và test component bị ảnh hưởng.
- Jest với mock chỉ kiểm chứng FE xử lý fixture. Để chứng minh FE/BE tương thích, cần chạy luồng thật trên môi trường test/staging hoặc contract/integration test thích hợp.
- Chưa có gate FE/BE chung trong CI hiện tại; không ghi nhận gate này như tính năng đã có.

## 5. Lệnh kiểm tra bắt buộc

Chạy từ thư mục `LMS_FE`, dùng Node 20 để đồng bộ với CI hiện tại:

```powershell
npm ci
npm test -- --runInBand
npx tsc --noEmit
npm run build
```

Chạy một file khi phát triển:

```powershell
npm test -- --runInBand --runTestsByPath src/components/TransactionInquiry.test.tsx
```

Đo coverage khi cần đánh giá vùng thiếu test:

```powershell
npm run test:coverage -- --runInBand
```

Test chọn lọc không thay cho suite đầy đủ trước PR. `npm run build` dùng Vite, không thay cho kiểm tra kiểu đầy đủ bằng `npx tsc --noEmit`.

## 6. Bằng chứng trong PR

- Ghi riêng kết quả Jest, TypeScript và build; báo cáo test skip nếu có.
- Với sửa lỗi tương tác, mô tả cách tái hiện và test hồi quy mới.
- Với thay đổi thị giác, ghi kích thước/mode đã kiểm tra; ảnh trước/sau khi hữu ích.
- Không có script `npm run lint` trong cấu hình hiện tại; không yêu cầu thành viên chạy lệnh không tồn tại.
- Khi sửa BE, Backend CI chạy thêm job kiểm tra FE: Jest, `npx tsc --noEmit` và build. Các job BE/FE chạy song song; Backend CI chỉ thành công khi cả hai pass, nên lỗi FE cũng chặn Backend CD tự động. Đây không phải test tích hợp API thật và không kích hoạt Frontend CD. Frontend CI độc lập hiện chạy Jest và build, chưa có bước TypeScript riêng.
