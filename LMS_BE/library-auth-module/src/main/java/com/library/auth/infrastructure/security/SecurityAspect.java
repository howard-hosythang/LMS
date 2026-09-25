package com.library.auth.infrastructure.security;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.util.RequiresAnyRole;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.RequiresRole;
import com.library.shared.util.SecurityEvaluator;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class SecurityAspect {
    private final SecurityEvaluator securityEvaluator;

    @Before("@annotation(requiresRole)")
    public void checkRole(RequiresRole requiresRole) {
        String roleNeeded = requiresRole.value();
        if (!securityEvaluator.hasRole(roleNeeded)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    @Before("@annotation(requiresAnyRole)")
    public void checkAnyRole(RequiresAnyRole requiresAnyRole) {
        String[] rolesNeeded = requiresAnyRole.value();
        if (!securityEvaluator.hasAnyRole(rolesNeeded)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    @Before("@annotation(requiresAuthentication)")
    public void checkAuthenticated(RequiresAuthentication requiresAuthentication) {
        if (!securityEvaluator.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }
}
