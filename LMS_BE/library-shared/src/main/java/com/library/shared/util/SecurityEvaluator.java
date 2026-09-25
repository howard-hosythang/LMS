package com.library.shared.util;

public interface SecurityEvaluator {
    boolean hasRole(String role);
    boolean hasAnyRole(String... roles);
    boolean isOwner(Long resourceId);
    Long getCurrentUserId();
    
    // New methods to implement
    boolean isAdmin();
    boolean isLibrarian();
    boolean isStudent();
    boolean isAuthenticated();
    boolean isOwnerOrAdmin(Long resourceId);
}
