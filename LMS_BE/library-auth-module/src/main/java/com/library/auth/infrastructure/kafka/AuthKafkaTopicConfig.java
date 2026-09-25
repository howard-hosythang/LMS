package com.library.auth.infrastructure.kafka;

import com.library.shared.kafka.KafkaTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class AuthKafkaTopicConfig {

  @Bean
  public NewTopic forgotPasswordTopic() {
    return TopicBuilder.name(KafkaTopics.USER_FORGOT_PASSWORD)
        .partitions(1)
        .replicas(1)
        .build();
  }
}
