package com.library.circulation.infrastructure.port;

import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.shared.port.BorrowingChecker;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BorrowingCheckerImpl implements BorrowingChecker {

  private final BorrowingTransactionJpaRepository borrowingTransactionJpaRepository;


  @Override
  public boolean hasBorrowedPublication(Long userId, Long publicationId) {
    return borrowingTransactionJpaRepository.existsByUserIdAndPublicationId(userId, publicationId);
  }

  @Override
  public boolean hasReturnedPublication(Long userId, Long publicationId) {
    return borrowingTransactionJpaRepository.existsReturnedByUserIdAndPublicationId(userId, publicationId);
  }
}
