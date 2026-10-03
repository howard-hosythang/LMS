package com.library.catalog.infrastructure.persistence.repository;

import com.library.catalog.dto.projection.AuthorNameProjection;
import com.library.catalog.dto.projection.MostBorrowedPublicationProjection;
import com.library.catalog.dto.projection.NewestPublicationProjection;
import com.library.catalog.dto.response.item.ItemsByPublicationIdResponse;
import com.library.catalog.infrastructure.persistence.entity.PublicationEntity;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PublicationJpaRepository extends JpaRepository<PublicationEntity, Long> {

  boolean existsByIsbn(String isbn);

  boolean existsByIsbnAndIdNot(String isbn, Long id);

  @Query("""
      SELECT
          p.id              AS publicationId,
          p.title           AS title,
          p.coverImageUrl   AS coverImageUrl,
          p.publicationYear AS publicationYear,
          p.createdAt       AS createdAt,
          COUNT(DISTINCT CASE WHEN i.status = 'AVAILABLE' THEN i.id ELSE NULL END) AS availableItems,
          AVG(r.star)       AS ratingAverage,
          COUNT(DISTINCT r.id) AS ratingCount,
          COUNT(DISTINCT bt.id) AS borrowCount
      FROM PublicationEntity p
      LEFT JOIN ItemEntity i   ON i.publicationId = p.id
      LEFT JOIN RatingEntity r ON r.publicationId = p.id
      LEFT JOIN BorrowingTransactionEntity bt ON bt.itemId = i.id
      GROUP BY p.id, p.title, p.coverImageUrl, p.publicationYear, p.createdAt
      ORDER BY p.createdAt DESC
      """)
  List<NewestPublicationProjection> findNewestPublications(Pageable pageable);


  @Query("""
      SELECT
          p.id              AS publicationId,
          p.title           AS title,
          p.coverImageUrl   AS coverImageUrl,
          p.publicationYear AS publicationYear,
          p.createdAt       AS createdAt,
          COUNT(DISTINCT CASE WHEN i.status = 'AVAILABLE' THEN i.id ELSE NULL END) AS availableItems,
          AVG(r.star)       AS ratingAverage,
          COUNT(DISTINCT r.id) AS ratingCount,
          COUNT(DISTINCT bt.id) AS borrowCount
      FROM PublicationEntity p
      LEFT JOIN ItemEntity i   ON i.publicationId = p.id
      LEFT JOIN RatingEntity r ON r.publicationId = p.id
      LEFT JOIN BorrowingTransactionEntity bt ON bt.itemId = i.id AND bt.status = 'RETURNED'
      GROUP BY p.id, p.title, p.coverImageUrl, p.publicationYear, p.createdAt
      ORDER BY borrowCount DESC
      """)
  List<MostBorrowedPublicationProjection> findMostBorrowedPublications(Pageable pageable);


  @Query("""
      SELECT pa.publicationId AS publicationId, a.name AS authorName
      FROM PublicationAuthorEntity pa
      JOIN AuthorEntity a ON a.id = pa.authorId
      WHERE pa.publicationId IN :publicationIds
      """)
  List<AuthorNameProjection> findAuthorNamesByPublicationIds(
      @Param("publicationIds") List<Long> publicationIds);


  @Query(
      value = """
          SELECT new com.library.catalog.dto.response.item.ItemsByPublicationIdResponse(
              i.id, i.barcode, i.branch, i.location, i.status, i.condition,
              i.copyType, i.bindingType, i.conditionNote, i.acquiredDate, i.acquisitionSource,
              MAX(bt.dueDate))
          FROM ItemEntity i
          LEFT JOIN BorrowingTransactionEntity bt ON bt.itemId = i.id AND bt.status = 'BORROWING'
          WHERE i.publicationId = :publicationId
          GROUP BY i.id, i.barcode, i.branch, i.location, i.status, i.condition,
              i.copyType, i.bindingType, i.conditionNote, i.acquiredDate, i.acquisitionSource
          """,
      countQuery = """
          SELECT COUNT(i)
          FROM ItemEntity i
          WHERE i.publicationId = :publicationId
          """
  )
  Page<ItemsByPublicationIdResponse> findAllItemsByPublicationId(
      @Param("publicationId") Long publicationId,
      Pageable pageable);
}
