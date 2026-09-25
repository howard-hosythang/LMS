# 05. Deploy/DevOps - Học Và Nắm Library74 Từ Gốc

Tài liệu này xem bạn là người mới học lập trình web ở mức cơ bản. Mục tiêu không phải học thuộc lệnh deploy, mà là hiểu khi đưa một hệ thống lên internet thì chuyện gì xảy ra, vì sao cần Docker, vì sao cần reverse proxy, vì sao phải kiểm tra `.env.prod`, và khi hội đồng hỏi thì bạn giải thích được bằng logic.

Lộ trình học toàn project:

1. FE - Frontend: người dùng nhìn thấy gì, bấm gì, dữ liệu đi đâu.
2. DB - Database: dữ liệu được lưu như thế nào.
3. BE - Backend: nghiệp vụ, bảo mật, API.
4. AI - Recommendation, semantic search, xử lý tri thức.
5. Deploy/DevOps - đưa hệ thống chạy thật trên server.

Trong file này ta học phần Deploy/DevOps.

---

## 1. Deploy Là Gì?

### 1.1. Vấn Đề Thực Tế

Khi lập trình ở máy cá nhân, ta thường chạy hệ thống bằng nhiều lệnh riêng:

```text
Frontend chạy bằng npm run dev.
Backend chạy bằng Spring Boot.
AI chạy bằng FastAPI hoặc worker.
Database chạy bằng Docker hoặc local PostgreSQL.
```

Nhưng người dùng thật không thể truy cập máy cá nhân của ta. Người dùng cần vào:

```text
https://library74.uk
```

Vì vậy project cần được đưa lên một máy chủ chạy ổn định 24/7.

### 1.2. Định Nghĩa

**Deploy** là quá trình đưa source code, cấu hình, database, service và tài nguyên cần thiết lên môi trường chạy thật để người dùng có thể truy cập qua internet.

Nói đơn giản:

```text
Code trong máy dev -> build -> đưa lên server -> chạy bằng container -> domain trỏ vào -> người dùng truy cập
```

### 1.3. DevOps Là Gì?

**DevOps** là cách làm kết hợp giữa phát triển phần mềm và vận hành hệ thống.

Trong project Library74, DevOps trả lời các câu hỏi:

- Làm sao chạy frontend, backend, AI, database cùng lúc?
- Làm sao domain `library74.uk` trỏ đúng vào web?
- Làm sao có HTTPS?
- Làm sao cấu hình mật khẩu, OAuth, mail mà không hardcode trong code?
- Làm sao kiểm tra service còn sống?
- Làm sao deploy thay đổi mới mà không xóa database?
- Làm sao rollback khi deploy lỗi?

**Trả lời hội đồng:**

> Deploy là bước đưa hệ thống từ môi trường phát triển lên môi trường production để người dùng thật sử dụng. Với Library74, deploy không chỉ là chạy frontend, mà là chạy cả frontend, backend, AI service, worker, database, message queue và reverse proxy theo một cấu hình thống nhất.

---

## 2. Production Khác Local Như Thế Nào?

### 2.1. Local

Local là môi trường trên máy lập trình viên.

Đặc điểm:

- Dễ sửa code.
- Dễ restart.
- Có thể dùng dữ liệu test.
- Lỗi không ảnh hưởng người dùng thật.
- Có thể chạy bằng `npm run dev`, IDE, terminal.

Ví dụ:

```text
http://localhost:5173
http://localhost:8080
http://localhost:8001
```

### 2.2. Production

Production là môi trường người dùng thật truy cập.

Đặc điểm:

- Cần chạy ổn định.
- Cần HTTPS.
- Cần domain thật.
- Cần secret thật.
- Cần dữ liệu thật.
- Cần backup.
- Cần hạn chế downtime.

Ví dụ:

```text
https://library74.uk
```

### 2.3. Vì Sao Không Chạy Production Bằng `npm run dev`?

`npm run dev` sinh ra để lập trình, không phải để phục vụ người dùng thật.

Lý do:

- Dev server ưu tiên tốc độ phát triển, không tối ưu bảo mật.
- Không phù hợp để chịu traffic thật.
- Không tự tối ưu file tĩnh.
- Không phải cách chuẩn để chạy production.

Với frontend production, ta build ra file tĩnh:

```text
HTML + CSS + JS đã tối ưu
```

Sau đó dùng nginx trong container để phục vụ.

**Trả lời hội đồng:**

> Local dùng để phát triển và kiểm thử. Production dùng để phục vụ người dùng thật nên cần cấu hình ổn định hơn, có HTTPS, domain, secret thật, backup và healthcheck. Vì vậy production của project được chạy bằng Docker Compose thay vì các lệnh dev riêng lẻ.

---

## 3. Bức Tranh Production Của Library74

Production hiện tại của Library74 gồm các service chính:

| Service | Vai trò |
|---|---|
| `caddy` | Reverse proxy, nhận request từ internet qua cổng 80/443 |
| `frontend` | React/Vite đã build, phục vụ qua nginx |
| `backend` | Spring Boot API, xử lý nghiệp vụ chính |
| `ai-api` | FastAPI service cho AI |
| `ai-worker` | Worker xử lý PDF, vector, metadata |
| `postgres` | PostgreSQL + pgvector, lưu dữ liệu chính và vector |
| `kafka` | Hàng đợi event, email, notification |
| `rabbitmq` | Hàng đợi tác vụ AI |

Luồng truy cập chính:

```text
Người dùng
  -> https://library74.uk
  -> Caddy
  -> Frontend hoặc Backend
  -> Database / AI / Queue
```

Luồng API:

```text
Browser
  -> https://library74.uk/api/...
  -> Caddy
  -> Backend Spring Boot
  -> PostgreSQL / Kafka / AI
```

Luồng AI:

```text
Backend
  -> ai-api
  -> RabbitMQ
  -> ai-worker
  -> PostgreSQL + pgvector
```

**Trả lời hội đồng:**

