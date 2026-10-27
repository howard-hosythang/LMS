"""Opt-in retrieval evaluation with real local weights. No DB, Gemini key or user records.

Run from LMS_AI: python -m scripts.evaluate_chatbot_retrieval
Reports retrieval only; it does not measure routing/generation or production latency.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from sentence_transformers import SentenceTransformer

from ai_gateway.chatbot_knowledge import Document, prepare_text, rank_help_candidates, split_document

# Paraphrases rather than copies of the source questions. Extend after real user feedback.
CASES = [
    ("vi", "creator", "Người nào đã xây dựng hệ thống Library74 này?"),
    ("vi", "borrow", "Mình cần làm những bước gì để đăng ký mượn một quyển sách?"),
    ("vi", "reservation", "Sách đã hết bản có sẵn thì tôi đặt chỗ chờ như thế nào?"),
    ("vi", "pickup", "Tôi đã gửi yêu cầu mượn, giờ phải tới đâu để nhận sách?"),
    ("vi", "renewal", "Muốn kéo dài thời gian giữ sách đang mượn phải làm gì?"),
    ("vi", "returns", "Đọc xong rồi thì tôi mang sách trả bằng cách nào?"),
    ("vi", "password", "Tôi không nhớ mật khẩu nên không vào tài khoản được, xử lý sao?"),
    ("vi", "deposit", "Khoản tiền đặt cọc được hoàn lại theo quy trình nào?"),
    ("vi", "lost", "Lỡ làm rách hoặc mất cuốn đang mượn thì báo ở đâu?"),
    ("vi", "support", "Tôi muốn nhờ thủ thư hỗ trợ thì liên lạc bằng cách nào?"),
    ("en", "creator", "Who is responsible for developing the Library74 website?"),
    ("en", "borrow", "What steps should a reader follow to request a library book?"),
    ("en", "reservation", "How can I join the waiting list for a book with no available copies?"),
    ("en", "pickup", "After requesting a loan, where do I collect the physical book?"),
    ("en", "renewal", "What is the procedure to extend the time I can keep a borrowed book?"),
    ("en", "returns", "I have finished reading. How should I bring the book back?"),
    ("en", "password", "I cannot remember my account password. How can I regain access?"),
    ("en", "deposit", "How does the library handle returning my security deposit?"),
    ("en", "lost", "Where should I report that I lost or damaged my borrowed book?"),
    ("en", "support", "How do I get help from a library staff member?"),
]


def main():
    source = Path(__file__).resolve().parents[2] / "LMS_BE/library-recommendation-module/src/main/resources/chatbot/faq.json"
    entries = json.loads(source.read_text(encoding="utf-8"))["entries"]
    model = SentenceTransformer(os.getenv("AI_ETL_EMBEDDING_MODEL", "bkai-foundation-models/vietnamese-bi-encoder"))
    chunks = [chunk for entry in entries for language in ("vi", "en")
              for chunk in split_document(Document(id=entry["id"], language=language,
                  title=entry[language]["question"], content=entry[language]["answer"], source_path=entry["sourcePath"]), model)]
    embeddings = model.encode([chunk.model_input for chunk in chunks], normalize_embeddings=True)
    results = []
    for language, expected, question in CASES:
        vector = model.encode(prepare_text(question, language), normalize_embeddings=True)
        scores = embeddings @ vector
        candidates = [{"topic_id": chunk.topic_id, "content": chunk.content, "title": chunk.title,
                       "score": float(scores[i]), "source_path": chunk.source_path}
                      for i, chunk in enumerate(chunks) if chunk.language == language]
        hits = [hit["topic_id"] for hit in rank_help_candidates(question, candidates)]
        results.append({"language": language, "expected": expected, "retrieved": hits, "hit": expected in hits})
    print(json.dumps({"documents": len(entries) * 2, "chunks": len(chunks),
        "max_tokens": max(chunk.tokens for chunk in chunks), "cases": len(results),
        "recall_at_5": sum(result["hit"] for result in results) / len(results), "results": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
