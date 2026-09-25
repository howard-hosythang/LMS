package com.library.shared.port;

public interface BorrowingChecker {

  boolean hasBorrowedPublication(Long userId, Long publicationId);

  default boolean hasReturnedPublication(Long userId, Long publicationId) {
    return hasBorrowedPublication(userId, publicationId);
  }
}
