package com.library.catalog.application;

import com.library.catalog.dto.response.publication.MostBorrowedPublicationsResponse;
import java.util.List;

public interface GetMostBorrowedPublicationsUseCase {

  default List<MostBorrowedPublicationsResponse> execute(int limit) {
    return execute(limit, "vi");
  }

  List<MostBorrowedPublicationsResponse> execute(int limit, String uiLanguage);
}
