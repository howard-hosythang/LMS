package com.library.auth.application.impl;

import static com.library.shared.util.StaticVariable.CLIENT_ID;
import static com.library.shared.util.StaticVariable.CLIENT_SECRET;
import static com.library.shared.util.StaticVariable.DEFAULT_AVATAR;
import static com.library.shared.util.StaticVariable.REDIRECT_URI;

import com.library.auth.application.AuthService;
import com.library.auth.application.enums.AttributeLoginType;
import com.library.auth.domain.valueobject.UUIDToken;
import com.library.auth.dto.response.ExchangeTokenResponse;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.util.StaticVariable;
import com.library.user.domain.entities.Role;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.RoleRepository;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.Email;
import com.library.user.domain.valueobject.UserId;
import com.library.user.domain.valueobject.UserProfile;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import io.hypersistence.tsid.TSID;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private final com.library.auth.properties.RSAKeyRecord rsaKeyRecord;
  private final com.library.auth.domain.repository.RefreshTokensRepository refreshTokensRepository;
  private final ClientRegistrationRepository clientRegistrationRepository;
  private final WebClient webClient;
  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final NamedParameterJdbcTemplate jdbcTemplate;

  @Value("${jwt.expirationTime}")
  @NonFinal
  private long expirationTime;

  @Value("${jwt.refreshExpTime}")
  @NonFinal
  private long refreshExpTime;

  @Value("${base.url}")
  private String baseUrl;

  @Override
  public String generateToken(User user, com.library.auth.application.enums.PurposeToken purpose) {
    // Header
    JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
        .keyID(rsaKeyRecord.keyId())
        .type(JOSEObjectType.JWT)
        .build();
    // Payload
    long expireSeconds = getExpirationSeconds(purpose);
    String jwtId = TSID.Factory.getTsid().toString();

    JWTClaimsSet claimsSet = buildClaims(user, purpose, jwtId, expireSeconds);
    Payload payload = new Payload(claimsSet.toJSONObject());

    JWSObject object = new JWSObject(header, payload);
    // Signature
    try {
      if (rsaKeyRecord.rsaPrivateKey() == null) {
        throw new IllegalStateException("Private key is not initialized");
      }
      JWSSigner signer = new RSASSASigner(rsaKeyRecord.rsaPrivateKey());
      object.sign(signer);
    } catch (JOSEException e) {
      log.error("Failed to sign JWT", e);
      throw new AppException(ErrorCode.TOKEN_GENERATION_FAILED);
    }

    // save refresh token if purpose is REFRESH
    if (purpose == com.library.auth.application.enums.PurposeToken.REFRESH) {
      com.library.auth.domain.entity.RefreshTokens refreshToken = new com.library.auth.domain.entity.RefreshTokens(UUIDToken.of(jwtId),
          "deviceId",
          user.getId().getValue(),
          Instant.now().plusSeconds(expireSeconds)
      );

      refreshTokensRepository.upsertRefreshToken(refreshToken);
    }
    return object.serialize();
  }


  private long getExpirationSeconds(com.library.auth.application.enums.PurposeToken purpose) {
    return switch (purpose) {
      case ACCESS -> expirationTime;      // default 1h (config: EXP_TOKEN)
      case VERIFY_EMAIL -> 24 * 60 * 60; // 24 hours
      case RESET_PASSWORD -> 15 * 60;    // 15 minutes
      case REFRESH -> refreshExpTime;    // default 7 days (config: EXP_REFRESH_TOKEN)
    };
  }

  private JWTClaimsSet buildClaims(User user, com.library.auth.application.enums.PurposeToken purpose, String jwtId,
      long expireSeconds) {
    return new JWTClaimsSet.Builder()
        .issuer("library-hcmut.com")
        .subject(user.getId().getValue().toString())
        .issueTime(Date.from(Instant.now()))
        .expirationTime(Date.from(Instant.now().plusSeconds(expireSeconds)))
        .jwtID(jwtId)
        .claim("scope", buildScopes(user.getRoles()))
        .claim(StaticVariable.PURPOSE, purpose)
        .audience("uni.com")
        .build();
  }

  private List<String> buildScopes(Set<Role> roles) {
    return roles.stream().map(Role::getRoleName).toList();
  }


  @Override
  @Transactional
  public com.library.auth.dto.response.TokenResponse oauth2CallBack(String loginType, String code, String deviceId) {
    // load client registration
    ClientRegistration clientRegistration = clientRegistrationRepository.findByRegistrationId(
        loginType);
    String accessToken = exchangeToken(loginType, code, clientRegistration);
    log.info("tokenResponse: {}", accessToken);
    Map<String, Object> userInfo = fetchUserInfo(accessToken, clientRegistration);

    AttributeLoginType varName = AttributeLoginType.valueOf(loginType.toUpperCase());

    log.info("userInfo: {}", userInfo.toString());
    String providerId = userInfo.get(varName.getSub()).toString();
    String email = userInfo.get("email") != null ? userInfo.get("email").toString()
        : loginType + "_" + providerId + "@dummy.com";

    if ("google".equals(loginType) && !isGoogleEmailVerified(userInfo)) {
      throw new AppException(ErrorCode.VERIFY_EMAIL_FAILED);
    }

    if (!isAllowedLoginEmail(email)) {
      throw new AppException(ErrorCode.INVALID_EMAIL);
    }

    String givenName  = userInfo.get("given_name")  != null ? userInfo.get("given_name").toString()  : "";
    String familyName = userInfo.get("family_name") != null ? userInfo.get("family_name").toString() : "";
    String fullName = (!familyName.isEmpty() && !givenName.isEmpty())
        ? familyName + " " + givenName          // Thứ tự Việt Nam: Họ + Tên
        : userInfo.get("name") != null ? userInfo.get("name").toString() : null;
    String avatarUrl = DEFAULT_AVATAR;
    if (loginType.equals("google")) {
      avatarUrl =
          userInfo.get("picture") != null ? userInfo.get("picture").toString() : DEFAULT_AVATAR;
    }

    // onboard User
    User user = userRepository.findByProviderAndProviderId(loginType, providerId).orElse(null);
    if (user == null) {
      if (userRepository.findByEmail(Email.of(email)).isEmpty()) {
        user = onBoardUserFromOauth2(email, fullName, avatarUrl, loginType, providerId);
      } else {
        user = userRepository.findByEmail(Email.of(email)).orElse(null);
      }
    }
    if ("google".equals(loginType)) {
      jdbcTemplate.update(
          "UPDATE users SET is_verified = TRUE WHERE email = :email",
          new MapSqlParameterSource("email", email)
      );
    }

    // Here you would typically generate a JWT token or similar
    String accessTokenResponse = generateToken(user, com.library.auth.application.enums.PurposeToken.ACCESS);
    String refreshToken = generateToken(user, com.library.auth.application.enums.PurposeToken.REFRESH);
    boolean isNewUser = Objects.requireNonNull(user).getProfile().getStudentId() == null;

//        loginAttemptsService.loginSucceeded(user.getId());
    return com.library.auth.dto.response.TokenResponse.builder()
        .accessToken(accessTokenResponse)
        .refreshToken(refreshToken)
        .isNewUser(isNewUser)
        .build();

  }

  @Override
  public User getUserFromClaims(JWTClaimsSet claimsSet) {
    Long userId = Long.valueOf(claimsSet.getSubject());
    return userRepository.findById(UserId.of(userId)).orElseThrow(
        () -> new AppException(ErrorCode.USER_NOT_FOUND)
    );
  }

  public String exchangeToken(String loginType, String code,
      ClientRegistration clientRegistration) {
    String tokenUri = clientRegistration.getProviderDetails().getTokenUri();
    String clientId = clientRegistration.getClientId();
    String redirectUri = clientRegistration.getRedirectUri();
    String clientSecret = clientRegistration.getClientSecret();

    // Case 3: Google or others (POST + JSON response)
    if ("google".equalsIgnoreCase(loginType)) {
      MultiValueMap<String, String> linkedValues = new LinkedMultiValueMap<>();
      linkedValues.add("code", code);
      linkedValues.add(CLIENT_ID, clientId);
      linkedValues.add(REDIRECT_URI, redirectUri);
      linkedValues.add(CLIENT_SECRET, clientSecret);
      linkedValues.add("grant_type", "authorization_code");

      ExchangeTokenResponse response = webClient.post()
          .uri(tokenUri)
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .body(BodyInserters.fromFormData(linkedValues))
          .retrieve()
          .bodyToMono(ExchangeTokenResponse.class)
          .block();

      return response != null ? response.getAccessToken() : null;
    }
    return null;
  }

  public Map<String, Object> fetchUserInfo(String accessToken,
      ClientRegistration clientRegistration) {
    return webClient.get()
        .uri(clientRegistration.getProviderDetails().getUserInfoEndpoint().getUri())
        .headers(headers -> headers.setBearerAuth(accessToken))
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block(); // Blocking for Spring Web
  }

  private boolean isGoogleEmailVerified(Map<String, Object> userInfo) {
    Object openIdVerified = userInfo.get("email_verified");
    Object oauthVerified = userInfo.get("verified_email");
    return Boolean.parseBoolean(String.valueOf(openIdVerified))
        || Boolean.parseBoolean(String.valueOf(oauthVerified));
  }

  private boolean isAllowedLoginEmail(String email) {
    if (email == null) {
      return false;
    }
    String normalized = email.toLowerCase();
    return normalized.endsWith("@gmail.com") || normalized.endsWith("@hcmut.edu.vn");
  }


  public User onBoardUserFromOauth2(String email, String fullName, String avatarUrl,
      String provider, String providerId) {
    Role role = roleRepository.findByName("STUDENT").orElseThrow(
        () -> new AppException(ErrorCode.ROLE_NOT_FOUND)
    );
    User user = User.createByOauth2(
        Email.of(email),
        UserProfile.createByOauth2(fullName, avatarUrl),
        provider,
        providerId,
        role
    );

    user = userRepository.save(user);
    return user;
  }
}
