package com.library.circulation.presentation.controller;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.util.RequiresRole;
import com.library.shared.util.TsIdGenerator;
import io.swagger.v3.oas.annotations.Operation;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/transactions/{transactionId}/note")
@RequiredArgsConstructor
public class TransactionNoteController {

  private final NamedParameterJdbcTemplate jdbcTemplate;
  private final com.library.shared.util.SecurityEvaluator security;

  public record UpsertTransactionNoteRequest(Boolean important, String note) {}

  @Builder
  public record TransactionNoteResponse(
      @JsonSerialize(using = ToStringSerializer.class) Long noteId,
      @JsonSerialize(using = ToStringSerializer.class) Long transactionId,
      @JsonSerialize(using = ToStringSerializer.class) Long librarianId,
      String librarianName,
      String librarianCode,
      String librarianAvatarUrl,
      boolean important,
      String note,
      Instant createdAt,
      Instant updatedAt,
      boolean editableByCurrentUser) {}

  @GetMapping
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "List librarian notes for a transaction")
  public ApiResponseApp<List<TransactionNoteResponse>> listNotes(
      @PathVariable("transactionId") Long transactionId) {
    return ApiResponseApp.success(fetchNotes(transactionId));
  }

  @PostMapping
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Add librarian note to a transaction")
  public ApiResponseApp<TransactionNoteResponse> addNote(
      @PathVariable("transactionId") Long transactionId,
      @RequestBody UpsertTransactionNoteRequest request) {
    Long librarianId = security.getCurrentUserId();
    Boolean important = request.important() == null ? Boolean.TRUE : request.important();
    String note = request.note() == null ? "" : request.note().trim();
    Long noteId = TsIdGenerator.next();

    jdbcTemplate.update("""
        INSERT INTO transaction_notes (id, created_at, updated_at, transaction_id, librarian_id, important, note)
        VALUES (:id, NOW(), NOW(), :transactionId, :librarianId, :important, :note)
        """, Map.of(
        "id", noteId,
        "transactionId", transactionId,
        "librarianId", librarianId,
        "important", important,
        "note", note
    ));

    return ApiResponseApp.success(fetchNoteById(noteId));
  }

  @PutMapping
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Add librarian note to a transaction")
  public ApiResponseApp<TransactionNoteResponse> upsertNote(
      @PathVariable("transactionId") Long transactionId,
      @RequestBody UpsertTransactionNoteRequest request) {
    return addNote(transactionId, request);
  }

  @DeleteMapping
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Delete current librarian notes for a transaction")
  public ApiResponseApp<Void> deleteNote(@PathVariable("transactionId") Long transactionId) {
    Long librarianId = security.getCurrentUserId();
    jdbcTemplate.update(
        """
        DELETE FROM transaction_notes
        WHERE transaction_id = :transactionId
          AND librarian_id = :librarianId
        """,
        Map.of("transactionId", transactionId, "librarianId", librarianId));
    return ApiResponseApp.success(null);
  }

  @DeleteMapping("/{noteId}")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Delete one librarian note")
  public ApiResponseApp<Void> deleteOneNote(
      @PathVariable("transactionId") Long transactionId,
      @PathVariable("noteId") Long noteId) {
    Long librarianId = security.getCurrentUserId();
    jdbcTemplate.update("""
        DELETE FROM transaction_notes
        WHERE transaction_id = :transactionId
          AND id = :noteId
          AND librarian_id = :librarianId
        """, Map.of("transactionId", transactionId, "noteId", noteId, "librarianId", librarianId));
    return ApiResponseApp.success(null);
  }

  private List<TransactionNoteResponse> fetchNotes(Long transactionId) {
    Long currentUserId = security.getCurrentUserId();
    return jdbcTemplate.query("""
        SELECT
          tn.id,
          tn.transaction_id,
          tn.librarian_id,
          u.full_name AS librarian_name,
          u.student_id AS librarian_code,
          u.profile_picture_url AS librarian_avatar_url,
          tn.important,
          tn.note,
          tn.created_at,
          tn.updated_at,
          (tn.librarian_id = :currentUserId) AS editable_by_current_user
        FROM transaction_notes tn
        LEFT JOIN users u ON u.id = tn.librarian_id
        WHERE tn.transaction_id = :transactionId
        ORDER BY tn.created_at ASC, tn.id ASC
        """, Map.of("transactionId", transactionId, "currentUserId", currentUserId), (rs, rowNum) -> mapNote(rs));
  }

  private TransactionNoteResponse fetchNoteById(Long noteId) {
    Long currentUserId = security.getCurrentUserId();
    return jdbcTemplate.queryForObject("""
        SELECT
          tn.id,
          tn.transaction_id,
          tn.librarian_id,
          u.full_name AS librarian_name,
          u.student_id AS librarian_code,
          u.profile_picture_url AS librarian_avatar_url,
          tn.important,
          tn.note,
          tn.created_at,
          tn.updated_at,
          (tn.librarian_id = :currentUserId) AS editable_by_current_user
        FROM transaction_notes tn
        LEFT JOIN users u ON u.id = tn.librarian_id
        WHERE tn.id = :noteId
        """, Map.of("noteId", noteId, "currentUserId", currentUserId), (rs, rowNum) -> mapNote(rs));
  }

  private TransactionNoteResponse mapNote(java.sql.ResultSet rs) throws java.sql.SQLException {
    return TransactionNoteResponse.builder()
        .noteId(rs.getLong("id"))
        .transactionId(rs.getLong("transaction_id"))
        .librarianId(rs.getLong("librarian_id"))
        .librarianName(rs.getString("librarian_name"))
        .librarianCode(rs.getString("librarian_code"))
        .librarianAvatarUrl(rs.getString("librarian_avatar_url"))
        .important(rs.getBoolean("important"))
        .note(rs.getString("note"))
        .createdAt(toInstant(rs.getTimestamp("created_at")))
        .updatedAt(toInstant(rs.getTimestamp("updated_at")))
        .editableByCurrentUser(rs.getBoolean("editable_by_current_user"))
        .build();
  }

  private Instant toInstant(Timestamp timestamp) {
    return timestamp == null ? null : timestamp.toInstant();
  }
}
