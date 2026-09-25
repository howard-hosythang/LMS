package com.library.circulation.application.transaction.impl;

import com.library.circulation.application.transaction.GetAllBorrowingTransactionUseCase;
import com.library.circulation.application.transaction.GetAllTransactionByItemUseCase;
import com.library.circulation.dto.response.TransactionListResponse;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetAllTransactionByItemUseCaseImpl implements GetAllTransactionByItemUseCase {

    private final BorrowingTransactionJpaRepository jpaRepository;

    @Override
    public com.library.shared.dto.PageResponse<TransactionListResponse> execute(Long itemId, int page, int size) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page,size, sort);
        Page<TransactionListResponse> transactions = jpaRepository.
                getAllTransactionByItemId(itemId,pageable);
        return com.library.shared.dto.PageResponse.from(transactions);
    }
}
