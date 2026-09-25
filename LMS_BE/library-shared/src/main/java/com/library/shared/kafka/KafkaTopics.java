package com.library.shared.kafka;

public final class KafkaTopics {

  private KafkaTopics() {}

  public static final String USER_REGISTERED = "user.registered";
  public static final String USER_FORGOT_PASSWORD = "user.forgot-password";
  public static final String NOTIFICATION_SEND = "notification.send";
  public static final String LIBRARY_EMAIL = "library.email";
}
