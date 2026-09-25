# Chiến Lược Kiểm Thử Và Đánh Giá AI

Tài liệu này trả lời trực tiếp câu hỏi: **kiểm thử AI là kiểm thử cái gì, đo bằng thông số nào, và vì sao có thể tin AI trong hệ thống thư viện này**.

## 1. AI Trong Project Đang Làm Gì

Hệ thống AI hiện có 3 nhóm chức năng chính:

1. **AI ETL cho sách PDF**
   - Trích xuất text từ PDF.
   - Làm sạch nhiễu, chia chunk.
   - Sinh embedding cho từng chunk.
   - Dùng Gemini ở pha reduce để tạo `ai_summary`, `ai_target_audience`, 5 tag.
   - Có fallback deterministic nếu LLM lỗi hoặc trả nội dung chất lượng thấp.

2. **Semantic search**
   - Biến câu hỏi của người dùng thành vector.
   - Tìm sách gần nghĩa bằng pgvector cosine distance.
   - Có keyword fallback để tránh trường hợp vector search không đủ dữ liệu.

3. **Recommendation**
   - Dùng lịch sử `WATCH`, `WISHLIST`, `BORROWED` để học sở thích.
   - Trọng số hiện tại: `WATCH=1`, `WISHLIST=5`, `BORROWED=10`.
   - ALS cho collaborative filtering.
   - Fallback content-based/metadata/trending cho cold-start.

Vì vậy kiểm thử AI không thể chỉ hỏi “API có chạy không”. Phải kiểm thử cả **độ đúng nội dung**, **độ đúng xếp hạng**, **độ ổn định**, **độ trễ**, **khả năng fallback**, và **rủi ro hallucination**.

## 2. Các Câu Hỏi Của Hội Đồng Và Cách Trả Lời Bằng Số Liệu

### 2.1. “Kiểm thử AI là kiểm thử cái gì?”

Kiểm thử theo 6 lớp:

| Lớp | Kiểm thử gì | Ví dụ |
| --- | --- | --- |
| Data quality | PDF có đọc được không, text có sạch không, chunk có đủ không | Không lấy header/footer/legal boilerplate làm nội dung chính |
| Metadata quality | Summary, audience, tag có đúng nội dung sách không | Sách database phải ra tag SQL, chuẩn hóa, giao dịch |
| Search quality | Query có trả đúng sách liên quan ở top đầu không | Query “SQL transaction” phải ưu tiên sách CSDL |
| Recommendation quality | Gợi ý có đúng sở thích người dùng không | User hay mượn ML nên được gợi ý sách ML/AI |
| Robustness | LLM lỗi, PDF lỗi, API chậm thì hệ thống xử lý thế nào | Có retry, timeout, fallback, trạng thái FAILED rõ ràng |
| Operational quality | Độ trễ, coverage, tỉ lệ fallback, số vector/chunk | p95 latency dưới budget, vector_count > 0 |

### 2.2. “Có thông số gì đánh giá không?”

Có. Nhóm thông số chính:

| Nhóm | Metric | Ý nghĩa |
| --- | --- | --- |
| Tag | Precision, Recall, F1 | Tag sinh ra có đúng và đủ so với bộ tag chuẩn không |
| Summary | Keyword coverage | Summary có bao phủ các ý cốt lõi trong sách không |
| Summary | Hallucination guard pass rate | Summary có chứa thuật ngữ sai/ngành sai bị cấm không |
| Search | Precision@K | Trong top K có bao nhiêu kết quả đúng |
| Search | Recall@K | Trong các sách đúng, hệ thống tìm được bao nhiêu ở top K |
| Search | MRR | Kết quả đúng đầu tiên đứng sớm hay muộn |
| Search | nDCG@K | Kết quả đúng có được xếp ở đầu danh sách không |
| Recommendation | Precision@K, Recall@K, nDCG@K | Gợi ý có đúng sở thích và xếp hạng tốt không |
| Runtime | p50, p95 latency | Người dùng có phải chờ lâu không |
| Reliability | Reliability score | Điểm tổng hợp có trọng số để báo cáo |

Điểm tổng hợp hiện dùng trong script:

```text
Reliability score =
25% tag F1
+ 20% summary keyword coverage
+ 10% hallucination guard pass rate
+ 20% semantic search nDCG@K
+ 15% recommendation nDCG@K
+ 10% latency score
```

Không dùng accuracy chung chung vì search/recommendation là bài toán ranking; dùng `nDCG@K`, `MRR`, `Precision@K`, `Recall@K` thuyết phục hơn.

### 2.3. “Làm sao tin cậy AI?”

Không tin AI bằng cảm giác. Tin bằng cơ chế kiểm soát:

