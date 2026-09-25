package com.library.catalog.domain.entities;

/**
 * Enum representing different formats/types of library items.
 * Only physical items - no digital formats.
 */
public enum ItemType {
    /**
     * Hardcover book.
     */
    HARDCOVER,

    /**
     * Paperback book.
     */
    PAPERBACK,

    /**
     * Academic or periodical journal.
     */
    JOURNAL
}
