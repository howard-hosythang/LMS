package com.library.user.application.dto.request;

public record AdminUpdateUserRequest(
    String email,
    String fullName,
    String phoneNumber,
    String studentId,
    String librarianCampus,
    String faculty,
    String address,
    String profilePictureUrl
) {
}
