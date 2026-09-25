package com.library.shared.kafka.event;

public record UserRegisteredMessage(
    Long userId,
    String email,
    String fullName
) {

}