> Production của Library74 được tách thành nhiều service vì mỗi phần có trách nhiệm khác nhau. Frontend phục vụ giao diện, backend xử lý nghiệp vụ, AI xử lý tìm kiếm ngữ nghĩa và recommendation, database lưu dữ liệu, queue giúp xử lý bất đồng bộ, còn Caddy đứng trước để nhận traffic và cấp HTTPS.

---

## 4. Server, Domain, DNS Và HTTPS

### 4.1. Server Là Gì?

Server là máy tính chạy trên internet, có địa chỉ IP public, ví dụ:

```text
34.21.174.195
```

Người dùng không nhớ IP, họ nhớ domain:

```text
library74.uk
```

### 4.2. Domain Là Gì?

Domain là tên dễ nhớ của website.

Ví dụ:

```text
library74.uk
```

Khi người dùng nhập domain, trình duyệt cần biết domain đó trỏ tới IP nào.

### 4.3. DNS Là Gì?

DNS giống danh bạ internet:

```text
library74.uk -> 34.21.174.195
```

Kiểm tra DNS:

```bash
dig +short library74.uk A
```

Kỳ vọng:

```text
34.21.174.195
```

### 4.4. HTTPS Là Gì?

HTTPS là HTTP có mã hóa TLS.

Nó giúp:

- Mã hóa dữ liệu giữa browser và server.
- Tránh bị đọc trộm thông tin đăng nhập.
- Tăng độ tin cậy của website.
- Cho phép browser tin tưởng domain.

Trong Library74, Caddy tự xin và gia hạn certificate HTTPS.

**Trả lời hội đồng:**

> DNS giúp domain `library74.uk` trỏ tới IP server. Caddy nhận request từ domain đó và tự cấp HTTPS certificate, nhờ vậy người dùng truy cập bằng kết nối bảo mật thay vì HTTP thường.

---

## 5. Docker Là Gì?

### 5.1. Vấn Đề Thực Tế

Nếu không dùng Docker, khi deploy ta phải cài thủ công rất nhiều thứ trên server:

- Node.js đúng version.
- Java đúng version.
- Python đúng version.
- PostgreSQL đúng extension.
- Kafka.
- RabbitMQ.
- Nginx hoặc Caddy.
- Biến môi trường.
- Script chạy từng service.

Rủi ro:

- Máy dev chạy được nhưng server không chạy.
- Version lệch nhau.
- Cài đặt khó lặp lại.
- Chuyển server rất mệt.

### 5.2. Định Nghĩa

**Docker** là công cụ đóng gói ứng dụng và môi trường chạy của nó thành container.

Container có thể hiểu là một môi trường chạy cô lập, có đủ thứ app cần để chạy.

Ví dụ:

```text
backend container có Java và file .jar
frontend container có nginx và file build tĩnh
ai-api container có Python packages
postgres container có PostgreSQL
```

### 5.3. Image Và Container

**Image** là bản đóng gói.

**Container** là image đang chạy.

So sánh:

```text
Image giống file cài đặt.
Container giống chương trình đang chạy từ file cài đặt đó.
```

Ví dụ:

```bash
docker images
docker ps
```

`docker images` xem các image đã build hoặc pull.

`docker ps` xem các container đang chạy.

**Trả lời hội đồng:**

> Docker giúp đóng gói từng phần của hệ thống cùng môi trường chạy của nó. Nhờ đó production không phụ thuộc quá nhiều vào việc server đã cài gì sẵn, và việc deploy có thể lặp lại ổn định hơn.

---

## 6. Docker Compose Là Gì?

### 6.1. Vấn Đề Thực Tế

Project Library74 không chỉ có một service.

Nếu chạy thủ công, ta phải nhớ rất nhiều lệnh:

```text
Chạy database.
Chạy Kafka.
Chạy RabbitMQ.
Chạy backend.
Chạy AI API.
Chạy AI worker.
Chạy frontend.
Chạy reverse proxy.
```

Ngoài ra còn phải nối mạng giữa chúng:

```text
backend gọi postgres bằng hostname nào?
backend gọi kafka bằng hostname nào?
backend gọi ai-api bằng hostname nào?
caddy forward /api vào đâu?
```

### 6.2. Định Nghĩa

**Docker Compose** là công cụ khai báo và chạy nhiều container bằng một file YAML.

Trong project, file production là:

```text
docker-compose.prod.yml
```

Compose định nghĩa:

- Service nào cần chạy.
- Build image từ thư mục nào.
- Biến môi trường nào được truyền vào.
- Cổng nào được expose.
- Volume nào để lưu dữ liệu.
- Service nào phụ thuộc service nào.
- Healthcheck ra sao.
- Network nội bộ ra sao.

Lệnh chuẩn:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Ý nghĩa:

- `docker compose`: dùng Docker Compose.
- `--env-file .env.prod`: đọc biến môi trường production.
- `-f docker-compose.prod.yml`: dùng file compose production.
- `ps`: xem trạng thái service.

**Trả lời hội đồng:**

> Docker chạy từng container riêng lẻ. Docker Compose giúp quản lý cả một hệ thống nhiều container bằng một file cấu hình. Với Library74, Compose giúp chạy đồng bộ frontend, backend, AI, database, queue và reverse proxy.

---

## 7. Reverse Proxy Và Caddy

### 7.1. Reverse Proxy Là Gì?

Reverse proxy là service đứng trước các service nội bộ.

Người dùng chỉ nhìn thấy:

```text
https://library74.uk
```

Nhưng bên trong, reverse proxy quyết định request đi đâu.

Ví dụ:

```text
/api/* -> backend:8080
/ws/*  -> backend:8080
khác   -> frontend:80
```

### 7.2. Vì Sao Cần Reverse Proxy?

Cần reverse proxy vì:

- Người dùng chỉ cần một domain duy nhất.
- Backend không cần mở trực tiếp ra internet.
- Frontend và backend có thể chạy trong network nội bộ.
- Có thể xử lý HTTPS ở một chỗ.
- Có thể route WebSocket.

### 7.3. Caddy Trong Project

File cấu hình:

```text
deploy/Caddyfile
```

Ý tưởng:

