package com.library.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.library.auth.application.impl.ForgotPasswordUseCaseImpl;
import com.library.auth.domain.entity.PasswordResetToken;
import com.library.auth.domain.repository.PasswordResetTokenRepository;
import com.library.auth.dto.request.ForgotPasswordRequest;
import com.library.auth.infrastructure.kafka.ForgotPasswordKafkaPublisher;
import com.library.shared.kafka.event.ForgotPasswordMessage;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.Email;
import com.library.user.domain.valueobject.UserId;
import com.library.user.domain.valueobject.UserProfile;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class ForgotPasswordRoutingTest {
    @Test void emailUsesBrowserRouteWithThePersistedResetToken() {
        var users = mock(UserRepository.class);
        var tokens = mock(PasswordResetTokenRepository.class);
        var publisher = mock(ForgotPasswordKafkaPublisher.class);
        var user = mock(User.class);
        when(users.findByEmail(any())).thenReturn(Optional.of(user));
        when(user.getId()).thenReturn(UserId.of(7L));
        when(user.getEmail()).thenReturn(Email.of("reader@gmail.com"));
        when(user.getProfile()).thenReturn(new UserProfile("Reader", null, null, null, null, null, null));
        var service = new ForgotPasswordUseCaseImpl(users, tokens, publisher);
        ReflectionTestUtils.setField(service, "frontendUrl", "https://library74.uk");

        service.execute(new ForgotPasswordRequest("reader@gmail.com"));

        var saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        var sent = ArgumentCaptor.forClass(ForgotPasswordMessage.class);
        verify(tokens).save(saved.capture());
        verify(publisher).publish(sent.capture());
        assertThat(sent.getValue().resetLink()).isEqualTo(
            "https://library74.uk/publicpage/reset-password?token=" + saved.getValue().getToken());
        assertThat(sent.getValue().resetLink()).doesNotContain("#");
    }
}