1. **Giới hạn vai trò LLM**
   - LLM chỉ dùng ở pha tổng hợp metadata toàn sách.
   - Embedding/search/recommendation là pipeline deterministic hoặc mô hình có metric rõ.

2. **Giảm chi phí và giảm nhiễu**
   - Không gọi LLM cho từng chunk.
   - Chọn chunk đại diện, tránh front matter/legal boilerplate.

3. **Ép output có cấu trúc**
   - Gemini phải trả JSON gồm `master_summary`, `audience`, `tags`.
   - Tag giới hạn đúng 5 tag.

4. **Có quality gate**
   - Loại tag quá chung như “tài liệu”, “công nghệ”, “ứng dụng thực tế”.
   - Reject summary kiểu chỉ lặp lại catalog/title.
   - Nếu sách văn học mà trả tag kỹ thuật thì bị xem là bất nhất.

5. **Có fallback deterministic**
   - Nếu LLM lỗi, timeout, trả JSON sai hoặc nội dung thấp, hệ thống không sập.
   - Fallback vẫn sinh summary/tag từ nội dung PDF và catalog context.

6. **Có contract test và latency test**
   - `pytest` kiểm tra API contract, pipeline core, tag quality, DB SQL contract, recommender.
   - Test live API có budget độ trễ.

7. **Có benchmark định lượng**
   - Dùng `scripts/ai_quality_benchmark.py` để tạo báo cáo số liệu.

## 3. Bộ Kiểm Thử Hiện Có Trong Repo

Chạy:

```bash
cd LMS_AI
pytest -q
```

Các nhóm test hiện có:

| File | Vai trò |
| --- | --- |
| `tests/test_pdf_processing.py` | Kiểm thử làm sạch PDF, OCR/text extraction, chunking |
| `tests/test_pipeline_core.py` | Kiểm thử chọn chunk đại diện, reduce budget, fallback |
| `tests/test_ai_metadata_quality.py` | Kiểm thử chất lượng tag/summary/fallback theo domain |
| `tests/test_llm_client.py` | Kiểm thử parse JSON, retry, response guard của LLM |
| `tests/test_recommender_engine.py` | Kiểm thử trọng số hành vi và ALS bundle |
| `tests/test_api_service_contract.py` | Kiểm thử contract service nội bộ |
| `tests/integration/test_api_contract_and_latency.py` | Kiểm thử live API và latency budget |
| `tests/test_database_sql_contract.py` | Kiểm thử SQL contract với schema |

## 4. Benchmark Định Lượng Mới

Mình bổ sung:

- `evaluation/ai_quality_cases.sample.json`
- `scripts/ai_quality_benchmark.py`
- `tests/test_ai_quality_benchmark.py`

## 4.0. Nguyên Tắc Quan Trọng: Không Đánh Giá Bằng Metadata Legacy

Local database có thể còn giữ metadata do prompt/model/code cũ sinh ra. Những kết quả này có thể rất rác, ví dụ summary lấy nhầm boilerplate, header/footer, dòng pháp lý hoặc đoạn OCR thô. Vì vậy **không được dùng trực tiếp metadata cũ trong DB để kết luận AI hiện tại kém**.

Quy trình đúng khi kiểm thử chất lượng AI:

1. Chọn một sách có `file_url` rõ ràng.
2. Force reprocess bằng AI service đang chạy code/model mới nhất.
3. Xác nhận `etl.status = SUCCESS`, `chunks_count > 0`, `vectors_count > 0`.
4. Lấy `ai_summary`, `ai_target_audience`, tags mới sinh ra.
5. Chỉ dùng output mới đó để đánh giá bằng rubric/metric.

Lệnh reprocess một sách qua AI API:

```bash
curl -sS -m 300 \
  -H 'Content-Type: application/json' \
  -d '{"publication_id":845190199117107187,"force_reprocess":true}' \
  http://127.0.0.1:8001/api/v1/publications/process
```

Ví dụ đã chạy local với `Frankenstein`:

```json
{
  "publication_id": 845190199117107187,
  "status": "SUCCESS",
  "skipped": false,
  "chunks": 225,
  "vectors": 225,
  "summary_generated": true,
  "tags": [
    "Văn học Gothic",
    "Đạo đức khoa học",
    "Tiểu thuyết kinh điển",
    "Trách nhiệm sáng tạo",
    "Kinh Dị Gothic"
  ],
  "ai_target_audience": "TOAN_BO_SINH_VIEN_BKU",
  "error": null
}
```

Summary mới sau reprocess:

> Frankenstein là một kiệt tác văn học Gothic kinh điển, xoay quanh hành trình đầy bi kịch của Victor Frankenstein, một sinh viên trẻ đầy tham vọng đã vô tình tạo ra một sinh vật sống từ những vật chất vô tri. Tác phẩm đi sâu vào những hệ lụy khủng khiếp của sự kiêu ngạo khoa học...

