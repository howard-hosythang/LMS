package com.library.user.domain.valueobject;

import com.library.shared.exception.DomainException;
import com.library.user.domain.enums.FacultyEnum;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Value;
import lombok.With;

@Value
@Builder(access = AccessLevel.PRIVATE)
@With
public class UserProfile {

  String fullName;
  LocalDate dateOfBirth;
  String phoneNumber;
  String address;
  String profilePictureUrl;
  String studentId;
  FacultyEnum faculty;


  public UserProfile(String fullName,
      LocalDate dateOfBirth,
      String phoneNumber,
      String address,
      String profilePictureUrl,
      String studentId,
      FacultyEnum faculty) {
    if (fullName == null || fullName.trim().isEmpty()) {
      throw new DomainException("Full name cannot be null or empty");
    }
    if (dateOfBirth != null && dateOfBirth.isAfter(LocalDate.now())) {
      throw new DomainException("Date of birth must be in the past");
    }
    this.fullName = fullName.trim();
    this.dateOfBirth = dateOfBirth;
    this.phoneNumber = phoneNumber != null ? phoneNumber.trim() : null;
    this.address = address != null ? address.trim() : null;
    this.profilePictureUrl = profilePictureUrl != null ? profilePictureUrl.trim() : null;
    this.studentId = studentId;
    this.faculty = faculty;
  }

  public static UserProfile of(String fullName, LocalDate dateOfBirth, String phoneNumber,
      String address, String profilePictureUrl, String studentId, FacultyEnum faculty) {
    return UserProfile.builder()
        .fullName(fullName)
        .dateOfBirth(dateOfBirth)
        .phoneNumber(phoneNumber)
        .address(address)
        .profilePictureUrl(profilePictureUrl)
        .studentId(studentId)
        .faculty(faculty)
        .build();
  }

  public static UserProfile create(String fullName, LocalDate dateOfBirth, String phoneNumber,
      String address, String studentId, FacultyEnum faculty) {
    return UserProfile.builder()
        .fullName(fullName)
        .dateOfBirth(dateOfBirth)
        .phoneNumber(phoneNumber)
        .address(address)
        .studentId(studentId)
        .faculty(faculty)
        .build();
  }

  public static UserProfile createByOauth2(String fullName, String avatarUrl) {
    return UserProfile.builder()
        .fullName(fullName)
        .profilePictureUrl(avatarUrl)
        .build();
  }
}
