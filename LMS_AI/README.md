# AI ETL Pipeline (Optimized Reduce-First)

Pipeline ETL cho xử lý PDF sách, tối ưu mạnh cho chi phí và thời gian trong khi vẫn giữ chất lượng tìm kiếm ngữ nghĩa.

## Luồng xử lý

1. Extract & Transform

- Đọc PDF bằng `PyMuPDF`.
- Làm sạch text bằng Regex trước khi chunk: loại header/footer lặp, số trang, ký tự null (`\x00`), lỗi ngắt dòng và chuẩn hóa whitespace.
- Chunking bằng Sliding Window theo ký tự: `chunk_size=1500`, `overlap=150`.

2. Ingestion phase (non-LLM)

- Không gọi LLM ở MAP để tránh tốn quota.
- Sinh embedding 768 chiều trực tiếp từ chunk text bằng SBERT.
- Bulk insert vector theo lô vào `ai_engine.publication_vectors`.
- Hỗ trợ skip ETL nếu hash file PDF không đổi (idempotency nâng cao).

3. REDUCE phase

- Chọn tối đa 12 chunk đại diện (diverse + relevance), mỗi chunk tối đa 900 ký tự, tổng prompt khoảng 10.000 ký tự.
- Gọi Gemini tối đa 1 lần mỗi sách để tổng hợp metadata toàn cục; nếu Gemini quá tải hoặc từ chối thì dùng fallback deterministic để hệ thống vẫn index được sách.
- Ép JSON object gồm `master_summary`, `audience`, `tags` (đúng 5 tags).
- Update `public.publications` cho `ai_summary`, `ai_target_audience`.
- Find-or-create tags bằng `ON CONFLICT DO NOTHING + RETURNING id`.
- Ghi bảng nối thật của backend `public.publication_tags` để frontend hiển thị tag ngay trên trang chi tiết.

## Cấu trúc chính

- `main.py`: CLI entrypoint.
- `ai_etl/config.py`: đọc `.env`.
- `ai_etl/pdf_processing.py`: sanitize + sliding window.
- `ai_etl/llm_client.py`: Gemini API + retry + JSON parsing guard.
- `ai_etl/embedding_client.py`: SBERT embeddings.
- `ai_etl/db.py`: SQL và transaction helpers.
- `ai_etl/pipeline.py`: orchestration MAP-REDUCE.

## Cài đặt

Yêu cầu khuyến nghị:

- Python 3.10+
- PostgreSQL 15+ có extension `pgvector`
- RabbitMQ nếu chạy Celery worker
- Gemini API key nếu muốn dùng REDUCE bằng LLM

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Cấu hình `.env`

Xem mẫu trong `.env.example`.

Các biến quan trọng:

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `AI_ETL_GEMINI_MODEL`
- `AI_ETL_EMBEDDING_MODEL`
- `AI_ETL_CHUNK_SIZE`
- `AI_ETL_CHUNK_OVERLAP`
- `AI_ETL_GEMINI_MODEL_CHEAP`
- `AI_ETL_GEMINI_MODEL_PREMIUM`
- `AI_ETL_VECTOR_INSERT_BATCH_SIZE`
- `AI_ETL_REDUCE_MAX_CHUNKS`
- `AI_ETL_REDUCE_MAX_CHARS_PER_CHUNK`
- `AI_ETL_REDUCE_TOTAL_CHARS_BUDGET`
- `AI_ETL_ENABLE_HASH_SKIP`
- `AI_ETL_LLM_TIMEOUT_SECONDS`
- `AI_ETL_LLM_RETRY_ATTEMPTS`

## Chạy pipeline

```bash
python main.py --publication-id 123 --pdf-path ./data/book.pdf
```

Kết quả in ra JSON gồm số lượng chunks, số summaries, master summary, audience và 5 tags.

## Động cơ bất đồng bộ (Celery + RabbitMQ)

