package com.library.shared.kafka.event;

public record NotificationMessage(
    Long userId,
    String type,
    String title,
    String message,
    String link,
    Long referenceId
) {}
