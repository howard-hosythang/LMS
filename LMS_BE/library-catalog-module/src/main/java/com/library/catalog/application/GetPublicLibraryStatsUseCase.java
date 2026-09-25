package com.library.catalog.application;

import com.library.catalog.dto.response.publication.PublicLibraryStatsResponse;

public interface GetPublicLibraryStatsUseCase {
  PublicLibraryStatsResponse execute();
}
