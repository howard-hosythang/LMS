package com.library.user.application.port;

import com.library.user.domain.event.UserRegisteredEvent;

public interface UserEventPublisher {

  void publish(UserRegisteredEvent event);
}
