package com.library.recommendation.presentation.controller;

import com.library.recommendation.application.chatbot.FaqChatbotService;
import com.library.shared.dto.ApiResponseApp;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chatbot")
public class FaqChatbotController {
    public record Question(@NotBlank @Size(max = 500) String message,
        @Pattern(regexp = "vi|en") String language) {}
    private final FaqChatbotService service;
    public FaqChatbotController(FaqChatbotService service) { this.service = service; }

    @GetMapping("/faqs")
    public ResponseEntity<ApiResponseApp<List<FaqChatbotService.Suggestion>>> faqs(
        @RequestParam(name = "language", defaultValue = "vi") String language) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(ApiResponseApp.success(service.suggestions(language)));
    }

    @PostMapping("/messages")
    public ResponseEntity<ApiResponseApp<FaqChatbotService.Answer>> answer(@Valid @RequestBody Question request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(ApiResponseApp.success(service.answer(request.message().trim(), request.language())));
    }
}
