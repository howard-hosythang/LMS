package com.library.auth.infrastructure.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final CustomJwtDecoder jwtDecoder;
    private final CustomAuthenticationConverter authenticationConverter;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new MessageDeliveryException("WebSocket authentication required: missing Bearer token");
        }

        try {
            Jwt jwt = jwtDecoder.decode(authHeader.substring(7));
            AbstractAuthenticationToken auth = authenticationConverter.convert(jwt);
            accessor.setUser(auth);
            log.debug("WebSocket authenticated: userId={}", auth != null ? auth.getName() : "null");
        } catch (Exception e) {
            log.error("WebSocket authentication failed: {}", e.getMessage());
            throw new MessageDeliveryException("WebSocket authentication failed: " + e.getMessage());
        }

        return message;
    }
}
