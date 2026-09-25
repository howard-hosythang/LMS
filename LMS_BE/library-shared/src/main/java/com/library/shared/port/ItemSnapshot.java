package com.library.shared.port;

public record ItemSnapshot(
    Long id,
    String status,
    Long publicationId,
    String publicationTitle,
    String barcode,
    String branch,
    String location
) {}
