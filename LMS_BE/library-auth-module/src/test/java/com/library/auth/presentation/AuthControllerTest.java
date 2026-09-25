package com.library.auth.presentation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.auth.application.AuthService;
import com.library.auth.application.ForgotPasswordUseCase;
import com.library.auth.application.LoginUseCase;
import com.library.auth.application.LogoutUseCase;
import com.library.auth.application.OnboardingProfileUseCase;
import com.library.auth.application.RefreshAccessTokenUseCase;
import com.library.auth.application.ResetPasswordUseCase;
import com.library.auth.application.VerifyEmailUseCase;
import com.library.auth.infrastructure.config.Oauth2UrlBuilder;
import com.library.shared.util.SecurityEvaluator;
import com.library.user.application.dto.request.RegisterUserCommand;
import com.library.user.application.port.PasswordHasher;
import com.library.user.application.usecase.user.SignUpUseCase;
import com.library.user.domain.enums.FacultyEnum;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController — MockMvc")
class AuthControllerTest {

    @Mock LoginUseCase loginUseCase;
    @Mock PasswordHasher passwordHasher;
    @Mock Oauth2UrlBuilder oauth2UrlBuilder;
    @Mock AuthService authService;
    @Mock LogoutUseCase logoutUseCase;
    @Mock RefreshAccessTokenUseCase refreshAccessTokenUseCase;
    @Mock SecurityEvaluator securityEvaluator;
    @Mock OnboardingProfileUseCase onboardingProfileUseCase;
    @Mock SignUpUseCase signUpUseCase;
    @Mock VerifyEmailUseCase verifyEmailUseCase;
    @Mock ForgotPasswordUseCase forgotPasswordUseCase;
    @Mock ResetPasswordUseCase resetPasswordUseCase;

    @InjectMocks AuthController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setValidator(validator)
            .build();
    }

    @Test
    @DisplayName("POST /auth/register accepts valid Gmail registration payload")
    void register_shouldCallSignUpUseCase_whenPayloadIsValid() throws Exception {
        RegisterUserCommand request = new RegisterUserCommand(
            "Nguyen Van A",
            "2212345",
            "STUDENT",
            "student@gmail.com",
            "pass1234",
            "pass1234",
            FacultyEnum.KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.message").value("Register successful"));

        ArgumentCaptor<RegisterUserCommand> captor =
            ArgumentCaptor.forClass(RegisterUserCommand.class);
        verify(signUpUseCase).execute(captor.capture());
        org.assertj.core.api.Assertions.assertThat(captor.getValue().email())
            .isEqualTo("student@gmail.com");
        org.assertj.core.api.Assertions.assertThat(captor.getValue().studentId())
            .isEqualTo("2212345");
    }

    @Test
    @DisplayName("POST /auth/register rejects unsupported email domain before use case")
    void register_shouldReturnBadRequest_whenEmailIsInvalid() throws Exception {
        RegisterUserCommand request = new RegisterUserCommand(
            "Nguyen Van A",
            "2212345",
            "STUDENT",
            "student@example.com",
            "pass1234",
            "pass1234",
            FacultyEnum.KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());

        verifyNoInteractions(signUpUseCase);
    }

    @Test
    @DisplayName("POST /auth/register rejects invalid student id before use case")
    void register_shouldReturnBadRequest_whenStudentIdIsInvalid() throws Exception {
        RegisterUserCommand request = new RegisterUserCommand(
            "Nguyen Van A",
            "22ABC45",
            "STUDENT",
            "student@gmail.com",
            "pass1234",
            "pass1234",
            FacultyEnum.KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());

        verify(signUpUseCase, org.mockito.Mockito.never()).execute(any());
    }
}
