package com.library.catalog.dto.projection;

import java.time.Instant;

public interface NewestPublicationProjection {

  Long getPublicationId();

  String getTitle();

  String getCoverImageUrl();

  Integer getPublicationYear();

  Instant getCreatedAt();

  Integer getAvailableItems();

  Double getRatingAverage();

  Integer getRatingCount();

  Long getBorrowCount();
}
