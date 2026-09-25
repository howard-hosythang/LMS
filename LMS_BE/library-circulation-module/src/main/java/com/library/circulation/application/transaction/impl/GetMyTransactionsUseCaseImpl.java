package com.library.circulation.application.transaction.impl;

import com.library.circulation.application.transaction.GetMyTransactionsUseCase;
import com.library.circulation.dto.response.UserTransactionResponse;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetMyTransactionsUseCaseImpl implements GetMyTransactionsUseCase {

    private final BorrowingTransactionJpaRepository jpaRepository;

    @Override
    public com.library.shared.dto.PageResponse<UserTransactionResponse> execute(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserTransactionResponse> result = jpaRepository.getMyTransactions(userId, pageable);
        return com.library.shared.dto.PageResponse.from(result);
    }
}