```text
library74.uk {
  /api/* -> backend
  /ws/*  -> backend
  còn lại -> frontend
}
```

Vì vậy browser gọi:

```text
https://library74.uk/api/books
```

Caddy sẽ chuyển vào:

```text
backend:8080/api/books
```

Browser gọi:

```text
https://library74.uk
```

Caddy sẽ chuyển vào:

```text
frontend:80
```

**Trả lời hội đồng:**

> Caddy là reverse proxy của hệ thống. Nó nhận request công khai từ internet, tự xử lý HTTPS, rồi chuyển request vào đúng service nội bộ. Nhờ đó backend và AI không cần public trực tiếp ra internet.

---

## 8. Biến Môi Trường Và `.env.prod`

### 8.1. Vấn Đề Thực Tế

Code không nên chứa trực tiếp:

- Mật khẩu database.
- Mật khẩu app mail.
- OAuth secret.
- Domain production.
- API key.

Nếu hardcode secret trong code, khi push Git sẽ lộ thông tin nhạy cảm.

### 8.2. Biến Môi Trường Là Gì?

Biến môi trường là cấu hình được truyền từ bên ngoài vào app lúc chạy.

Ví dụ:

```env
PUBLIC_DOMAIN=library74.uk
MAIL_HOST=smtp.zoho.com
MAIL_SENDER_USERNAME=admin@library74.uk
MAIL_SENDER_PASSWORD=<zoho_app_password>
```

### 8.3. `.env.prod` Dùng Để Làm Gì?

`.env.prod` chứa cấu hình production thật.

File này dùng cho Docker Compose:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

### 8.4. Vì Sao Không Commit `.env.prod`?

Vì `.env.prod` chứa secret thật.

Nếu commit lên Git:

- Người khác có thể thấy mật khẩu.
- Mail/domain/database có thể bị lạm dụng.
- Production có thể bị chiếm quyền.

### 8.5. Quy Tắc Viết `.env.prod`

Nên dùng dạng đơn giản:

```env
KEY=value
```

Tránh tùy tiện thêm dấu nháy hoặc khoảng trắng quanh dấu `=`.

Đúng:

```env
MAIL_NOREPLY_ADDRESS=noreply@library74.uk
```

Không nên:

```env
MAIL_NOREPLY_ADDRESS = noreply@library74.uk
```

Với display name có khoảng trắng hoặc dấu nháy đơn, project nên để trong `application.yml` hoặc code default nếu đã kiểm soát được parser.

Ví dụ:

```text
Library74 System
Library74's Support Center
```

Lý do: nhiều trình đọc `.env` có thể hiểu khác nhau nếu value có dấu nháy, khoảng trắng, hoặc ký tự đặc biệt.

### 8.6. Mail Production Của Library74

Luồng mail mong muốn:

| Trường hợp | From address | Display name |
|---|---|---|
| Verify email | `noreply@library74.uk` | `Library74 System` |
| Forgot/reset password | `noreply@library74.uk` | `Library74 System` |
| Mượn sách | `noreply@library74.uk` | `Library74 System` |
| Trả sách | `noreply@library74.uk` | `Library74 System` |
| Phí phạt | `noreply@library74.uk` | `Library74 System` |
| Đặt trước | `noreply@library74.uk` | `Library74 System` |
| Thủ thư bấm Đã xử lý ở Contact Inbox | `support@library74.uk` | `Library74's Support Center` |

Ý tưởng thiết kế:

- `noreply` dùng cho mail hệ thống tự động.
- `support` dùng cho mail hỗ trợ người dùng.

**Trả lời hội đồng:**

> `.env.prod` tách cấu hình production khỏi source code. Những thông tin như mật khẩu mail, database password, domain, OAuth secret được truyền vào lúc chạy, giúp bảo mật hơn và dễ thay đổi cấu hình mà không phải sửa code.

---

## 9. Frontend Được Deploy Như Thế Nào?

### 9.1. Frontend Local

Khi phát triển:

```bash
cd LMS_FE
npm run dev
```

Vite mở dev server để lập trình nhanh.

### 9.2. Frontend Production

Khi deploy:

```bash
cd LMS_FE
npm run build
```

Build tạo thư mục:

```text
dist/
```

Trong `dist/` có:

```text
index.html
assets/*.js
assets/*.css
```

Sau đó Docker image frontend dùng nginx để phục vụ các file này.

### 9.3. Vì Sao Frontend Cần Build Lại Khi Sửa UI?

Vì production không chạy code `.tsx` trực tiếp.

Browser production chỉ nhận file tĩnh đã build.

Nếu sửa:

```text
LMS_FE/pages/user_pages/ContactTicketsPage.tsx
```

Nhưng không build lại frontend container, production vẫn dùng bản cũ.

### 9.4. Lệnh Deploy Khi Chỉ Sửa FE

Trên VPS:

```bash
cd /home/hosythang/LMS
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build frontend
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d caddy
```

Sau đó kiểm tra:

```bash
curl -I https://library74.uk
```

Kỳ vọng:

```text
HTTP/2 200
```

**Trả lời hội đồng:**

> Frontend production không chạy bằng Vite dev server. React được build thành HTML, CSS, JS tĩnh rồi được nginx serve trong container. Khi sửa giao diện, cần build lại container frontend để production nhận bản mới.

---

## 10. Backend Được Deploy Như Thế Nào?

### 10.1. Backend Local

Khi phát triển backend, ta có thể chạy bằng IDE hoặc Maven.

Backend nhận request từ frontend:

```text
GET /api/books
POST /api/auth/login
POST /api/loans
```

### 10.2. Backend Production

Production backend chạy trong container Spring Boot.

Docker build backend từ:

```text
LMS_BE/
```

Backend cần nhiều cấu hình:

- Database URL.
- Kafka URL.
- AI service URL.
- JWT secret.
- OAuth config.
- Mail config.
- Domain frontend.

Các cấu hình này đến từ `.env.prod` và `docker-compose.prod.yml`.

### 10.3. Vì Sao Backend Cần Healthcheck?

Backend có thể container đã start nhưng app chưa sẵn sàng.

Ví dụ:

