# 🚀 Hướng Dẫn Cài Đặt & Chạy LMS-AI

> Tài liệu chi tiết để cài đặt, cấu hình và chạy hệ thống AI ETL cho xử lý PDF sách

---

## 📋 Mục Lục

1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Bước 1: Chuẩn Bị Môi Trường](#bước-1-chuẩn-bị-môi-trường)
3. [Bước 2: Cài Đặt Dependencies](#bước-2-cài-đặt-dependencies)
4. [Bước 3: Cấu Hình Biến Môi Trường](#bước-3-cấu-hình-biến-môi-trường)
5. [Bước 4: Khởi Động Hệ Thống](#bước-4-khởi-động-hệ-thống)
6. [Bước 5: Kiểm Tra Hoạt Động](#bước-5-kiểm-tra-hoạt-động)
7. [Các Lệnh Sử Dụng Hàng Ngày](#các-lệnh-sử-dụng-hàng-ngày)
8. [Xử Lý Sự Cố](#xử-lý-sự-cố)
9. [API Endpoints](#api-endpoints)

---

## 📦 Yêu Cầu Hệ Thống

**Phần Cứng Tối Thiểu:**

- CPU: 2 cores (4+ recommended)
- RAM: 4GB (8GB+ recommended)
- Disk: 10GB free space

**Phần Mềm Bắt Buộc:**

- **Python 3.10+** - [Tải tại đây](https://www.python.org/downloads/)
- **Docker & Docker Compose** - [Tải tại đây](https://docs.docker.com/get-docker/)
- **Git** - [Tải tại đây](https://git-scm.com/download)

**Tài Khoản & API Keys:**

- [Google Gemini API Key](https://aistudio.google.com/apikey) (miễn phí)
- PostgreSQL 16+ (kèm theo Docker)
- RabbitMQ (kèm theo Docker)

---

## 🔧 Bước 1: Chuẩn Bị Môi Trường

### 1.1 Clone Repository

```bash
# Clone repo về máy
git clone https://github.com/howard-hosythang/LMS_AI.git
cd LMS_AI

# Xem branch hiện tại
git branch
# Output: * main
```

### 1.2 Tạo Virtual Environment

```bash
# Tạo Python virtual environment
python3 -m venv venv

# Kích hoạt virtual environment
# Trên macOS/Linux:
source venv/bin/activate

# Trên Windows:
# venv\Scripts\activate
```

**Kiểm tra xem đã kích hoạt chưa:**

- Prompt terminal sẽ có tiền tố `(venv)`
- Ví dụ: `(venv) $ python --version`

---

## 📥 Bước 2: Cài Đặt Dependencies

```bash
# Cập nhật pip (bước này rất quan trọng)
pip install --upgrade pip setuptools wheel

# Cài đặt tất cả dependencies từ requirements.txt
pip install -r requirements.txt

# Kiểm tra cài đặt thành công
pip list | grep -E "fastapi|torch|sentence-transformers|psycopg2"
```

**Các Package Chính:**

- `fastapi==0.135.3` - Web framework
- `sentence-transformers==3.4.1` - Embedding models
- `psycopg2-binary==2.9.11` - PostgreSQL driver
- `celery==5.4.0` - Task queue worker
- `PyMuPDF==1.24.14` - PDF processing

**Thời Gian Cài Đặt:** ~5-15 phút (tùy tốc độ internet)

---

## ⚙️ Bước 3: Cấu Hình Biến Môi Trường

### 3.1 Tạo File `.env`

```bash
# Copy file mẫu
cp .env.example .env

# Mở file để chỉnh sửa
# Trên macOS/Linux:
nano .env
# Trên Windows:
# notepad .env
```

### 3.2 Cấu Hình Các Giá Trị Quan Trọng

**Bắt Buộc Chỉnh Sửa:**

```bash
# 1. API Key cho Google Gemini
GEMINI_API_KEY=your_api_key_here_from_aistudio.google.com
```

**Cách Lấy Gemini API Key:**

1. Mở https://aistudio.google.com/apikey
2. Click "Create API key in new Google Cloud project"
3. Copy key và dán vào `.env`
4. Lưu file

**Tùy Chọn Chỉnh Sửa:**

```bash
# Database (nếu không dùng Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/postgres

# RabbitMQ (nếu không dùng Docker)
RABBITMQ_URL=amqp://guest:guest@localhost:5672/

# Tốc độ xử lý PDF
AI_ETL_CHUNK_SIZE=1500           # Chunk theo ký tự, cân bằng semantic quality và số vector
AI_ETL_CHUNK_OVERLAP=150         # Giữ ngữ cảnh ở biên chunk

# Số lượng chunks để tạo summary
AI_ETL_REDUCE_MAX_CHUNKS=12      # Giữ thấp để phù hợp Gemini free tier

# Timeout cho API calls
AI_ETL_LLM_TIMEOUT_SECONDS=30    # Fail nhanh rồi dùng fallback local nếu Gemini quá tải
```

**Kiểm Tra Cấu Hình:**

```bash
# Xem giá trị được load
python -c "from ai_etl.config import load_settings; s = load_settings(); print(f'DB: {s.database_url[:20]}...'); print(f'API Model: {s.gemini_model_cheap}')"
```

---

## 🐳 Bước 4: Khởi Động Hệ Thống

### Tùy Chọn A: Chạy Toàn Bộ Bằng Docker (Khuyến Nghị ✅)

**Bước 1: Xây Dựng Images**

```bash
# Tạo các Docker images (chỉ cần lần đầu)
docker-compose build --no-cache
# Thời gian: ~3-5 phút
```

**Bước 2: Khởi Động Hệ Thống**

```bash
# Khởi động tất cả services
docker-compose up -d

# Xem logs để kiểm tra
docker-compose logs -f

# Output cuối cùng sẽ thấy:
# ✓ postgres (healthy)
# ✓ rabbitmq (running)
# ✓ api_server (listening on 0.0.0.0:8001)
# ✓ celery_worker (worker ready to accept tasks)
```

**Kiểm Tra Trạng Thái:**

```bash
# Xem tất cả containers
docker-compose ps

# Output:
# NAME                 STATUS
# lms_ai_postgres      Up (healthy)
# lms_ai_rabbitmq      Up (healthy)
# lms_ai_api           Up
# lms_ai_worker        Up
```

**Tắt Hệ Thống:**

```bash
# Dừng tất cả services (dữ liệu được lưu giữ)
docker-compose down

# Xóa tất cả dữ liệu (cẩn thận!)
docker-compose down -v
```

---

### Tùy Chọn B: Chạy Cục Bộ (Advanced)

> ⚠️ Chỉ khuyến nghị cho development. Yêu cầu PostgreSQL 16+ và RabbitMQ đã cài sẵn.

```bash
# Terminal 1: PostgreSQL (nếu dùng Docker)
docker run --name pg16 -e POSTGRES_PASSWORD=postgres -d -p 5433:5432 pgvector/pgvector:pg16

# Terminal 2: RabbitMQ (nếu dùng Docker)
docker run --name rmq -d -p 5672:5672 -p 15672:15672 rabbitmq:3.13-management

# Terminal 3: FastAPI Server
source venv/bin/activate
python api_service.py

# Terminal 4: Celery Worker
source venv/bin/activate
celery -A worker worker --loglevel=info
```

---

## ✅ Bước 5: Kiểm Tra Hoạt Động

### 5.1 Kiểm Tra API Server

```bash
# Mở browser hoặc curl
curl http://localhost:8001/docs

# Hoặc mở trình duyệt: http://localhost:8001/docs
# Bạn sẽ thấy Swagger UI với danh sách API endpoints
```

### 5.2 Kiểm Tra Database

```bash
# Chạy script kiểm tra
python scripts/verify_etl_db.py --book-id 101

# Output:
# ✓ Connected to database
# ✓ Schema initialized
# ✓ Vector table ready
```

### 5.3 Kiểm Tra RabbitMQ

```bash
# Mở management UI
# http://localhost:15672
# Username: guest
# Password: guest
```

---

## 📚 Các Lệnh Sử Dụng Hàng Ngày

### Khởi Động & Dừng

```bash
# Khởi động (chạy nền)
docker-compose up -d

# Xem logs (real-time)
docker-compose logs -f

# Dừng tất cả
docker-compose down

# Dừng 1 service cụ thể
docker-compose stop api_server
docker-compose start api_server
```

### Xử Lý 1 Quyển Sách (ETL)

```bash
# Cách 1: Dùng CLI (ETL tức thời)
source venv/bin/activate
python main.py --publication-id 123 --pdf-path ./books/sample.pdf

# Output:
# ✓ Chunks created: 45
# ✓ Embeddings generated: 45
# ✓ Summary: "Đây là một quyển sách về..."
# ✓ Tags: ["AI", "Machine Learning", "Python", "Data Science", "LLM"]
```

### Xử Lý Async (Queue)

```bash
# Terminal 1: Khởi động mock webhook receiver
python scripts/mock_backend_webhook_server.py --port 8080

# Terminal 2: Enqueue một sách vào queue
python scripts/mock_enqueue_book.py \
  --book-id 101 \
  --pdf-url "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" \
  --webhook-url "http://localhost:8080/api/ai/callback"

# Kết quả:
# ✓ Message queued: {"book_id": 101, "status": "PENDING"}
# ✓ Worker xử lý (check RabbitMQ)
# ✓ Webhook callback được gửi sau 30s-5m
```

### Xem Logs

```bash
# Logs từ tất cả services
docker-compose logs

# Logs từ 1 service cụ thể
docker-compose logs api_server
docker-compose logs celery_worker

# Logs real-time (follow)
docker-compose logs -f celery_worker

# Logs của 100 dòng cuối cùng
docker-compose logs --tail=100
```

---

## 🐛 Xử Lý Sự Cố

### ❌ Lỗi: `GEMINI_API_KEY is required`

**Nguyên Nhân:** Chưa cấu hình API key hoặc `.env` không được load

**Giải Pháp:**

```bash
# Kiểm tra file .env tồn tại
ls -la .env

# Kiểm tra API key được set
cat .env | grep GEMINI_API_KEY

# Nếu rỗng, cập nhật ngay
nano .env
# Thêm: GEMINI_API_KEY=your_key_here
```

### ❌ Lỗi: `psycopg2.OperationalError: could not connect to server`

**Nguyên Nhân:** PostgreSQL không chạy hoặc port sai

**Giải Pháp:**

```bash
# Kiểm tra PostgreSQL container
docker-compose ps postgres

# Nếu không chạy, khởi động lại
docker-compose restart postgres

# Kiểm tra port
netstat -an | grep 5433  # macOS/Linux
netstat -ano | findstr :5433  # Windows
```

### ❌ Lỗi: `embeddings (768,) vs database (384,)`

**Nguyên Nhân:** Model embedding thay đổi (từ 384D sang 768D)

**Giải Pháp:**

```bash
# Xóa dữ liệu cũ
docker-compose down -v
docker-compose up -d

# Hoặc trong PostgreSQL:
# DELETE FROM ai_engine.publication_vectors;
```

### ❌ Lỗi: `Celery worker không xử lý task`

**Nguyên Nhân:** RabbitMQ không chạy hoặc queue không kết nối

**Giải Pháp:**

```bash
# Kiểm tra RabbitMQ
docker-compose logs rabbitmq

# Reset RabbitMQ
docker-compose restart rabbitmq

# Xem workers connected
docker-compose logs celery_worker | grep "Connected to"
```

### 💡 Xem Tất Cả Logs Chi Tiết

```bash
# Docker inspect
docker-compose logs --timestamps --tail=200 api_server

# Python errors
docker-compose exec celery_worker python -m pdb

# Database queries
docker-compose exec postgres psql -U postgres -d postgres -c "SELECT * FROM ai_engine.publication_etl_runs LIMIT 5;"
```

---

## 🔌 API Endpoints

### Semantic Search

```bash
curl -X POST "http://localhost:8001/api/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "machine learning algorithms",
    "limit": 10
  }'

# Response:
# {
#   "publication_ids": [101, 102, 105, ...],
#   "score": 0.95
# }
```

### Recommendations

```bash
curl -X POST "http://localhost:8001/api/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "limit": 5
  }'

# Response:
# {
#   "publication_ids": [45, 67, 89, 123, 145],
#   "strategy": "hybrid_als_semantic"
# }
```

### Health Check

```bash
curl http://localhost:8001/health

# Response:
# {
#   "status": "ok",
#   "services": {
#     "database": "ok",
#     "embedding_model": "ok",
#     "rabbitmq": "ok"
#   }
# }
```

---

## 📊 Monitoring & Performance

### Dashboard URLs

| Service         | URL                        | Username | Password |
| --------------- | -------------------------- | -------- | -------- |
| **Swagger API** | http://localhost:8001/docs | -        | -        |
| **RabbitMQ**    | http://localhost:15672     | guest    | guest    |
| **PostgreSQL**  | localhost:5433             | postgres | postgres |

### Kiểm Tra Performance

```bash
# Thời gian ETL
python scripts/verify_etl_db.py --book-id 101

# Load test API
# pip install locust
locust -f scripts/load_test.py --host=http://localhost:8001

# Database stats
docker-compose exec postgres psql -U postgres -d postgres << EOF
SELECT
  COUNT(*) as total_chunks,
  COUNT(DISTINCT publication_id) as publications,
  pg_size_pretty(pg_total_relation_size('ai_engine.publication_vectors')) as vector_table_size
FROM ai_engine.publication_vectors;
EOF
```

---

## 🚀 Deployment Checklist

Trước khi deploy lên production:

- [ ] `.env` được cấu hình đúng (không commit `.env`)
- [ ] `docker-compose.yml` sử dụng production settings
- [ ] Database backup được setup
- [ ] RabbitMQ được cấu hình authentication
- [ ] Logs rotation được enable
- [ ] Monitoring & alerting được setup
- [ ] Rate limiting được configure

---

## 📞 Support & Troubleshooting

**Cần giúp?**

1. Kiểm tra logs: `docker-compose logs -f`
2. Xem file `.env` có đúng không
3. Restart services: `docker-compose restart`
4. Xóa & tái tạo: `docker-compose down -v && docker-compose up -d`

**Liên hệ:**

- Email: your-email@example.com
- Issues: https://github.com/howard-hosythang/LMS_AI/issues

---

**Bản Cập Nhật:** May 12, 2026
**Phiên Bản:** 1.0.0