Worker lắng nghe queue `book.processing.queue` và xử lý background theo kiến trúc event-driven.

### Message input

JSON message bắt buộc có đủ:

- `book_id`
- `pdf_url`
- `webhook_url`

Ví dụ:

```json
{
  "book_id": 101,
  "pdf_url": "https://example.com/books/book.pdf",
  "webhook_url": "http://localhost:8080/api/ai/callback"
}
```

### Các đảm bảo kỹ thuật

- Model AI được load một lần mỗi worker process qua Celery signal `worker_process_init`.
- Sử dụng `psycopg2` connection pool, mượn/trả connection bằng `finally` để tránh cạn kết nối.
- Có idempotency nâng cao bằng hash file PDF, skip xử lý nếu dữ liệu không đổi.
- Nếu hash thay đổi thì xóa vector/tag cũ và re-index sạch.
- PDF tải về thư mục tạm và luôn được dọn dẹp trong `finally`.
- Có webhook callback cho cả `SUCCESS` và `FAILED`.
- Lỗi transient sẽ auto-retry tối đa 3 lần (backoff theo phút).
- Worker tự recycle process sau 50 task (`worker_max_tasks_per_child=50`) để giảm rủi ro memory leak.

### Chạy worker

```bash
celery -A worker.celery_app worker --loglevel=INFO --queues book.processing.queue --concurrency=2
```

### Biến môi trường bổ sung

- `AI_ETL_WEBHOOK_TIMEOUT_SECONDS` (mặc định `8`)
- `AI_ETL_DB_POOL_MINCONN` (mặc định `1`)
- `AI_ETL_DB_POOL_MAXCONN` (mặc định `6`)

## FastAPI Microservice (Search & Recommendation)

Service độc lập cung cấp 2 API cho Backend Java:

- Semantic Search: chuyển query thành vector và tìm top sách bằng pgvector cosine distance.
- Hybrid Recommendation: dùng ALS (implicit feedback), có fallback trending cho cold-start.

### Tối ưu runtime

- SBERT được load một lần duy nhất qua FastAPI lifespan.
- Dùng connection pool cho toàn bộ request.
- Mọi truy vấn nặng đều set `statement_timeout` (mặc định 5000ms).
- Mô hình ALS được train định kỳ (mặc định 1 giờ) và lưu file `.pkl`; API chỉ load file để dự đoán nhanh.

### Endpoint 1: Semantic Search

- Path: `POST /api/v1/semantic-search`
- Input: `{ "query_text": "...", "limit": 10 }`
- SQL lấy nearest chunks bằng HNSW (`ORDER BY embedding <=> query_vector LIMIT ...`) rồi gom về publication.
- Output: `{ "publication_ids": [1, 5, 9] }`

### Endpoint 2: Recommendations

- Path: `POST /api/v1/recommendations`
- Input: `{ "user_id": 123, "limit": 10 }`
- Trọng số hành vi: WATCH=1, WISHLIST=5, BORROWED=10; ALS dùng `cui = 1 + 40 * rui`.
- Cold-start: nếu user chưa có tương tác, trả về trending theo tương tác, lượt mượn và rating; nếu có tương tác nhưng chưa có profile ALS thì chuyển sang Content-Based bằng vector sách đã xem.
- Post-filter: chỉ trả về sách còn item AVAILABLE.

### Chạy FastAPI

```bash
uvicorn api_service:app --host 0.0.0.0 --port 8001 --workers 1
```

Kiểm tra service:

```bash
curl http://localhost:8001/health
```

### Biến môi trường cho API

