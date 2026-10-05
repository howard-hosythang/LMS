## Mục tiêu và thay đổi

<!-- Nêu yêu cầu/lỗi được xử lý, phạm vi BE/FE/AI/docs và hành vi trước/sau. -->

## Test bổ sung hoặc cập nhật

<!-- Ghi tên file/test, trường hợp thành công, lỗi và ranh giới quan trọng. Nếu không cần test tự động, giải thích cụ thể. -->

## Bằng chứng kiểm tra

| Lệnh hoặc bước thủ công | Kết quả PASS / FAIL / SKIP / Chưa chạy | Ghi chú |
| --- | --- | --- |
| | | |

<!-- Ghi số test nếu có; môi trường/Docker; lý do skip/chưa chạy. Không ghi PASS nếu chưa thực hiện. -->

## Tác động và rủi ro

<!-- API: endpoint/field/kiểu/nullability/client. DB: version migration và kiểm tra nâng cấp. Tài chính/phân quyền/branch: rủi ro và cách bảo vệ. Ghi “Không có” nếu không liên quan. -->

## Checklist tác giả

<!-- Đánh dấu việc đã làm; mục không áp dụng ghi N/A kèm lý do bên dưới. -->

- [ ] Đã đọc CONTRIBUTING.md và hướng dẫn test của thành phần liên quan.
- [ ] Có test phù hợp cho hành vi mới/sửa lỗi hoặc giải thích vì sao không cần.
- [ ] Không làm yếu/xóa/skip test chỉ để có kết quả xanh.
- [ ] Thay đổi BE: toàn bộ Maven test đã chạy; test SQL/migration liên quan thực sự chạy với Docker.
- [ ] Thay đổi FE: toàn bộ Jest, `npx tsc --noEmit` và `npm run build` đã pass.
- [ ] Thay đổi API: đã kiểm tra client bị ảnh hưởng và cung cấp bằng chứng tích hợp FE/BE.
- [ ] Thay đổi UI: đã kiểm tra trình duyệt ở kích thước/ngôn ngữ/theme phù hợp.
- [ ] Migration mới không trùng version; không sửa migration đã triển khai.
- [ ] Không có secret/dữ liệu cá nhân thật; không chạy test ghi dữ liệu vào production.
- [ ] Đã cập nhật tài liệu liên quan và công khai giới hạn kiểm chứng.

Các mục N/A và lý do:

## Checklist reviewer

- [ ] Test kiểm chứng hành vi thực tế, gồm trường hợp bị từ chối/rủi ro liên quan.
- [ ] Bằng chứng kiểm tra đủ; các mục skip/chưa chạy/N/A được đánh giá, không coi là PASS.
- [ ] Tác động API, database, phân quyền và tài chính đã được xem xét khi liên quan.

Tham khảo [quy tắc đóng góp và kiểm thử](../CONTRIBUTING.md) trong repository.
