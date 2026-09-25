package com.library.catalog.application;

import com.library.catalog.dto.response.author.AuthorOverviewResponse;
import java.util.List;

public interface SearchAuthorUseCase {
    List<AuthorOverviewResponse> execute(String keyword);
}
