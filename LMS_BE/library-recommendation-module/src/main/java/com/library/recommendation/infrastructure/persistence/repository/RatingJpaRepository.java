package com.library.recommendation.infrastructure.persistence.repository;

import com.library.recommendation.dto.response.PublicationRatingResponse;
import com.library.recommendation.dto.response.PublicationRatingSummaryResponse;
import com.library.recommendation.infrastructure.persistence.entity.RatingEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RatingJpaRepository extends JpaRepository<RatingEntity, Long> {

  @Query(value = """
      SELECT new com.library.recommendation.dto.response.PublicationRatingResponse(
          r.id, r.userId, r.transactionId, r.itemBarcode, r.star, r.comment, r.helpfulCount,
          u.fullName, u.profilePictureUrl, u.studentId, u.faculty, r.createdAt)
       FROM RatingEntity r
       JOIN UserEntity u ON r.userId = u.id
       WHERE r.publicationId = :publicationId
         AND (:star IS NULL OR r.star = :star)
      """)
  Page<PublicationRatingResponse> findAllByPublicationId(@Param("publicationId") Long publicationId,
      @Param("star") Integer star,
      Pageable pageable);


  @Query("""
      SELECT new com.library.recommendation.dto.response.PublicationRatingSummaryResponse(
          SUM(CASE WHEN r.star = 5 THEN 1 ELSE 0 END),
          SUM(CASE WHEN r.star = 4 THEN 1 ELSE 0 END),
          SUM(CASE WHEN r.star = 3 THEN 1 ELSE 0 END),
          SUM(CASE WHEN r.star = 2 THEN 1 ELSE 0 END),
          SUM(CASE WHEN r.star = 1 THEN 1 ELSE 0 END),
          COUNT(r)
      )
      FROM RatingEntity r
      WHERE r.publicationId = :publicationId
      """)
  PublicationRatingSummaryResponse getRatingSummaryByPublicationId(
      @Param("publicationId") Long publicationId);
}
