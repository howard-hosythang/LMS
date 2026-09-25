package com.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;


@EnableJpaAuditing
@EnableScheduling
@EnableAsync(proxyTargetClass = true)
@SpringBootApplication(scanBasePackages = "com.library")
@ConfigurationPropertiesScan
public class LibraryManagementApplication {

  public static void main(String[] args) {
    SpringApplication.run(LibraryManagementApplication.class, args);
  }
}
