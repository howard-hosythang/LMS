package com.library.catalog.application;

import com.library.catalog.dto.response.tag.TagResponse;
import java.util.List;

public interface SearchTagUseCase {
    List<TagResponse> execute(String keyword);
}
