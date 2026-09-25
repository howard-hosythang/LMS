package com.library.catalog.domain.valueobject;

import lombok.Value;

/**
 * Value Object representing a unique barcode identifier for library items.
 * Used to track physical and digital copies of publications.
 */
@Value
public class Barcode {
    String value;

    private Barcode(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Barcode cannot be null or empty");
        }

        String trimmedValue = value.trim();

        if (trimmedValue.length() < 5 || trimmedValue.length() > 50) {
            throw new IllegalArgumentException("Barcode must be between 5 and 50 characters");
        }

        // Barcode should contain only alphanumeric and hyphens
        if (!trimmedValue.matches("^[A-Za-z0-9-]+$")) {
            throw new IllegalArgumentException("Barcode can only contain letters, numbers, and hyphens");
        }

        this.value = trimmedValue.toUpperCase();
    }

    /**
     * Creates a Barcode from a string value.
     */
    public static Barcode of(String value) {
        return new Barcode(value);
    }
}
