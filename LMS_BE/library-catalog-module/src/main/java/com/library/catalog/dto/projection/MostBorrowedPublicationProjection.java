package com.library.catalog.dto.projection;

import java.time.Instant;

public interface MostBorrowedPublicationProjection {

  Long getPublicationId();

  String getTitle();

  String getCoverImageUrl();

  Integer getPublicationYear();

  Instant getCreatedAt();

  Integer getAvailableItems();

  Float getRatingAverage();

  Integer getRatingCount();

  Long getBorrowCount();
}
