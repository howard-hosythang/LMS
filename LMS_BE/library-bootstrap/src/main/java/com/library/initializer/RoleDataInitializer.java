package com.library.initializer;

import com.library.user.domain.entities.Role;
import com.library.user.domain.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;


@Slf4j
@Component
@Order(1) // Run first, before AdminAccountInitializer
@RequiredArgsConstructor
public class RoleDataInitializer implements CommandLineRunner {

  private final RoleRepository roleRepository;

  @Override
  public void run(String... args) {
    log.info("Starting role data initialization...");

    initializeRole("STUDENT", "Student role - can borrow books and make reservations");
    initializeRole("LIBRARIAN", "Librarian role - can manage books, transactions, and users");
    initializeRole("ADMIN", "Administrator role - has full access to all system features");

    log.info("Role data initialization completed.");
  }

  private void initializeRole(String roleName, String description) {
    if (roleRepository.existsByName(roleName)) {
      log.debug("Role '{}' already exists, skipping initialization.", roleName);
      return;
    }

    Role role = Role.create(roleName, description);
    roleRepository.save(role);
    log.info("Created system role: {} (ID: {})", roleName, role.getId().getValue());
  }
}
