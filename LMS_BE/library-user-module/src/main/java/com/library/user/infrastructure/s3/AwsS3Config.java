package com.library.user.infrastructure.s3;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class AwsS3Config {

    @Bean
    public S3Client s3Client(
        @Value("${spring.aws.credentials.access-key}") String accessKey,
        @Value("${spring.aws.credentials.secret-key}") String secretKey,
        @Value("${spring.aws.region}") String region
    ) {
        return S3Client.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKey, secretKey)
            ))
            .build();
    }

    @Bean
    public S3Presigner s3Presigner(
        @Value("${spring.aws.credentials.access-key}") String accessKey,
        @Value("${spring.aws.credentials.secret-key}") String secretKey,
        @Value("${spring.aws.region}") String region
    ) {
        return S3Presigner.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKey, secretKey)
            ))
            .build();
    }
}
