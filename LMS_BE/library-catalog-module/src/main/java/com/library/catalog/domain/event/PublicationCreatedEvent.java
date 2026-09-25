package com.library.catalog.domain.event;

import com.library.catalog.domain.valueobject.ISBN;
import com.library.catalog.domain.valueobject.PublicationId;

import java.time.LocalDateTime;

/**
 * Domain event fired when a new publication is created.
 */
public record PublicationCreatedEvent(
    PublicationId publicationId,
    ISBN isbn,
    String title,
    LocalDateTime occurredAt
) {
    public PublicationCreatedEvent(PublicationId publicationId, ISBN isbn, String title) {
        this(publicationId, isbn, title, LocalDateTime.now());
    }
}
