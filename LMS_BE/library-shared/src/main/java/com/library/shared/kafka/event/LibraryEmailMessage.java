package com.library.shared.kafka.event;

import java.util.Map;

public record LibraryEmailMessage(
    Long userId,
    String emailType,
    Map<String, String> data
) {
    public static final String BORROW_PICKUP_REMINDER = "BORROW_PICKUP_REMINDER";
    public static final String PICKUP_CONFIRMED       = "PICKUP_CONFIRMED";
    public static final String DUE_DATE_WARNING       = "DUE_DATE_WARNING";
    public static final String RETURN_CONFIRMED       = "RETURN_CONFIRMED";
    public static final String FINE_PAID              = "FINE_PAID";
    public static final String BOOK_AVAILABLE         = "BOOK_AVAILABLE";
}
