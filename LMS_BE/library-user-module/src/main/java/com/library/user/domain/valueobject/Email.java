package com.library.user.domain.valueobject;

import com.library.shared.exception.DomainException;
import java.util.regex.Pattern;
import lombok.Getter;
import lombok.Value;


@Value
@Getter
public class Email {

  private static final Pattern EMAIL_PATTERN =
      Pattern.compile("^[A-Za-z0-9._%+-]+@(gmail\\.com|hcmut\\.edu\\.vn)$", Pattern.CASE_INSENSITIVE);

  String value;

  private Email(String value) {
    if (value == null || value.trim().isEmpty()) {
      throw new DomainException("Email cannot be null or empty");
    }
    if (!EMAIL_PATTERN.matcher(value).matches()) {
      throw new DomainException(
          "Invalid email format: " + value + ", expected domain: gmail.com or hcmut.edu.vn");
    }
    this.value = value.toLowerCase();
  }

  public static Email of(String value) {
    return new Email(value);
  }

  public String getDomain() {
    return value.substring(value.indexOf('@') + 1);
  }

  public String getLocalPart() {
    return value.substring(0, value.indexOf('@'));
  }
}
