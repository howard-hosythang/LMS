1. Chạy toàn bộ stack bằng 1 lệnh:

docker compose up -d --build

2. Mock webhook receiver:
   python scripts/mock_backend_webhook_server.py --port 8080

3. Đẩy message giả lập Java vào queue:
   python scripts/mock_enqueue_book.py --book-id 101 --pdf-url "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" --webhook-url "http://localhost:8080/api/ai/callback"

4. Kiểm tra DB sau ETL:

   python scripts/verify_etl_db.py --book-id 101

5. Chạy test API contract + latency:
   pytest tests/integration/test_api_contract_and_latency.py -q
