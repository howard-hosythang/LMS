package com.library.user.infrastructure.persistence.entity;

import com.library.shared.entity.BaseEntity;
import com.library.user.domain.enums.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
public class NotificationEntity extends BaseEntity {

  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false, length = 30)
  private NotificationType type;

  @Column(name = "title", nullable = false, length = 255)
  private String title;

  @Column(name = "message", nullable = false, columnDefinition = "TEXT")
  private String message;

  @Column(name = "link", length = 255)
  private String link;

  @Column(name = "reference_id")
  private Long referenceId;

}
