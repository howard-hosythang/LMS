package com.library.catalog.application.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.catalog.domain.enums.FacultyTarget;
import com.library.catalog.domain.enums.PublicationFormat;
import com.library.catalog.dto.request.publication.CreatePublicationRequest;
import com.library.catalog.infrastructure.persistence.entity.PublicationEntity;
import com.library.catalog.infrastructure.persistence.repository.PublicationJpaRepository;
import com.library.shared.service.LibrarianNotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreatePublicationUseCase — Unit Tests")
class CreatePublicationUseCaseImplTest {

    @Mock private PublicationJpaRepository publicationJpaRepository;
    @Mock private JdbcTemplate jdbcTemplate;
    @Mock private LibrarianNotificationService librarianNotificationService;

    @InjectMocks private CreatePublicationUseCaseImpl useCase;

    @Test
    @DisplayName("creates publication, normalizes ISBN and writes junction rows")
    void execute_shouldPersistPublicationAndRelations() throws Exception {
        CreatePublicationRequest request = new CreatePublicationRequest(
            "978-0-13-235088-4",
            "Clean Code",
            "A Handbook of Agile Software Craftsmanship",
            "Practical software engineering guidance",
            "en",
            464,
            "Summary",
            FacultyTarget.KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH,
            2008,
            1,
            PublicationFormat.PRINT_BOOK,
            "First edition",
            "24x18x3 cm",
            700.0,
            10L,
            "https://cdn.example/clean-code.jpg",
            new Long[] {11L, 12L},
            new Long[] {21L},
            new Long[] {31L, 32L},
            "QA76.76",
            new ObjectMapper().readTree("[{\"title\":\"Chapter 1\"}]")
        );

        Long id = useCase.execute(request, 99L);

        ArgumentCaptor<PublicationEntity> publicationCaptor =
            ArgumentCaptor.forClass(PublicationEntity.class);
        verify(publicationJpaRepository).saveAndFlush(publicationCaptor.capture());
        PublicationEntity saved = publicationCaptor.getValue();

        assertThat(id).isEqualTo(saved.getId());
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getIsbn()).isEqualTo("9780132350884");
        assertThat(saved.getTitle()).isEqualTo("Clean Code");
        assertThat(saved.getPublisherId()).isEqualTo(10L);
        assertThat(saved.getCreatedByLibrarianId()).isEqualTo(99L);
        assertThat(saved.getUpdatedByLibrarianId()).isEqualTo(99L);
        assertThat(saved.getTableOfContents()).contains("Chapter 1");

        verify(jdbcTemplate).update(
            contains("publication_authors"),
            any(Long.class),
            org.mockito.ArgumentMatchers.eq(saved.getId()),
            org.mockito.ArgumentMatchers.eq(11L)
        );
        verify(jdbcTemplate).update(
            contains("publication_authors"),
            any(Long.class),
            org.mockito.ArgumentMatchers.eq(saved.getId()),
            org.mockito.ArgumentMatchers.eq(12L)
        );
        verify(jdbcTemplate).update(
            contains("publication_categories"),
            any(Long.class),
            org.mockito.ArgumentMatchers.eq(saved.getId()),
            org.mockito.ArgumentMatchers.eq(21L)
        );
        verify(jdbcTemplate).update(
            contains("publication_tags"),
            any(Long.class),
            org.mockito.ArgumentMatchers.eq(saved.getId()),
            org.mockito.ArgumentMatchers.eq(31L)
        );
        verify(jdbcTemplate).update(
            contains("publication_tags"),
            any(Long.class),
            org.mockito.ArgumentMatchers.eq(saved.getId()),
            org.mockito.ArgumentMatchers.eq(32L)
        );
    }
}
