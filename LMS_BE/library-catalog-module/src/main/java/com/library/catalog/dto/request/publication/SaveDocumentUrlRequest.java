package com.library.catalog.dto.request.publication;

import jakarta.validation.constraints.NotBlank;

public record SaveDocumentUrlRequest(@NotBlank String s3Key) {
}
