package com.library.user.presentation.controller;

import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.shared.service.EmailService;
import com.library.shared.service.LibrarianNotificationService;
import com.library.shared.templates.EmailTemplates;
import com.library.shared.util.RequiresAnyRole;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.RequiresRole;
import com.library.shared.util.SecurityEvaluator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Size;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/contact-messages")
@RequiredArgsConstructor
@Slf4j
public class ContactMessageController {

  private final NamedParameterJdbcTemplate jdbcTemplate;
  private final SecurityEvaluator security;
  private final KafkaTemplate<String, Object> kafkaTemplate;
  private final EmailService emailService;
  private final LibrarianNotificationService librarianNotificationService;

  @Value("${base.frontend-url:http://localhost:3000}")
  private String frontendUrl;

  public record SubmitContactMessageRequest(
      @Size(max = 120) String name,
      @Size(max = 160) String email,
      @Pattern(regexp = "GENERAL|SYSTEM_ERROR|CIRCULATION|BOOK_SUGGESTION|ACCOUNT|OTHER") String category,
      @NotBlank @Size(max = 200) String subject,
      @NotBlank @Size(max = 5000) String message
  ) {
  }

  public record UpdateContactMessageRequest(
      @Pattern(regexp = "NEW|IN_PROGRESS|RESOLVED|CLOSED") String status,
      @Size(max = 5000) String internalNote,
      @Size(max = 5000) String replyMessage
  ) {
  }

  public record AddContactCommentRequest(
      @NotBlank @Size(max = 5000) String body
  ) {
  }

  public record UpsertInternalNoteRequest(
      @NotBlank @Size(max = 5000) String body
  ) {
  }

  public record FeedbackRequest(
      @Min(1) @Max(5) int rating,
      @Size(max = 1000) String note
  ) {
  }

  public record ContactSummaryResponse(long newCount) {
  }

  public record ContactMessageResponse(
      Long id,
      String ticketCode,
      Long senderUserId,
      String senderName,
      String senderEmail,
      String senderPhoneNumber,
      String senderAvatarUrl,
      String category,
      String subject,
      String message,
      String status,
      String internalNote,
      String replyMessage,
      LocalDateTime repliedAt,
      Long handledByUserId,
      Long assignedToUserId,
      Boolean assignedToCurrentUser,
      String assignedToName,
      String assignedToEmail,
      String assignedToPhoneNumber,
      String assignedToLibrarianCode,
      String assignedToAvatarUrl,
      LocalDateTime closedAt,
      Integer satisfactionRating,
      String feedbackNote,
      LocalDateTime reopenedAt,
      LocalDateTime createdAt,
      LocalDateTime updatedAt
  ) {
  }

  public record ContactMessageCommentResponse(
      Long id,
      Long contactMessageId,
      Long authorUserId,
      String authorName,
      String authorEmail,
      String authorAvatarUrl,
      String authorRole,
      String body,
      LocalDateTime createdAt
  ) {
  }

  public record ContactInternalNoteResponse(
      Long id,
      Long contactMessageId,
      Long authorUserId,
      String authorName,
      String authorEmail,
      String authorAvatarUrl,
      String body,
      LocalDateTime createdAt,
      LocalDateTime updatedAt
  ) {
  }

  private record CurrentUser(Long id, String fullName, String email, String role) {
  }

  @PostMapping
  @RequiresAuthentication
  public ApiResponseApp<ContactMessageResponse> submit(@Valid @RequestBody SubmitContactMessageRequest request) {
    String ticketCode = "REQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    String category = request.category() == null || request.category().isBlank() ? "GENERAL" : request.category().trim();
    CurrentUser sender = currentUser();
    ContactMessageResponse response = jdbcTemplate.queryForObject(
        """
        INSERT INTO contact_messages (ticket_code, sender_user_id, sender_name, sender_email, category, subject, message, status)
        VALUES (:ticketCode, :senderUserId, :name, :email, :category, :subject, :message, 'NEW')
        RETURNING contact_messages.*,
            (SELECT phone_number FROM users WHERE id = contact_messages.sender_user_id) AS sender_phone_number,
            (SELECT profile_picture_url FROM users WHERE id = contact_messages.sender_user_id) AS sender_avatar_url,
            NULL::varchar AS assigned_to_name,
            NULL::varchar AS assigned_to_email,
            NULL::varchar AS assigned_to_phone_number,
            NULL::varchar AS assigned_to_librarian_code,
            NULL::varchar AS assigned_to_avatar_url
        """,
        new MapSqlParameterSource()
            .addValue("ticketCode", ticketCode)
            .addValue("senderUserId", sender.id())
            .addValue("name", sender.fullName())
            .addValue("email", sender.email())
            .addValue("category", category)
            .addValue("subject", request.subject().trim())
            .addValue("message", request.message().trim()),
        mapper()
    );
    insertComment(response.id(), sender.id(), sender.fullName(), sender.email(), "USER", response.message());
    librarianNotificationService.notifyAll(
        "LIB_TICKET_NEW",
        "Ticket hỗ trợ mới",
        "Ticket " + response.ticketCode() + " từ " + response.senderName() + ": " + response.subject(),
        "/librarianpage/contact-inbox?ticket=" + response.id(),
        response.id()
    );
    return ApiResponseApp.success("Contact message submitted", response);
  }

