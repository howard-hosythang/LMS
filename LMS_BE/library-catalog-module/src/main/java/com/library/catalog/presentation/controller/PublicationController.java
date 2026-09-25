package com.library.catalog.presentation.controller;

import com.library.catalog.application.BookLookupUseCase;
import com.library.catalog.application.CreatePublicationUseCase;
import com.library.catalog.application.DeletePublicationUseCase;
import com.library.catalog.application.GetDocumentUploadUrlUseCase;
import com.library.catalog.application.GetListPublicationForLibrarianUseCase;
import com.library.catalog.application.RecordPublicationViewUseCase;
import com.library.catalog.application.SearchPublicationsUseCase;
import com.library.catalog.application.GetMostBorrowedPublicationsUseCase;
import com.library.catalog.application.GetNewestPublicationsUseCase;
import com.library.catalog.application.GetPublicationByIdByUseCase;
import com.library.catalog.application.GetPublicLibraryStatsUseCase;
import com.library.catalog.application.GetPublicTestimonialsUseCase;
import com.library.catalog.application.SaveDocumentUrlUseCase;
import com.library.catalog.application.UpdatePublicationUseCase;
import com.library.catalog.application.UploadPublicationCoverUseCase;
import com.library.catalog.application.publication.GetAllItemsByPublicationId;
import com.library.catalog.dto.request.publication.CreatePublicationRequest;
import com.library.catalog.dto.request.publication.PublicSearchRequest;
import com.library.catalog.dto.request.publication.PublicationSearchRequest;
import com.library.catalog.dto.request.publication.SaveDocumentUrlRequest;
import com.library.catalog.dto.request.publication.UpdatePublicationRequest;
import com.library.catalog.dto.response.item.ItemsByPublicationIdResponse;
import com.library.catalog.dto.response.publication.BookLookupResponse;
import com.library.catalog.dto.response.publication.DocumentUploadUrlResponse;
import com.library.catalog.dto.response.publication.PublicSearchResult;
import com.library.catalog.dto.response.publication.LibrarianPublicationListResponse;
import com.library.catalog.dto.response.publication.MostBorrowedPublicationsResponse;
import com.library.catalog.dto.response.publication.NewestPublicationsResponse;
import com.library.catalog.dto.response.publication.PublicationDetailResponse;
import com.library.catalog.dto.response.publication.PublicLibraryStatsResponse;
import com.library.catalog.dto.response.publication.PublicTestimonialResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.dto.PageResponse;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.RequiresRole;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/v1/publications")
@RequiredArgsConstructor
public class PublicationController {

  private final BookLookupUseCase bookLookupUseCase;
  private final DeletePublicationUseCase deletePublicationUseCase;
  private final GetListPublicationForLibrarianUseCase getListPublicationForLibrarianUseCase;
  private final GetPublicationByIdByUseCase getPublicationByIdByUseCase;
  private final RecordPublicationViewUseCase recordPublicationViewUseCase;
  private final com.library.shared.util.SecurityEvaluator securityEvaluator;
  private final UpdatePublicationUseCase updatePublicationUseCase;
  private final CreatePublicationUseCase createPublicationUseCase;
  private final GetNewestPublicationsUseCase getNewestPublicationsUseCase;
  private final GetMostBorrowedPublicationsUseCase getMostBorrowedPublicationsUseCase;
  private final GetAllItemsByPublicationId getAllItemsByPublicationId;
  private final SearchPublicationsUseCase searchPublicationsUseCase;
  private final UploadPublicationCoverUseCase uploadPublicationCoverUseCase;
  private final GetDocumentUploadUrlUseCase getDocumentUploadUrlUseCase;
  private final SaveDocumentUrlUseCase saveDocumentUrlUseCase;
  private final GetPublicLibraryStatsUseCase getPublicLibraryStatsUseCase;
  private final GetPublicTestimonialsUseCase getPublicTestimonialsUseCase;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<String> createPublication(
      @RequestBody @Valid CreatePublicationRequest request) {
    log.info("Create publication with request: {}", request);
    Long id = createPublicationUseCase.execute(request, securityEvaluator.getCurrentUserId());
    return ApiResponseApp.created(String.valueOf(id));
  }

  @PostMapping(value = "/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<String> uploadCover(
      @PathVariable("id") Long id,
      @RequestParam("file") MultipartFile file) {
    return ApiResponseApp.success("Upload cover success",
        uploadPublicationCoverUseCase.execute(id, file));
  }

  @GetMapping("/{id}/document-upload-url")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<DocumentUploadUrlResponse> getDocumentUploadUrl(
      @PathVariable("id") Long id,
      @RequestParam(name = "filename") String filename) {
    return ApiResponseApp.success(getDocumentUploadUrlUseCase.execute(id, filename));
  }

  @PutMapping("/{id}/document-url")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<String> saveDocumentUrl(
      @PathVariable("id") Long id,
      @RequestBody @Valid SaveDocumentUrlRequest request) {
    return ApiResponseApp.success("Document URL saved successfully",
        saveDocumentUrlUseCase.execute(id, request.s3Key()));
  }