Điểm quan trọng khi trình bày với giảng viên:

> Những output rác trong local là dữ liệu legacy sinh bởi phiên bản AI cũ, không đại diện cho pipeline AI hiện tại. Khi kiểm thử nghiêm túc, tụi em luôn force reprocess bằng model/code mới nhất rồi mới đo Tag F1, Summary Coverage, Hallucination Guard, nDCG@K và latency. Điều này giống kiểm thử phần mềm thông thường: không lấy artifact cũ của version lỗi để đánh giá version đã sửa.

### 4.1. Chạy offline bằng dữ liệu mẫu

```bash
cd LMS_AI
python scripts/ai_quality_benchmark.py \
  --dataset evaluation/ai_quality_cases.sample.json \
  --k 5 \
  --json-out evaluation/latest_ai_quality_report.json \
  --md-out evaluation/latest_ai_quality_report.md
```

Script sẽ tính:

- Tag precision/recall/F1.
- Summary keyword coverage.
- Hallucination guard.
- Search Precision@5, Recall@5, MRR, nDCG@5.
- Recommendation Precision@5, Recall@5, MRR, nDCG@5.
- Reliability score.

### 4.2. Chạy với API thật

Khởi động AI service:

```bash
uvicorn api_service:app --host 127.0.0.1 --port 8001
```

Chạy benchmark live:

```bash
python scripts/ai_quality_benchmark.py \
  --dataset evaluation/ai_quality_cases.sample.json \
  --api-base-url http://127.0.0.1:8001 \
  --k 5 \
  --latency-budget-ms 200 \
  --json-out evaluation/live_ai_quality_report.json \
  --md-out evaluation/live_ai_quality_report.md
```

Ở live mode:

- `search_cases[].returned_publication_ids` sẽ bị bỏ qua, script gọi `/api/v1/semantic-search`.
- `recommendation_cases[].returned_publication_ids` sẽ bị bỏ qua, script gọi `/api/v1/recommendations`.
- Script đo thêm p50/p95 latency.

### 4.3. Báo Cáo Thực Nghiệm Trên Local Sau Reprocess

Đã tạo bộ ground truth thật:

```text
evaluation/ai_quality_cases.real.json
```

Bộ này dùng 6 sách đã force reprocess bằng AI service hiện tại:

| Sách | Trạng thái |
| --- | --- |
| Frankenstein | SUCCESS |
| Pride and Prejudice | SUCCESS |
| The Time Machine | SUCCESS |
| The Art of Computer Programming | SUCCESS |
| How to Win Friends and Influence People | SUCCESS |
| Digital Design and Computer Architecture | SUCCESS |

Chạy báo cáo:

```bash
cd LMS_AI
./venv/bin/python scripts/ai_quality_benchmark.py \
  --dataset evaluation/ai_quality_cases.real.json \
  --db-url postgresql://library:library@127.0.0.1:5432/library \
  --api-base-url http://127.0.0.1:8001 \
  --k 5 \
  --latency-budget-ms 3000 \
  --json-out evaluation/final_ai_quality_report.json \
  --md-out evaluation/final_ai_quality_report.md
```

Kết quả hiện tại:

| Nhóm | Metric | Kết quả |
| --- | --- | ---: |
| Tổng hợp | Reliability score | 79.03/100 |
| Metadata | Tag F1 | 54.8% |
| Metadata | Summary keyword coverage | 76.7% |
| Metadata | Summary length OK rate | 100.0% |
| Metadata | Hallucination guard pass rate | 100.0% |
| Search | Recall@5 | 100.0% |
| Search | MRR | 0.875 |
| Search | nDCG@5 | 0.908 |
| Search | Coverage | 100.0% |
| Runtime | p50 latency | 693.99 ms |
| Runtime | p95 latency | 1739.72 ms |

Diễn giải:

- Search rất tốt: tất cả query đều tìm được sách đúng trong top 5, phần lớn đứng top 1.
- Summary an toàn: không dính forbidden terms trong bộ test, độ phủ keyword tốt, độ dài đạt chuẩn.
- Tag generation đã hữu ích nhưng vẫn là điểm cần cải thiện: một số tag đúng hướng nhưng khác wording so với ground truth, và có case sinh một tag lệch như `Môi Trường` cho `How to Win Friends and Influence People`.
- Recommendation chưa được chấm trong report này vì chưa có bộ user-profile ground truth được curator gán thủ công. Không nên gán bừa để làm đẹp điểm.

Đây là cách trình bày trung thực và mạnh: hệ thống có số liệu thật, có điểm mạnh rõ, có điểm còn cải thiện được, và không che giấu lỗi.

## 5. Cách Tạo Bộ Ground Truth Chuyên Nghiệp

