package com.library.catalog.dto.response.author;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class AuthorResponse {
    private Long id;
    private String name;
    private String bio;
    private LocalDate dateOfBirth;
    private LocalDate dateOfDeath;
}
