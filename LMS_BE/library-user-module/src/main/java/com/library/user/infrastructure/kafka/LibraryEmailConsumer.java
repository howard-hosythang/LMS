package com.library.user.infrastructure.kafka;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.LibraryEmailMessage;
import com.library.shared.service.EmailService;
import com.library.shared.templates.EmailTemplates;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.UserId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class LibraryEmailConsumer {

    private final EmailService emailService;
    private final UserRepository userRepository;

    @Value("${base.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Transactional
    @KafkaListener(topics = KafkaTopics.LIBRARY_EMAIL, groupId = "${spring.kafka.consumer.group-id}")
    public void handle(LibraryEmailMessage message) {
        try {
            User user = userRepository.findById(UserId.of(message.userId()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            String to       = user.getEmail().getValue();
            String fullName = user.getProfile().getFullName();
            var data        = message.data();

            switch (message.emailType()) {
                case LibraryEmailMessage.BORROW_PICKUP_REMINDER -> emailService.sendEmailWithArgs(
                    to, EmailTemplates.BORROW_PICKUP_REMINDER,
                    fullName,
                    data.get("publicationTitle"),
                    data.get("location"),
                    data.get("deadline"),
                    actionUrl(data, "/userpage/my-books"),
                    actionUrl(data, "/userpage/my-books")
                );
                case LibraryEmailMessage.DUE_DATE_WARNING -> emailService.sendEmailWithArgs(
                    to, EmailTemplates.DUE_DATE_WARNING,
                    fullName,
                    data.get("publicationTitle"),
                    data.get("dueDate"),
                    actionUrl(data, "/userpage/my-books"),
                    actionUrl(data, "/userpage/my-books")
                );
                case LibraryEmailMessage.PICKUP_CONFIRMED -> emailService.sendEmailWithArgs(
                    to, EmailTemplates.PICKUP_CONFIRMED,
                    fullName,
                    data.get("publicationTitle"),
                    data.get("dueDate"),
                    data.getOrDefault("depositAmount", "0đ"),
                    actionUrl(data, "/userpage/my-books"),
                    actionUrl(data, "/userpage/my-books")
                );
                case LibraryEmailMessage.RETURN_CONFIRMED -> emailService.sendEmailWithArgs(
                    to, EmailTemplates.RETURN_CONFIRMED,
                    fullName,
                    data.get("publicationTitle"),
                    data.get("returnDate"),
                    data.getOrDefault("depositAmount", "0đ"),
                    data.getOrDefault("grossFineAmount", "0đ"),
                    data.getOrDefault("depositAppliedAmount", "0đ"),
                    data.getOrDefault("depositRefundAmount", "0đ"),
                    data.getOrDefault("additionalAmountDue", "0đ"),
                    actionUrl(data, "/userpage/my-books"),
                    actionUrl(data, "/userpage/my-books")
                );
                case LibraryEmailMessage.FINE_PAID -> emailService.sendEmailWithArgs(
                    to, EmailTemplates.FINE_PAID,
                    fullName,
                    data.get("fineAmount"),
                    data.get("publicationTitle"),
                    actionUrl(data, "/userpage/fines"),
                    actionUrl(data, "/userpage/fines")
                );
                case LibraryEmailMessage.BOOK_AVAILABLE -> emailService.sendEmailWithArgs(
                    to, EmailTemplates.BOOK_AVAILABLE,
                    fullName,
                    data.get("publicationTitle"),
                    data.get("deadline"),
                    actionUrl(data, "/userpage/reservations"),
                    actionUrl(data, "/userpage/reservations")
                );
                default -> log.warn("Unknown email type: {}", message.emailType());
            }

            log.info("Email sent: type={}, userId={}", message.emailType(), message.userId());
        } catch (Exception e) {
            log.error("Failed to send email: type={}, userId={}, error={}",
                message.emailType(), message.userId(), e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private String actionUrl(java.util.Map<String, String> data, String fallbackPath) {
        String path = data.getOrDefault("actionPath", fallbackPath);
        if (path == null || path.isBlank()) {
            path = fallbackPath;
        }
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        String normalizedBase = frontendUrl.endsWith("/")
            ? frontendUrl.substring(0, frontendUrl.length() - 1)
            : frontendUrl;
        String normalizedPath = path.startsWith("/") ? path : "/" + path;
        if (normalizedBase.contains("#")) {
            return normalizedBase + normalizedPath;
        }
        return normalizedBase + "/#" + normalizedPath;
    }
}
