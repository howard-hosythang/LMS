package com.library.auth.infrastructure.security;

import com.library.shared.util.SecurityEvaluator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component("auth")
@RequiredArgsConstructor
public class SecurityEvaluatorImpl implements SecurityEvaluator {

    @Override
    public boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) return false;
        
        String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return auth.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals(roleWithPrefix));
    }

    @Override
    public boolean hasAnyRole(String... roles) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) return false;
        
        return Arrays.stream(roles).anyMatch(this::hasRole);
    }

    @Override
    public boolean isOwner(Long resourceId) {
        return getCurrentUserId().equals(resourceId);
    }

    @Override
    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) return null;
        return Long.valueOf(auth.getName());
    }

    @Override
    public boolean isAdmin() {
        return hasRole("ADMIN");
    }

    @Override
    public boolean isLibrarian() {
        return hasRole("LIBRARIAN");
    }

    @Override
    public boolean isStudent() {
        return hasRole("STUDENT");
    }

    @Override
    public boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken);
    }

    @Override
    public boolean isOwnerOrAdmin(Long resourceId) {
        return isOwner(resourceId) || isAdmin();
    }
}