  @GetMapping("/summary")
  @RequiresAuthentication
  @RequiresAnyRole({RoleConstants.LIBRARIAN, RoleConstants.ADMIN})
  public ApiResponseApp<ContactSummaryResponse> summary() {
    Long count = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM contact_messages WHERE status = 'NEW'",
        new MapSqlParameterSource(),
        Long.class
    );
    return ApiResponseApp.success(new ContactSummaryResponse(count == null ? 0 : count));
  }

  @GetMapping("/my")
  @RequiresAuthentication
  public ApiResponseApp<List<ContactMessageResponse>> myTickets() {
    CurrentUser currentUser = currentUser();
    List<ContactMessageResponse> rows = jdbcTemplate.query(
        """
        SELECT cm.*,
               sender.profile_picture_url AS sender_avatar_url,
               sender.phone_number AS sender_phone_number,
               assignee.full_name AS assigned_to_name,
               assignee.email AS assigned_to_email,
               assignee.phone_number AS assigned_to_phone_number,
               assignee.student_id AS assigned_to_librarian_code,
               assignee.profile_picture_url AS assigned_to_avatar_url
        FROM contact_messages cm
        LEFT JOIN users sender ON sender.id = cm.sender_user_id
        LEFT JOIN users assignee ON assignee.id = cm.assigned_to_user_id
        WHERE cm.sender_user_id = :userId
           OR LOWER(cm.sender_email) = LOWER(:email)
        ORDER BY cm.updated_at DESC, cm.created_at DESC
        LIMIT 100
        """,
        new MapSqlParameterSource()
            .addValue("userId", currentUser.id())
            .addValue("email", currentUser.email()),
        mapper()
    );
    return ApiResponseApp.success(rows);
  }

  @GetMapping
  @RequiresAuthentication
  @RequiresAnyRole({RoleConstants.LIBRARIAN, RoleConstants.ADMIN})
  public ApiResponseApp<List<ContactMessageResponse>> list(
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "50") int limit
  ) {
    String statusFilter = status == null || status.isBlank() ? "ALL" : status.trim();
    String sql = """
        SELECT cm.*,
               sender.profile_picture_url AS sender_avatar_url,
               sender.phone_number AS sender_phone_number,
               assignee.full_name AS assigned_to_name,
               assignee.email AS assigned_to_email,
               assignee.phone_number AS assigned_to_phone_number,
               assignee.student_id AS assigned_to_librarian_code,
               assignee.profile_picture_url AS assigned_to_avatar_url
        FROM contact_messages cm
        LEFT JOIN users sender ON sender.id = cm.sender_user_id
        LEFT JOIN users assignee ON assignee.id = cm.assigned_to_user_id
        WHERE (:statusFilter = 'ALL' OR cm.status = :statusFilter)
        ORDER BY cm.created_at DESC
        LIMIT :limit
        """;
    List<ContactMessageResponse> rows = jdbcTemplate.query(
        sql,
        new MapSqlParameterSource()
            .addValue("statusFilter", statusFilter)
            .addValue("limit", Math.max(1, Math.min(limit, 200))),
        mapper()
    );
    return ApiResponseApp.success(rows);
  }

  @PatchMapping("/{id}")
  @RequiresAuthentication
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<ContactMessageResponse> update(
      @PathVariable Long id,
      @Valid @RequestBody UpdateContactMessageRequest request
  ) {
    Long currentUserId = security.getCurrentUserId();
    ContactMessageResponse ticket = requireTicketAccess(id);
    if (security.isAdmin()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin can only view contact tickets");
    }
    requireAssignedLibrarian(ticket);
    String requestedStatus = request.status();
    if (requestedStatus != null && !requestedStatus.isBlank()
        && !"RESOLVED".equals(requestedStatus)
        && !"CLOSED".equals(requestedStatus)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Only resolve or close actions are allowed here");
    }
    if ("CLOSED".equals(ticket.status())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket is already closed");
    }
    ContactMessageResponse response = jdbcTemplate.queryForObject(
        """
        UPDATE contact_messages
        SET status = COALESCE(CAST(:status AS varchar), status),
            internal_note = COALESCE(CAST(:internalNote AS text), internal_note),
            reply_message = COALESCE(CAST(:replyMessage AS text), reply_message),
            replied_at = CASE WHEN CAST(:replyMessage AS text) IS NULL THEN replied_at ELSE CURRENT_TIMESTAMP END,
            handled_by_user_id = :handledByUserId,
            assigned_to_user_id = COALESCE(assigned_to_user_id, :handledByUserId),
            closed_at = CASE
                WHEN CAST(:status AS varchar) = 'CLOSED' THEN CURRENT_TIMESTAMP
                ELSE closed_at
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        RETURNING contact_messages.*,
            (SELECT phone_number FROM users WHERE id = contact_messages.sender_user_id) AS sender_phone_number,
            (SELECT profile_picture_url FROM users WHERE id = contact_messages.sender_user_id) AS sender_avatar_url,
            (SELECT full_name FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_name,
            (SELECT email FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_email,
            (SELECT phone_number FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_phone_number,
            (SELECT student_id FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_librarian_code,
            (SELECT profile_picture_url FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_avatar_url
        """,
        new MapSqlParameterSource()
            .addValue("id", id)
            .addValue("status", request.status())
            .addValue("internalNote", request.internalNote())
            .addValue("replyMessage", request.replyMessage())
            .addValue("handledByUserId", currentUserId),
        mapper()
    );
    if (request.replyMessage() != null && !request.replyMessage().isBlank()) {
      CurrentUser currentUser = currentUser();
      insertComment(response.id(), currentUser.id(), currentUser.fullName(), currentUser.email(), "LIBRARIAN", request.replyMessage().trim());
      notifyTicketSender(response, "CONTACT_TICKET_REPLY");
    }
    if ("RESOLVED".equals(requestedStatus) && !"RESOLVED".equals(ticket.status())) {
      notifyTicketSender(response, "CONTACT_TICKET_RESOLVED");
      librarianNotificationService.notifyAll(
          "LIB_TICKET_RESOLVED",
          "Ticket đã được xử lý",
          "Ticket " + response.ticketCode() + " đã được xử lý bởi " + response.assignedToName() + ".",
          "/librarianpage/contact-inbox?ticket=" + response.id(),
          response.id()
      );
      sendResolvedSupportEmail(response);
    }
    if ("CLOSED".equals(requestedStatus) && !"CLOSED".equals(ticket.status())) {
      notifyTicketSender(response, "CONTACT_TICKET_CLOSED");
      librarianNotificationService.notifyAll(
          "LIB_TICKET_CLOSED",
          "Ticket đã được đóng",
          "Ticket " + response.ticketCode() + " đã được đóng bởi " + response.assignedToName() + ".",
          "/librarianpage/contact-inbox?ticket=" + response.id(),
          response.id()
      );
    }
    return ApiResponseApp.success("Contact message updated", response);
  }

  @PostMapping("/{id}/assign")
  @RequiresAuthentication
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<ContactMessageResponse> assign(@PathVariable Long id) {
    Long currentUserId = security.getCurrentUserId();
    ContactMessageResponse ticket = requireTicketAccess(id);
    if (security.isAdmin()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin can only view contact tickets");
    }
    if ("RESOLVED".equals(ticket.status()) || "CLOSED".equals(ticket.status())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Resolved or closed tickets cannot be assigned");
    }
    if (ticket.assignedToUserId() != null && !ticket.assignedToUserId().equals(currentUserId)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket is already assigned to another librarian");
    }
    ContactMessageResponse response = jdbcTemplate.queryForObject(
        """
        UPDATE contact_messages
        SET status = CASE WHEN status = 'NEW' THEN 'IN_PROGRESS' ELSE status END,
            assigned_to_user_id = :userId,
            handled_by_user_id = :userId,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
          AND (assigned_to_user_id IS NULL OR assigned_to_user_id = :userId)
          AND status NOT IN ('RESOLVED', 'CLOSED')
        RETURNING contact_messages.*,
            (SELECT phone_number FROM users WHERE id = contact_messages.sender_user_id) AS sender_phone_number,
            (SELECT profile_picture_url FROM users WHERE id = contact_messages.sender_user_id) AS sender_avatar_url,
            (SELECT full_name FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_name,
            (SELECT email FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_email,
            (SELECT phone_number FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_phone_number,
            (SELECT student_id FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_librarian_code,
            (SELECT profile_picture_url FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_avatar_url
        """,
        new MapSqlParameterSource()
            .addValue("id", id)
            .addValue("userId", currentUserId),
        mapper()
    );
    librarianNotificationService.notifyAll(
        "LIB_TICKET_ASSIGNED",
        "Ticket đã có thủ thư nhận xử lý",
        "Ticket " + response.ticketCode() + " đã được nhận xử lý bởi " + response.assignedToName() + ".",
        "/librarianpage/contact-inbox?ticket=" + response.id(),
        response.id()
    );
    return ApiResponseApp.success("Ticket assigned", response);
  }

  @GetMapping("/{id}/comments")
  @RequiresAuthentication
  public ApiResponseApp<List<ContactMessageCommentResponse>> comments(@PathVariable Long id) {
    requireTicketAccess(id);
    List<ContactMessageCommentResponse> rows = jdbcTemplate.query(
        """
        SELECT c.*, u.profile_picture_url AS author_avatar_url
        FROM contact_message_comments c
        LEFT JOIN users u ON u.id = c.author_user_id
        WHERE c.contact_message_id = :id
        ORDER BY c.created_at ASC, c.id ASC
        """,
        new MapSqlParameterSource().addValue("id", id),
        commentMapper()
    );
    return ApiResponseApp.success(rows);
  }

  @PostMapping("/{id}/comments")
  @RequiresAuthentication
  public ApiResponseApp<ContactMessageCommentResponse> addComment(
      @PathVariable Long id,
      @Valid @RequestBody AddContactCommentRequest request
  ) {
    ContactMessageResponse ticket = requireTicketAccess(id);
    if (security.isAdmin()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin can only view contact tickets");
    }
    if (!isStaff() && ("RESOLVED".equals(ticket.status()) || "CLOSED".equals(ticket.status()))) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket is already resolved or closed");
    }
    if (isStaff()) {
      requireAssignedLibrarian(ticket);
      if ("RESOLVED".equals(ticket.status()) || "CLOSED".equals(ticket.status())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket is already resolved or closed");
      }
    }

    CurrentUser currentUser = currentUser();
    String authorRole = isStaff() ? "LIBRARIAN" : "USER";
    ContactMessageCommentResponse comment = insertComment(
        id,
        currentUser.id(),
        currentUser.fullName(),
        currentUser.email(),
        authorRole,
        request.body().trim()
    );

    if (isStaff()) {
      jdbcTemplate.update(
          """
          UPDATE contact_messages
          SET status = CASE WHEN status = 'NEW' THEN 'IN_PROGRESS' ELSE status END,
              reply_message = :body,
              replied_at = CURRENT_TIMESTAMP,
              handled_by_user_id = :userId,
              assigned_to_user_id = COALESCE(assigned_to_user_id, :userId),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = :id
          """,
          new MapSqlParameterSource()
              .addValue("id", id)
              .addValue("body", request.body().trim())
              .addValue("userId", currentUser.id())
      );
      notifyTicketSender(ticket, "CONTACT_TICKET_REPLY");
    } else {
      jdbcTemplate.update(
          """
          UPDATE contact_messages
          SET status = CASE WHEN status = 'RESOLVED' THEN 'IN_PROGRESS' ELSE status END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = :id
          """,
          new MapSqlParameterSource().addValue("id", id)
      );
      if (ticket.assignedToUserId() != null) {
        librarianNotificationService.notifyOne(
            ticket.assignedToUserId(),
            "LIB_TICKET_MESSAGE",
            "Sinh viên nhắn tin trong ticket",
            "Ticket " + ticket.ticketCode() + " có tin nhắn mới từ " + currentUser.fullName() + ".",
            "/librarianpage/contact-inbox?ticket=" + ticket.id(),
            ticket.id()
        );
      }
    }

    return ApiResponseApp.success("Comment added", comment);
  }

  @GetMapping("/{id}/internal-notes")
  @RequiresAuthentication
  @RequiresAnyRole({RoleConstants.LIBRARIAN, RoleConstants.ADMIN})
  public ApiResponseApp<List<ContactInternalNoteResponse>> internalNotes(@PathVariable Long id) {
    requireTicketAccess(id);
    List<ContactInternalNoteResponse> rows = jdbcTemplate.query(
        """
        SELECT n.*, u.full_name AS author_name, u.email AS author_email, u.profile_picture_url AS author_avatar_url
        FROM contact_message_internal_notes n
        JOIN users u ON u.id = n.author_user_id
        WHERE n.contact_message_id = :id
        ORDER BY n.created_at DESC, n.id DESC
        """,
        new MapSqlParameterSource().addValue("id", id),
        internalNoteMapper()
    );
    return ApiResponseApp.success(rows);
  }

  @PostMapping("/{id}/internal-notes")
  @RequiresAuthentication
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<ContactInternalNoteResponse> addInternalNote(
      @PathVariable Long id,
      @Valid @RequestBody UpsertInternalNoteRequest request
  ) {
    requireTicketAccess(id);
    CurrentUser currentUser = currentUser();
    ContactInternalNoteResponse response = jdbcTemplate.queryForObject(
        """
        INSERT INTO contact_message_internal_notes (contact_message_id, author_user_id, body)
        VALUES (:ticketId, :authorUserId, :body)
        RETURNING *, :authorName AS author_name, :authorEmail AS author_email,
            (SELECT profile_picture_url FROM users WHERE id = :authorUserId) AS author_avatar_url
        """,
        new MapSqlParameterSource()
            .addValue("ticketId", id)
            .addValue("authorUserId", currentUser.id())
            .addValue("authorName", currentUser.fullName())
            .addValue("authorEmail", currentUser.email())
            .addValue("body", request.body().trim()),
        internalNoteMapper()
    );
    touchTicket(id);
    return ApiResponseApp.success("Internal note added", response);
  }

  @PatchMapping("/{id}/internal-notes/{noteId}")
  @RequiresAuthentication
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<ContactInternalNoteResponse> updateInternalNote(
      @PathVariable Long id,
      @PathVariable Long noteId,
      @Valid @RequestBody UpsertInternalNoteRequest request
  ) {
    CurrentUser currentUser = currentUser();
    ContactInternalNoteResponse response = jdbcTemplate.query(
        """
        UPDATE contact_message_internal_notes
        SET body = :body,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :noteId
          AND contact_message_id = :ticketId
          AND author_user_id = :authorUserId
        RETURNING *,
            (SELECT full_name FROM users WHERE id = author_user_id) AS author_name,
            (SELECT email FROM users WHERE id = author_user_id) AS author_email,
            (SELECT profile_picture_url FROM users WHERE id = author_user_id) AS author_avatar_url
        """,
        new MapSqlParameterSource()
            .addValue("ticketId", id)
            .addValue("noteId", noteId)
            .addValue("authorUserId", currentUser.id())
            .addValue("body", request.body().trim()),
        internalNoteMapper()
    ).stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only note author can edit this note"));
    touchTicket(id);
    return ApiResponseApp.success("Internal note updated", response);
  }

  @DeleteMapping("/{id}/internal-notes/{noteId}")
  @RequiresAuthentication
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<Void> deleteInternalNote(@PathVariable Long id, @PathVariable Long noteId) {
    int deleted = jdbcTemplate.update(
        """
        DELETE FROM contact_message_internal_notes
        WHERE id = :noteId
          AND contact_message_id = :ticketId
          AND author_user_id = :authorUserId
        """,
        new MapSqlParameterSource()
            .addValue("ticketId", id)
            .addValue("noteId", noteId)
            .addValue("authorUserId", security.getCurrentUserId())
    );
    if (deleted == 0) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only note author can delete this note");
    }
    touchTicket(id);
    return ApiResponseApp.success("Internal note deleted", null);
  }

  @PostMapping("/{id}/reopen")
  @RequiresAuthentication
  public ApiResponseApp<ContactMessageResponse> reopen(@PathVariable Long id) {
    ContactMessageResponse ticket = requireTicketAccess(id);
    if (isStaff()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only sender can reopen this ticket");
    }
    if (!"RESOLVED".equals(ticket.status()) && !"CLOSED".equals(ticket.status())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Only resolved or closed tickets can be reopened");
    }
    ContactMessageResponse response = jdbcTemplate.queryForObject(
        """
        UPDATE contact_messages
        SET status = 'IN_PROGRESS',
            reopened_at = CURRENT_TIMESTAMP,
            closed_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        RETURNING contact_messages.*,
            (SELECT phone_number FROM users WHERE id = contact_messages.sender_user_id) AS sender_phone_number,
            (SELECT profile_picture_url FROM users WHERE id = contact_messages.sender_user_id) AS sender_avatar_url,
            (SELECT full_name FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_name,
            (SELECT email FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_email,
            (SELECT phone_number FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_phone_number,
            (SELECT student_id FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_librarian_code,
            (SELECT profile_picture_url FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_avatar_url
        """,
        new MapSqlParameterSource().addValue("id", id),
        mapper()
    );
    CurrentUser currentUser = currentUser();
    insertComment(id, currentUser.id(), currentUser.fullName(), currentUser.email(), "USER", "Yêu cầu mở lại ticket.");
    if (response.assignedToUserId() != null) {
      librarianNotificationService.notifyOne(
          response.assignedToUserId(),
          "LIB_TICKET_MESSAGE",
          "Sinh viên mở lại ticket",
          "Ticket " + response.ticketCode() + " được mở lại bởi " + response.senderName() + ".",
          "/librarianpage/contact-inbox?ticket=" + response.id(),
          response.id()
      );
    }
    return ApiResponseApp.success("Ticket reopened", response);
  }

  @PostMapping("/{id}/feedback")
  @RequiresAuthentication
  public ApiResponseApp<ContactMessageResponse> feedback(
      @PathVariable Long id,
      @Valid @RequestBody FeedbackRequest request
  ) {
    ContactMessageResponse ticket = requireTicketAccess(id);
    if (isStaff()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only sender can rate this ticket");
    }
    if (!"RESOLVED".equals(ticket.status()) && !"CLOSED".equals(ticket.status())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Only resolved tickets can be rated");
    }
    ContactMessageResponse response = jdbcTemplate.queryForObject(
        """
        UPDATE contact_messages
        SET satisfaction_rating = :rating,
            feedback_note = CAST(:note AS text),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        RETURNING contact_messages.*,
            (SELECT phone_number FROM users WHERE id = contact_messages.sender_user_id) AS sender_phone_number,
            (SELECT profile_picture_url FROM users WHERE id = contact_messages.sender_user_id) AS sender_avatar_url,
            (SELECT full_name FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_name,
            (SELECT email FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_email,
            (SELECT phone_number FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_phone_number,
            (SELECT student_id FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_librarian_code,
            (SELECT profile_picture_url FROM users WHERE id = contact_messages.assigned_to_user_id) AS assigned_to_avatar_url
        """,
        new MapSqlParameterSource()
            .addValue("id", id)
            .addValue("rating", request.rating())
            .addValue("note", request.note()),
        mapper()
    );
    if (response.assignedToUserId() != null) {
      librarianNotificationService.notifyOne(
          response.assignedToUserId(),
          "LIB_TICKET_FEEDBACK",
          "Sinh viên đã đánh giá hỗ trợ",
          "Ticket " + response.ticketCode() + " được đánh giá " + request.rating() + "/5"
              + (request.note() == null || request.note().isBlank() ? "." : ": " + request.note().trim()),
          "/librarianpage/contact-inbox?ticket=" + response.id(),
          response.id()
      );
    }
    return ApiResponseApp.success("Feedback saved", response);
  }

  private RowMapper<ContactMessageResponse> mapper() {
    return (rs, rowNum) -> map(rs);
  }

  private RowMapper<ContactMessageCommentResponse> commentMapper() {
    return (rs, rowNum) -> new ContactMessageCommentResponse(
        rs.getLong("id"),
        rs.getLong("contact_message_id"),
        rs.getObject("author_user_id") != null ? rs.getLong("author_user_id") : null,
        rs.getString("author_name"),
        rs.getString("author_email"),
        rs.getString("author_avatar_url"),
        rs.getString("author_role"),
        rs.getString("body"),
        rs.getTimestamp("created_at").toLocalDateTime()
    );
  }

  private RowMapper<ContactInternalNoteResponse> internalNoteMapper() {
    return (rs, rowNum) -> new ContactInternalNoteResponse(
        rs.getLong("id"),
        rs.getLong("contact_message_id"),
        rs.getLong("author_user_id"),
        rs.getString("author_name"),
        rs.getString("author_email"),
        rs.getString("author_avatar_url"),
        rs.getString("body"),
        rs.getTimestamp("created_at").toLocalDateTime(),
        rs.getTimestamp("updated_at").toLocalDateTime()
    );
  }

  private ContactMessageResponse map(ResultSet rs) throws SQLException {
    Long currentUserId = security.getCurrentUserId();
    Long assignedToUserId = rs.getObject("assigned_to_user_id") != null ? rs.getLong("assigned_to_user_id") : null;
    boolean exposeInternalLibrarianCode = isStaff();
    return new ContactMessageResponse(
        rs.getLong("id"),
        rs.getString("ticket_code"),
        rs.getObject("sender_user_id") != null ? rs.getLong("sender_user_id") : null,
        rs.getString("sender_name"),
        rs.getString("sender_email"),
        rs.getString("sender_phone_number"),
        rs.getString("sender_avatar_url"),
        rs.getString("category"),
        rs.getString("subject"),
        rs.getString("message"),
        rs.getString("status"),
        rs.getString("internal_note"),
        rs.getString("reply_message"),
        rs.getTimestamp("replied_at") != null ? rs.getTimestamp("replied_at").toLocalDateTime() : null,
        rs.getObject("handled_by_user_id") != null ? rs.getLong("handled_by_user_id") : null,
        assignedToUserId,
        assignedToUserId != null && assignedToUserId.equals(currentUserId),
        rs.getString("assigned_to_name"),
        rs.getString("assigned_to_email"),
        rs.getString("assigned_to_phone_number"),
        exposeInternalLibrarianCode ? rs.getString("assigned_to_librarian_code") : null,
        rs.getString("assigned_to_avatar_url"),
        rs.getTimestamp("closed_at") != null ? rs.getTimestamp("closed_at").toLocalDateTime() : null,
        rs.getObject("satisfaction_rating") != null ? rs.getInt("satisfaction_rating") : null,
        rs.getString("feedback_note"),
        rs.getTimestamp("reopened_at") != null ? rs.getTimestamp("reopened_at").toLocalDateTime() : null,
        rs.getTimestamp("created_at").toLocalDateTime(),
        rs.getTimestamp("updated_at").toLocalDateTime()
    );
  }

  private ContactMessageCommentResponse insertComment(
      Long ticketId,
      Long authorUserId,
      String authorName,
      String authorEmail,
      String authorRole,
      String body
  ) {
    return jdbcTemplate.queryForObject(
        """
        INSERT INTO contact_message_comments (
            contact_message_id,
            author_user_id,
            author_name,
            author_email,
            author_role,
            body
        )
        VALUES (:ticketId, :authorUserId, :authorName, :authorEmail, :authorRole, :body)
        RETURNING *,
            (SELECT profile_picture_url FROM users WHERE id = :authorUserId) AS author_avatar_url
        """,
        new MapSqlParameterSource()
            .addValue("ticketId", ticketId)
            .addValue("authorUserId", authorUserId)
            .addValue("authorName", authorName)
            .addValue("authorEmail", authorEmail)
            .addValue("authorRole", authorRole)
            .addValue("body", body),
        commentMapper()
    );
  }

  private ContactMessageResponse requireTicketAccess(Long id) {
    ContactMessageResponse ticket = jdbcTemplate.query(
        """
        SELECT cm.*,
               sender.phone_number AS sender_phone_number,
               sender.profile_picture_url AS sender_avatar_url,
               assignee.full_name AS assigned_to_name,
               assignee.email AS assigned_to_email,
               assignee.phone_number AS assigned_to_phone_number,
               assignee.student_id AS assigned_to_librarian_code,
               assignee.profile_picture_url AS assigned_to_avatar_url
        FROM contact_messages cm
        LEFT JOIN users sender ON sender.id = cm.sender_user_id
        LEFT JOIN users assignee ON assignee.id = cm.assigned_to_user_id
        WHERE cm.id = :id
        """,
        new MapSqlParameterSource().addValue("id", id),
        mapper()
    ).stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

    if (isStaff()) {
      return ticket;
    }

    CurrentUser currentUser = currentUser();
    if (ticket.senderEmail() != null && ticket.senderEmail().equalsIgnoreCase(currentUser.email())) {
      return ticket;
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this ticket");
  }

  private void requireAssignedLibrarian(ContactMessageResponse ticket) {
    Long currentUserId = security.getCurrentUserId();
    if (ticket.assignedToUserId() == null) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket must be assigned before this action");
    }
    if (!ticket.assignedToUserId().equals(currentUserId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned librarian can update this ticket");
    }
  }

  private void touchTicket(Long id) {
    jdbcTemplate.update(
        "UPDATE contact_messages SET updated_at = CURRENT_TIMESTAMP WHERE id = :id",
        new MapSqlParameterSource().addValue("id", id)
    );
  }

  private void notifyTicketSender(ContactMessageResponse ticket, String type) {
    if (ticket.senderUserId() == null) {
      return;
    }
    String title = switch (type) {
      case "CONTACT_TICKET_REPLY" -> "Thư viện đã phản hồi ticket";
      case "CONTACT_TICKET_RESOLVED" -> "Ticket hỗ trợ đã được đánh dấu xử lý";
      case "CONTACT_TICKET_CLOSED" -> "Ticket hỗ trợ đã được đóng";
      default -> "Cập nhật ticket hỗ trợ";
    };
    String message = switch (type) {
      case "CONTACT_TICKET_REPLY" -> "Ticket " + ticket.ticketCode() + " đã có phản hồi mới từ thủ thư.";
      case "CONTACT_TICKET_RESOLVED" -> "Ticket " + ticket.ticketCode() + " đã được xử lý. Bạn có thể đánh giá chất lượng hỗ trợ hoặc yêu cầu mở lại nếu chưa hài lòng.";
      case "CONTACT_TICKET_CLOSED" -> "Ticket " + ticket.ticketCode() + " đã được đóng sau khi hoàn tất xử lý.";
      default -> "Ticket " + ticket.ticketCode() + " có cập nhật mới.";
    };
    kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
        ticket.senderUserId(),
        type,
        title,
        message,
        "/userpage/contact-tickets",
        ticket.id()
    ));
  }

  private void sendResolvedSupportEmail(ContactMessageResponse ticket) {
    if (ticket.senderEmail() == null || ticket.senderEmail().isBlank()) {
      return;
    }
    String actionUrl = frontendActionUrl("/userpage/contact-tickets");
    try {
      emailService.sendSupportEmailWithArgs(
          ticket.senderEmail(),
          EmailTemplates.CONTACT_RESOLVED,
          ticket.senderName(),
          ticket.ticketCode(),
          ticket.subject(),
          actionUrl,
          actionUrl,
          actionUrl
      );
    } catch (Exception e) {
      log.error("Failed to send support resolved email for contact message {} to {}: {}",
          ticket.id(), ticket.senderEmail(), e.getMessage());
    }
  }

  private String frontendActionUrl(String path) {
    String normalizedBase = frontendUrl.endsWith("/")
        ? frontendUrl.substring(0, frontendUrl.length() - 1)
        : frontendUrl;
    String normalizedPath = path.startsWith("/") ? path : "/" + path;
    if (normalizedBase.contains("#")) {
      return normalizedBase + normalizedPath;
    }
    return normalizedBase + "/#" + normalizedPath;
  }

  private CurrentUser currentUser() {
    Long currentUserId = security.getCurrentUserId();
    if (currentUserId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    return jdbcTemplate.query(
        """
        SELECT id, full_name, email
        FROM users
        WHERE id = :id
        """,
        new MapSqlParameterSource().addValue("id", currentUserId),
        (rs, rowNum) -> new CurrentUser(
            rs.getLong("id"),
            rs.getString("full_name"),
            rs.getString("email"),
            isStaff() ? "LIBRARIAN" : "USER"
        )
    ).stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  private boolean isStaff() {
    return security.isLibrarian() || security.isAdmin();
  }
}
