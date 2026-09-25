package com.library.catalog.domain.entities;

import com.library.catalog.domain.event.PublicationCreatedEvent;
import com.library.catalog.domain.valueobject.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.*;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Publication {
    private final PublicationId id;
    private ISBN isbn;
    private PublicationMetadata metadata;
    private PublisherId publisherId;
    // Domain events
    private final List<Object> domainEvents = new ArrayList<>();


    public static Publication create(ISBN isbn, PublicationMetadata metadata, PublisherId publisherId) {
        Publication publication = new Publication(
            PublicationId.generate(),
            isbn,
            metadata,
            publisherId
        );

        publication.addDomainEvent(new PublicationCreatedEvent(
                publication.getId(),
                publication.getIsbn(),
                publication.getMetadata().getTitle())
        );
        return publication;
    }

    public static Publication of(PublicationId id, ISBN isbn, PublicationMetadata metadata, PublisherId publisherId) {
        return new Publication(id, isbn, metadata, publisherId);
    }

    public List<Object> pollDomainEvents() {
        List<Object> events = new ArrayList<>(this.domainEvents);
        this.domainEvents.clear();
        return events;
    }

    private void addDomainEvent(Object event) {
        this.domainEvents.add(event);
    }

    // ========== Validation ==========

    private static void validatePublicationYear(Integer year) {
        int currentYear = java.time.Year.now().getValue();
        if (year < 0 || year > currentYear + 1) {
            throw new IllegalArgumentException(
                "Publication year must be between 0 and " + (currentYear + 1)
            );
        }
    }
}