- `AI_API_DB_POOL_MINCONN`
- `AI_API_DB_POOL_MAXCONN`
- `AI_API_DB_STATEMENT_TIMEOUT_MS`
- `AI_API_DEFAULT_SEARCH_LIMIT`
- `AI_API_MAX_SEARCH_LIMIT`
- `AI_API_RECOMMEND_DEFAULT_LIMIT`
- `AI_API_RECOMMEND_MAX_LIMIT`
- `AI_API_ALS_FACTORS`
- `AI_API_ALS_REGULARIZATION`
- `AI_API_ALS_ITERATIONS`
- `AI_API_ALS_ALPHA`
- `AI_API_ALS_MODEL_PATH`
- `AI_API_ALS_RETRAIN_INTERVAL_SECONDS`

## Kiểm thử tích hợp tự động

Chạy toàn bộ test unit/contract:

```bash
pytest -q
```

### 1) Mock ETL flow (giả lập Java đẩy message)

Không cần thao tác tay trên UI. Dùng script tự động:

Mở receiver giả lập webhook của Java (terminal 1):

```bash
python scripts/mock_backend_webhook_server.py --port 8080
```

```bash
python scripts/mock_enqueue_book.py \
  --book-id 101 \
  --pdf-url "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" \
  --webhook-url "http://localhost:8080/api/ai/callback"
```

Sau khi worker xử lý xong, xác minh DB:

```bash
python scripts/verify_etl_db.py --book-id 101
```

Điều kiện pass: `vector_count > 0`, `tag_link_count = 5`, `has_summary = true`, `has_audience = true`.

### 2) Mock API flow + latency budget

Chạy test tự động cho contract và độ trễ:

```bash
pytest tests/integration/test_api_contract_and_latency.py -q
```

Mặc định ngưỡng latency: `API_LATENCY_THRESHOLD_MS=200` (ms).

## Ping-Pong Integration với Java Backend

Luồng thực tế: Java gửi message RabbitMQ -> AI Worker xử lý -> AI callback webhook về Java.

Checklist hợp đồng API:

- Message vào queue bắt buộc có `book_id`, `pdf_url`, `webhook_url`.
- Callback thành công: `{ "book_id": 101, "status": "SUCCESS" }`.
- Callback lỗi: `{ "book_id": 101, "status": "FAILED", "error": "..." }`.

Khi test qua LAN/Ngrok:

- Không dùng `localhost` làm webhook nếu AI chạy trong Docker.
- Dùng `host.docker.internal` (Docker Desktop) hoặc IP LAN thực tế của máy Java.

## Docker hóa triển khai

### Mục tiêu

Khởi động toàn bộ stack AI bằng 1 lệnh:

```bash
docker compose up -d --build
```

### Thành phần

- `api_server`: FastAPI/Uvicorn.
- `celery_worker`: Worker nền Celery (concurrency=2).
- `postgres`: PostgreSQL + pgvector.
- `rabbitmq`: Message broker.

### Tối ưu image và model cache

- Base image: `python:3.10-slim`.
- Cài dependency theo `pip --no-cache-dir` (qua biến `PIP_NO_CACHE_DIR=1`).
- Dùng volume `model_cache` để giữ cache SBERT/HuggingFace giữa các lần restart.

### Tránh race condition khi startup

- `docker-compose.yml` có `depends_on` + `healthcheck` cho Postgres/RabbitMQ.
- `scripts/run_api.sh` và `scripts/run_worker.sh` gọi `scripts/wait_for_tcp.py` để retry đến khi service sẵn sàng.

### Cổng và endpoint

- API: `http://localhost:${FASTAPI_PORT:-8001}`
- RabbitMQ management: `http://localhost:15672` (guest/guest)

### Biến môi trường quan trọng khi deploy

- `DATABASE_URL`
- `RABBITMQ_URL`
- `GEMINI_API_KEY`
- `FASTAPI_PORT`
- `BACKEND_WEBHOOK_URL`
- `DOCKER_DATABASE_URL`
- `DOCKER_RABBITMQ_URL`

Gợi ý trong container callback về Java local:

- `BACKEND_WEBHOOK_URL=http://host.docker.internal:8080/api/ai/callback`