- Đang kết nối database.
- Đang load Spring context.
- Đang chạy migration hoặc init.

Healthcheck giúp Docker biết backend thật sự đã sẵn sàng chưa.

Kiểm tra:

```bash
docker exec lms_backend wget -qO- http://localhost:8080/actuator/health
```

Kỳ vọng:

```json
{"status":"UP"}
```

### 10.4. Lệnh Deploy Khi Chỉ Sửa BE

Trên VPS:

```bash
cd /home/hosythang/LMS
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build backend
```

Xem log:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=120 backend
```

Kiểm tra health:

```bash
docker exec lms_backend wget -qO- http://localhost:8080/actuator/health
```

**Trả lời hội đồng:**

> Backend production là Spring Boot chạy trong container. Khi deploy backend, Docker build lại ứng dụng, truyền cấu hình production từ `.env.prod`, rồi healthcheck đảm bảo API đã sẵn sàng trước khi các service khác phụ thuộc vào nó.

---

## 11. AI Được Deploy Như Thế Nào?

### 11.1. AI Có Hai Phần

Trong Library74, AI không chỉ là một API đơn giản.

AI gồm:

```text
ai-api    -> nhận request từ backend
ai-worker -> xử lý tác vụ nặng phía sau
```

### 11.2. Vì Sao Cần Worker?

Một số tác vụ AI có thể tốn thời gian:

- Đọc PDF.
- Chia chunk.
- Tạo embedding.
- Lưu vector.
- Xử lý metadata.

Nếu backend hoặc API chờ trực tiếp, request có thể timeout.

Vì vậy hệ thống dùng queue:

```text
Backend -> ai-api -> RabbitMQ -> ai-worker
```

Worker xử lý sau, không làm request chính bị treo quá lâu.

### 11.3. AI Dùng Database Như Thế Nào?

AI dùng PostgreSQL có pgvector để lưu vector embedding.

Ý tưởng:

```text
Nội dung sách -> embedding vector -> lưu vào database -> tìm kiếm ngữ nghĩa
```

### 11.4. Lệnh Deploy Khi Sửa AI

Trên VPS:

```bash
cd /home/hosythang/LMS
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build ai-api ai-worker
```

Kiểm tra:

```bash
docker exec lms_ai_api curl -fsS http://localhost:8001/health
```

Kỳ vọng:

```json
{"status":"ok"}
```

**Trả lời hội đồng:**

> AI được tách thành API và worker để các tác vụ nặng không làm nghẽn request chính. API nhận yêu cầu, worker xử lý nền qua RabbitMQ, còn vector được lưu trong PostgreSQL với pgvector để phục vụ semantic search và recommendation.

---

## 12. Database Và Volume

### 12.1. Vấn Đề Thực Tế

Container có thể bị xóa và tạo lại khi deploy.

Nếu dữ liệu nằm trực tiếp trong container, khi container bị xóa thì dữ liệu cũng mất.

Database production không được phép mất dữ liệu chỉ vì rebuild container.

### 12.2. Volume Là Gì?

**Volume** là vùng lưu trữ bền vững do Docker quản lý.

PostgreSQL container có thể thay đổi, nhưng dữ liệu nằm trong volume:

```text
postgres_data
```

Nói đơn giản:

```text
Container là phần chạy.
Volume là phần giữ dữ liệu.
```

### 12.3. Lệnh Nguy Hiểm

Không chạy trên production:

```bash
docker compose down -v
```

Vì `-v` xóa volume.

Hậu quả có thể gồm:

- Mất database.
- Mất dữ liệu Kafka/RabbitMQ.
- Mất cache model.
- Mất certificate Caddy.

### 12.4. Deploy Có Xóa Database Không?

Lệnh deploy bình thường:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build backend
```

Không xóa volume database.

Nó chỉ build/recreate service cần thiết.

**Trả lời hội đồng:**

> Database production phải được lưu trong Docker volume để dữ liệu không mất khi container được recreate. Khi deploy chỉ nên rebuild service cần thay đổi, tuyệt đối tránh `down -v` vì lệnh đó xóa volume và có thể làm mất dữ liệu thật.

---

## 13. Message Queue: Kafka Và RabbitMQ

### 13.1. Queue Là Gì?

Queue là hàng đợi tác vụ.

Thay vì xử lý ngay mọi thứ trong cùng một request, hệ thống có thể ghi một event vào queue để service khác xử lý sau.

Ví dụ:

```text
Người dùng mượn sách
  -> backend cập nhật giao dịch
  -> đẩy event gửi mail
  -> service xử lý mail gửi sau
```

### 13.2. Kafka Trong Project

Kafka dùng cho event, email, notification.

Ý nghĩa:

- Giảm phụ thuộc giữa nghiệp vụ chính và tác vụ phụ.
- Tăng khả năng xử lý bất đồng bộ.
- Nếu gửi mail chậm, nghiệp vụ chính không nhất thiết phải bị kẹt.

### 13.3. RabbitMQ Trong Project

RabbitMQ dùng cho AI worker.

Ý nghĩa:

- Tác vụ AI có thể nặng.
- Worker xử lý dần.
- API không phải làm hết trong một request.

**Trả lời hội đồng:**

> Kafka và RabbitMQ đều giúp xử lý bất đồng bộ. Trong project, Kafka phục vụ event, email, notification của backend, còn RabbitMQ phục vụ tác vụ AI worker. Việc dùng queue giúp hệ thống không bị nghẽn khi có thao tác tốn thời gian.

---

## 14. Healthcheck Là Gì?

### 14.1. Vấn Đề Thực Tế

Một container có thể "đang chạy" nhưng app bên trong chưa dùng được.

Ví dụ:

```text
Container backend đã start.
Nhưng Spring Boot chưa boot xong.
Database connection chưa sẵn sàng.
Endpoint vẫn lỗi.
```

Nếu chỉ nhìn `running`, ta dễ tưởng service đã ổn.

### 14.2. Định Nghĩa

**Healthcheck** là cơ chế kiểm tra service có thật sự sẵn sàng không.

Ví dụ backend:

