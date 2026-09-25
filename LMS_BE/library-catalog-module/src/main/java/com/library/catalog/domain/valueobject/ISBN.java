package com.library.catalog.domain.valueobject;

import lombok.Value;

import java.util.regex.Pattern;

/**
 * Value Object representing an International Standard Book Number (ISBN).
 * Supports both ISBN-10 and ISBN-13 formats with validation.
 */
@Value
public class ISBN {
    private static final Pattern ISBN_10_PATTERN = Pattern.compile("^\\d{9}[\\dX]$");
    private static final Pattern ISBN_13_PATTERN = Pattern.compile("^\\d{13}$");

    String value;

    private ISBN(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("ISBN cannot be null or empty");
        }

        String cleanIsbn = value.replaceAll("[\\s-]", "").toUpperCase();

        if (!isValidISBN(cleanIsbn)) {
            throw new IllegalArgumentException("Invalid ISBN format: " + value);
        }

        this.value = cleanIsbn;
    }

    /**
     * Creates an ISBN from a string value.
     */
    public static ISBN of(String value) {
        return new ISBN(value);
    }

    public static String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return ISBN.of(value).getValue();
    }

    /**
     * Validates if the ISBN format is correct (ISBN-10 or ISBN-13).
     */
    private boolean isValidISBN(String isbn) {
        return isValidISBN10(isbn) || isValidISBN13(isbn);
    }

    /**
     * Validates an ISBN-10 format with a check digit.
     */
    private boolean isValidISBN10(String isbn) {
        if (!ISBN_10_PATTERN.matcher(isbn).matches()) {
            return false;
        }

        int sum = 0;
        for (int i = 0; i < 9; i++) {
            sum += (isbn.charAt(i) - '0') * (10 - i);
        }

        char lastChar = isbn.charAt(9);
        sum += (lastChar == 'X') ? 10 : (lastChar - '0');

        return sum % 11 == 0;
    }

    /**
     * Validates an ISBN-13 format with check digit (using Luhn algorithm variant).
     */
    private boolean isValidISBN13(String isbn) {
        if (!ISBN_13_PATTERN.matcher(isbn).matches()) {
            return false;
        }

        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int digit = isbn.charAt(i) - '0';
            sum += (i % 2 == 0) ? digit : digit * 3;
        }

        int checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit == (isbn.charAt(12) - '0');
    }

    /**
     * Checks if this ISBN is an ISBN-13 format.
     */
    public boolean isISBN13() {
        return value.length() == 13;
    }

    /**
     * Checks if this ISBN is an ISBN-10 format.
     */
    public boolean isISBN10() {
        return value.length() == 10;
    }

    /**
     * Returns formatted ISBN with dashes for readability.
     */
    public String getFormatted() {
        if (isISBN13()) {
            // Format: 978-1-234-56789-0
            return String.format("%s-%s-%s-%s-%s",
                value.substring(0, 3),
                value.substring(3, 4),
                value.substring(4, 7),
                value.substring(7, 12),
                value.substring(12, 13));
        } else {
            // Format: 1-234-56789-0
            return String.format("%s-%s-%s-%s",
                value.substring(0, 1),
                value.substring(1, 4),
                value.substring(4, 9),
                value.substring(9, 10));
        }
    }
}
