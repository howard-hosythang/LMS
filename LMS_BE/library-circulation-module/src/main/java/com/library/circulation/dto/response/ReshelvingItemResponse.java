package com.library.circulation.dto.response;

import java.time.Instant;

public record ReshelvingItemResponse(
    String taskId, String barcode, String publicationTitle, String location,
    String branch, Instant queuedAt, String studentId, String fullName, String source
) {}
