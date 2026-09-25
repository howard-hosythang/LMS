package com.library.auth.infrastructure.config;


import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

@Component
public class Oauth2UrlBuilder {
    private final OAuth2AuthorizationRequestResolver resolver;

    public Oauth2UrlBuilder(ClientRegistrationRepository clientRegistrationRepository) {
        this.resolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository, "/oauth2/authorization"
        );
    }

    public String buildAuthorizationUrl(HttpServletRequest request, String loginType) {
        try {
            OAuth2AuthorizationRequest authorizationRequest = resolver.resolve(request, loginType);
            if (authorizationRequest == null) {
                throw new AppException(ErrorCode.BUILD_OAUTH2_URL_FAILED);
            }
            OAuth2AuthorizationRequest modifiedRequest = OAuth2AuthorizationRequest.from(authorizationRequest)
                    .additionalParameters(params -> params.put("prompt", "select_account"))
                    .build();
            return modifiedRequest.getAuthorizationRequestUri();
        }
        catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.BUILD_OAUTH2_URL_FAILED);
        }
    }
}
