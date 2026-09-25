package com.library.user.application.dto.request;

import com.library.user.domain.enums.FacultyEnum;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateUserProfileCommand(

    @Pattern(regexp = "^[\\p{L}\\s]*$", message = "Full name must contain only letters")
    @Size(min = 2, max = 50, message = "Full name must be between 2 and 50 characters")
    String fullName,

    @Past(message = "Date of birth must be in the past")
    LocalDate dateOfBirth,

    @Pattern(regexp = "^[+]?\\d{10,15}$", message = "Phone number must be valid")
    String phoneNumber,

    @Size(max = 200, message = "Address must not exceed 200 characters")
    String address,

    FacultyEnum faculty
) {

}