```bash
docker exec lms_backend wget -qO- http://localhost:8080/actuator/health
```

Ví dụ AI:

```bash
docker exec lms_ai_api curl -fsS http://localhost:8001/health
```

### 14.3. Trạng Thái Cần Thấy

Xem toàn bộ service:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Kỳ vọng:

```text
lms_postgres   healthy
lms_kafka      healthy
lms_rabbitmq   healthy
lms_backend    healthy
lms_ai_api     healthy
lms_ai_worker  Up
lms_frontend   Up
lms_caddy      Up
```

**Trả lời hội đồng:**

> Healthcheck cho biết service có thật sự sẵn sàng phục vụ hay không, không chỉ là container đã chạy. Điều này quan trọng trong hệ thống nhiều service vì backend cần database, AI cần backend và RabbitMQ, Caddy cần route tới service khỏe.

---

## 15. Log Và Debug Production

### 15.1. Vì Sao Cần Log?

Khi production lỗi, người dùng chỉ thấy:

```text
Không đăng nhập được.
Không gửi mail được.
Trang trắng.
API lỗi 500.
```

Nhưng nguyên nhân thật nằm trong log.

### 15.2. Xem Log Service

Backend:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=120 backend
```

Frontend:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=120 frontend
```

Caddy:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=120 caddy
```

AI:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=120 ai-api ai-worker
```

### 15.3. Cách Đọc Log Cơ Bản

Khi đọc log, tìm:

- `ERROR`
- `Exception`
- `Connection refused`
- `Authentication failed`
- `timeout`
- `Cannot connect`
- `permission denied`
- `invalid credentials`

### 15.4. Ví Dụ Lỗi Mail

Nếu mật khẩu app mail sai, log backend có thể báo lỗi authentication SMTP.

Hướng xử lý:

```text
Kiểm tra MAIL_HOST.
Kiểm tra MAIL_SENDER_USERNAME.
Kiểm tra MAIL_SENDER_PASSWORD.
Kiểm tra app password Zoho còn đúng không.
Restart backend sau khi sửa .env.prod.
```

**Trả lời hội đồng:**

> Log là nguồn thông tin chính khi debug production. Người dùng chỉ thấy biểu hiện lỗi, còn log cho biết nguyên nhân kỹ thuật như sai cấu hình, không kết nối được database, mail authentication fail hoặc service chưa sẵn sàng.

---

## 16. Backup

### 16.1. Vì Sao Cần Backup?

Production có dữ liệu thật:

- Tài khoản người dùng.
- Sách.
- Bản sao sách.
- Lượt mượn trả.
- Phí phạt.
- Contact ticket.
- Dữ liệu AI/vector.

Nếu server lỗi hoặc deploy nhầm gây mất dữ liệu, backup là đường cứu.

### 16.2. Backup Database

Project có profile backup trong Docker Compose.

Lệnh:

```bash
cd /home/hosythang/LMS
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile backup run --rm postgres-backup
```

Ý nghĩa:

- Chạy service backup tạm thời.
- Dump database ra file backup.
- Xong thì container backup tự xóa.

### 16.3. Khi Nào Nên Backup?

Nên backup:

- Trước deploy lớn.
- Trước sửa cấu trúc database.
- Trước chạy migration nguy hiểm.
- Trước thao tác chưa chắc chắn.
- Định kỳ theo lịch.

**Trả lời hội đồng:**

> Backup là bắt buộc với production vì dữ liệu người dùng là tài sản quan trọng nhất. Trước các thay đổi lớn, cần backup database để có khả năng khôi phục nếu deploy hoặc migration gặp lỗi.

---

## 17. Rollback

### 17.1. Rollback Là Gì?

Rollback là quay lại phiên bản trước khi phiên bản mới bị lỗi.

Ví dụ:

```text
Deploy bản mới.
Login bị lỗi.
Người dùng không mượn được sách.
Ta quay lại commit ổn định trước đó.
```

### 17.2. Rollback Code

Trên VPS:

```bash
cd /home/hosythang/LMS
git log --oneline -5
git checkout <commit_cu_on_dinh>
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build frontend backend
```

Sau đó kiểm tra lại health.

### 17.3. Rollback Database Khó Hơn Rollback Code

Code rollback tương đối dễ.

Database rollback khó hơn vì dữ liệu có thể đã bị thay đổi.

Ví dụ:

- Migration đã xóa cột.
- Dữ liệu đã bị cập nhật sai.
- Bảng mới đã được tạo nhưng code cũ không hiểu.

Vì vậy trước thay đổi database lớn cần backup.

**Trả lời hội đồng:**

> Rollback là quay lại phiên bản ổn định khi bản deploy mới có lỗi. Rollback code thường dễ hơn rollback database, nên với thay đổi liên quan dữ liệu cần backup trước và thiết kế migration cẩn thận.

---

## 18. Các Kiểu Deploy Theo Loại Thay Đổi

### 18.1. Chỉ Sửa Frontend

Ví dụ:

```text
Sửa giao diện Contact Tickets.
Thêm nút list/grid.
Dịch tiếng Việt/tiếng Anh.
Sửa sidebar.
```

Lệnh:

```bash
cd /home/hosythang/LMS
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build frontend
```

Kiểm tra:

```bash
curl -I https://library74.uk
```

### 18.2. Chỉ Sửa Backend

Ví dụ:

```text
Sửa API.
Sửa gửi mail.
Sửa nghiệp vụ mượn trả.
Sửa contact inbox.
```

Lệnh:

```bash
cd /home/hosythang/LMS
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build backend
```

Kiểm tra:

```bash
docker exec lms_backend wget -qO- http://localhost:8080/actuator/health
```

### 18.3. Chỉ Sửa AI

Ví dụ:

```text
Sửa semantic search.
Sửa recommendation.
Sửa xử lý PDF.
Sửa worker.
```

Lệnh:

```bash
cd /home/hosythang/LMS
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build ai-api ai-worker
```

Kiểm tra:

```bash
docker exec lms_ai_api curl -fsS http://localhost:8001/health
```

### 18.4. Sửa `.env.prod`

