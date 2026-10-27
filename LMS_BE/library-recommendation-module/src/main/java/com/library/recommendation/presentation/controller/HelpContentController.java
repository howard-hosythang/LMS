package com.library.recommendation.presentation.controller;

import com.library.recommendation.application.chatbot.FaqCatalog;
import com.library.recommendation.application.chatbot.FaqContent;
import com.library.shared.dto.ApiResponseApp;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/help")
public class HelpContentController {
    public record Topic(String id, String question, FaqContent content, String sourcePath) {}
    public record Content(int revision, String version, List<Topic> topics) {}
    private final FaqCatalog catalog;
    public HelpContentController(FaqCatalog catalog) { this.catalog = catalog; }
    @GetMapping("/content")
    public ResponseEntity<ApiResponseApp<Content>> content(@RequestParam(name="language", defaultValue="vi") String language) {
        if (!List.of("vi", "en").contains(language)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported language");
        var topics = catalog.entries().stream().map(entry -> new Topic(entry.id(), entry.copy(language).question(),
            FaqContent.fromSource(entry.copy(language).answer()), entry.sourcePath())).toList();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(ApiResponseApp.success(new Content(catalog.revision(), catalog.version(), topics)));
    }
}
