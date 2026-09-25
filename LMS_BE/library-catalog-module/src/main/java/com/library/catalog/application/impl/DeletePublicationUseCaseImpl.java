package com.library.catalog.application.impl;

import com.library.catalog.application.DeletePublicationUseCase;
import com.library.catalog.infrastructure.persistence.repository.PublicationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.service.LibrarianNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeletePublicationUseCaseImpl implements DeletePublicationUseCase {

    private final PublicationJpaRepository publicationJpaRepository;
    private final JdbcTemplate jdbcTemplate;
    private final LibrarianNotificationService librarianNotificationService;

    @Override
    @Transactional
    public void execute(Long publicationId) {
        if (!publicationJpaRepository.existsById(publicationId)) {
            throw new AppException(ErrorCode.PUBLICATION_NOT_FOUND);
        }
        String title = jdbcTemplate.queryForObject(
            "SELECT title FROM publications WHERE id = ?",
            String.class,
            publicationId
        );

        Integer itemCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM items WHERE publication_id = ?", Integer.class, publicationId);
        if (itemCount != null && itemCount > 0) {
            throw new AppException(ErrorCode.CANNOT_DELETE_PUBLICATION_HAS_ITEMS);
        }

        Integer activeReservationCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM reservations WHERE publication_id = ? AND status IN ('PENDING','READY_FOR_PICKUP')",
            Integer.class, publicationId);
        if (activeReservationCount != null && activeReservationCount > 0) {
            throw new AppException(ErrorCode.CANNOT_DELETE_PUBLICATION_HAS_ACTIVE_RESERVATIONS);
        }

        // Cascade delete dependent data
        jdbcTemplate.update("DELETE FROM publication_authors WHERE publication_id = ?", publicationId);
        jdbcTemplate.update("DELETE FROM publication_categories WHERE publication_id = ?", publicationId);
        jdbcTemplate.update("DELETE FROM publication_tags WHERE publication_id = ?", publicationId);
        jdbcTemplate.update("DELETE FROM ratings WHERE publication_id = ?", publicationId);
        jdbcTemplate.update("DELETE FROM user_interactions WHERE publication_id = ?", publicationId);
        jdbcTemplate.update("DELETE FROM reservations WHERE publication_id = ?", publicationId);

        publicationJpaRepository.deleteById(publicationId);
        librarianNotificationService.notifyAll(
            "LIB_BOOK_DELETED",
            "Đã xoá đầu sách",
            String.format("Đầu sách '%s' đã được xoá khỏi hệ thống.", title),
            "/librarianpage/books",
            publicationId
        );
    }
}
