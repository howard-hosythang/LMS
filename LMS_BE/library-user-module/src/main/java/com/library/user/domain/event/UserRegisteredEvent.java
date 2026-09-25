package com.library.user.domain.event;

import com.library.user.domain.valueobject.UserId;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserRegisteredEvent {

  private final UserId userId;
  private final String email;
  private final String fullName;
  private final Instant occurredOn;

  public UserRegisteredEvent(UserId userId, String email, String fullName) {
    this.userId = userId;
    this.email = email;
    this.fullName = fullName;
    this.occurredOn = Instant.now();
  }
}
