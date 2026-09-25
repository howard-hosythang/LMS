package com.library.user.presentation.controller;

import com.library.shared.dto.ApiResponseApp;
import com.library.user.application.dto.request.CreateRoleRequest;
import com.library.user.application.dto.response.RoleResponse;
import com.library.user.application.usecase.role.CreateRoleUseCase;
import com.library.user.application.usecase.role.GetAllRoleUseCase;
import com.library.user.application.usecase.role.GetRoleByIdUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for Role management
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final GetRoleByIdUseCase getRoleByIdUseCase;
    private final GetAllRoleUseCase getAllRoleUseCase;
    private final CreateRoleUseCase createRoleUseCase;

    /**
     * Get all roles
     * GET /api/v1/roles
     */
    @GetMapping
    public ApiResponseApp<List<RoleResponse>> getAllRoles() {
        log.info("REST request to get all roles");
        List<RoleResponse> responses = getAllRoleUseCase.execute();
        return ApiResponseApp.success(responses);
    }

    /**
     * Get role by ID
     * GET /api/v1/roles/{id}
     */
    @GetMapping("/{id}")
    public ApiResponseApp<RoleResponse> getRoleById(@PathVariable("id") Long id) {
        log.info("REST request to get role by ID: {}", id);
        RoleResponse response = getRoleByIdUseCase.execute(id);
        return ApiResponseApp.success(response);
    }

    /**
     * Create a new role
     * POST /api/v1/roles
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponseApp<RoleResponse> createRole(@RequestBody CreateRoleRequest request) {
        log.info("REST request to create role");
        RoleResponse response = createRoleUseCase.execute(request);
        return ApiResponseApp.created("create role successfully",response);
    }
}
