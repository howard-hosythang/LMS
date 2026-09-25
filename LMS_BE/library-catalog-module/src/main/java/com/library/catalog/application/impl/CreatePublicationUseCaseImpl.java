package com.library.catalog.application.impl;

import com.library.catalog.application.CreatePublicationUseCase;
import com.library.catalog.domain.enums.PublicationFormat;
import com.library.catalog.domain.valueobject.ISBN;
import com.library.catalog.dto.request.publication.CreatePublicationRequest;
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
public class CreatePublicationUseCaseImpl implements CreatePublicationUseCase {

    private final PublicationJpaRepository publicationJpaRepository;
    private final JdbcTemplate jdbcTemplate;
    private final LibrarianNotificationService librarianNotificationService;

    @Override
    @Transactional
    public Long execute(CreatePublicationRequest request, Long librarianId) {
        String normalizedIsbn = ISBN.normalizeOptional(request.isbn());
        if (normalizedIsbn != null && publicationJpaRepository.existsByIsbn(normalizedIsbn)) {
            throw new AppException(ErrorCode.ISBN_ALREADY_EXISTS);
        }

        // 1. Create and Save Publication Entity
        PublicationEntity entity = new PublicationEntity();
        entity.setId(TsIdGenerator.next());
        entity.setIsbn(normalizedIsbn);
        entity.setTitle(request.title());
        entity.setSubtitle(request.subtitle());
        entity.setDescription(request.description());
        entity.setLanguage(request.language());
        entity.setNumberOfPages(request.numberOfPages());
        entity.setAiSummary(request.aiSummary());
        entity.setAiTargetAudience(request.aiTargetAudience());
        entity.setPublicationYear(request.publicationYear());
        entity.setEdition(request.edition());
        entity.setPublicationFormat(request.publicationFormat() != null ? request.publicationFormat() : PublicationFormat.PRINT_BOOK);
        entity.setEditionNote(request.editionNote());
        entity.setSize(request.size());
        entity.setWeight(request.weight());
        entity.setCoverImageUrl(request.coverImageUrl());
        entity.setCallNumber(request.callNumber());
        entity.setTableOfContents(request.tableOfContents() != null ? request.tableOfContents().toString() : null);
        entity.setPublisherId(request.publisherId());
        entity.setCreatedByLibrarianId(librarianId);
        entity.setUpdatedByLibrarianId(librarianId);

        publicationJpaRepository.saveAndFlush(entity);

        // 2. Insert into Junction Tables
        insertAuthors(entity.getId(), request.authorIds());
        insertCategories(entity.getId(), request.categoryIds());
        insertTags(entity.getId(), request.tagIds());
        librarianNotificationService.notifyAll(
            "LIB_BOOK_CREATED",
            "Đã thêm đầu sách",
            String.format("Đầu sách '%s' đã được thêm vào hệ thống.", entity.getTitle()),
            "/librarianpage/books/" + entity.getId(),
            entity.getId()
        );

        return entity.getId();
    }

    private void insertAuthors(Long publicationId, Long[] authorIds) {
        if (authorIds != null) {
            for (Long authorId : authorIds) {
                jdbcTemplate.update("INSERT INTO publication_authors (id, publication_id, author_id) VALUES (?, ?, ?)",
                        TsIdGenerator.next(), publicationId, authorId);
            }
        }
    }

    private void insertCategories(Long publicationId, Long[] categoryIds) {
        if (categoryIds != null) {
            for (Long categoryId : categoryIds) {
                jdbcTemplate.update("INSERT INTO publication_categories (id, publication_id, category_id) VALUES (?, ?, ?)",
                        TsIdGenerator.next(), publicationId, categoryId);
            }
        }
    }

    private void insertTags(Long publicationId, Long[] tagIds) {
        if (tagIds != null) {
            for (Long tagId : tagIds) {
                jdbcTemplate.update("INSERT INTO publication_tags (id, publication_id, tag_id) VALUES (?, ?, ?)",
                        TsIdGenerator.next(), publicationId, tagId);
            }
        }
    }
}
