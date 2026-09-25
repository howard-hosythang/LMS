package com.library.shared.kafka.event;

public record ForgotPasswordMessage(
    String email,
    String fullName,
    String resetLink
) {}
