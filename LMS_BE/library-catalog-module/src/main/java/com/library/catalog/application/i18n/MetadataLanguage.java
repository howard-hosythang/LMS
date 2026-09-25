package com.library.catalog.application.i18n;

public final class MetadataLanguage {

  public static final String DEFAULT_LANGUAGE = "vi";
  public static final String ENGLISH = "en";

  private MetadataLanguage() {
  }

  public static String normalize(String rawLanguage) {
    if (rawLanguage == null || rawLanguage.isBlank()) {
      return DEFAULT_LANGUAGE;
    }

    String normalized = rawLanguage.trim().toLowerCase();
    if (normalized.startsWith(ENGLISH)) {
      return ENGLISH;
    }
    return DEFAULT_LANGUAGE;
  }
}
