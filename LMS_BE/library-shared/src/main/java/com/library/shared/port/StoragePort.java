package com.library.shared.port;

import org.springframework.web.multipart.MultipartFile;

public interface StoragePort {
    String upload(MultipartFile file, String folder);

    String generatePresignedPutUrl(String s3Key, long ttlSeconds);

    String buildPublicUrl(String s3Key);
}