  @PostMapping(value = "/{id}/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<String> uploadDocument(
      @PathVariable("id") Long id,
      @RequestParam("file") MultipartFile file) {
    return ApiResponseApp.success("Document uploaded successfully",
        saveDocumentUrlUseCase.upload(id, file));
  }

  @PostMapping("/{id}/ai/reprocess")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<Void> reprocessPublicationAi(@PathVariable("id") Long id) {
    saveDocumentUrlUseCase.reprocessExistingDocument(id);
    return ApiResponseApp.success("AI reprocessing queued");
  }

  @PostMapping("/{id}/ai/vectorize")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<Void> vectorizePublicationAi(@PathVariable("id") Long id) {
    saveDocumentUrlUseCase.reprocessExistingDocumentVectors(id);
    return ApiResponseApp.success("AI vectorization queued");
  }

  @PostMapping("/{id}/ai/metadata")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<Void> generatePublicationAiMetadata(@PathVariable("id") Long id) {
    saveDocumentUrlUseCase.generateExistingDocumentMetadata(id);
    return ApiResponseApp.success("AI metadata generation queued");
  }


  @DeleteMapping("/{id}")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<Void> deletePublication(@PathVariable("id") Long id) {
    deletePublicationUseCase.execute(id);
    return ApiResponseApp.success("Xóa ấn phẩm thành công");
  }

  @PutMapping("/{id}")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<Void> updatePublication(
      @PathVariable("id") Long id,
      @RequestBody @Valid UpdatePublicationRequest request) {
    log.info("Update publication with request: {}", request);
    updatePublicationUseCase.execute(id, request, securityEvaluator.getCurrentUserId());
    return ApiResponseApp.success("update success");
  }


  @GetMapping("/book-lookup")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<BookLookupResponse> bookLookup(
      @RequestParam(name = "q") String query) {
    return ApiResponseApp.success(bookLookupUseCase.execute(query));
  }

  // public endpoint
  @GetMapping("/search")
  public ApiResponseApp<PageResponse<PublicSearchResult>> searchPublications(
      @ModelAttribute PublicSearchRequest request,
      @RequestHeader(name = "Accept-Language", required = false) String acceptLanguage) {
    return ApiResponseApp.success(searchPublicationsUseCase.execute(request, acceptLanguage));
  }

  @GetMapping("/{id}")
  public ApiResponseApp<PublicationDetailResponse> getPublicationById(
      @PathVariable("id") Long id,
      @RequestHeader(name = "Accept-Language", required = false) String acceptLanguage) {
    return ApiResponseApp.success(getPublicationByIdByUseCase.execute(id, acceptLanguage));
  }

  @PostMapping("/{id}/view")
  @RequiresAuthentication
  public ApiResponseApp<Void> recordView(@PathVariable("id") Long id) {
    recordPublicationViewUseCase.execute(id, securityEvaluator.getCurrentUserId());
    return ApiResponseApp.success("ok");
  }

  // public endpoint
  @GetMapping("/{id}/items")
  public ApiResponseApp<PageResponse<ItemsByPublicationIdResponse>> getItemsByPublicationId(
      @PathVariable("id") Long publicationId,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "limit", defaultValue = "10") int limit
  ) {

    return ApiResponseApp.success("get items by publication id success",
        getAllItemsByPublicationId.execute(publicationId, page, limit));
  }


  @RequiresRole(RoleConstants.LIBRARIAN)
  @GetMapping("/librarian")
  public ApiResponseApp<PageResponse<LibrarianPublicationListResponse>> getPublications(
      @ModelAttribute PublicationSearchRequest request
  ) {
    log.info("Get publications with request: {}", request);
    return ApiResponseApp.success(getListPublicationForLibrarianUseCase.execute(request));
  }


  // public endpoint
  @GetMapping("/newest")
  public ApiResponseApp<List<NewestPublicationsResponse>> getNewestPublications(
      @RequestParam(name = "limit", defaultValue = "10") int limit,
      @RequestHeader(name = "Accept-Language", required = false) String acceptLanguage
  ) {
    return ApiResponseApp.success("get newest publications success",
        getNewestPublicationsUseCase.execute(limit, acceptLanguage));
  }


  // public endpoint
  @GetMapping("/most-borrowed")
  public ApiResponseApp<List<MostBorrowedPublicationsResponse>> getMostBorrowedPublications(
      @RequestParam(name = "limit", defaultValue = "10") int limit,
      @RequestHeader(name = "Accept-Language", required = false) String acceptLanguage
  ) {
    return ApiResponseApp.success("get most borrowed publications success",
        getMostBorrowedPublicationsUseCase.execute(limit, acceptLanguage));
  }

  // public endpoint
  @GetMapping("/public-stats")
  public ApiResponseApp<PublicLibraryStatsResponse> getPublicStats() {
    return ApiResponseApp.success("get public library stats success",
        getPublicLibraryStatsUseCase.execute());
  }

  // public endpoint
  @GetMapping("/testimonials")
  public ApiResponseApp<List<PublicTestimonialResponse>> getPublicTestimonials(
      @RequestParam(name = "limit", defaultValue = "3") int limit
  ) {
    return ApiResponseApp.success("get public testimonials success",
        getPublicTestimonialsUseCase.execute(limit));
  }
}
