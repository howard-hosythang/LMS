package com.library.catalog.domain.entities;

import com.library.catalog.domain.valueobject.PublisherId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Publisher {
    private PublisherId id;
    private String name;
    private String address;

    public static Publisher create(String publisherName, String address) {
        validatePublisherName(publisherName);
        return new Publisher(
            PublisherId.generate(),
            publisherName.trim(),
            address != null ? address.trim() : null
        );
    }

    public static Publisher of(PublisherId id, String publisherName, String address) {
        validatePublisherName(publisherName);
        return new Publisher(id, publisherName.trim(), address);
    }

    public void updateInfo(String newName, String newAddress) {
        if (newName != null && !newName.isBlank()) {
            validatePublisherName(newName);
            this.name = newName.trim();
        }
        if (newAddress != null) {
            this.address = newAddress.trim();
        }
    }

    private static void validatePublisherName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Publisher name cannot be null or empty");
        }
        if (name.length() > 100) {
            throw new IllegalArgumentException("Publisher name must not exceed 100 characters");
        }
    }
}
