package com.library.user.infrastructure.kafka;

import com.library.shared.kafka.KafkaTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

  @Bean
  public NewTopic userRegisteredTopic() {
    return TopicBuilder.name(KafkaTopics.USER_REGISTERED)
        .partitions(1)
        .replicas(1)
        .build();
  }

  @Bean
  public NewTopic notificationSendTopic() {
    return TopicBuilder.name(KafkaTopics.NOTIFICATION_SEND)
        .partitions(1)
        .replicas(1)
        .build();
  }

  @Bean
  public NewTopic libraryEmailTopic() {
    return TopicBuilder.name(KafkaTopics.LIBRARY_EMAIL)
        .partitions(1)
        .replicas(1)
        .build();
  }
}
