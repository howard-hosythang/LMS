package com.library.initializer;

import com.library.shared.constant.RoleConstants;
import com.library.shared.exception.DomainException;
import com.library.user.application.port.PasswordHasher;
import com.library.user.domain.entities.Role;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.RoleRepository;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.Email;
import com.library.user.domain.valueobject.PasswordHash;
import com.library.user.domain.valueobject.UserProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(2) // Run after RoleDataInitializer (which has default order = 1)
@RequiredArgsConstructor
public class AdminAccountInitializer implements CommandLineRunner {

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final PasswordHasher passwordHasher;

  // Default admin credentials
  private static final String ADMIN_EMAIL = "admin@hcmut.edu.vn";
  private static final String ADMIN_PASSWORD = "admin";
  private static final String ADMIN_FULL_NAME = "Hồ Sỹ Thắng - Admin";

  @Override
  public void run(String... args) {
    log.info("Starting account initialization...");

    initializeAccount(ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME, RoleConstants.ADMIN);

    log.info("Admin account initialization completed.");
  }

  /**
   * Initialize the default admin account if it doesn't exist.
   */
  private void initializeAccount(String email, String password, String fullName, String roleName) {
    Email emailVo = Email.of(email);

    // Check if admin account already exists
    if (userRepository.existsByEmail(emailVo)) {
      log.debug("account '{}' already exists, skipping initialization.", ADMIN_EMAIL);
      return;
    }

    // Get ADMIN role
    Role adminRole = roleRepository.findByName(roleName)
        .orElseThrow(() -> new DomainException(
            "role not found. Ensure RoleDataInitializer runs before AccountInitializer."
        ));

    UserProfile profile = UserProfile.create(fullName, null, null, null, null, null);

    // Hash the password
    PasswordHash passwordHash = PasswordHash.createFromRaw(password, passwordHasher);

    // Create admin user
    User user = User.createUserForInitializer(emailVo, passwordHash, profile, adminRole);

    // Save to database
    userRepository.save(user);
  }
}
