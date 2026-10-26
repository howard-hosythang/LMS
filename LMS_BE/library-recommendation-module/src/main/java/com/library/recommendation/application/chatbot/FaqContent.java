package com.library.recommendation.application.chatbot;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/** Plain text only: presentation uses paragraphs and semantic lists, never generated HTML. */
public record FaqContent(String summary, List<String> steps, List<String> bullets, String note) {
    public String text() {
        return java.util.stream.Stream.of(summary,
            java.util.stream.IntStream.range(0, steps.size())
                .mapToObj(index -> (index + 1) + ". " + steps.get(index)).collect(Collectors.joining("\n")),
            String.join("\n", bullets), note).filter(value -> !value.isBlank()).collect(Collectors.joining("\n\n"));
    }

    /** Preserve every source sentence; split existing numbered instructions without inventing steps. */
    public static FaqContent fromSource(String text) {
        var lines = text.split("\\R");
        if (lines.length > 1 && Arrays.stream(lines).anyMatch(line -> line.matches("\\d+\\. .*"))) {
            var steps = Arrays.stream(lines).filter(line -> line.matches("\\d+\\. .*"))
                .map(line -> line.replaceFirst("^\\d+\\. ", "")).toList();
            var remaining = Arrays.stream(lines).skip(1).filter(line -> !line.matches("\\d+\\. .*") && !line.isBlank())
                .collect(Collectors.joining(" "));
            return new FaqContent(lines[0].matches("\\d+\\. .*") ? "" : lines[0], steps, List.of(), remaining);
        }
        var sentences = text.split("(?<=[.!?])\\s+(?=\\p{Lu})");
        return new FaqContent(sentences[0], List.of(), Arrays.stream(sentences).skip(1).toList(), "");
    }
}
