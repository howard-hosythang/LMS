package com.library.auth.infrastructure.userdetails;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.infrastructure.persistence.entity.UserEntity;
import com.library.user.infrastructure.persistence.repository.UserJpaRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserJpaRepository userJpaRepository;

    public UserDetailsServiceImpl(UserJpaRepository userJpaRepository) {
        this.userJpaRepository = userJpaRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEntity user = userJpaRepository.findByIdWithRoles(Long.valueOf(username)).orElseThrow(
                () -> new BadCredentialsException("" ,new AppException(ErrorCode.USER_NOT_FOUND))
        );

        return new UserDetailsImpl(user);
    }
}
