package com.library.circulation.infrastructure.persistence.repository;

import com.library.circulation.dto.response.TransactionListResponse;
import com.library.circulation.dto.response.UserTransactionResponse;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BorrowingTransactionJpaRepository extends
    JpaRepository<BorrowingTransactionEntity, Long> {

  @Query(value = """
          SELECT new com.library.circulation.dto.response.TransactionListResponse(
              t.id, u.id, u.fullName, u.studentId, f.fineAmount, t.borrowedDate, t.dueDate, t.returnedDate, t.status
          )
          FROM BorrowingTransactionEntity t left join UserEntity u on t.userId = u.id
              left join FineEntity f on t.id = f.transactionId
      """,
      countQuery = "SELECT count(t) FROM BorrowingTransactionEntity t")
  Page<TransactionListResponse> getAllTransactionWithPagination(Pageable pageable);

  @Query(value = """
          SELECT new com.library.circulation.dto.response.TransactionListResponse(
              t.id, u.id, u.fullName, u.studentId, f.fineAmount, t.borrowedDate, t.dueDate, t.returnedDate, t.status
          )
          FROM BorrowingTransactionEntity t
          LEFT JOIN UserEntity u ON t.userId = u.id
          LEFT JOIN FineEntity f ON t.id = f.transactionId
          WHERE :keyword = ''
             OR LOWER(u.fullName)  LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(u.studentId) LIKE LOWER(CONCAT('%', :keyword, '%'))
      """,
      countQuery = """
          SELECT count(t) FROM BorrowingTransactionEntity t
          LEFT JOIN UserEntity u ON t.userId = u.id
          WHERE :keyword = ''
             OR LOWER(u.fullName)  LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(u.studentId) LIKE LOWER(CONCAT('%', :keyword, '%'))
      """)
  Page<TransactionListResponse> searchTransactions(@Param("keyword") String keyword, Pageable pageable);


  @Query(value = """
          SELECT new com.library.circulation.dto.response.TransactionListResponse(
              t.id, u.id, u.fullName, u.studentId, f.fineAmount, t.borrowedDate, t.dueDate, t.returnedDate, t.status
          )
          FROM BorrowingTransactionEntity t left join UserEntity u on t.userId = u.id
              left join FineEntity f on t.id = f.transactionId
          where t.itemId = :itemId
      """,
      countQuery = "SELECT count(t) FROM BorrowingTransactionEntity t")
  Page<TransactionListResponse> getAllTransactionByItemId(
      @Param("itemId") Long itemId,
      Pageable pageable);


  @Query("""
          SELECT COUNT(t) > 0
          FROM BorrowingTransactionEntity t
          JOIN ItemEntity i ON t.itemId = i.id
          WHERE t.userId = :userId
            AND i.publicationId = :publicationId
            AND t.status IN ('WAITING_FOR_PICKUP', 'BORROWING', 'OVERDUE')
      """)
  boolean existsByUserIdAndPublicationId(
      @Param("userId") Long userId,
      @Param("publicationId") Long publicationId
  );

  @Query("""
          SELECT COUNT(t) > 0
          FROM BorrowingTransactionEntity t
          JOIN ItemEntity i ON t.itemId = i.id
          WHERE t.userId = :userId
            AND i.publicationId = :publicationId
            AND t.status = 'RETURNED'
      """)
  boolean existsReturnedByUserIdAndPublicationId(
      @Param("userId") Long userId,
      @Param("publicationId") Long publicationId
  );

  @Query(value = """
          SELECT new com.library.circulation.dto.response.UserTransactionResponse(
              t.id, p.id, p.title, p.coverImageUrl, i.barcode, i.branch, i.location,
              t.pickedUpDeadline, t.borrowedDate, t.dueDate, t.returnedDate, t.status, COALESCE(SUM(f.fineAmount), 0),
              t.depositGrossFineAmount, t.depositAmount, t.depositStatus, t.depositAppliedAmount,
              t.depositRefundAmount, t.depositAdditionalAmountDue,
              CASE WHEN r.id IS NOT NULL THEN true ELSE false END
          )
          FROM BorrowingTransactionEntity t
          JOIN ItemEntity i ON t.itemId = i.id
          JOIN PublicationEntity p ON i.publicationId = p.id
          LEFT JOIN FineEntity f ON t.id = f.transactionId
          LEFT JOIN RatingEntity r ON r.transactionId = t.id
          WHERE t.userId = :userId
          GROUP BY t.id, p.id, p.title, p.coverImageUrl, i.barcode, i.branch, i.location,
              t.pickedUpDeadline, t.borrowedDate, t.dueDate, t.returnedDate, t.status,
              t.depositGrossFineAmount, t.depositAmount, t.depositStatus, t.depositAppliedAmount,
              t.depositRefundAmount, t.depositAdditionalAmountDue, r.id
      """,
      countQuery = "SELECT COUNT(t) FROM BorrowingTransactionEntity t WHERE t.userId = :userId")
  Page<UserTransactionResponse> getMyTransactions(
      @Param("userId") Long userId,
      Pageable pageable
  );
}
