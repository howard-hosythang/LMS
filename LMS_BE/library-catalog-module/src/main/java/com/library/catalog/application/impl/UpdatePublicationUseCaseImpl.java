package com.library.catalog.application.impl;

import com.library.catalog.application.UpdatePublicationUseCase;
import com.library.catalog.domain.enums.PublicationFormat;
import com.library.catalog.domain.valueobject.ISBN;
import com.library.catalog.dto.request.publication.UpdatePublicationRequest;
import com.library.catalog.infrastructure.persistence.entity.PublicationEntity;
import com.library.catalog.infrastructure.persistence.repository.PublicationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.service.LibrarianNotificationService;
import com.library.shared.util.TsIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UpdatePublicationUseCaseImpl implements UpdatePublicationUseCase {

    private final PublicationJpaRepository publicationJpaRepository;
    private final JdbcTemplate jdbcTemplate;
    private final LibrarianNotificationService librarianNotificationService;

    @Override
    @Transactional
    public void execute(Long publicationId, UpdatePublicationRequest request, Long librarianId) {
        PublicationEntity entity = publicationJpaRepository.findById(publicationId)
                .orElseThrow(() -> new IllegalArgumentException("Publication not found: " + publicationId));
        String normalizedIsbn = ISBN.normalizeOptional(request.isbn());
        if (normalizedIsbn != null && publicationJpaRepository.existsByIsbnAndIdNot(normalizedIsbn, publicationId)) {
            throw new AppException(ErrorCode.ISBN_ALREADY_EXISTS);
        }

        // 1. Update Publication Entity
        entity.setIsbn(normalizedIsbn);
        entity.setTitle(request.title());
        entity.setSubtitle(request.subtitle());
        entity.setDescription(request.description());
        entity.setLanguage(request.language());
        entity.setNumberOfPages(request.numberOfPages());
        entity.setPublicationYear(request.publicationYear());
        entity.setEdition(request.edition());
        entity.setPublicationFormat(request.publicationFormat() != null ? request.publicationFormat() : PublicationFormat.PRINT_BOOK);
        entity.setEditionNote(request.editionNote());
        entity.setCoverImageUrl(request.coverImageUrl());
        entity.setSize(request.size());
        entity.setWeight(request.weight());
        entity.setCallNumber(request.callNumber());
        entity.setAiTargetAudience(request.aiTargetAudience());
        entity.setPublisherId(request.publisherId());
        entity.setUpdatedByLibrarianId(librarianId);

        publicationJpaRepository.saveAndFlush(entity);

        // 2. Update Junction Tables
        updateAuthors(publicationId, request.authorIds());
        updateCategories(publicationId, request.categoryIds());
        updateTags(publicationId, request.tagIds());
        librarianNotificationService.notifyAll(
            "LIB_BOOK_UPDATED",
            "Đã cập nhật đầu sách",
            String.format("Đầu sách '%s' đã được cập nhật.", entity.getTitle()),
            "/librarianpage/books/" + publicationId,
            publicationId
        );
    }

    private void updateAuthors(Long publicationId, Long[] authorIds) {
        jdbcTemplate.update("DELETE FROM publication_authors WHERE publication_id = ?", publicationId);
        if (authorIds != null) {
            for (Long authorId : authorIds) {
                jdbcTemplate.update("INSERT INTO publication_authors (id, publication_id, author_id) VALUES (?, ?, ?)",
                        TsIdGenerator.next(), publicationId, authorId);
            }
        }
    }

    private void updateCategories(Long publicationId, Long[] categoryIds) {
        jdbcTemplate.update("DELETE FROM publication_categories WHERE publication_id = ?", publicationId);
        if (categoryIds != null) {
            for (Long categoryId : categoryIds) {
                jdbcTemplate.update("INSERT INTO publication_categories (id, publication_id, category_id) VALUES (?, ?, ?)",
                        TsIdGenerator.next(), publicationId, categoryId);
            }
        }
    }

    private void updateTags(Long publicationId, Long[] tagIds) {
        jdbcTemplate.update("DELETE FROM publication_tags WHERE publication_id = ?", publicationId);
        if (tagIds != null) {
            for (Long tagId : tagIds) {
                jdbcTemplate.update("INSERT INTO publication_tags (id, publication_id, tag_id) VALUES (?, ?, ?)",
                        TsIdGenerator.next(), publicationId, tagId);
            }
        }
    }
}