Ví dụ:

```text
Đổi mail app password.
Đổi OAuth secret.
Đổi domain.
Đổi cấu hình AI.
```

Nếu biến đó backend đọc, restart backend:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d backend
```

Nếu biến đó frontend dùng lúc build, phải build lại frontend:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build frontend
```

Nếu biến đó Caddy dùng, restart Caddy:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d caddy
```

### 18.5. Sửa Nhiều Phần

Ví dụ sửa cả FE và BE:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build frontend backend
```

Ví dụ sửa toàn hệ thống:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

**Trả lời hội đồng:**

> Không phải thay đổi nào cũng cần rebuild toàn bộ hệ thống. Nếu chỉ sửa frontend thì rebuild frontend, nếu sửa backend thì rebuild backend, nếu sửa AI thì rebuild AI. Cách này giảm downtime, giảm rủi ro và giúp deploy nhanh hơn.

---

## 19. Quy Trình Deploy Chuẩn

### 19.1. Bước 1: Kiểm Tra Code Local

Frontend:

```bash
cd LMS_FE
npm run build
```

Backend:

```bash
cd LMS_BE
mvn -q -DskipTests compile
```

AI, nếu có sửa:

```bash
cd LMS_AI
python3 -m compileall api_service.py worker.py ai_etl ai_gateway scripts tests
```

### 19.2. Bước 2: Kiểm Tra `.env.prod`

Không để placeholder như:

```text
CHANGE_ME
NHAP_APP_PASSWORD
your-secret-here
```

Kiểm tra compose parse được env:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml config >/tmp/lms-compose-config.yml
echo $?
```

Kỳ vọng:

```text
0
```

### 19.3. Bước 3: Vào VPS Production

Ví dụ:

```bash
ssh hosythang@34.21.174.195
cd /home/hosythang/LMS
```

### 19.4. Bước 4: Cập Nhật Code

Nếu production dùng Git:

```bash
git pull
```

Nếu source được sync bằng cách khác, cần đảm bảo VPS đã có code mới.

### 19.5. Bước 5: Build Service Cần Deploy

Ví dụ sửa FE và BE:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build frontend backend
```

### 19.6. Bước 6: Kiểm Tra Container

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

### 19.7. Bước 7: Kiểm Tra Website

```bash
curl -I https://library74.uk
```

Kỳ vọng:

```text
HTTP/2 200
```

### 19.8. Bước 8: Kiểm Tra Backend Và AI

Backend:

```bash
docker exec lms_backend wget -qO- http://localhost:8080/actuator/health
```

AI:

```bash
docker exec lms_ai_api curl -fsS http://localhost:8001/health
```

### 19.9. Bước 9: Kiểm Tra Chức Năng Chính

Sau deploy, nên kiểm tra bằng browser:

- Trang chủ mở được.
- Đăng nhập được.
- User search sách được.
- Librarian vào dashboard được.
- API không lỗi 500.
- Nếu có sửa mail, test đúng luồng mail.
- Nếu có sửa AI, test search/recommendation.

**Trả lời hội đồng:**

> Quy trình deploy chuẩn gồm kiểm tra build local, kiểm tra cấu hình, cập nhật code trên server, rebuild service cần thay đổi, kiểm tra container, healthcheck và test chức năng chính. Mục tiêu là phát hiện lỗi trước khi người dùng gặp lỗi.

---

## 20. Những Lỗi Deploy Hay Gặp

### 20.1. Deploy Nhầm Máy

Có thể Docker local đang chạy nhưng không phải production.

Kiểm tra:

```bash
hostname
docker context ls
docker ps
```

Nếu `docker ps` không thấy các container production như:

```text
lms_backend
lms_frontend
lms_caddy
```

thì phải cẩn thận, có thể đang không ở VPS production.

### 20.2. `.env.prod` Sai

Ví dụ:

- Mật khẩu Zoho sai.
- Thiếu OAuth secret.
- Domain sai.
- Có dấu nháy hoặc khoảng trắng làm parser hiểu sai.

Kiểm tra:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml config
```

### 20.3. Backend 502 Tạm Thời Khi Recreate

Khi backend đang recreate, Caddy có thể chưa proxy được vào backend.

Biểu hiện:

```text
502 Bad Gateway
```

Nếu chỉ xảy ra vài giây trong lúc deploy, đó có thể là downtime ngắn khi service restart.

Nếu kéo dài, cần xem log backend.

### 20.4. Frontend Vẫn Hiện Bản Cũ

Nguyên nhân có thể:

- Chưa build lại frontend.
- Browser cache.
- Service worker hoặc cache asset.
- Caddy vẫn route vào container cũ nếu deploy chưa recreate đúng.

Xử lý:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build frontend
```

Sau đó hard refresh browser.

### 20.5. Database Chưa Healthy

Nếu backend không lên, kiểm tra database:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps postgres
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=120 postgres
```

### 20.6. Không Gửi Được Mail

Kiểm tra:

- `MAIL_HOST=smtp.zoho.com`
- `MAIL_SENDER_USERNAME=admin@library74.uk`
- `MAIL_SENDER_PASSWORD=<zoho_app_password>`
- Alias `noreply@library74.uk` và `support@library74.uk`
- Log backend có SMTP authentication error không.

**Trả lời hội đồng:**

> Lỗi deploy thường không chỉ do code, mà còn do môi trường: deploy nhầm máy, sai biến môi trường, service chưa healthy, cache frontend, database chưa sẵn sàng hoặc mail credential sai. Vì vậy deploy luôn cần kiểm tra cả code, config, container và chức năng thật.

---

## 21. Cách Đọc `docker-compose.prod.yml`

Khi mở `docker-compose.prod.yml`, đừng cố học thuộc. Hãy đọc theo câu hỏi.

### 21.1. Service Này Là Gì?

Tìm:

```yaml
services:
  backend:
```

Nghĩa là có một service tên `backend`.

### 21.2. Nó Build Từ Đâu?

Tìm:

```yaml
build:
  context: ./LMS_BE