Để báo cáo trước hội đồng, không nên chỉ dùng dữ liệu mẫu. Nên tạo một file benchmark riêng từ dữ liệu thật:

```text
evaluation/ai_quality_cases.real.json
```

Quy trình tạo ground truth:

1. Chọn 20-50 đầu sách đại diện nhiều ngành: CNTT, điện, cơ khí, hóa, môi trường, văn học, kỹ năng.
2. Với mỗi sách, thủ thư hoặc nhóm dự án gán:
   - 5 tag chuẩn.
   - 5-8 keyword cốt lõi phải xuất hiện trong summary.
   - 3-5 forbidden term để bắt hallucination ngành sai.
3. Chọn 20-30 query tìm kiếm thật:
   - Mỗi query có danh sách sách liên quan.
   - Cho phép nhiều sách đúng, không chỉ một đáp án.
4. Chọn 10-20 user profile mẫu:
   - Mỗi user có lịch sử tương tác.
   - Gán danh sách sách nên được recommend.
5. Chạy benchmark và lưu kết quả trước/sau khi chỉnh AI.

Điểm mạnh của cách này: hội đồng thấy AI được đánh giá bằng **bộ test cố định**, có thể lặp lại, không phụ thuộc cảm tính.

## 6. Ngưỡng Đề Xuất Để Báo Cáo

Với project tốt nghiệp/demo học thuật, có thể đặt ngưỡng:

| Metric | Ngưỡng pass đề xuất |
| --- | ---: |
| Tag F1 | >= 0.75 |
| Summary keyword coverage | >= 0.70 |
| Hallucination guard pass rate | >= 0.95 |
| Semantic search nDCG@5 | >= 0.75 |
| Semantic search MRR | >= 0.80 |
| Recommendation nDCG@5 | >= 0.60 |
| Recommendation coverage | >= 0.95 |
| API p95 latency | <= 200-500 ms tùy máy và dữ liệu |
| ETL success rate | >= 0.95 |
| Fallback success rate khi LLM lỗi | 1.00 |

Recommendation thường khó hơn search vì phụ thuộc dữ liệu hành vi. Nếu dataset ít, nên giải thích rõ:

- Search đo bằng semantic relevance.
- Recommendation đo bằng lịch sử tương tác và có cold-start fallback.
- Với dữ liệu thật càng nhiều, ALS càng đáng tin hơn.

## 7. Cách Trình Bày Với Giảng Viên

Một câu trả lời mạnh:

> Em không đánh giá AI bằng cảm giác “thấy có vẻ đúng”. Tụi em chia AI thành các năng lực riêng: sinh metadata, tìm kiếm ngữ nghĩa, gợi ý sách, độ ổn định và độ trễ. Mỗi phần có metric riêng như Tag F1, Summary Coverage, Hallucination Guard, nDCG@5, MRR, Precision@5, Recall@5 và p95 latency. Ngoài ra pipeline có quality gate, reject tag quá chung, reject summary chỉ lặp catalog, có fallback deterministic khi LLM lỗi, và có benchmark script để chạy lại trên cùng bộ ground truth. Vì vậy AI trong hệ thống không phải hộp đen hoàn toàn mà được đo, kiểm soát và có cơ chế phục hồi.

## 8. Cần Ghi Trong Báo Cáo Hiện Thực

Nên có bảng như sau:

| Hạng mục | Cách kiểm thử | Metric | Kết quả |
| --- | --- | --- | --- |
| AI summary | So với keyword cốt lõi do người đánh giá gán | Keyword coverage | lấy từ benchmark |
| AI tag | So với 5 tag chuẩn | Precision/Recall/F1 | lấy từ benchmark |
| Hallucination | Forbidden term/domain mismatch | Pass rate | lấy từ benchmark |
| Search | Query -> sách liên quan | nDCG@5, MRR | lấy từ benchmark |
| Recommendation | User profile -> sách phù hợp | nDCG@5, Precision@5 | lấy từ benchmark |
| Runtime | Gọi endpoint thật | p95 latency | lấy từ benchmark |
| Robustness | Tắt LLM/mock lỗi | Fallback pass | pytest |

## 9. Kết Luận Kỹ Thuật

AI đáng tin khi:

- Có input sạch.
- Có output schema.
- Có metric định lượng.
- Có threshold pass/fail.
- Có fallback khi model lỗi.
- Có log/trạng thái để thủ thư biết đang xử lý, thành công hay thất bại.
- Có benchmark chạy lại được sau mỗi lần thay đổi.

Đây là hướng kiểm thử phù hợp với hệ thống thư viện vì mục tiêu không phải chứng minh AI “luôn đúng tuyệt đối”, mà là chứng minh AI **đủ đúng, đo được, kiểm soát được, và khi sai thì hệ thống không gây hỏng nghiệp vụ**.
