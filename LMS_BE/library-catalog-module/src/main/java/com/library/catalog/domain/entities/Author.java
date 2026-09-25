package com.library.catalog.domain.entities;

import com.library.catalog.domain.valueobject.AuthorId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Author {
    private AuthorId id;
    private String name;
    private String bio;
    private LocalDate dateOfBirth;
    private LocalDate dateOfDeath;


    public static Author create(String authorName, String biography,
                               LocalDate dateOfBirth, LocalDate dateOfDeath) {
        validateAuthorName(authorName);
        validateLifeDates(dateOfBirth, dateOfDeath);
        return new Author(
            AuthorId.generate(),
            authorName.trim(),
            biography != null ? biography.trim() : null,
            dateOfBirth,
            dateOfDeath
        );
    }


    public static Author of(AuthorId id, String authorName, String biography,
                          LocalDate dateOfBirth, LocalDate dateOfDeath) {
        validateAuthorName(authorName);
        validateLifeDates(dateOfBirth, dateOfDeath);
        return new Author(id, authorName.trim(), biography, dateOfBirth, dateOfDeath);
    }

    public void updateBiography(String newBiography) {
        this.bio = newBiography != null ? newBiography.trim() : null;
    }

    public void updateLifeDates(LocalDate birth, LocalDate death) {
        validateLifeDates(birth, death);
        this.dateOfBirth = birth;
        this.dateOfDeath = death;
    }

    public void updateName(String authorName){
        validateAuthorName(authorName);
        this.name = authorName.trim();
    }

    public void markAsAlive() {
        this.dateOfDeath = null;
    }


    private static void validateAuthorName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Author name cannot be null or empty");
        }
        if (name.length() > 100) {
            throw new IllegalArgumentException("Author name must not exceed 100 characters");
        }
    }

    private static void validateLifeDates(LocalDate birth, LocalDate death) {
        if (birth != null && death != null && death.isBefore(birth)) {
            throw new IllegalArgumentException("Date of death cannot be before date of birth");
        }
        if (birth != null && birth.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Date of birth cannot be in the future");
        }

        if (death != null && death.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Date of death cannot be in the future");
        }
    }
}
