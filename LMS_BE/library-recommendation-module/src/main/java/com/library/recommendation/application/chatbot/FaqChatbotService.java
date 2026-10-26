package com.library.recommendation.application.chatbot;

import com.library.recommendation.infrastructure.ai.FaqIntentSelector;
import java.time.Clock;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FaqChatbotService {
    public record Suggestion(String id, String question) {}
    public record Answer(String status, String faqId, String answer, String sourceTitle, String sourcePath) {}
    private final FaqCatalog catalog;
    private final FaqIntentSelector selector;
    private final int limit;
    private final Clock clock;
    private long minute = -1;
    private int count;

    @Autowired
    public FaqChatbotService(FaqCatalog catalog, FaqIntentSelector selector,
        @Value("${chatbot.requests-per-minute:60}") int limit) {
        this(catalog, selector, limit, Clock.systemUTC());
    }
    FaqChatbotService(FaqCatalog catalog, FaqIntentSelector selector, int limit, Clock clock) {
        this.catalog = catalog; this.selector = selector;
        this.limit = Math.max(1, limit); this.clock = clock;
    }

    public List<Suggestion> suggestions(String language) {
        return catalog.entries().stream().map(entry -> new Suggestion(entry.id(), entry.copy(language).question())).toList();
    }

    public Answer answer(String question, String language) {
        checkRate();
        var exact = catalog.exactMatch(question);
        if (exact.isPresent()) return approved(exact.get(), language);
        String id = selector.select(question, catalog.entries());
        if (id != null && !"NONE".equals(id)) {
            var entry = catalog.find(id);
            if (entry.isPresent()) return approved(entry.get(), language);
        }
        boolean en = "en".equals(language);
        if (id == null || (!"NONE".equals(id) && catalog.find(id).isEmpty())) {
            return new Answer("UNAVAILABLE", null, en
                ? "I cannot match this question right now. Please choose a suggested question or open the user guide. I do not access account records or live library data."
                : "Tôi chưa thể đối chiếu câu hỏi lúc này. Bạn hãy chọn câu hỏi gợi ý hoặc mở hướng dẫn sử dụng. Tôi không truy cập hồ sơ tài khoản hay dữ liệu thư viện hiện tại.", null, null);
        }
        return new Answer("UNSUPPORTED", null, en
            ? "I only provide approved Library74 instructions and do not have a matching answer. I cannot look up personal records, current figures or perform transactions. Please open the guide or contact the library."
            : "Tôi chỉ cung cấp hướng dẫn Library74 đã duyệt và chưa có câu trả lời phù hợp. Tôi không tra cứu dữ liệu cá nhân, số liệu hiện tại hay thực hiện giao dịch. Bạn có thể mở hướng dẫn hoặc liên hệ thư viện.", null, null);
    }

    private Answer approved(FaqCatalog.Entry entry, String language) {
        var copy = entry.copy(language);
        return new Answer("ANSWERED", entry.id(), copy.answer(), copy.question(), entry.sourcePath());
    }

    // Per-instance global budget also bounds paid provider calls without storing IPs or sessions.
    private synchronized void checkRate() {
        long now = clock.millis() / 60_000;
        if (now != minute) { minute = now; count = 0; }
        if (++count > limit) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "FAQ request limit reached");
    }
}
