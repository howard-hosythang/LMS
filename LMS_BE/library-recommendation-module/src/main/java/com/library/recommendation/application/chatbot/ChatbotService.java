package com.library.recommendation.application.chatbot;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.library.recommendation.infrastructure.ai.ChatbotKnowledgeClient;
import com.library.recommendation.infrastructure.ai.FaqIntentSelector;
import com.library.recommendation.infrastructure.persistence.ChatbotReadQueries;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class ChatbotService {
    private final FaqCatalog catalog;
    private final FaqChatbotService faq;
    private final FaqIntentSelector model;
    private final ChatbotKnowledgeClient knowledge;
    private final ChatbotReadQueries reads;
    public ChatbotService(FaqCatalog catalog, FaqChatbotService faq, FaqIntentSelector model,
        ChatbotKnowledgeClient knowledge, ChatbotReadQueries reads) {
        this.catalog=catalog; this.faq=faq; this.model=model; this.knowledge=knowledge; this.reads=reads;
    }

    public ChatbotReply answer(String question, String language, Long readerId) {
        String lang = "en".equals(language) ? "en" : "vi";
        boolean en = "en".equals(lang);
        var exact = catalog.exactMatch(question);
        if (exact.isPresent()) {
            var reply = ChatbotReply.legacy(faq.answer(question, lang));
            if (Set.of("policy", "renewal", "deposit", "fines", "pickup").contains(exact.get().id())) {
                try {
                    var policy = reads.execute(ChatbotTool.get_current_circulation_policy, JsonNodeFactory.instance.objectNode(), null, lang);
                    return new ChatbotReply(reply.status(), reply.faqId(), reply.answer(), reply.sourceTitle(), reply.sourcePath(), reply.content(),
                        java.util.stream.Stream.concat(reply.sources().stream(), policy.sources().stream()).distinct().toList(), policy.cards(), policy.total(), policy.page(), policy.retrievedAt());
                } catch (Exception ignored) {
                    return new ChatbotReply(reply.status(), reply.faqId(), reply.answer(), reply.sourceTitle(), reply.sourcePath(),
                        new FaqContent(reply.content().summary(), reply.content().steps(), reply.content().bullets(),
                            en ? "Current policy values could not be loaded. Please retry the policy page." : "Chưa tải được thông số chính sách hiện hành. Bạn hãy thử lại trang quy định."),
                        reply.sources(), List.of(), null, null, null);
                }
            }
            return reply;
        }
        var allowed = ChatbotTool.available(readerId != null);
        var call = model.chooseTool(question, allowed, lang);
        if (call == null) return unavailable(en);
        if ("AUTH_REQUIRED".equals(call.name())) return new ChatbotReply("AUTH_REQUIRED", null,
            en ? "Please sign in with a reader account to view your own records." : "Bạn hãy đăng nhập bằng tài khoản bạn đọc để xem dữ liệu của mình.",
            en ? "Sign in" : "Đăng nhập", "/publicpage/login", null,
            List.of(new ChatbotReply.Source(en ? "Sign in" : "Đăng nhập", "/publicpage/login")), List.of(), null, null, null);
        if ("NONE".equals(call.name())) return ChatbotReply.message("UNSUPPORTED", en
            ? "I can help with Library74 instructions and read-only lookups. I cannot perform actions or answer book chapter questions."
            : "Tôi có thể hướng dẫn và tra cứu thông tin Library74. Tôi không thực hiện thao tác thay bạn hoặc trả lời nội dung chương sách.");
        try {
            ChatbotTool tool = ChatbotTool.valueOf(call.name());
            if (!allowed.contains(tool)) throw new SecurityException("Tool is not available");
            var arguments = ChatbotReadQueries.validate(tool, call.arguments());
            if (tool == ChatbotTool.search_library_help) {
                var entries = knowledge.retrieve(arguments.getOrDefault("query", question), lang);
                if (entries.isEmpty()) return ChatbotReply.message("UNAVAILABLE", en
                    ? "No suitable indexed guidance is available. Please choose a suggested question or open the guide."
                    : "Chưa có hướng dẫn đã lập chỉ mục phù hợp. Bạn có thể chọn câu hỏi gợi ý hoặc mở hướng dẫn.");
                var draft = model.generate(question, entries, lang);
                if (draft == null || "NONE".equals(draft.faqId())) return unavailable(en);
                var source = entries.stream().filter(entry -> entry.id().equals(draft.faqId())).findFirst();
                if (source.isEmpty()) return unavailable(en);
                var content = draft.content() != null ? draft.content() : FaqContent.fromSource(source.get().copy(lang).answer());
                var reference = source.get();
                return new ChatbotReply("ANSWERED", reference.id(), content.text(), reference.copy(lang).question(), reference.sourcePath(), content,
                    List.of(new ChatbotReply.Source(reference.copy(lang).question(), reference.sourcePath())), List.of(), null, null, null);
            }
            // Private results are returned as server-produced cards; never uploaded to Gemini.
            return reads.execute(tool, call.arguments(), tool.personal ? readerId : null, lang);
        } catch (IllegalArgumentException ignored) {
            return ChatbotReply.message("CLARIFY", en ? "Please clarify the book title, date range or page you want to look up."
                : "Bạn hãy chỉ rõ tên sách, khoảng ngày hoặc trang dữ liệu muốn tra cứu.");
        } catch (Exception ignored) { return unavailable(en); }
    }
    private static ChatbotReply unavailable(boolean en) {
        return ChatbotReply.message("UNAVAILABLE", en ? "The lookup is unavailable right now. Please retry or choose a suggested question."
            : "Chưa thể tra cứu lúc này. Bạn hãy thử lại hoặc chọn câu hỏi gợi ý.");
    }
}
