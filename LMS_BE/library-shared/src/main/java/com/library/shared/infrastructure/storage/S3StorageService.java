package com.library.shared.infrastructure.storage;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.port.StoragePort;
import java.io.IOException;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class S3StorageService implements StoragePort {

  private final S3Client s3Client;
  private final S3Presigner s3Presigner;

  @Value("${spring.aws.s3.bucket}")
  private String bucket;

  @Value("${spring.aws.region}")
  private String region;

  @Override
  public String upload(MultipartFile file, String folder) {
    if (file == null || file.isEmpty()) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    String key = folder + "/" + generateKey(file.getOriginalFilename());

    try {
      s3Client.putObject(
          PutObjectRequest.builder()
              .bucket(bucket)
              .key(key)
              .contentType(file.getContentType())
              .contentLength(file.getSize())
              .build(),
          RequestBody.fromInputStream(file.getInputStream(), file.getSize())
      );
    } catch (IOException e) {
      log.error("S3 upload failed for key={}: {}", key, e.getMessage());
      throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
    } catch (S3Exception e) {
      log.error("S3 upload failed for bucket={}, key={}, status={}, awsCode={}, requestId={}",
          bucket, key, e.statusCode(), e.awsErrorDetails().errorCode(), e.requestId());
      throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
    } catch (SdkException e) {
      log.error("S3 upload failed for bucket={}, key={}: {}", bucket, key, e.getMessage());
      throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
    }

    String url = String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, key);
    log.info("Uploaded to S3: {}", url);
    return url;
  }

  @Override
  public String generatePresignedPutUrl(String s3Key, long ttlSeconds) {
    try {
      PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
          .signatureDuration(Duration.ofSeconds(ttlSeconds))
          .putObjectRequest(PutObjectRequest.builder()
              .bucket(bucket)
              .key(s3Key)
              .build())
          .build();

      PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);
      log.info("Generated presigned PUT URL for key={}, ttl={}s", s3Key, ttlSeconds);
      return presigned.url().toString();
    } catch (SdkException e) {
      log.error("Failed to generate presigned PUT URL for bucket={}, key={}: {}",
          bucket, s3Key, e.getMessage());
      throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
    }
  }

  @Override
  public String buildPublicUrl(String s3Key) {
    return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, s3Key);
  }

  public static String generateKey(String originalFilename) {
    String ext = "";
    String base = "file";
    if (originalFilename != null && originalFilename.contains(".")) {
      int dot = originalFilename.lastIndexOf('.');
      ext = originalFilename.substring(dot).toLowerCase();
      base = originalFilename.substring(0, dot);
    } else if (originalFilename != null) {
      base = originalFilename;
    }
    String safeName = base.trim().replaceAll("[^a-zA-Z0-9._-]", "_");
    return safeName + "_" + UUID.randomUUID() + ext;
  }
}