```

Nghĩa là Docker build backend từ thư mục `LMS_BE`.

### 21.3. Nó Cần Biến Môi Trường Nào?

Tìm:

```yaml
env_file:
  - .env.prod
```

hoặc:

```yaml
environment:
```

Nghĩa là service này nhận cấu hình từ `.env.prod` hoặc từ compose.

### 21.4. Nó Kết Nối Với Ai?

Tìm:

```yaml
depends_on:
```

hoặc các URL:

```text
postgres:5432
kafka:9092
ai-api:8001
```

Trong Docker network, service gọi nhau bằng tên service.

### 21.5. Nó Có Lưu Dữ Liệu Không?

Tìm:

```yaml
volumes:
```

Nếu service có volume, dữ liệu của nó cần được giữ lại.

**Trả lời hội đồng:**

> Khi đọc Docker Compose, em đọc theo vai trò service: build từ đâu, nhận biến môi trường nào, phụ thuộc service nào, expose cổng nào, có healthcheck không và có volume lưu dữ liệu không. Cách đọc này giúp hiểu hệ thống thay vì học thuộc file YAML.

---

## 22. Cách Đọc `Caddyfile`

File:

```text
deploy/Caddyfile
```

Nên đọc theo 3 câu hỏi.

### 22.1. Domain Nào Được Phục Vụ?

```text
{$PUBLIC_DOMAIN}
```

Giá trị đến từ `.env.prod`, ví dụ:

```text
library74.uk
```

### 22.2. API Đi Vào Đâu?

```text
handle /api/* {
  reverse_proxy backend:8080
}
```

Nghĩa là request `/api/*` đi vào backend.

### 22.3. Frontend Đi Vào Đâu?

```text
handle {
  reverse_proxy frontend:80
}
```

Nghĩa là request còn lại đi vào frontend.

**Trả lời hội đồng:**

> `Caddyfile` định nghĩa domain và cách route request. Với Library74, `/api/*` và `/ws/*` được chuyển vào backend, còn các request giao diện được chuyển vào frontend. Caddy cũng tự xử lý HTTPS cho domain.

---

## 23. Checklist Trước Khi Deploy

Trước khi deploy, tự hỏi:

- Mình đang deploy lên đúng VPS production chưa?
- Code đã build được ở local chưa?
- `.env.prod` có còn placeholder không?
- Compose config có parse được không?
- Có thay đổi database nguy hiểm không?
- Có cần backup trước không?
- Mình chỉ rebuild service cần thiết hay rebuild toàn bộ?
- Sau deploy sẽ kiểm tra endpoint nào?
- Nếu lỗi, rollback bằng commit nào?

Checklist lệnh nhanh:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml config >/tmp/lms-compose-config.yml
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
curl -I https://library74.uk
```

**Trả lời hội đồng:**

> Deploy production cần checklist vì lỗi production ảnh hưởng trực tiếp người dùng và dữ liệu thật. Checklist giúp tránh lỗi cơ bản như sai môi trường, sai secret, chưa backup hoặc quên healthcheck.

---

## 24. Một Quy Trình Deploy Mẫu Từ Đầu Đến Cuối

Giả sử sửa cả frontend và backend.

### 24.1. Ở Local

Kiểm tra frontend:

```bash
cd "/Users/hosythang/Desktop/Rốt lập trình/LMS/LMS_FE"
npm run build
```

Kiểm tra backend:

```bash
cd "/Users/hosythang/Desktop/Rốt lập trình/LMS/LMS_BE"
mvn -q -DskipTests compile
```

Commit và push code nếu production pull từ Git:

```bash
git status
git add <files>
git commit -m "Update contact inbox and mail sender"
git push
```

### 24.2. Vào VPS

```bash
ssh hosythang@34.21.174.195
cd /home/hosythang/LMS
git pull
```

### 24.3. Kiểm Tra Env

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml config >/tmp/lms-compose-config.yml
echo $?
```

### 24.4. Deploy

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build frontend backend
```

### 24.5. Kiểm Tra

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
curl -I https://library74.uk
docker exec lms_backend wget -qO- http://localhost:8080/actuator/health
```

### 24.6. Xem Log Nếu Có Lỗi

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=120 backend
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=120 caddy
```

**Trả lời hội đồng:**

> Một lần deploy chuẩn bắt đầu từ kiểm tra build ở local, sau đó cập nhật code trên VPS, kiểm tra env, build lại service thay đổi, rồi xác nhận bằng container status, HTTP status và healthcheck. Nếu lỗi thì đọc log theo service bị ảnh hưởng.

---

## 25. Những Điều Tuyệt Đối Cẩn Thận

### 25.1. Không Lộ Secret

Không đưa vào tài liệu, Git, ảnh chụp màn hình:

- App password Zoho.
- Database password.
- JWT secret.
- OAuth client secret.
- API key.

Khi viết tài liệu, dùng placeholder:

```text
<zoho_app_password>
<database_password>
<jwt_secret>
```

### 25.2. Không Xóa Volume Production

Không chạy:

```bash
docker compose down -v
```

trên production.

### 25.3. Không Deploy Khi `.env.prod` Còn Placeholder

Nếu mail password còn placeholder, production sẽ chạy nhưng gửi mail fail.

Vì vậy trước deploy phải kiểm tra env.

### 25.4. Không Chỉ Nhìn Web 200 Là Đủ

`https://library74.uk` trả 200 chỉ chứng minh frontend mở được.

Vẫn cần kiểm tra:

- Backend health.
- AI health nếu có sửa AI.
- Chức năng đăng nhập.
- Chức năng vừa sửa.
- Log không có lỗi nghiêm trọng.

**Trả lời hội đồng:**

> Production không chỉ cần chạy được trang chủ. Cần bảo vệ secret, giữ volume database, kiểm tra cấu hình, healthcheck từng service và test chức năng chính. Những điểm này giúp giảm rủi ro mất dữ liệu hoặc lỗi người dùng thật.

---

## 26. Câu Hỏi Hội Đồng Hay Hỏi

### Câu 1: Vì sao dùng Docker?

Vì Docker đóng gói ứng dụng cùng môi trường chạy, giúp deploy ổn định hơn giữa local và server. Mỗi service như frontend, backend, AI, database chạy trong container riêng, dễ quản lý và dễ rebuild khi có thay đổi.

### Câu 2: Vì sao dùng Docker Compose?

Vì hệ thống có nhiều service. Docker Compose giúp khai báo và chạy toàn bộ stack bằng một file, bao gồm network, env, volume, healthcheck và dependency giữa các service.

### Câu 3: Vì sao cần Caddy?

Caddy đứng trước hệ thống để nhận request từ internet, tự cấp HTTPS và route request vào đúng service. `/api/*` đi vào backend, còn request giao diện đi vào frontend.

### Câu 4: Vì sao không public trực tiếp backend?

Vì backend nên nằm trong network nội bộ để giảm bề mặt tấn công. Người dùng truy cập qua Caddy, Caddy mới forward request cần thiết vào backend.

### Câu 5: Vì sao cần `.env.prod`?

Vì production cần cấu hình thật như mật khẩu mail, database password, domain, OAuth secret. Những thông tin này không nên hardcode trong source code và không nên commit lên Git.

### Câu 6: Vì sao cần healthcheck?

Vì container running chưa chắc app đã sẵn sàng. Healthcheck kiểm tra endpoint thật để biết service có hoạt động đúng không.

### Câu 7: Vì sao cần volume?

Vì container có thể bị recreate khi deploy. Volume giữ dữ liệu database và dữ liệu quan trọng không bị mất khi container thay đổi.

### Câu 8: Vì sao không dùng `docker compose down -v`?

Vì `-v` xóa volume. Trên production, điều đó có thể làm mất database, queue data, cache model và certificate.

### Câu 9: Khi chỉ sửa frontend thì có cần deploy backend không?

Không cần. Nếu chỉ sửa giao diện, chỉ rebuild frontend là đủ. Deploy đúng service giúp nhanh hơn và giảm rủi ro.

### Câu 10: Khi đổi mail password trong `.env.prod` thì cần làm gì?

Cần cập nhật `.env.prod` trên server, kiểm tra compose config parse được, rồi restart service dùng biến đó, thường là backend. Sau đó test luồng gửi mail và xem log nếu lỗi.

### Câu 11: Nếu sau deploy website báo 502 thì làm gì?

Kiểm tra Caddy log và backend log. Nếu backend đang recreate, 502 có thể chỉ tạm thời. Nếu kéo dài, cần kiểm tra backend health, database, env và exception trong log.

### Câu 12: Backup dùng để làm gì?

Backup giúp khôi phục dữ liệu nếu deploy hoặc migration lỗi. Với hệ thống thư viện, dữ liệu mượn trả, người dùng, sách và phí phạt rất quan trọng nên cần backup trước thay đổi lớn.

---

## 27. Cách Học Deploy Trong Project Này

Không cần học thuộc từng dòng YAML. Hãy học theo đường đi của request.

### 27.1. Khi Người Dùng Mở Web

```text
Browser
  -> DNS library74.uk
  -> IP server
  -> Caddy
  -> frontend
```

### 27.2. Khi Frontend Gọi API

```text
Browser
  -> https://library74.uk/api/...
  -> Caddy
  -> backend
  -> database / queue / AI
```

### 27.3. Khi Backend Gửi Mail

```text
Backend
  -> đọc MAIL_* từ .env.prod
  -> SMTP Zoho
  -> người dùng nhận email
```

### 27.4. Khi AI Xử Lý Tác Vụ Nặng

```text
Backend
  -> ai-api
  -> RabbitMQ
  -> ai-worker
  -> PostgreSQL + pgvector
```

### 27.5. Khi Deploy Bản Mới

```text
Code mới
  -> build image mới
  -> recreate container
  -> healthcheck
  -> test web thật
```

**Trả lời hội đồng:**

> Em học deploy bằng cách lần theo đường đi của request và dữ liệu. Từ browser vào Caddy, từ Caddy vào frontend/backend, từ backend vào database, queue, AI và mail. Như vậy em hiểu hệ thống vận hành thay vì chỉ học thuộc lệnh.

---

## 28. Tóm Tắt Một Phút

Library74 production chạy trên VPS với domain `library74.uk`. Domain trỏ tới IP server qua DNS. Caddy nhận request công khai, tự xử lý HTTPS và route request vào frontend hoặc backend. Frontend là React/Vite đã build thành file tĩnh và được nginx serve. Backend là Spring Boot chạy trong container, xử lý nghiệp vụ và kết nối PostgreSQL, Kafka, AI, mail. AI gồm FastAPI và worker, dùng RabbitMQ cho tác vụ nền và PostgreSQL pgvector cho dữ liệu vector.

Docker giúp đóng gói từng service. Docker Compose giúp chạy toàn bộ stack bằng `docker-compose.prod.yml`. `.env.prod` chứa cấu hình production và secret, không được commit. Database dùng volume để không mất dữ liệu khi container recreate. Deploy nên rebuild đúng service thay đổi, sau đó kiểm tra `docker compose ps`, website, backend health, AI health và chức năng chính. Trước thay đổi lớn cần backup, và không chạy `docker compose down -v` trên production.

---

## 29. Mười Ý Chính Cần Nhớ

1. Deploy là đưa hệ thống lên server để người dùng thật truy cập.
2. Production khác local vì cần domain, HTTPS, secret thật, uptime và backup.
3. Library74 production gồm Caddy, frontend, backend, AI API, AI worker, PostgreSQL, Kafka và RabbitMQ.
4. Docker đóng gói từng service thành container.
5. Docker Compose quản lý nhiều container bằng một file.
6. Caddy là reverse proxy, route `/api/*` vào backend và request giao diện vào frontend.
7. `.env.prod` chứa cấu hình production, không được commit và không để placeholder.
8. Volume giữ database an toàn khi container bị recreate.
9. Healthcheck giúp biết service thật sự sẵn sàng hay chưa.
10. Deploy xong phải kiểm tra container, website, backend health, AI health và chức năng vừa sửa.

