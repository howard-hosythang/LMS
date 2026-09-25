package com.library.catalog.application;

import com.library.catalog.dto.response.publication.NewestPublicationsResponse;
import java.util.List;

public interface GetNewestPublicationsUseCase {

  default List<NewestPublicationsResponse> execute(int limit) {
    return execute(limit, "vi");
  }

  List<NewestPublicationsResponse> execute(int limit, String uiLanguage);
}
